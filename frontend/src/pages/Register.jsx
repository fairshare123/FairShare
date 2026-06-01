import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favourite movie?",
  "What is your oldest sibling's name?",
  "What street did you grow up on?",
  "What was your childhood nickname?",
];

const pwdChecks = (pwd) => [
  { label: 'At least 6 characters',          ok: pwd.length >= 6 },
  { label: 'One uppercase letter (A–Z)',      ok: /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter (a–z)',      ok: /[a-z]/.test(pwd) },
  { label: 'One number (0–9)',                ok: /[0-9]/.test(pwd) },
  { label: 'One special character (!@#…)',    ok: /[^A-Za-z0-9]/.test(pwd) },
];

const isPasswordStrong = (pwd) => pwdChecks(pwd).every((c) => c.ok);

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = pwdChecks(password);
  return (
    <div className="mt-2 space-y-1.5">
      {checks.map((c, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 text-xs transition-colors duration-200 ${c.ok ? 'text-teal-600' : 'text-red-400'}`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {c.ok
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          </svg>
          {c.label}
        </div>
      ))}
    </div>
  );
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [questions, setQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
    setError('');
  };

  const getAvailableQuestions = (currentIndex) => {
    const selected = questions
      .map((q, i) => (i !== currentIndex ? q.question : null))
      .filter(Boolean);
    return SECURITY_QUESTIONS.filter((q) => !selected.includes(q));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordStrong(formData.password)) {
      return setError('Password does not meet all requirements.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (questions.some((q) => !q.question || !q.answer.trim())) {
      return setError('Please fill in all 3 security questions and answers.');
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, questions);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-600">FairShare</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text" name="name" value={formData.name}
              onChange={handleChange} required placeholder="Sahil Kini"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" name="email" value={formData.email}
              onChange={handleChange} required placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" name="password" value={formData.password}
              onChange={handleChange} required placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <PasswordStrength password={formData.password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password" name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} required placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Security Questions</p>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index} className="space-y-2">
                  <select
                    value={q.question}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Select question {index + 1}</option>
                    {getAvailableQuestions(index).map((question) => (
                      <option key={question} value={question}>{question}</option>
                    ))}
                  </select>
                  <input
                    type="text" value={q.answer}
                    onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                    required placeholder={`Answer ${index + 1}`}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:underline">Sign in</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;