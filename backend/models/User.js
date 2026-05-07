const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  securityQuestions: [
    {
      question: {
        type: String,
        required: true
      },
      answer: {
        type: String,
        required: true
      }
    }
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hash security question answers before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('securityQuestions')) return next();
  for (let i = 0; i < this.securityQuestions.length; i++) {
    const salt = await bcrypt.genSalt(10);
    this.securityQuestions[i].answer = await bcrypt.hash(
      this.securityQuestions[i].answer.toLowerCase().trim(),
      salt
    );
  }
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to compare security question answers
userSchema.methods.matchSecurityAnswer = async function (index, enteredAnswer) {
  return await bcrypt.compare(
    enteredAnswer.toLowerCase().trim(),
    this.securityQuestions[index].answer
  );
};

module.exports = mongoose.model('User', userSchema);