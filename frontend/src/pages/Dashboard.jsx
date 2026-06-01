import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  food: '#F97316',
  travel: '#3B82F6',
  hotel: '#8B5CF6',
  entertainment: '#EC4899',
  shopping: '#EAB308',
  health: '#10B981',
  other: '#9CA3AF',
};

const formatAmount = (amount) => `₩${Math.abs(amount).toLocaleString()}`;
const formatTick = (v) => v >= 1000000 ? `₩${(v / 1000000).toFixed(1)}M` : `₩${(v / 1000).toFixed(0)}k`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
        {label && <p className="text-gray-500 mb-1">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.fill }} className="font-semibold">
            {formatAmount(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
        <p className="capitalize text-gray-700 font-medium">{payload[0].name}</p>
        <p className="font-semibold text-gray-900">{formatAmount(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [globalBalances, setGlobalBalances] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInsights, setShowInsights] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [allExpenses, setAllExpenses] = useState(null); // null = not yet fetched

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

  const handleToggleInsights = async () => {
    // If opening and not yet fetched, load expenses now
    if (!showInsights && allExpenses === null) {
      setInsightsLoading(true);
      try {
        const results = await Promise.all(
          groups.map((g) =>
            axiosInstance.get(`/api/expenses/group/${g._id}`).then((r) => r.data).catch(() => [])
          )
        );
        setAllExpenses(results.flat());
      } catch {
        setAllExpenses([]);
      } finally {
        setInsightsLoading(false);
      }
    }
    setShowInsights((prev) => !prev);
  };

  // ── Personal insights derived data ─────────────────────────────────────────

  const buildPersonalData = () => {
    if (!allExpenses || !user) return { categoryData: [], monthlyData: [], totalSpent: 0 };

    const cats = {};
    const months = {};
    let totalSpent = 0;

    allExpenses.forEach((exp) => {
      const mySplit = exp.splits?.find(
        (s) => (s.user?._id || s.user) === user._id
      );
      if (!mySplit || mySplit.amount <= 0) return;

      const amt = mySplit.amount;
      totalSpent += amt;

      // Category
      cats[exp.category] = (cats[exp.category] || 0) + amt;

      // Month (sorted by YYYY-MM key)
      const d = new Date(exp.date);
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[sortKey]) months[sortKey] = { sortKey, label, amount: 0 };
      months[sortKey].amount += amt;
    });

    const categoryData = Object.entries(cats).map(([name, value]) => ({ name, value }));
    const monthlyData = Object.values(months)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ label, amount }) => ({ month: label, amount }));

    return { categoryData, monthlyData, totalSpent };
  };

  const { categoryData, monthlyData, totalSpent } = buildPersonalData();

  // ── Main render ─────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>;
  }

  const totalOwed = globalBalances?.totalOwed || 0;
  const totalOwing = globalBalances?.totalOwe || 0;
  const netBalance = globalBalances?.netBalance || 0;

  const balancesByUser = globalBalances?.balancesByUser || {};
  const allMembers = groups.flatMap((g) => g.members || []);
  const friendBalances = Object.entries(balancesByUser).map(([userId, amount]) => {
    const match = allMembers.find((m) => m.user?._id === userId);
    return { userId, name: match?.user?.name || 'Unknown', amount };
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

      {/* Spending Insights toggle */}
      {groups.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={handleToggleInsights}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">Your Spending Insights</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 text-gray-400 transition-transform ${showInsights ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showInsights && (
            <div className="border-t border-gray-100 px-5 py-5 space-y-6">
              {insightsLoading ? (
                <p className="text-sm text-gray-400 text-center py-6">Loading insights...</p>
              ) : allExpenses?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No expense data yet.</p>
              ) : (
                <>
                  {/* Total personal spend */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Your total share across all groups</p>
                    <p className="text-2xl font-bold text-gray-900">{formatAmount(totalSpent)}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Donut — category breakdown */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Spending by Category</p>
                      {categoryData.length === 0 ? (
                        <p className="text-xs text-gray-400">No data</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoryData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.other}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                            <Legend
                              formatter={(value) => (
                                <span className="text-xs capitalize text-gray-600">{value}</span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Bar — monthly spending */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Monthly Spending</p>
                      {monthlyData.length === 0 ? (
                        <p className="text-xs text-gray-400">No data</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={formatTick} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={52} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="amount" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;