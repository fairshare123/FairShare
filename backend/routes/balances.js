const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const { protect } = require('../middleware/auth');

// Helper: Calculate balances for a group
const calculateGroupBalances = async (groupId) => {
  const expenses = await Expense.find({ group: groupId });
  const settlements = await Settlement.find({ group: groupId });

  // Build balance map: balances[userId][otherUserId] = amount owed
  const balances = {};

  // Process expenses
  expenses.forEach(expense => {
    const paidBy = expense.paidBy.toString();

    expense.splits.forEach(split => {
      const owedBy = split.user.toString();

      if (owedBy === paidBy) return; // Skip if same person

      if (!balances[owedBy]) balances[owedBy] = {};
      if (!balances[owedBy][paidBy]) balances[owedBy][paidBy] = 0;

      balances[owedBy][paidBy] += split.amount;
    });
  });

  // Process settlements (reduce balances)
  settlements.forEach(settlement => {
    const paidBy = settlement.paidBy.toString();
    const paidTo = settlement.paidTo.toString();
    const amount = settlement.amount;

    if (balances[paidBy] && balances[paidBy][paidTo]) {
      balances[paidBy][paidTo] -= amount;
      if (balances[paidBy][paidTo] <= 0) {
        delete balances[paidBy][paidTo];
      }
    }
  });

  return balances;
};

// Helper: Debt simplification algorithm (minimum cash flow)
const simplifyDebts = (balances) => {
  // Calculate net balance for each person
  const netBalances = {};

  Object.keys(balances).forEach(debtor => {
    Object.keys(balances[debtor]).forEach(creditor => {
      const amount = balances[debtor][creditor];
      if (amount <= 0) return;

      if (!netBalances[debtor]) netBalances[debtor] = 0;
      if (!netBalances[creditor]) netBalances[creditor] = 0;

      netBalances[debtor] -= amount;
      netBalances[creditor] += amount;
    });
  });

  // Separate into creditors and debtors
  const creditors = [];
  const debtors = [];

  Object.keys(netBalances).forEach(userId => {
    if (netBalances[userId] > 0) {
      creditors.push({ userId, amount: netBalances[userId] });
    } else if (netBalances[userId] < 0) {
      debtors.push({ userId, amount: -netBalances[userId] });
    }
  });

  // Sort by amount descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Generate minimum transactions
  const transactions = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const amount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(amount)
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }

  return transactions;
};

// @route   GET /api/balances/group/:groupId
// @desc    Get balances for a group
// @access  Private
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const balances = await calculateGroupBalances(req.params.groupId);
    const simplifiedTransactions = simplifyDebts(balances);

    // Map user IDs to names
    const memberMap = {};
    group.members.forEach(m => {
      memberMap[m.user._id.toString()] = m.user.name;
    });

    const namedTransactions = simplifiedTransactions.map(t => ({
      from: { id: t.from, name: memberMap[t.from] },
      to: { id: t.to, name: memberMap[t.to] },
      amount: t.amount
    }));

    res.json({
      groupId: req.params.groupId,
      balances,
      simplifiedTransactions: namedTransactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/balances/global
// @desc    Get global balances for logged in user across all groups
// @access  Private
router.get('/global', protect, async (req, res) => {
  try {
    // Get all groups user is in
    const groups = await Group.find({
      'members.user': req.user._id
    }).populate('members.user', 'name email');

    const globalBalances = {};
    let totalOwed = 0;
    let totalOwe = 0;

    for (const group of groups) {
      const balances = await calculateGroupBalances(group._id);

      // Extract balances relevant to logged in user
      const userId = req.user._id.toString();

      // What others owe the user
      Object.keys(balances).forEach(debtor => {
        if (balances[debtor][userId]) {
          if (!globalBalances[debtor]) globalBalances[debtor] = 0;
          globalBalances[debtor] -= balances[debtor][userId];
          totalOwed += balances[debtor][userId];
        }
      });

      // What user owes others
      if (balances[userId]) {
        Object.keys(balances[userId]).forEach(creditor => {
          if (!globalBalances[creditor]) globalBalances[creditor] = 0;
          globalBalances[creditor] += balances[userId][creditor];
          totalOwe += balances[userId][creditor];
        });
      }
    }

    res.json({
      totalOwed: Math.round(totalOwed),
      totalOwe: Math.round(totalOwe),
      netBalance: Math.round(totalOwed - totalOwe),
      balancesByUser: globalBalances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;