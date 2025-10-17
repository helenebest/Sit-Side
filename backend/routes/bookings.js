const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, requireStudentOrParent } = require('../middleware/auth');
const router = express.Router();

// Create new booking
router.post('/', auth, requireStudentOrParent, async (req, res) => {
  try {
    const {
      studentId,
      date,
      startTime,
      endTime,
      numberOfChildren,
      childrenAges,
      specialInstructions,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!studentId || !date || !startTime || !endTime || !numberOfChildren || !emergencyContact) {
      return res.status(400).json({
        error: 'Missing required fields: studentId, date, startTime, endTime, numberOfChildren, emergencyContact'
      });
    }

    // Only parents can create bookings
    if (req.user.userType !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create bookings' });
    }

    // Get student information
    const student = await User.findOne({
      _id: studentId,
      userType: 'student',
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student is verified
    if (!student.isVerified) {
      return res.status(400).json({ error: 'Student is not verified' });
    }

    // Create booking
    const booking = new Booking({
      student: studentId,
      parent: req.user._id,
      date: new Date(date),
      startTime,
      endTime,
      numberOfChildren,
      childrenAges: childrenAges || [],
      specialInstructions: specialInstructions || '',
      emergencyContact,
      hourlyRate: student.hourlyRate
    });

    await booking.save();

    // Populate the booking with user details
    await booking.populate([
      { path: 'student', select: 'firstName lastName email phone rating' },
      { path: 'parent', select: 'firstName lastName email phone' }
    ]);

    res.status(201).json({
      booking,
      message: 'Booking request created successfully'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, requireStudentOrParent, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    // Filter by user role
    if (req.user.userType === 'student') {
      filter.student = req.user._id;
    } else if (req.user.userType === 'parent') {
      filter.parent = req.user._id;
    }
    
    // Filter by status
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate([
        { path: 'student', select: 'firstName lastName email phone rating profileImage' },
        { path: 'parent', select: 'firstName lastName email phone profileImage' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single booking
router.get('/:id', auth, requireStudentOrParent, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate([
        { path: 'student', select: 'firstName lastName email phone rating profileImage' },
        { path: 'parent', select: 'firstName lastName email phone profileImage' }
      ]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.userType === 'student' && booking.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.userType === 'parent' && booking.parent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status (student can confirm/reject, parent can cancel)
router.put('/:id/status', auth, requireStudentOrParent, async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('student parent');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check permissions
    const isStudent = req.user.userType === 'student' && booking.student._id.toString() === req.user._id.toString();
    const isParent = req.user.userType === 'parent' && booking.parent._id.toString() === req.user._id.toString();
    
    if (!isStudent && !isParent) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status changes
    if (isStudent) {
      if (!['confirmed', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Students can only confirm or reject bookings' });
      }
      if (booking.status !== 'pending') {
        return res.status(400).json({ error: 'Can only update pending bookings' });
      }
    }

    if (isParent) {
      if (!['cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Parents can only cancel bookings' });
      }
      if (['completed', 'cancelled'].includes(booking.status)) {
        return res.status(400).json({ error: 'Cannot update completed or cancelled bookings' });
      }
    }

    // Update booking
    booking.status = status;
    if (reason) {
      booking.disputeReason = reason;
    }

    await booking.save();

    res.json({
      booking,
      message: `Booking ${status} successfully`
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark booking as completed
router.put('/:id/complete', auth, requireStudentOrParent, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check permissions - only parent can mark as completed
    if (req.user.userType !== 'parent' || booking.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the parent can mark booking as completed' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Can only complete confirmed bookings' });
    }

    booking.status = 'completed';
    await booking.save();

    res.json({
      booking,
      message: 'Booking marked as completed'
    });

  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add review to booking
router.post('/:id/review', auth, requireStudentOrParent, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user has access to this booking
    const isStudent = req.user.userType === 'student' && booking.student.toString() === req.user._id.toString();
    const isParent = req.user.userType === 'parent' && booking.parent.toString() === req.user._id.toString();
    
    if (!isStudent && !isParent) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    // Check if user already reviewed
    if (isStudent && booking.studentReview) {
      return res.status(400).json({ error: 'Student has already reviewed this booking' });
    }
    
    if (isParent && booking.parentReview) {
      return res.status(400).json({ error: 'Parent has already reviewed this booking' });
    }

    // Add review
    const review = {
      rating,
      comment: comment || '',
      createdAt: new Date()
    };

    if (isStudent) {
      booking.studentReview = review;
    } else {
      booking.parentReview = review;
    }

    await booking.save();

    // Update user rating if both reviews are complete
    if (booking.studentReview && booking.parentReview) {
      const student = await User.findById(booking.student);
      const allStudentBookings = await Booking.find({
        student: booking.student,
        'studentReview.rating': { $exists: true },
        'parentReview.rating': { $exists: true }
      });

      const totalRating = allStudentBookings.reduce((sum, b) => sum + b.parentReview.rating, 0);
      const averageRating = totalRating / allStudentBookings.length;

      student.rating = Math.round(averageRating * 10) / 10;
      student.reviewCount = allStudentBookings.length;
      await student.save();
    }

    res.json({
      booking,
      message: 'Review added successfully'
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
