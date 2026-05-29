import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

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
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
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