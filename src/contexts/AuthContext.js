import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to make authenticated requests
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await apiRequest('/auth/verify');
          setUser(data.user);
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getStudents = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      const data = await apiRequest(`/users/students?${queryParams}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getStudentProfile = async (studentId) => {
    try {
      const data = await apiRequest(`/users/students/${studentId}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const createBooking = async (bookingData) => {
    try {
      const data = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getMyBookings = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      const data = await apiRequest(`/bookings/my-bookings?${queryParams}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateBookingStatus = async (bookingId, status, reason = '') => {
    try {
      const data = await apiRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const addReview = async (bookingId, rating, comment = '') => {
    try {
      const data = await apiRequest(`/bookings/${bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateAvailability = async (availability) => {
    try {
      const data = await apiRequest('/users/availability', {
        method: 'PUT',
        body: JSON.stringify({ availability }),
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const addCertification = async (certification) => {
    try {
      const data = await apiRequest('/users/certifications', {
        method: 'POST',
        body: JSON.stringify({ certification }),
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    getStudents,
    getStudentProfile,
    createBooking,
    getMyBookings,
    updateBookingStatus,
    addReview,
    updateAvailability,
    addCertification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
