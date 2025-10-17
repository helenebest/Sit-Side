const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  numberOfChildren: { type: Number, required: true, min: 1, max: 10 },
  childrenAges: [{ type: Number, min: 0, max: 18 }],
  specialInstructions: { type: String, maxlength: 1000 },
  emergencyContact: { type: String, required: true },
  hourlyRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'disputed'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  },
  
  // Payment information
  stripePaymentIntentId: { type: String },
  stripeCustomerId: { type: String },
  
  // Reviews
  studentReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date }
  },
  parentReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date }
  },
  
  // Dispute information
  disputeReason: { type: String },
  disputeResolution: { 
    type: String, 
    enum: ['refund', 'partial_refund', 'no_action', 'pending'] 
  },
  adminNotes: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate total amount before saving
bookingSchema.pre('save', function(next) {
  if (this.startTime && this.endTime && this.hourlyRate) {
    const start = new Date(`2000-01-01T${this.startTime}`);
    const end = new Date(`2000-01-01T${this.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    this.totalAmount = Math.round(hours * this.hourlyRate * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
