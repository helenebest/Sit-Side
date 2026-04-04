import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PrimaryButton from '../components/ui/PrimaryButton';
import Card from '../components/ui/Card';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success && result.user) {
        // Redirect based on user type
        const userType = result.user.userType || 'student';
        // Handle admin, parent, and student redirects
        if (userType === 'admin') {
          navigate('/admin');
        } else if (userType === 'parent') {
          navigate('/parent');
        } else {
          navigate('/student');
        }
        // Note: Don't set loading to false here as we're navigating away
      } else {
        const errorMsg = result.error || 'Login failed. Please check your credentials and try again.';
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = err.message || 'An unexpected error occurred. Please check your connection and try again.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card className="p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">Welcome Back</h1>
          <p className="text-neutral-light">Sign in to your Sit Side account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="current-password"
            />
          </div>
          <PrimaryButton
            type="submit"
            disabled={loading || !formData.email || !formData.password}
            className="w-full mt-6"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </PrimaryButton>
        </form>

        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            className="text-sm text-neutral-light hover:text-primary"
            onClick={() => {/* TODO: Implement forgot password */}}
          >
            Forgot password?
          </button>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => navigate('/signup')}
          >
            Don't have an account? Sign Up
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
