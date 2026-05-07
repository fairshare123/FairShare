const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'expense_added',
      'expense_edited',
      'expense_deleted',
      'settlement_made',
      'member_joined',
      'member_left'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense'
    },
    amount: {
      type: Number
    },
    previousAmount: {
      type: Number
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', activitySchema);