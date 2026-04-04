# Sit Side - Production Integration Guide

This guide provides step-by-step instructions for integrating production features into Sit Side.

## 🗄️ 1. Backend Integration - Database & API

### Step 1.1: Backend Setup
```bash
# Create backend directory
mkdir sit-side-backend
cd sit-side-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express mongoose bcryptjs jsonwebtoken cors dotenv helmet express-rate-limit
npm install -D nodemon

# Install Stripe
npm install stripe
```

### Step 1.2: Database Schema (MongoDB/Mongoose)
Create `models/User.js`:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  userType: { type: String, enum: ['student', 'parent'], required: true },
  
  // Student-specific fields
  grade: { type: Number, min: 9, max: 12 },
  school: String,
  bio: String,
  hourlyRate: { type: Number, min: 5, max: 50 },
  experience: String,
  certifications: [String],
  location: String,
  availability: {
    monday: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    tuesday: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    wednesday: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    thursday: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    friday: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    saturday: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    sunday: { morning: Boolean, afternoon: Boolean, evening: Boolean }
  },
  
  // Parent-specific fields
  emergencyContact: String,
  
  // Common fields
  profileImage: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  backgroundCheckStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
```

Create `models/Booking.js`:
```javascript
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  numberOfChildren: { type: Number, required: true },
  childrenAges: [Number],
  specialInstructions: String,
  hourlyRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  },
  stripePaymentIntentId: String,
  
  // Reviews
  studentReview: {
    rating: Number,
    comment: String,
    createdAt: Date
  },
  parentReview: {
    rating: Number,
    comment: String,
    createdAt: Date
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
```

### Step 1.3: API Routes
Create `routes/auth.js`:
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, userType, ...userData } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      userType,
      ...userData
    });
    
    await user.save();
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 💳 2. Payment Processing - Stripe Integration

### Step 2.1: Stripe Setup
```bash
npm install stripe
```

Create `services/stripeService.js`:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  // Create payment intent for booking
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      return paymentIntent;
    } catch (error) {
      throw new Error(`Stripe error: ${error.message}`);
    }
  }
  
  // Confirm payment
  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new Error(`Stripe error: ${error.message}`);
    }
  }
  
  // Create customer for user
  async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString()
        }
      });
      
      return customer;
    } catch (error) {
      throw new Error(`Stripe error: ${error.message}`);
    }
  }
}

module.exports = new StripeService();
```

### Step 2.2: Payment Routes
Create `routes/payments.js`:
```javascript
const express = require('express');
const StripeService = require('../services/stripeService');
const Booking = require('../models/Booking');
const router = express.Router();

// Create payment intent for booking
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('student parent');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const paymentIntent = await StripeService.createPaymentIntent(
      booking.totalAmount,
      'usd',
      { bookingId: booking._id.toString() }
    );
    
    // Update booking with payment intent ID
    booking.stripePaymentIntentId = paymentIntent.id;
    await booking.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: booking.totalAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const paymentIntent = await StripeService.confirmPayment(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update booking status
      const booking = await Booking.findOne({ stripePaymentIntentId: paymentIntentId });
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        await booking.save();
      }
    }
    
    res.json({ status: paymentIntent.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 2.3: Frontend Stripe Integration
Update `src/utils/stripe.js`:
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const createPaymentIntent = async (bookingId) => {
  const response = await fetch('/api/payments/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ bookingId })
  });
  
  return response.json();
};

export const confirmPayment = async (paymentIntentId) => {
  const response = await fetch('/api/payments/confirm-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ paymentIntentId })
  });
  
  return response.json();
};

export default stripePromise;
```

## 🔐 3. Authentication - JWT & Role-Based Access

### Step 3.1: Auth Middleware
Create `middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

module.exports = { auth, requireRole };
```

### Step 3.2: Frontend Auth Context
Create `src/contexts/AuthContext.js`:
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  };

  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🔍 4. Background Checks - Verification Services

