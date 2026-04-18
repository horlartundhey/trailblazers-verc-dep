import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await API.post(`/api/auth/reset-password/${token}`, { password: formData.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Set a new password</h2>
          <p className="mt-2 text-sm text-gray-600">Choose a strong password for your account.</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-300 text-green-800 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">Password reset successful!</p>
            <p className="mt-1 text-sm">Redirecting you to the login page...</p>
            <Link to="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-500 font-medium">
              Go to Login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                value={formData.confirm}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <p className="text-center text-sm text-gray-600">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Request a new link
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
