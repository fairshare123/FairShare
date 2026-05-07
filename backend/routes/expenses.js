const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

// Helper function to calculate splits
const calculateSplits = (amount, splitType, members, splitData) => {
  const splits = [];

  if (splitType === 'equal') {
    const equalAmount = Math.round(amount / members.length);
    members.forEach(userId => {
      splits.push({ user: userId, amount: equalAmount });
    });

  } else if (splitType === 'exact') {
    splitData.forEach(item => {
      splits.push({ user: item.userId, amount: item.amount });
    });

  } else if (splitType === 'percentage') {
    splitData.forEach(item => {
      const splitAmount = Math.round((item.percentage / 100) * amount);
      splits.push({
        user: item.userId,
        amount: splitAmount,
        percentage: item.percentage
      });
    });

  } else if (splitType === 'share') {
    const totalShares = splitData.reduce((sum, item) => sum + item.shares, 0);
    splitData.forEach(item => {
      const splitAmount = Math.round((item.shares / totalShares) * amount);
      splits.push({
        user: item.userId,
        amount: splitAmount,
        shares: item.shares
      });
    });
  }

  return splits;
};

// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a group
// @access  Private
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get a single expense
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      groupId,
      description,
      amount,
      category,
      paidBy,
      splitType,
      splitAmong,
      splitData,
      date
    } = req.body;

    if (!groupId || !description || !amount || !splitType || !splitAmong) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Calculate splits
    const splits = calculateSplits(amount, splitType, splitAmong, splitData);

    const expense = await Expense.create({
      group: groupId,
      description,
      amount,
      category: category || 'other',
      paidBy: paidBy || req.user._id,
      splitType,
      splits,
      date: date || Date.now(),
      createdBy: req.user._id
    });

    await expense.populate('paidBy', 'name email');
    await expense.populate('splits.user', 'name email');

    // Log activity
    await Activity.create({
      group: groupId,
      user: req.user._id,
      type: 'expense_added',
      message: `${req.user.name} added ₩${amount.toLocaleString()} for ${description}`,
      metadata: {
        expenseId: expense._id,
        amount
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    io.to(groupId).emit('expense_added', expense);

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Edit an expense
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const {
      description,
      amount,
      category,
      paidBy,
      splitType,
      splitAmong,
      splitData,
      date
    } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.group);
    const member = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    // Check permissions — admin can edit any, member can only edit own
    const isAdmin = member && member.role === 'admin';
    const isCreator = expense.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to edit this expense' });
    }

    const previousAmount = expense.amount;

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (paidBy) expense.paidBy = paidBy;
    if (date) expense.date = date;
    if (splitType) expense.splitType = splitType;
    if (splitAmong && splitType) {
      expense.splits = calculateSplits(
        amount || expense.amount,
        splitType,
        splitAmong,
        splitData
      );
    }

    expense.updatedAt = Date.now();
    await expense.save();
    await expense.populate('paidBy', 'name email');
    await expense.populate('splits.user', 'name email');

    // Log activity
    await Activity.create({
      group: expense.group,
      user: req.user._id,
      type: 'expense_edited',
      message: `${req.user.name} edited ${expense.description} ₩${previousAmount.toLocaleString()} → ₩${expense.amount.toLocaleString()}`,
      metadata: {
        expenseId: expense._id,
        amount: expense.amount,
        previousAmount
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    io.to(expense.group.toString()).emit('expense_updated', expense);

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense (admin only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.group);
    const member = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete expenses' });
    }

    // Log activity before deleting
    await Activity.create({
      group: expense.group,
      user: req.user._id,
      type: 'expense_deleted',
      message: `${req.user.name} deleted ${expense.description}`,
      metadata: {
        amount: expense.amount
      }
    });

    await expense.deleteOne();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(expense.group.toString()).emit('expense_deleted', {
      expenseId: req.params.id
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;