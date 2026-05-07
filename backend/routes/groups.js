const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

// @route   GET /api/groups
// @desc    Get all groups for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id
    }).populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/groups/:id
// @desc    Get a single group
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, category, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Build members array — creator is always admin
    const members = [{ user: req.user._id, role: 'admin' }];

    if (memberIds && memberIds.length > 0) {
      memberIds.forEach(id => {
        if (id !== req.user._id.toString()) {
          members.push({ user: id, role: 'member' });
        }
      });
    }

    const group = await Group.create({
      name,
      category: category || 'other',
      members,
      createdBy: req.user._id
    });

    await group.populate('members.user', 'name email');

    // Log activity
    await Activity.create({
      group: group._id,
      user: req.user._id,
      type: 'member_joined',
      message: `${req.user.name} created the group ${group.name}`
    });

    // Emit real-time event
    const io = req.app.get('io');
    io.to(group._id.toString()).emit('group_created', group);

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/groups/:id
// @desc    Rename a group (admin only)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, category } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can rename the group' });
    }

    if (name) group.name = name;
    if (category) group.category = category;

    await group.save();
    await group.populate('members.user', 'name email');

    const io = req.app.get('io');
    io.to(group._id.toString()).emit('group_updated', group);

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/groups/:id/members
// @desc    Add member to group (admin only)
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const alreadyMember = group.members.some(
      m => m.user.toString() === userId
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push({ user: userId, role: 'member' });
    await group.save();
    await group.populate('members.user', 'name email');

    // Log activity
    await Activity.create({
      group: group._id,
      user: userId,
      type: 'member_joined',
      message: `A new member joined ${group.name}`
    });

    const io = req.app.get('io');
    io.to(group._id.toString()).emit('member_added', group);

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove member from group (admin only)
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    group.members = group.members.filter(
      m => m.user.toString() !== req.params.userId
    );

    await group.save();
    await group.populate('members.user', 'name email');

    // Log activity
    await Activity.create({
      group: group._id,
      user: req.params.userId,
      type: 'member_left',
      message: `A member left ${group.name}`
    });

    const io = req.app.get('io');
    io.to(group._id.toString()).emit('member_removed', group);

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group (admin only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete the group' });
    }

    await group.deleteOne();

    const io = req.app.get('io');
    io.to(req.params.id).emit('group_deleted', { groupId: req.params.id });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;