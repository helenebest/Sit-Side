// Netlify serverless function for API routes
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware - Allow all origins for Netlify (CORS handled by Netlify)
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(apiLimiter);

// Simple in-memory storage (for demo - replace with MongoDB in production)
let users = [];
let bookings = [];
let nextUserId = 1;
let nextBookingId = 1;

// Create default admin user
const defaultAdmin = {
  id: 0,
  email: process.env.ADMIN_EMAIL || 'admin@sitside.com',
  password: process.env.ADMIN_PASSWORD || 'Tenacity2301!',
  firstName: 'Admin',
  lastName: 'Helen',
  userType: 'admin',
  token: `admin_token_${Date.now()}`,
  createdAt: new Date(),
  isActive: true
};
users.push(defaultAdmin);

// Simple auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const user = users.find(u => u.token === token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = user;
  next();
};

// Admin auth middleware
const adminAuth = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, phone, userType } = req.body;
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    id: nextUserId++,
    email,
    password, // In production, hash this password
    firstName,
    lastName,
    phone,
    userType,
    profilePicture: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
    token: `token_${nextUserId}_${Date.now()}`,
    createdAt: new Date(),
    isActive: true
  };
  users.push(newUser);

  const userResponse = { ...newUser };
  delete userResponse.password;

  res.status(201).json({
    message: 'User registered successfully',
    token: newUser.token,
    user: userResponse
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account is deactivated. Please contact support.' });
  }

  const userResponse = { ...user };
  delete userResponse.password;

  res.json({
    message: 'Login successful',
    token: user.token,
    user: userResponse
  });
});

app.get('/api/users/me', auth, (req, res) => {
  const userResponse = { ...req.user };
  delete userResponse.password;
  res.json(userResponse);
});

// Verify token endpoint
app.get('/api/auth/verify', auth, (req, res) => {
  const userResponse = { ...req.user };
  delete userResponse.password;
  res.json({ user: userResponse });
});

// Update profile endpoint
app.put('/api/auth/profile', auth, (req, res) => {
  const { firstName, lastName, phone, grade, school } = req.body;
  const user = req.user;
  
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (grade) user.grade = grade;
  if (school) user.school = school;
  
  const userResponse = { ...user };
  delete userResponse.password;
  res.json({ user: userResponse });
});

// Get students endpoint (for parents)
app.get('/api/users/students', (req, res) => {
  const students = users
    .filter(u => u.userType === 'student' && u.isActive)
    .map(u => {
      const { password, ...user } = u;
      return user;
    });
  res.json(students);
});

// Get single student profile
app.get('/api/users/students/:id', (req, res) => {
  const student = users.find(u => u.id === parseInt(req.params.id) && u.userType === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const { password, ...studentResponse } = student;
  res.json(studentResponse);
});

// Create booking endpoint
app.post('/api/bookings', auth, (req, res) => {
  const { studentId, date, time, duration, location, notes } = req.body;
  
  if (!studentId || !date || !time || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const student = users.find(u => u.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  const booking = {
    id: nextBookingId++,
    parentId: req.user.id,
    studentId,
    date,
    time,
    duration,
    location,
    notes,
    status: 'pending',
    createdAt: new Date()
  };
  
  bookings.push(booking);
  res.status(201).json(booking);
});

// Get user's bookings
app.get('/api/bookings/my-bookings', auth, (req, res) => {
  const userBookings = bookings.filter(b => 
    b.parentId === req.user.id || b.studentId === req.user.id
  );
  res.json(userBookings);
});

// Update booking status
app.put('/api/bookings/:id/status', auth, (req, res) => {
  const { status, reason } = req.body;
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  if (booking.studentId !== req.user.id && booking.parentId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  booking.status = status;
  if (reason) booking.reason = reason;
  
  res.json(booking);
});

// Add review to booking
app.post('/api/bookings/:id/review', auth, (req, res) => {
  const { rating, comment } = req.body;
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  if (booking.parentId !== req.user.id) {
    return res.status(403).json({ error: 'Only parents can add reviews' });
  }
  
  booking.review = { rating, comment, createdAt: new Date() };
  
  // Update student rating
  const student = users.find(u => u.id === booking.studentId);
  if (student) {
    const reviews = bookings
      .filter(b => b.studentId === student.id && b.review)
      .map(b => b.review.rating);
    student.rating = reviews.reduce((a, b) => a + b, 0) / reviews.length;
    student.reviewCount = reviews.length;
  }
  
  res.json(booking);
});

// Update availability (students only)
app.put('/api/users/availability', auth, (req, res) => {
  if (req.user.userType !== 'student') {
    return res.status(403).json({ error: 'Only students can update availability' });
  }
  
  req.user.availability = req.body.availability;
  const { password, ...userResponse } = req.user;
  res.json({ user: userResponse });
});

// Add certification (students only)
app.post('/api/users/certifications', auth, (req, res) => {
  if (req.user.userType !== 'student') {
    return res.status(403).json({ error: 'Only students can add certifications' });
  }
  
  if (!req.user.certifications) {
    req.user.certifications = [];
  }
  
  req.user.certifications.push(req.body.certification);
  const { password, ...userResponse } = req.user;
  res.json({ user: userResponse });
});

// Admin routes - Get all users
app.get('/api/admin/users', auth, adminAuth, (req, res) => {
  const usersResponse = users.map(u => {
    const { password, ...user } = u;
    return user;
  });
  res.json(usersResponse);
});

// Admin routes - Get all bookings
app.get('/api/admin/bookings', auth, adminAuth, (req, res) => {
  res.json(bookings);
});

// Admin routes
app.get('/api/admin/dashboard', auth, adminAuth, (req, res) => {
  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.userType === 'student').length;
  const totalParents = users.filter(u => u.userType === 'parent').length;
  const totalBookings = bookings.length;

  res.json({
    stats: {
      totalUsers,
      totalStudents,
      totalParents,
      totalBookings,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length
    },
    recentUsers: users.slice(-5).map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      userType: u.userType,
      createdAt: u.createdAt
    })),
    recentBookings: bookings.slice(-5)
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    users: users.length,
    bookings: bookings.length
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
