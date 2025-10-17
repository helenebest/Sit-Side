const express = require('express');
const User = require('../models/User');
const { auth, requireStudentOrParent } = require('../middleware/auth');
const router = express.Router();

// Get all students (for parents to browse)
router.get('/students', auth, requireStudentOrParent, async (req, res) => {
  try {
    const { 
      location, 
      maxRate, 
      availability, 
      experience, 
      page = 1, 
      limit = 10 
    } = req.query;

    // Build filter object
    const filter = { 
      userType: 'student', 
      isActive: true,
      isVerified: true 
    };

    // Add location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Add rate filter
    if (maxRate) {
      filter.hourlyRate = { $lte: parseFloat(maxRate) };
    }

    // Add experience filter
    if (experience) {
      const years = parseInt(experience.replace('+', ''));
      filter.experience = { $regex: `\\b${years}\\+?`, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find students
    const students = await User.find(filter)
      .select('-password -pushSubscriptions')
      .sort({ rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single student profile
router.get('/students/:id', auth, requireStudentOrParent, async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      userType: 'student',
      isActive: true
    }).select('-password -pushSubscriptions');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search students
router.get('/search', auth, requireStudentOrParent, async (req, res) => {
  try {
    const { q, location, maxRate } = req.query;

    if (!q && !location && !maxRate) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const filter = { 
      userType: 'student', 
      isActive: true,
      isVerified: true 
    };

    // Text search
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { school: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }

    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Rate filter
    if (maxRate) {
      filter.hourlyRate = { $lte: parseFloat(maxRate) };
    }

    const students = await User.find(filter)
      .select('-password -pushSubscriptions')
      .sort({ rating: -1, reviewCount: -1 })
      .limit(20);

    res.json({ students });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user availability (students only)
router.put('/availability', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can update availability' });
    }

    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({ error: 'Availability data required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true, runValidators: true }
    );

    res.json({
      availability: user.availability,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add certification (students only)
router.post('/certifications', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can add certifications' });
    }

    const { certification } = req.body;

    if (!certification || !certification.trim()) {
      return res.status(400).json({ error: 'Certification name required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.certifications.includes(certification.trim())) {
      user.certifications.push(certification.trim());
      await user.save();
    }

    res.json({
      certifications: user.certifications,
      message: 'Certification added successfully'
    });
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove certification (students only)
router.delete('/certifications/:certification', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can remove certifications' });
    }

    const certification = decodeURIComponent(req.params.certification);
    
    const user = await User.findById(req.user._id);
    user.certifications = user.certifications.filter(cert => cert !== certification);
    await user.save();

    res.json({
      certifications: user.certifications,
      message: 'Certification removed successfully'
    });
  } catch (error) {
    console.error('Remove certification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
