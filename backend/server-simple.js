const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple in-memory storage (for demo purposes)
let users = [];
let bookings = [];
let nextUserId = 1;
let nextBookingId = 1;

// Create default admin user
const defaultAdmin = {
  id: 0,
  email: 'admin@sitside.com',
  password: 'Tenacity2301!',
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
  
  // Simple token validation (in real app, use JWT)
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
  const { email, password, firstName, lastName, phone, userType, grade, school } = req.body;
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // Create user
  const user = {
    id: nextUserId++,
    email,
    password, // In real app, hash this
    firstName,
    lastName,
    phone,
    userType,
    grade,
    school,
    token: `token_${nextUserId}_${Date.now()}`,
    rating: 0,
    reviewCount: 0,
    isVerified: true,
    createdAt: new Date()
  };
  
  users.push(user);
  
  res.status(201).json({
    token: user.token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      grade: user.grade,
      school: user.school,
      rating: user.rating,
      reviewCount: user.reviewCount
    },
    message: 'User registered successfully'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({
    token: user.token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      grade: user.grade,
      school: user.school,
      rating: user.rating,
      reviewCount: user.reviewCount
    },
    message: 'Login successful'
  });
});

app.get('/api/auth/verify', auth, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      userType: req.user.userType
    }
  });
});

// User routes
app.get('/api/users/students', auth, (req, res) => {
  const students = users.filter(u => u.userType === 'student');
  res.json({
    students: students.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      grade: s.grade,
      school: s.school,
      rating: s.rating,
      reviewCount: s.reviewCount,
      hourlyRate: 15,
      location: 'Downtown Area',
      bio: 'Experienced babysitter with CPR certification.',
      certifications: ['CPR Certified', 'First Aid']
    })),
    pagination: {
      page: 1,
      limit: 10,
      total: students.length,
      pages: 1
    }
  });
});

app.get('/api/users/students/:id', auth, (req, res) => {
  const student = users.find(u => u.id == req.params.id && u.userType === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  res.json({
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      grade: student.grade,
      school: student.school,
      rating: student.rating,
      reviewCount: student.reviewCount,
      hourlyRate: 15,
      location: 'Downtown Area',
      bio: 'Experienced babysitter with CPR certification.',
      certifications: ['CPR Certified', 'First Aid'],
      availability: {
        monday: { morning: false, afternoon: true, evening: true },
        tuesday: { morning: false, afternoon: true, evening: true },
        wednesday: { morning: false, afternoon: true, evening: true },
        thursday: { morning: false, afternoon: true, evening: true },
        friday: { morning: false, afternoon: true, evening: true },
        saturday: { morning: true, afternoon: true, evening: true },
        sunday: { morning: true, afternoon: true, evening: false }
      }
    }
  });
});

// Booking routes
app.post('/api/bookings', auth, (req, res) => {
  const { studentId, date, startTime, endTime, numberOfChildren, emergencyContact } = req.body;
  
  if (req.user.userType !== 'parent') {
    return res.status(403).json({ error: 'Only parents can create bookings' });
  }
  
  const student = users.find(u => u.id == studentId && u.userType === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  const booking = {
    id: nextBookingId++,
    student: studentId,
    parent: req.user.id,
    date: new Date(date),
    startTime,
    endTime,
    numberOfChildren,
    emergencyContact,
    hourlyRate: 15,
    totalAmount: 60,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date()
  };
  
  bookings.push(booking);
  
  res.status(201).json({
    booking: {
      ...booking,
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName },
      parent: { id: req.user.id, firstName: req.user.firstName, lastName: req.user.lastName }
    },
    message: 'Booking request created successfully'
  });
});

app.get('/api/bookings/my-bookings', auth, (req, res) => {
  const userBookings = bookings.filter(b => 
    (req.user.userType === 'student' && b.student == req.user.id) ||
    (req.user.userType === 'parent' && b.parent == req.user.id)
  );
  
  res.json({
    bookings: userBookings.map(booking => ({
      ...booking,
      student: users.find(u => u.id == booking.student),
      parent: users.find(u => u.id == booking.parent)
    })),
    pagination: {
      page: 1,
      limit: 10,
      total: userBookings.length,
      pages: 1
    }
  });
});

// Admin routes
app.get('/api/admin/dashboard', auth, adminAuth, (req, res) => {
  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.userType === 'student').length;
  const totalParents = users.filter(u => u.userType === 'parent').length;
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  
  res.json({
    stats: {
      totalUsers,
      totalStudents,
      totalParents,
      totalBookings,
      pendingBookings,
      completedBookings
    },
    recentUsers: users.slice(-5).map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      userType: u.userType,
      createdAt: u.createdAt
    })),
    recentBookings: bookings.slice(-5).map(b => ({
      id: b.id,
      status: b.status,
      totalAmount: b.totalAmount,
      createdAt: b.createdAt,
      student: users.find(u => u.id == b.student),
      parent: users.find(u => u.id == b.parent)
    }))
  });
});

app.get('/api/admin/users', auth, adminAuth, (req, res) => {
  const { page = 1, limit = 10, userType } = req.query;
  let filteredUsers = users;
  
  if (userType) {
    filteredUsers = users.filter(u => u.userType === userType);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  res.json({
    users: paginatedUsers.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      userType: u.userType,
      grade: u.grade,
      school: u.school,
      phone: u.phone,
      createdAt: u.createdAt,
      isActive: u.isActive !== false
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredUsers.length,
      pages: Math.ceil(filteredUsers.length / limit)
    }
  });
});

app.put('/api/admin/users/:id/toggle', auth, adminAuth, (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.isActive = !user.isActive;
  res.json({ 
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive
    }
  });
});

app.delete('/api/admin/users/:id', auth, adminAuth, (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Don't allow deleting admin user
  if (users[userIndex].userType === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin user' });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  res.json({ 
    message: 'User deleted successfully',
    user: {
      id: deletedUser.id,
      firstName: deletedUser.firstName,
      lastName: deletedUser.lastName,
      email: deletedUser.email
    }
  });
});

app.get('/api/admin/bookings', auth, adminAuth, (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  let filteredBookings = bookings;
  
  if (status) {
    filteredBookings = bookings.filter(b => b.status === status);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
  
  res.json({
    bookings: paginatedBookings.map(b => ({
      ...b,
      student: users.find(u => u.id == b.student),
      parent: users.find(u => u.id == b.parent)
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredBookings.length,
      pages: Math.ceil(filteredBookings.length / limit)
    }
  });
});

app.put('/api/admin/bookings/:id/status', auth, adminAuth, (req, res) => {
  const bookingId = parseInt(req.params.id);
  const { status } = req.body;
  
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  booking.status = status;
  res.json({ 
    message: 'Booking status updated successfully',
    booking: {
      ...booking,
      student: users.find(u => u.id == booking.student),
      parent: users.find(u => u.id == booking.parent)
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    users: users.length,
    bookings: bookings.length
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`💾 Using in-memory storage (demo mode)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
