const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Security questions bank
const SECURITY_QUESTIONS = [
  'What was your first pet\'s name?',
  'What is your mother\'s maiden name?',
  'What city were you born in?',
  'What was the name of your first school?',
  'What is your favourite movie?',
  'What is your oldest sibling\'s name?',
  'What street did you grow up on?',
  'What was your childhood nickname?'
];

// @route   GET /api/auth/questions
// @desc    Get security questions bank
// @access  Public
router.get('/questions', (req, res) => {
  res.json(SECURITY_QUESTIONS);
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, securityQuestions } = req.body;

    // Validate fields
    if (!name || !email || !password || !securityQuestions) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Validate exactly 3 security questions
    if (securityQuestions.length !== 3) {
      return res.status(400).json({ message: 'Please provide exactly 3 security questions' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      securityQuestions
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -securityQuestions');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/forgot-password/verify-email
// @desc    Verify email exists and get security questions
// @access  Public
router.post('/forgot-password/verify-email', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Return questions without answers
    const questions = user.securityQuestions.map((q, index) => ({
      index,
      question: q.question
    }));

    res.json({ questions });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/forgot-password/verify-answers
// @desc    Verify security question answers
// @access  Public
router.post('/forgot-password/verify-answers', async (req, res) => {
  try {
    const { email, answers } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Verify all 3 answers
    for (let i = 0; i < 3; i++) {
      const isMatch = await user.matchSecurityAnswer(i, answers[i]);
      if (!isMatch) {
        return res.status(401).json({ message: 'One or more answers are incorrect' });
      }
    }

    // Generate a temporary reset token
    const resetToken = generateToken(user._id);
    res.json({ resetToken });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/forgot-password/reset
// @desc    Reset password after successful verification
// @access  Private (requires reset token)
router.post('/forgot-password/reset', protect, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;