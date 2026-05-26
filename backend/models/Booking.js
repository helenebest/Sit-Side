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

function minutesFromTime(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function calculateTotalAmount(startTime, endTime, hourlyRate) {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  const rate = Number(hourlyRate);
  if (start == null || end == null || !Number.isFinite(rate)) return null;

  let durationMinutes = end - start;
  if (durationMinutes <= 0) {
    durationMinutes += 24 * 60;
  }

  return Math.round((durationMinutes / 60) * rate * 100) / 100;
}

// totalAmount must be set before Mongoose validates required paths (validate runs before pre('save')).
// Mongoose 8+: sync hooks omit `next`; calling next() throws "next is not a function" in some runtimes.
bookingSchema.pre('validate', function () {
  if (this.startTime && minutesFromTime(this.startTime) == null) {
    this.invalidate('startTime', 'Start time must be a valid HH:MM time');
  }
  if (this.endTime && minutesFromTime(this.endTime) == null) {
    this.invalidate('endTime', 'End time must be a valid HH:MM time');
  }

  const calculatedTotal = calculateTotalAmount(this.startTime, this.endTime, this.hourlyRate);
  if (calculatedTotal != null) {
    this.totalAmount = calculatedTotal;
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
