import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
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
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
        {label && <p className="text-gray-500 mb-1">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.stroke || entry.fill || '#14B8A6' }} className="font-semibold">
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

const Reports = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axiosInstance.get('/api/groups');
        setGroups(res.data);
      } catch {
        setError('Failed to load groups.');
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // Fetch expenses whenever group selection or groups list changes
  useEffect(() => {
    if (groups.length === 0) {
      setLoading(false);
      return;
    }
    const fetchExpenses = async () => {
      setLoading(true);
      setError('');
      try {
        if (selectedGroup === 'all') {
          const results = await Promise.all(
            groups.map((g) =>
              axiosInstance.get(`/api/expenses/group/${g._id}`).then((r) => r.data).catch(() => [])
            )
          );
          setExpenses(results.flat());
        } else {
          const res = await axiosInstance.get(`/api/expenses/group/${selectedGroup}`);
          setExpenses(res.data);
        }
      } catch {
        setError('Failed to load expense data.');
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [selectedGroup, groups]);

  // ── Data processing ─────────────────────────────────────────────────────────

  // Category data for pie chart (group totals)
  const categoryData = (() => {
    const cats = {};
    expenses.forEach((exp) => {
      cats[exp.category] = (cats[exp.category] || 0) + exp.amount;
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Monthly data for bar chart (group totals)
  const monthlyData = (() => {
    const months = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[sortKey]) months[sortKey] = { sortKey, label, amount: 0 };
      months[sortKey].amount += exp.amount;
    });
    return Object.values(months)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ label, amount }) => ({ month: label, amount }));
  })();

  // Cumulative data for line chart
  const cumulativeData = (() => {
    let running = 0;
    return monthlyData.map(({ month, amount }) => {
      running += amount;
      return { month, total: running };
    });
  })();

  // Summary stats
  const totalGroupSpent = expenses.reduce((acc, e) => acc + e.amount, 0);

  const myTotalShare = expenses.reduce((acc, exp) => {
    const mySplit = exp.splits?.find((s) => (s.user?._id || s.user) === user?._id);
    return acc + (mySplit?.amount || 0);
  }, 0);

  const largestExpense = expenses.reduce((max, exp) => exp.amount > (max?.amount || 0) ? exp : max, null);

  const topCategory = categoryData[0] || null;

  const hasData = expenses.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Group spending analytics</p>
        </div>

        {/* Group filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white sm:w-52"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>{g.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center h-48 text-red-500">{error}</div>
      )}

      {!loading && !error && !hasData && (
        <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center h-48">
          <p className="text-sm text-gray-400">No expense data yet.</p>
        </div>
      )}

      {!loading && !error && hasData && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Group Total</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(totalGroupSpent)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Your Share</p>
              <p className="text-lg font-bold text-teal-600">{formatAmount(myTotalShare)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Largest Expense</p>
              <p className="text-lg font-bold text-gray-900">{largestExpense ? formatAmount(largestExpense.amount) : '—'}</p>
              {largestExpense && <p className="text-xs text-gray-400 truncate mt-0.5">{largestExpense.description}</p>}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Top Category</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{topCategory ? topCategory.name : '—'}</p>
              {topCategory && <p className="text-xs text-gray-400 mt-0.5">{formatAmount(topCategory.value)}</p>}
            </div>
          </div>

          {/* Pie + Category list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Pie chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-4">Spending by Category</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
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
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown list */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-4">Category Breakdown</p>
              <div className="space-y-3">
                {categoryData.map((cat) => {
                  const pct = Math.round((cat.value / totalGroupSpent) * 100);
                  const color = CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.other;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                          <span className="text-sm capitalize text-gray-700">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">{formatAmount(cat.value)}</span>
                          <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Monthly spending bar chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">Monthly Spending</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatTick} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative spending line chart */}
          {cumulativeData.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">Cumulative Spending</p>
              <p className="text-xs text-gray-400 mb-4">Running total over time</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={cumulativeData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatTick} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#14B8A6"
                    strokeWidth={2.5}
                    dot={{ fill: '#14B8A6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

        </>
      )}

    </div>
  );
};

export default Reports;