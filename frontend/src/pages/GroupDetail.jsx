import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EXPENSE_CATEGORIES = ['food', 'travel', 'hotel', 'entertainment', 'shopping', 'health', 'other'];
const SPLIT_TYPES = ['equal', 'exact', 'percentage', 'share'];

const formatAmount = (amount) => `₩${Math.abs(amount).toLocaleString()}`;
const numOnly = (val) => val.replace(/[^0-9]/g, '');
const toInt = (val) => {
  if (val === '' || val === undefined || val === null) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
};

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('expenses');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    description: '', amount: '', category: 'food',
    paidBy: '', splitType: 'equal', splitAmong: [], splitData: [],
  });
  const [expenseError, setExpenseError] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleForm, setSettleForm] = useState({ paidTo: '', amount: '', note: '' });
  const [settleError, setSettleError] = useState('');
  const [settling, setSettling] = useState(false);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [memberError, setMemberError] = useState('');

  const [balanceView, setBalanceView] = useState('simplified');

  useEffect(() => { fetchAll(); }, [groupId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [g, e, b] = await Promise.all([
        axiosInstance.get(`/api/groups/${groupId}`),
        axiosInstance.get(`/api/expenses/group/${groupId}`),
        axiosInstance.get(`/api/balances/group/${groupId}`),
      ]);
      setGroup(g.data); setExpenses(e.data); setBalances(b.data);
    } catch { setError('Failed to load group.'); }
    finally { setLoading(false); }
  };

  const isAdmin = group?.members?.find((m) => m.user?._id === user?._id)?.role === 'admin';
  const members = group?.members || [];

  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      description: '', amount: '', category: 'food',
      paidBy: user?._id, splitType: 'equal',
      splitAmong: members.map((m) => m.user?._id),
      splitData: members.map((m) => ({ userId: m.user?._id, amount: '', percentage: '', shares: '1' })),
    });
    setExpenseError('');
    setShowExpenseModal(true);
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      paidBy: expense.paidBy?._id || expense.paidBy,
      splitType: expense.splitType,
      splitAmong: expense.splits?.map((s) => s.user?._id || s.user) || [],
      splitData: expense.splits?.map((s) => ({
        userId: s.user?._id || s.user,
        amount: s.amount ? String(s.amount) : '',
        percentage: s.percentage ? String(s.percentage) : '',
        shares: s.shares ? String(s.shares) : '1',
      })) || [],
    });
    setExpenseError('');
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const totalAmt = toInt(expenseForm.amount);
    if (!expenseForm.description.trim()) return setExpenseError('Description is required.');
    if (totalAmt <= 0) return setExpenseError('Enter a valid amount.');
    if (expenseForm.splitAmong.length === 0) return setExpenseError('Select at least one member.');

    const active = expenseForm.splitData.filter((s) => expenseForm.splitAmong.includes(s.userId));

    if (expenseForm.splitType === 'exact') {
      const sum = active.reduce((a, s) => a + toInt(s.amount), 0);
      if (sum !== totalAmt) return setExpenseError(`Exact amounts must add up to ₩${totalAmt.toLocaleString()}. Current: ₩${sum.toLocaleString()}`);
    }
    if (expenseForm.splitType === 'percentage') {
      const sum = active.reduce((a, s) => a + toInt(s.percentage), 0);
      if (sum !== 100) return setExpenseError(`Percentages must add up to 100%. Current: ${sum}%`);
    }
    if (expenseForm.splitType === 'share') {
      if (active.some((s) => toInt(s.shares) <= 0)) return setExpenseError('All shares must be greater than 0.');
    }

    setSavingExpense(true);
    setExpenseError('');

    const payload = {
      groupId,
      description: expenseForm.description.trim(),
      amount: totalAmt,
      category: expenseForm.category,
      paidBy: expenseForm.paidBy,
      splitType: expenseForm.splitType,
      splitAmong: expenseForm.splitAmong,
      splitData: expenseForm.splitType !== 'equal'
        ? active.map((s) => ({ userId: s.userId, amount: toInt(s.amount), percentage: toInt(s.percentage), shares: toInt(s.shares) || 1 }))
        : [],
    };

    try {
      if (editingExpense) await axiosInstance.put(`/api/expenses/${editingExpense._id}`, payload);
      else await axiosInstance.post('/api/expenses', payload);
      setShowExpenseModal(false);
      fetchAll();
    } catch (err) { setExpenseError(err.response?.data?.message || 'Failed to save expense.'); }
    finally { setSavingExpense(false); }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await axiosInstance.delete(`/api/expenses/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); }
  };

  // onChange — just update the value, nothing else
  const updateSplitField = (memberId, field, rawValue) => {
    const cleanVal = numOnly(rawValue);
    setExpenseForm((prev) => ({
      ...prev,
      splitData: prev.splitData.map((s) =>
        s.userId === memberId ? { ...s, [field]: cleanVal } : s
      ),
    }));
  };

  // onBlur — once the user leaves a field, check if exactly one other is empty and auto-fill them
  const autoFillLastEmpty = (memberId) => {
    setExpenseForm((prev) => {
      if (prev.splitType !== 'exact' && prev.splitType !== 'percentage') return prev;

      const checkField = prev.splitType === 'exact' ? 'amount' : 'percentage';
      const total = prev.splitType === 'exact' ? toInt(prev.amount) : 100;
      const activeIds = prev.splitAmong;

      // Find others (not the field just left) that are still empty
      const emptyOthers = activeIds.filter((id) => {
        if (id === memberId) return false;
        const s = prev.splitData.find((sd) => sd.userId === id);
        return !s || s[checkField] === '';
      });

      // Only auto-fill if exactly one other person has an empty field
      if (emptyOthers.length === 1) {
        const filledSum = prev.splitData
          .filter((s) => activeIds.includes(s.userId) && s.userId !== emptyOthers[0])
          .reduce((acc, s) => acc + toInt(s[checkField]), 0);
        const remainder = Math.max(0, total - filledSum);
        return {
          ...prev,
          splitData: prev.splitData.map((s) =>
            s.userId === emptyOthers[0] ? { ...s, [checkField]: String(remainder) } : s
          ),
        };
      }

      return prev;
    });
  };

  const toggleMember = (memberId, on) => {
    setExpenseForm((prev) => {
      const newAmong = on ? [...prev.splitAmong, memberId] : prev.splitAmong.filter((id) => id !== memberId);
      let newData = prev.splitData;
      if (on && !prev.splitData.find((s) => s.userId === memberId)) {
        newData = [...prev.splitData, { userId: memberId, amount: '', percentage: '', shares: '1' }];
      }
      if (!on) newData = newData.filter((s) => s.userId !== memberId);
      return { ...prev, splitAmong: newAmong, splitData: newData };
    });
  };

  const openSettleModal = (toId, toName, amt) => {
    setSettleForm({ paidTo: toId, amount: String(Math.abs(amt)), note: '' });
    setSettleError('');
    setShowSettleModal(true);
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    if (toInt(settleForm.amount) <= 0) return setSettleError('Enter a valid amount.');
    setSettling(true); setSettleError('');
    try {
      await axiosInstance.post('/api/settlements', { groupId, paidTo: settleForm.paidTo, amount: toInt(settleForm.amount), note: settleForm.note });
      setShowSettleModal(false); fetchAll();
    } catch (err) { setSettleError(err.response?.data?.message || 'Failed.'); }
    finally { setSettling(false); }
  };

  const openMemberModal = async () => {
    try { setFriends((await axiosInstance.get('/api/friends')).data); } catch { setFriends([]); }
    setMemberError(''); setShowMemberModal(true);
  };
  const handleAddMember = async (fid) => {
    setMemberError('');
    try { await axiosInstance.post(`/api/groups/${groupId}/members`, { userId: fid }); fetchAll(); }
    catch (err) { setMemberError(err.response?.data?.message || 'Failed.'); }
  };
  const handleRemoveMember = async (mid) => {
    if (!window.confirm('Remove this member?')) return;
    try { await axiosInstance.delete(`/api/groups/${groupId}/members/${mid}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };
  const handleDeleteGroup = async () => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    try { await axiosInstance.delete(`/api/groups/${groupId}`); navigate('/groups'); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };
  const isMemberAdded = (fid) => members.some((m) => m.user?._id === fid);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>;

  const simplifiedDebts = balances?.simplifiedTransactions || [];

  // Build member name map from group members
  const memberMap = {};
  members.forEach((m) => { memberMap[m.user?._id] = m.user?.name; });

  // Breakdown: flat list of all raw pairwise debts, with names attached
  const rawBalances = balances?.balances || {};
  const breakdownDebts = [];
  Object.entries(rawBalances).forEach(([debtorId, creditors]) => {
    Object.entries(creditors).forEach(([creditorId, amount]) => {
      if (amount > 0) {
        breakdownDebts.push({
          from: { id: debtorId, name: memberMap[debtorId] || 'Unknown' },
          to: { id: creditorId, name: memberMap[creditorId] || 'Unknown' },
          amount: Math.round(amount),
        });
      }
    });
  });

  // Is the current user personally all settled up?
  const iAmSettledSimplified = simplifiedDebts.length > 0 && !simplifiedDebts.some((d) => d.from?.id === user?._id);
  const iAmSettledBreakdown  = breakdownDebts.length  > 0 && !breakdownDebts.some((d)  => d.from?.id === user?._id);

  // live split summary
  const totalAmt = toInt(expenseForm.amount);
  const activeData = expenseForm.splitData.filter((s) => expenseForm.splitAmong.includes(s.userId));
  let splitSummary = null;
  if (totalAmt > 0 && expenseForm.splitType !== 'equal' && activeData.length > 0) {
    if (expenseForm.splitType === 'exact') {
      const sum = activeData.reduce((a, s) => a + toInt(s.amount), 0);
      splitSummary = { ok: sum === totalAmt, text: `₩${sum.toLocaleString()} of ₩${totalAmt.toLocaleString()}` };
    } else if (expenseForm.splitType === 'percentage') {
      const sum = activeData.reduce((a, s) => a + toInt(s.percentage), 0);
      splitSummary = { ok: sum === 100, text: `${sum}% of 100%` };
    } else if (expenseForm.splitType === 'share') {
      const ts = activeData.reduce((a, s) => a + toInt(s.shares), 0);
      splitSummary = { ok: ts > 0, text: `${ts} total shares` };
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/groups')} className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Groups
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{group?.name}</h1>
          <p className="text-gray-400 text-sm capitalize">{group?.category} · {members.length} members</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={openMemberModal} className="text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg transition">Members</button>
              <button onClick={handleDeleteGroup} className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition">Delete</button>
            </>
          )}
          <button onClick={openAddExpense} className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg transition">+ Expense</button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['expenses', 'balances'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No expenses yet.</p>
              <button onClick={openAddExpense} className="mt-2 text-teal-600 text-sm hover:underline">Add the first expense</button>
            </div>
          ) : expenses.map((exp) => {
            const canEdit = isAdmin || exp.createdBy?._id === user?._id;
            return (
              <div key={exp._id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-xs font-semibold capitalize">{exp.category?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exp.description}</p>
                    <p className="text-xs text-gray-400">Paid by {exp.paidBy?.name || 'Unknown'} · {exp.splitType} split</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">{formatAmount(exp.amount)}</p>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditExpense(exp)} className="text-xs text-gray-400 hover:text-teal-600 px-2 py-1 rounded hover:bg-teal-50 transition">Edit</button>
                      {isAdmin && <button onClick={() => handleDeleteExpense(exp._id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition">Delete</button>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">

          {/* Breakdown / Simplified toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {['simplified', 'breakdown'].map((view) => (
              <button
                key={view}
                onClick={() => setBalanceView(view)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${balanceView === view ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Simplified view */}
          {balanceView === 'simplified' && (
            <>
              {iAmSettledSimplified && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-teal-700">You are all settled up in this group.</p>
                </div>
              )}
              {simplifiedDebts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">All settled up!</p>
              ) : simplifiedDebts.map((d, i) => {
                const isMe = d.from?.id === user?._id;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{d.from?.name}</span>
                        <span className="text-gray-400"> owes </span>
                        <span className="font-medium">{d.to?.name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatAmount(d.amount)}</p>
                    </div>
                    {isMe && <button onClick={() => openSettleModal(d.to?.id, d.to?.name, d.amount)} className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition">Settle</button>}
                  </div>
                );
              })}
            </>
          )}

          {/* Breakdown view */}
          {balanceView === 'breakdown' && (
            <>
              {iAmSettledBreakdown && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-teal-700">You are all settled up in this group.</p>
                </div>
              )}
              {breakdownDebts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">All settled up!</p>
              ) : breakdownDebts.map((d, i) => {
                const isMe = d.from?.id === user?._id;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{d.from?.name}</span>
                        <span className="text-gray-400"> owes </span>
                        <span className="font-medium">{d.to?.name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatAmount(d.amount)}</p>
                    </div>
                    {isMe && <button onClick={() => openSettleModal(d.to?.id, d.to?.name, d.amount)} className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition">Settle</button>}
                  </div>
                );
              })}
            </>
          )}

        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={expenseForm.description}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Dinner at restaurant"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₩)</label>
                <input type="text" inputMode="numeric" value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, amount: numOnly(e.target.value) }))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white capitalize">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
                <select value={expenseForm.paidBy} onChange={(e) => setExpenseForm((p) => ({ ...p, paidBy: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  {members.map((m) => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Split Type</label>
                <select value={expenseForm.splitType}
                  onChange={(e) => setExpenseForm((p) => ({
                    ...p, splitType: e.target.value,
                    splitData: p.splitData.map((s) => ({ ...s, amount: '', percentage: '', shares: '1' })),
                  }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white capitalize">
                  {SPLIT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Split Among</label>
                  {splitSummary && <span className={`text-xs font-medium ${splitSummary.ok ? 'text-teal-600' : 'text-red-500'}`}>{splitSummary.text}</span>}
                </div>
                <div className="space-y-2">
                  {members.map((m) => {
                    const mid = m.user?._id;
                    const on = expenseForm.splitAmong.includes(mid);
                    const sd = expenseForm.splitData.find((s) => s.userId === mid) || {};
                    const totalShares = activeData.reduce((a, s) => a + toInt(s.shares), 0);

                    return (
                      <div key={mid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={on} onChange={(e) => toggleMember(mid, e.target.checked)} className="accent-teal-600" />
                        <span className="text-sm text-gray-800 flex-1">{m.user?.name}</span>

                        {on && expenseForm.splitType === 'exact' && (
                          <div className="flex flex-col items-end">
                            <input type="text" inputMode="numeric" placeholder="₩ amount"
                              value={sd.amount || ''}
                              onChange={(e) => updateSplitField(mid, 'amount', e.target.value)}
                              onBlur={() => autoFillLastEmpty(mid)}
                              className="w-28 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            {totalAmt > 0 && <span className="text-xs text-gray-400 mt-0.5">of ₩{totalAmt.toLocaleString()}</span>}
                          </div>
                        )}

                        {on && expenseForm.splitType === 'percentage' && (
                          <div className="flex flex-col items-end">
                            <input type="text" inputMode="numeric" placeholder="%"
                              value={sd.percentage || ''}
                              onChange={(e) => updateSplitField(mid, 'percentage', e.target.value)}
                              onBlur={() => autoFillLastEmpty(mid)}
                              className="w-20 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            <span className="text-xs text-gray-400 mt-0.5">
                              {toInt(sd.percentage) > 0 && totalAmt > 0 ? `₩${Math.round((toInt(sd.percentage) / 100) * totalAmt).toLocaleString()}` : 'of 100%'}
                            </span>
                          </div>
                        )}

                        {on && expenseForm.splitType === 'share' && (
                          <div className="flex flex-col items-end">
                            <input type="text" inputMode="numeric" placeholder="shares"
                              value={sd.shares || ''}
                              onChange={(e) => updateSplitField(mid, 'shares', e.target.value)}
                              className="w-20 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            {toInt(sd.shares) > 0 && totalAmt > 0 && totalShares > 0 && (
                              <span className="text-xs text-gray-400 mt-0.5">₩{Math.round((toInt(sd.shares) / totalShares) * totalAmt).toLocaleString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {expenseError && <p className="text-red-500 text-sm">{expenseError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowExpenseModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={savingExpense}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50">
                  {savingExpense ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Record Settlement</h2>
              <button onClick={() => setShowSettleModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSettle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₩)</label>
                <input type="text" inputMode="numeric" value={settleForm.amount}
                  onChange={(e) => setSettleForm((p) => ({ ...p, amount: numOnly(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <input type="text" value={settleForm.note}
                  onChange={(e) => setSettleForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="e.g. Paid via cash"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              {settleError && <p className="text-red-500 text-sm">{settleError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSettleModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={settling}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50">
                  {settling ? 'Recording...' : 'Record Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Manage Members</h2>
              <button onClick={() => setShowMemberModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Current Members</p>
            <div className="space-y-2 mb-5">
              {members.map((m) => (
                <div key={m.user?._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-xs font-semibold">{m.user?.name?.charAt(0).toUpperCase()}</div>
                    <div><p className="text-sm font-medium text-gray-900">{m.user?.name}</p><p className="text-xs text-gray-400 capitalize">{m.role}</p></div>
                  </div>
                  {m.role !== 'admin' && <button onClick={() => handleRemoveMember(m.user?._id)} className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition">Remove</button>}
                </div>
              ))}
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Add from Friends</p>
            {friends.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No friends to add.</p> : (
              <div className="space-y-2">
                {friends.map((f) => (
                  <div key={f._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold">{f.name?.charAt(0).toUpperCase()}</div>
                      <p className="text-sm text-gray-900">{f.name}</p>
                    </div>
                    {isMemberAdded(f._id) ? <span className="text-xs text-teal-600 font-medium">Added</span>
                      : <button onClick={() => handleAddMember(f._id)} className="text-xs text-white bg-teal-600 hover:bg-teal-700 px-2 py-1 rounded transition">Add</button>}
                  </div>
                ))}
              </div>
            )}
            {memberError && <p className="text-red-500 text-sm mt-3">{memberError}</p>}
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupDetail;