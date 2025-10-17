import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PrimaryButton from '../components/ui/PrimaryButton';
import Card from '../components/ui/Card';

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: searchParams.get('type') || 'student',
    phone: '',
    school: '',
    grade: '',
    bio: '',
    hourlyRate: 15,
    experience: '',
    certifications: [],
    location: '',
    emergencyContact: '',
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'agreeToTerms' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    // Prepare registration data
    const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      userType: formData.userType,
    };

    // Add user type specific fields
    if (formData.userType === 'student') {
      registrationData.grade = parseInt(formData.grade);
      registrationData.school = formData.school;
      registrationData.bio = formData.bio;
      registrationData.hourlyRate = parseInt(formData.hourlyRate);
      registrationData.experience = formData.experience;
      registrationData.location = formData.location;
    } else if (formData.userType === 'parent') {
      registrationData.emergencyContact = formData.emergencyContact;
    }

    const result = await register(registrationData);
    
    if (result.success) {
      navigate(`/${formData.userType}`);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-neutral-dark mb-2">
                Join Sit Side
              </h1>
              <p className="text-neutral-light">
                Create your account to get started
              </p>
            </div>

            {error && (
              <div className="error-message">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div>
                <label htmlFor="userType" className="form-label">
                  I am a...
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="student">High School Student</option>
                  <option value="parent">Parent/Family</option>
                </select>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Student-specific fields */}
              {formData.userType === 'student' && (
                <>
                  <div>
                    <label htmlFor="school" className="form-label">
                      School
                    </label>
                    <input
                      id="school"
                      name="school"
                      type="text"
                      value={formData.school}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="grade" className="form-label">
                      Grade
                    </label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Grade</option>
                      <option value="9">9th Grade</option>
                      <option value="10">10th Grade</option>
                      <option value="11">11th Grade</option>
                      <option value="12">12th Grade</option>
                    </select>
                  </div>
                </>
              )}

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="form-checkbox"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="text-neutral-light">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <PrimaryButton
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </PrimaryButton>
              </div>
            </form>

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-primary hover:underline"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;