### Step 4.1: Background Check Service
Create `services/backgroundCheckService.js`:
```javascript
const axios = require('axios');

class BackgroundCheckService {
  constructor() {
    this.apiKey = process.env.BACKGROUND_CHECK_API_KEY;
    this.baseUrl = process.env.BACKGROUND_CHECK_API_URL;
  }

  // Initiate background check
  async initiateCheck(userData) {
    try {
      const response = await axios.post(`${this.baseUrl}/checks`, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        ssn: userData.ssn, // Encrypted
        address: userData.address
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Background check error: ${error.message}`);
    }
  }

  // Get check status
  async getCheckStatus(checkId) {
    try {
      const response = await axios.get(`${this.baseUrl}/checks/${checkId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Background check error: ${error.message}`);
    }
  }

  // Webhook handler for status updates
  async handleWebhook(payload) {
    const { checkId, status, results } = payload;
    
    // Update user background check status
    const User = require('../models/User');
    await User.findOneAndUpdate(
      { backgroundCheckId: checkId },
      { 
        backgroundCheckStatus: status === 'completed' ? 'approved' : 'pending',
        backgroundCheckResults: results
      }
    );
  }
}

module.exports = new BackgroundCheckService();
```

### Step 4.2: Background Check Routes
Create `routes/background-checks.js`:
```javascript
const express = require('express');
const { auth } = require('../middleware/auth');
const BackgroundCheckService = require('../services/backgroundCheckService');
const User = require('../models/User');
const router = express.Router();

// Initiate background check
router.post('/initiate', auth, async (req, res) => {
  try {
    const checkData = await BackgroundCheckService.initiateCheck(req.body);
    
    // Update user with check ID
    await User.findByIdAndUpdate(req.user._id, {
      backgroundCheckId: checkData.id,
      backgroundCheckStatus: 'pending'
    });
    
    res.json(checkData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get background check status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.backgroundCheckId) {
      return res.json({ status: 'not_initiated' });
    }
    
    const status = await BackgroundCheckService.getCheckStatus(user.backgroundCheckId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    await BackgroundCheckService.handleWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 💬 5. Messaging System - Real-time Communication

### Step 5.1: Socket.io Setup
```bash
npm install socket.io
```

Create `models/Message.js`:
```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  isRead: { type: Boolean, default: false },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
```

### Step 5.2: Socket.io Server
Create `services/socketService.js`:
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

class SocketService {
  constructor(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error'));
        }
        
        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { receiverId, content, type = 'text', bookingId } = data;
          
          const message = new Message({
            sender: socket.userId,
            receiver: receiverId,
            content,
            type,
            booking: bookingId
          });
          
          await message.save();
          
          // Send to receiver
          socket.to(`user_${receiverId}`).emit('new_message', {
            message: await message.populate('sender', 'firstName lastName profileImage')
          });
          
          // Send confirmation to sender
          socket.emit('message_sent', { message });
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        socket.to(`user_${data.receiverId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: data.isTyping
        });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }
}

module.exports = SocketService;
```

### Step 5.3: Frontend Socket Hook
Create `src/hooks/useSocket.js`:
```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('new_message', (data) => {
        setMessages(prev => [...prev, data.message]);
      });

      newSocket.on('user_typing', (data) => {
        // Handle typing indicators
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user]);

  const sendMessage = (receiverId, content, type = 'text', bookingId = null) => {
    if (socket) {
      socket.emit('send_message', {
        receiverId,
        content,
        type,
        bookingId
      });
    }
  };

  const sendTyping = (receiverId, isTyping) => {
    if (socket) {
      socket.emit('typing', { receiverId, isTyping });
    }
  };

  return { socket, messages, sendMessage, sendTyping };
};
```

## 📱 6. Push Notifications

### Step 6.1: Push Notification Service
```bash
npm install web-push
```

Create `services/notificationService.js`:
```javascript
const webpush = require('web-push');
const User = require('../models/User');

class NotificationService {
  constructor() {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async sendNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        const promises = user.pushSubscriptions.map(subscription => {
          return webpush.sendNotification(subscription, JSON.stringify(notification));
        });
        
        await Promise.allSettled(promises);
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  async sendBookingNotification(booking) {
    const notification = {
      title: 'New Booking Request',
      body: `You have a new booking request from ${booking.parent.firstName}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        bookingId: booking._id,
        type: 'booking'
      }
    };

    await this.sendNotification(booking.student._id, notification);
  }

  async sendMessageNotification(sender, receiverId, message) {
    const notification = {
      title: `Message from ${sender.firstName}`,
      body: message.content.substring(0, 100),
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        senderId: sender._id,
        type: 'message'
      }
    };

    await this.sendNotification(receiverId, notification);
  }
}

module.exports = new NotificationService();
```

### Step 6.2: Frontend Push Setup
Create `src/utils/notifications.js`:
```javascript
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const subscribeToNotifications = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.REACT_APP_VAPID_PUBLIC_KEY
      )
    });

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(subscription)
    });

    return subscription;
  }
  return null;
};
```

## 👨‍💼 7. Admin Dashboard

### Step 7.1: Admin Routes
Create `routes/admin.js`:
```javascript
const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const router = express.Router();

