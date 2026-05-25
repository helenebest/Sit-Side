const mongoose = require('../mongoose');

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

  serviceType: {
    type: String,
    enum: ['babysitter', 'tutor', 'coach'],
    default: 'babysitter',
  },
  tutoringSubject: { type: String, trim: true },
  tutoringSubjectOther: { type: String, trim: true, maxlength: 120 },
  coachingSport: { type: String, trim: true },
  coachingSportOther: { type: String, trim: true, maxlength: 120 },
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'disputed'], 
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

  // Conversation/messages related to this booking (web or Slack)
  messages: [
    {
      senderRole: { type: String, enum: ['parent', 'student', 'system'], required: true },
      source: { type: String, enum: ['web', 'slack'], default: 'web' },
      text: { type: String, required: true, maxlength: 2000 },
      sentAt: { type: Date, default: Date.now },
      slack: {
        channel: String,
        userId: String,
        messageTs: String,
        threadTs: String,
      },
    },
  ],
  
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

// totalAmount must be set before Mongoose validates required paths (validate runs before pre('save')).
// Mongoose 8+: sync hooks omit `next`; calling next() throws "next is not a function" in some runtimes.
bookingSchema.pre('validate', function () {
  const rate = this.hourlyRate;
  if (this.startTime && this.endTime != null && rate != null && Number.isFinite(Number(rate))) {
    const start = new Date(`2000-01-01T${this.startTime}`);
    let end = new Date(`2000-01-01T${this.endTime}`);
    if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end <= start) {
      end.setDate(end.getDate() + 1);
    }
    const hours = (end - start) / (1000 * 60 * 60);
    if (Number.isFinite(hours)) {
      const raw = hours * Number(rate);
      this.totalAmount = Math.round(Math.max(0, raw) * 100) / 100;
    }
  }
  if (this.totalAmount == null || Number.isNaN(this.totalAmount)) {
    this.totalAmount = 0;
  }
});

// Update timestamp on save
bookingSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Booking', bookingSchema);
