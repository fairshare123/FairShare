import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

const CATEGORIES = ['trip', 'house', 'event', 'food', 'other'];

const categoryColors = {
  trip: 'bg-blue-50 text-blue-600',
  house: 'bg-yellow-50 text-yellow-600',
  event: 'bg-purple-50 text-purple-600',
  food: 'bg-orange-50 text-orange-600',
  other: 'bg-gray-100 text-gray-600',
};

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'trip' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/api/groups');
      setGroups(res.data);
    } catch (err) {
      setError('Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setFormError('Group name is required.');
    setCreating(true);
    setFormError('');
    try {
      const res = await axiosInstance.post('/api/groups', {
        name: formData.name.trim(),
        category: formData.category,
        memberIds: [],
      });
      setGroups((prev) => [res.data, ...prev]);
      setShowModal(false);
      setFormData({ name: '', category: 'trip' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your expense groups</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + New Group
        </button>
      </div>

      {/* Groups list */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {loading && (
          <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 text-center py-10">{error}</p>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No groups yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-teal-600 text-sm hover:underline"
            >
              Create your first group
            </button>
          </div>
        )}

        {!loading && !error && groups.map((group) => (
          <Link
            key={group._id}
            to={`/groups/${group._id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-sm">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{group.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${categoryColors[group.category] || categoryColors.other}`}>
                    {group.category}
                  </span>
                  <span className="text-xs text-gray-400">{group.members?.length} members</span>
                </div>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Create New Group</h2>
              <button
                onClick={() => { setShowModal(false); setFormError(''); setFormData({ name: '', category: 'trip' }); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormError(''); }}
                  placeholder="e.g. Goa Trip"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white capitalize"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(''); setFormData({ name: '', category: 'trip' }); }}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Groups;