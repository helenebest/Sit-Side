const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  userType: { type: String, enum: ['student', 'parent', 'admin'], required: true },
  
  // Student-specific fields
  grade: { type: Number, min: 9, max: 12 },
  school: { type: String, trim: true },
  bio: { type: String, maxlength: 500 },
  hourlyRate: { type: Number, min: 5, max: 50 },
  experience: { type: String, trim: true },
  certifications: [{ type: String, trim: true }],
  location: { type: String, trim: true },
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
  emergencyContact: { type: String, trim: true },
  
  // Common fields
  profileImage: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  backgroundCheckStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'not_required'], 
    default: 'not_required' 
  },
  backgroundCheckId: { type: String },
  backgroundCheckResults: { type: Object },
  
  // Push notification subscriptions
  pushSubscriptions: [{ type: Object }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
