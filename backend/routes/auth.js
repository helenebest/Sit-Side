const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../lib/jwtSecret');
const { auth } = require('../middleware/auth');
const { notifyAdminPendingUserApproval } = require('../services/slack');
const {
  normalizedTutoringOfferings,
  normalizedCoachingOfferings,
  sanitizedTutoringOfferingsInput,
  sanitizedCoachingOfferingsInput,
  validateTutoringOfferings,
  validateCoachingOfferings,
} = require('../lib/studentOfferings');
const router = express.Router();

function studentProfileShape(user) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    userType: user.userType,
    grade: user.grade,
    school: user.school,
    bio: user.bio,
    hourlyRate: user.hourlyRate,
    useSameRateForAllServices: user.useSameRateForAllServices,
    hourlyRateTutor: user.hourlyRateTutor,
    hourlyRateCoach: user.hourlyRateCoach,
    tutoringOfferings: normalizedTutoringOfferings(user),
    coachingOfferings: normalizedCoachingOfferings(user),
    tutoringSubject: user.tutoringSubject,
    tutoringSubjectOther: user.tutoringSubjectOther,
    coachingSport: user.coachingSport,
    coachingSportOther: user.coachingSportOther,
    experience: user.experience,
    certifications: user.certifications,
    location: user.location,
    availability: user.availability,
    unavailableDates: user.unavailableDates,
    emergencyContact: user.emergencyContact,
    profileImage: user.profileImage,
    rating: user.rating,
    reviewCount: user.reviewCount,
    isVerified: user.isVerified,
    isActive: user.isActive,
    backgroundCheckStatus: user.backgroundCheckStatus,
    slackUserId: user.slackUserId,
    createdAt: user.createdAt,
  };
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      userType,
      grade,
      school,
      bio,
      hourlyRate,
      experience,
      certifications,
      location,
      availability,
      emergencyContact
    } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !userType) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, firstName, lastName, phone, userType' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Validate userType. Admins are provisioned through the protected seed path, never public signup.
    if (!['student', 'parent'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Validate student-specific fields
    if (userType === 'student') {
      if (!grade || !school) {
        return res.status(400).json({ 
          error: 'Students must provide grade and school' 
        });
      }
      if (grade < 9 || grade > 12) {
        return res.status(400).json({ 
          error: 'Grade must be between 9 and 12' 
        });
      }
    }

    // Create user object
    const userData = {
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      userType
    };

    // Add student-specific fields
    if (userType === 'student') {
      userData.grade = grade;
      userData.school = school?.trim();
      userData.bio = bio?.trim();
      userData.hourlyRate = hourlyRate || 15;
      userData.experience = experience?.trim();
      userData.certifications = certifications || [];
      userData.location = location?.trim();
      userData.availability = availability || {
        monday: { morning: false, afternoon: true, evening: true },
        tuesday: { morning: false, afternoon: true, evening: true },
        wednesday: { morning: false, afternoon: true, evening: true },
        thursday: { morning: false, afternoon: true, evening: true },
        friday: { morning: false, afternoon: true, evening: true },
        saturday: { morning: true, afternoon: true, evening: true },
        sunday: { morning: true, afternoon: true, evening: false }
      };
    }

    // Add parent-specific fields
    if (userType === 'parent') {
      userData.emergencyContact = emergencyContact?.trim();
    }

    // Create user
    const user = new User(userData);
    await user.save();

    if ((userType === 'student' || userType === 'parent') && !user.isVerified) {
      try {
        await notifyAdminPendingUserApproval(user);
        user.adminApprovalSlackNotifiedAt = new Date();
        await user.save();
      } catch (slackErr) {
        console.error('Admin approval Slack notification failed:', slackErr);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user data (password excluded by toJSON method)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        grade: user.grade,
        school: user.school,
        isVerified: user.isVerified,
        rating: user.rating,
        reviewCount: user.reviewCount
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account has been suspended. Please contact support.' 
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        grade: user.grade,
        school: user.school,
        isVerified: user.isVerified,
        rating: user.rating,
        reviewCount: user.reviewCount,
        profileImage: user.profileImage
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: studentProfileShape(user),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'bio', 'hourlyRate',
      'experience', 'certifications', 'location', 'availability',
      'emergencyContact', 'profileImage', 'slackUserId',
      'useSameRateForAllServices', 'hourlyRateTutor', 'hourlyRateCoach',
      'tutoringOfferings', 'coachingOfferings',
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (req.user.userType === 'student') {
      delete updates.hourlyRateTutor;
      delete updates.hourlyRateCoach;
      if (req.body.tutoringOfferings !== undefined) {
        const sanitized = sanitizedTutoringOfferingsInput(req.body.tutoringOfferings);
        const err = validateTutoringOfferings(sanitized);
        if (err) return res.status(400).json({ error: err });
        updates.tutoringOfferings = sanitized;
        updates.tutoringSubject = '';
        updates.tutoringSubjectOther = '';
      }
      if (req.body.coachingOfferings !== undefined) {
        const sanitized = sanitizedCoachingOfferingsInput(req.body.coachingOfferings);
        const err = validateCoachingOfferings(sanitized);
        if (err) return res.status(400).json({ error: err });
        updates.coachingOfferings = sanitized;
        updates.coachingSport = '';
        updates.coachingSportOther = '';
      }
      if (updates.useSameRateForAllServices !== undefined) {
        updates.useSameRateForAllServices = Boolean(updates.useSameRateForAllServices);
      }
      const parseRate = (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        const n = Number(val);
        return Number.isFinite(n) ? n : undefined;
      };
      if (req.body.hourlyRateTutor !== undefined) {
        const n = parseRate(req.body.hourlyRateTutor);
        if (n !== undefined) updates.hourlyRateTutor = n;
      }
      if (req.body.hourlyRateCoach !== undefined) {
        const n = parseRate(req.body.hourlyRateCoach);
        if (n !== undefined) updates.hourlyRateCoach = n;
      }
    } else {
      delete updates.useSameRateForAllServices;
      delete updates.hourlyRateTutor;
      delete updates.hourlyRateCoach;
      delete updates.tutoringOfferings;
      delete updates.coachingOfferings;
    }

    let user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (
      (user.userType === 'student' || user.userType === 'parent') &&
      !user.isVerified &&
      !user.adminApprovalSlackNotifiedAt
    ) {
      try {
        await notifyAdminPendingUserApproval(user);
        user = await User.findByIdAndUpdate(
          req.user._id,
          { adminApprovalSlackNotifiedAt: new Date() },
          { returnDocument: 'after', runValidators: true }
        );
      } catch (slackErr) {
        console.error('Admin approval Slack notification failed:', slackErr);
      }
    }

    res.json({
      user: studentProfileShape(user),
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token (for frontend auth check)
router.get('/verify', auth, (req, res) => {
  res.json({
    valid: true,
    user: studentProfileShape(req.user),
  });
});

module.exports = router;
