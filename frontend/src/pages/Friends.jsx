import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Friends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axiosInstance.get('/api/friends');
      setFriends(res.data);
    } catch (err) {
      setError('Failed to load friends.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setActionError('');

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await axiosInstance.get(`/api/friends/search?query=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    setActionError('');
    try {
      await axiosInstance.post(`/api/friends/${friendId}`);
      setSearchResults((prev) =>
        prev.map((u) => (u._id === friendId ? { ...u, isFriend: true } : u))
      );
      fetchFriends();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add friend.');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setActionError('');
    try {
      await axiosInstance.delete(`/api/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove friend.');
    }
  };

  const isFriend = (userId) => friends.some((f) => f._id === userId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
        <p className="text-gray-500 text-sm mt-1">Search and manage your friends</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Find People</p>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name or email..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        {/* Search results */}
        {searchQuery.trim().length >= 2 && (
          <div className="mt-3 space-y-2">
            {searching && (
              <p className="text-sm text-gray-400 text-center py-3">Searching...</p>
            )}
            {!searching && searchResults.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">No users found.</p>
            )}
            {!searching && searchResults.map((result) => (
              <div key={result._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-semibold text-sm">
                    {result.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{result.name}</p>
                    <p className="text-xs text-gray-400">{result.email}</p>
                  </div>
                </div>
                {result._id === user?._id ? (
                  <span className="text-xs text-gray-400">You</span>
                ) : isFriend(result._id) || result.isFriend ? (
                  <span className="text-xs text-teal-600 font-medium">Added</span>
                ) : (
                  <button
                    onClick={() => handleAddFriend(result._id)}
                    className="text-sm text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {actionError && <p className="text-red-500 text-sm mt-2">{actionError}</p>}
      </div>

      {/* Friends list */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">
          My Friends {friends.length > 0 && <span className="text-gray-400">({friends.length})</span>}
        </p>

        {loading && (
          <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 text-center py-6">{error}</p>
        )}

        {!loading && !error && friends.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            No friends yet. Search for people above to add them.
          </p>
        )}

        {!loading && !error && friends.length > 0 && (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div key={friend._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                    {friend.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                    <p className="text-xs text-gray-400">{friend.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend._id)}
                  className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Friends;