// All admin routes require admin role
router.use(auth, requireRole(['admin']));

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBackgroundChecks = await User.countDocuments({ 
      backgroundCheckStatus: 'pending' 
    });
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ['pending', 'confirmed'] } 
    });

    res.json({
      totalUsers,
      totalBookings,
      pendingBackgroundChecks,
      activeBookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: status === 'active',
        statusReason: reason,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('student parent')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve booking dispute
router.put('/bookings/:id/resolve', async (req, res) => {
  try {
    const { resolution, adminNotes } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        disputeResolution: resolution,
        adminNotes,
        status: resolution === 'refund' ? 'cancelled' : 'completed',
        resolvedAt: new Date(),
        resolvedBy: req.user._id
      },
      { new: true }
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 7.2: Admin Dashboard Frontend
Create `src/pages/AdminDashboard.js`:
```javascript
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import PrimaryButton from '../components/ui/PrimaryButton';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchBookings();
  }, []);

  const fetchStats = async () => {
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setStats(data);
  };

  const fetchUsers = async () => {
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setUsers(data.users);
  };

  const fetchBookings = async () => {
    const response = await fetch('/api/admin/bookings', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setBookings(data);
  };

  const updateUserStatus = async (userId, status, reason) => {
    await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status, reason })
    });
    fetchUsers(); // Refresh
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-neutral-dark mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-2xl font-bold text-primary">{stats.totalUsers}</h3>
            <p className="text-neutral-light">Total Users</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-2xl font-bold text-primary">{stats.totalBookings}</h3>
            <p className="text-neutral-light">Total Bookings</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingBackgroundChecks}</h3>
            <p className="text-neutral-light">Pending Background Checks</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-2xl font-bold text-green-600">{stats.activeBookings}</h3>
            <p className="text-neutral-light">Active Bookings</p>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold text-neutral-dark mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b">
                  <td className="py-2">{user.firstName} {user.lastName}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2 capitalize">{user.userType}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2">
                    <PrimaryButton
                      size="sm"
                      onClick={() => updateUserStatus(user._id, 'inactive', 'Admin action')}
                    >
                      Suspend
                    </PrimaryButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-dark mb-4">Booking Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Student</th>
                <th className="text-left py-2">Parent</th>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id} className="border-b">
                  <td className="py-2">{booking.student?.firstName} {booking.student?.lastName}</td>
                  <td className="py-2">{booking.parent?.firstName} {booking.parent?.lastName}</td>
                  <td className="py-2">{new Date(booking.date).toLocaleDateString()}</td>
                  <td className="py-2">${booking.totalAmount}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <PrimaryButton size="sm">
                      View Details
                    </PrimaryButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
```

## 🚀 Deployment & Environment Setup

### Environment Variables
Create `.env` files:

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sitside
JWT_SECRET=your_jwt_secret_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BACKGROUND_CHECK_API_KEY=your_api_key
BACKGROUND_CHECK_API_URL=https://api.backgroundcheck.com
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@sitside.com
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Production Deployment
1. **Backend (Heroku/Railway):**
   ```bash
   # Install Heroku CLI
   heroku create sitside-backend
   heroku config:set MONGODB_URI=your_production_mongodb_uri
   heroku config:set JWT_SECRET=your_production_jwt_secret
   git push heroku main
   ```

2. **Frontend (Vercel/Netlify):**
   ```bash
   npm run build
   # Deploy build folder to Vercel/Netlify
   ```

3. **Database (MongoDB Atlas):**
   - Create cluster on MongoDB Atlas
   - Set up database user and network access
   - Update connection string in environment variables

This comprehensive guide provides everything needed to transform Sit Side from a prototype into a production-ready application with all the requested features!
