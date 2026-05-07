const express = require('express');
const router = express.Router();
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

// @route   GET /api/settlements/group/:groupId
// @desc    Get all settlements for a group
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

    const settlements = await Settlement.find({ group: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('paidTo', 'name email')
      .sort({ date: -1 });

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/settlements/global
// @desc    Get all settlements for logged in user across all groups
// @access  Private
router.get('/global', protect, async (req, res) => {
  try {
    const settlements = await Settlement.find({
      $or: [
        { paidBy: req.user._id },
        { paidTo: req.user._id }
      ]
    })
      .populate('paidBy', 'name email')
      .populate('paidTo', 'name email')
      .populate('group', 'name')
      .sort({ date: -1 });

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/settlements
// @desc    Record a settlement
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { groupId, paidTo, amount, note, date } = req.body;

    if (!groupId || !paidTo || !amount) {
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

    const settlement = await Settlement.create({
      group: groupId,
      paidBy: req.user._id,
      paidTo,
      amount,
      note: note || '',
      date: date || Date.now()
    });

    await settlement.populate('paidBy', 'name email');
    await settlement.populate('paidTo', 'name email');

    // Log activity
    await Activity.create({
      group: groupId,
      user: req.user._id,
      type: 'settlement_made',
      message: `${req.user.name} settled ₩${amount.toLocaleString()} with ${settlement.paidTo.name}`,
      metadata: {
        amount,
        targetUser: paidTo
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    io.to(groupId).emit('settlement_made', settlement);

    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;