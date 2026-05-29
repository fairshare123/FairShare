import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [globalBalances, setGlobalBalances] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balancesRes, groupsRes] = await Promise.all([
          axiosInstance.get('/api/balances/global'),
          axiosInstance.get('/api/groups'),
        ]);
        setGlobalBalances(balancesRes.data);
        setGroups(groupsRes.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatAmount = (amount) => {
    return `₩${Math.abs(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

 const totalOwed = globalBalances?.totalOwed || 0;
const totalOwing = globalBalances?.totalOwe || 0;
const netBalance = globalBalances?.netBalance || 0;

// balancesByUser is { userId: amount } — positive means they owe you, negative means you owe them
const balancesByUser = globalBalances?.balancesByUser || {};
const friendBalances = Object.entries(balancesByUser).map(([userId, amount]) => {
  // find name from groups members
  const allMembers = groups.flatMap((g) => g.members || []);
  const match = allMembers.find((m) => m.user?._id === userId);
  return {
    userId,
    name: match?.user?.name || 'Unknown',
    amount,
  };
}).filter((fb) => fb.amount !== 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your expense summary</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">You are owed</p>
          <p className="text-2xl font-bold text-teal-600">{formatAmount(totalOwed)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">You owe</p>
          <p className="text-2xl font-bold text-red-500">{formatAmount(totalOwing)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Net balance</p>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
            {netBalance >= 0 ? '' : '-'}{formatAmount(netBalance)}
          </p>
        </div>

      </div>

      {/* Groups summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Your Groups</h2>
          <Link to="/groups" className="text-sm text-teal-600 hover:underline">View all</Link>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No groups yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {groups.slice(0, 5).map((group) => (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-semibold text-sm">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{group.category} · {group.members?.length} members</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Friend balances */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Friend Balances</h2>
          <Link to="/friends" className="text-sm text-teal-600 hover:underline">View all</Link>
        </div>

        {friendBalances.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No balances with friends yet.</p>
        ) : (
          <div className="space-y-3">
            {friendBalances.slice(0, 5).map((fb) => (
              <div key={fb.userId} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                    {fb.name?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{fb.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${fb.amount >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                    {fb.amount >= 0 ? `owed ${formatAmount(fb.amount)}` : `owes ${formatAmount(fb.amount)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;