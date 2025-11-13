import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API base URL - use relative path for Netlify, absolute for local dev
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

// Safe localStorage wrapper for Chrome compatibility
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage not available:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage setItem failed:', error);
      // Chrome sometimes blocks localStorage in certain contexts
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
    }
  }
};

// Helper function to make authenticated requests
const apiRequest = async (url, options = {}) => {
  const token = safeLocalStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || `Server error (${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = safeLocalStorage.getItem('token');
      if (token) {
        try {
          const data = await apiRequest('/auth/verify');
          setUser(data.user);
        } catch (error) {
          console.error('Auth verification failed:', error);
          safeLocalStorage.removeItem('token');
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

      safeLocalStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true, user: data.user };
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

      safeLocalStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    safeLocalStorage.removeItem('token');
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
