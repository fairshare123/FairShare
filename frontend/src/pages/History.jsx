import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

const formatAmount = (amount) => `₩${Math.abs(amount).toLocaleString()}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('en-KR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const FILTERS = ['all', 'expenses', 'settlements'];

const History = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [filter, setFilter] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup !== 'all') {
      fetchGroupData(selectedGroup);
    } else {
      fetchGlobalData();
    }
  }, [selectedGroup, groups]);

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/api/groups');
      setGroups(res.data);
    } catch (err) {
      // fail silently
    }
  };

  const fetchGlobalData = async () => {
    if (groups.length === 0) return;
    setLoading(true);
    setError('');
    try {
      // fetch settlements globally
      const settlementsRes = await axiosInstance.get('/api/settlements/global');

      // fetch expenses from all groups in parallel
      const expenseRequests = groups.map((g) =>
        axiosInstance.get(`/api/expenses/group/${g._id}`).then((res) => res.data).catch(() => [])
      );
      const allExpensesNested = await Promise.all(expenseRequests);
      const allExpenses = allExpensesNested.flat();

      setSettlements(settlementsRes.data);
      setExpenses(allExpenses);
    } catch (err) {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupData = async (groupId) => {
    setLoading(true);
    setError('');
    try {
      const [expensesRes, settlementsRes] = await Promise.all([
        axiosInstance.get(`/api/expenses/group/${groupId}`),
        axiosInstance.get(`/api/settlements/group/${groupId}`),
      ]);
      setExpenses(expensesRes.data);
      setSettlements(settlementsRes.data);
    } catch (err) {
      setError('Failed to load group history.');
    } finally {
      setLoading(false);
    }
  };

  const getItemDate = (item) => {
    return item.date || item.createdAt || null;
  };

  // Merge and sort expenses + settlements by date
  const combinedItems = [
    ...(filter !== 'settlements' ? expenses.map((e) => ({ ...e, itemType: 'expense' })) : []),
    ...(filter !== 'expenses' ? settlements.map((s) => ({ ...s, itemType: 'settlement' })) : []),
  ].sort((a, b) => new Date(getItemDate(b)) - new Date(getItemDate(a)));

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500 text-sm mt-1">All your expenses and settlements</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Group filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>{g.name}</option>
          ))}
        </select>

        {/* Type filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition
                ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f}
            </button>
          ))}
        </div>

      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

        {loading && (
          <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 text-center py-10">{error}</p>
        )}

        {!loading && !error && combinedItems.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">No history yet.</p>
        )}

        {!loading && !error && combinedItems.map((item, index) => {
          if (item.itemType === 'expense') {
            return (
              <div key={`exp-${item._id}-${index}`} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-xs font-semibold capitalize">
                    {item.category?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      Paid by {item.paidBy?.name || 'Unknown'}
                      {formatDate(getItemDate(item)) ? ` · ${formatDate(getItemDate(item))}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatAmount(item.amount)}</p>
                  <p className="text-xs text-teal-600 capitalize">{item.splitType} split</p>
                </div>
              </div>
            );
          }

          if (item.itemType === 'settlement') {
            return (
              <div key={`set-${item._id}-${index}`} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-xs font-semibold">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.paidBy?.name} settled with {item.paidTo?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.note ? `${item.note} · ` : ''}{formatDate(getItemDate(item))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">{formatAmount(item.amount)}</p>
                  <p className="text-xs text-gray-400">Settlement</p>
                </div>
              </div>
            );
          }

          return null;
        })}

      </div>

    </div>
  );
};

export default History;