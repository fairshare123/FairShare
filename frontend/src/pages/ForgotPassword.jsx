import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

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

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1 — Verify email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password/verify-email', { email });
      setQuestions(res.data.questions);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Email not found. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify answers
  const handleVerifyAnswers = async (e) => {
    e.preventDefault();
    if (answers.some((a) => !a.trim())) {
      return setError('Please answer all 3 security questions.');
    }
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password/verify-answers', {
        email,
        answers,
      });
      setResetToken(res.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isPasswordStrong(newPassword)) {
      return setError('Password does not meet all requirements.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post(
        '/api/auth/forgot-password/reset',
        { newPassword },
        { headers: { Authorization: `Bearer ${resetToken}` } }
      );
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Verify Email', 'Security Questions', 'New Password'];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-teal-600">FairShare</h1>
          <p className="text-gray-500 text-sm mt-1">Reset your password</p>
        </div>

        {/* Step indicator */}
        {!done && (
          <div className="flex items-center justify-between mb-8">
            {stepLabels.map((label, index) => {
              const stepNum = index + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1
                      ${isComplete ? 'bg-teal-600 text-white' : isActive ? 'border-2 border-teal-600 text-teal-600' : 'border-2 border-gray-200 text-gray-400'}`}
                  >
                    {isComplete ? '✓' : stepNum}
                  </div>
                  <span className={`text-xs ${isActive ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {index < stepLabels.length - 1 && (
                    <div className={`absolute hidden`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Success state */}
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-teal-600 text-2xl">✓</span>
            </div>
            <p className="text-gray-700 font-medium">Password reset successfully!</p>
            <p className="text-gray-500 text-sm">You can now sign in with your new password.</p>
            <Link
              to="/login"
              className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition text-center mt-4"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Step 1 — Email */}
            {step === 1 && (
              <form onSubmit={handleVerifyEmail} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    required
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            )}

            {/* Step 2 — Security questions */}
            {step === 2 && (
              <form onSubmit={handleVerifyAnswers} className="space-y-5">
                <p className="text-sm text-gray-500">Answer your 3 security questions to continue.</p>
                {questions.map((question, index) => (
  <div key={index}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {typeof question === 'object' ? question.question : question}
    </label>
                    <input
                      type="text"
                      value={answers[index]}
                      onChange={(e) => {
                        const updated = [...answers];
                        updated[index] = e.target.value;
                        setAnswers(updated);
                        setError('');
                      }}
                      required
                      placeholder="Your answer"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ))}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Answers'}
                </button>
              </form>
            )}

            {/* Step 3 — New password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <PasswordStrength password={newPassword} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </>
        )}

        {/* Back to login */}
        {!done && (
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-teal-600 hover:underline">Back to Sign In</Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;