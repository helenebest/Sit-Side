import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

// Core students data - same as in ParentDashboard
const CORE_STUDENTS = [
  {
    id: 1001,
    name: 'Helen Best',
    school: 'Windward High School',
    grade: 11,
    rating: null,
    reviewCount: 0,
    hourlyRateRange: '$18 – $25 / hour',
    location: 'Venice, Los Angeles',
    locationRange: 'Westside of LA and Santa Monica',
    bio: 'Experienced babysitter with retail experience. Math tutoring also available. Love working with kids of all ages!',
    certifications: ['California Licensed Driver'],
    availability: 'Saturdays, evenings after 5:30 PM',
    experience: '2 years',
    image: null,
  },
  {
    id: 1002,
    name: 'Ava Parker',
    school: 'Windward High School',
    grade: 11,
    rating: null,
    reviewCount: 0,
    hourlyRateRange: '$20 / hour',
    location: 'Ladera Heights',
    locationRange: 'Los Angeles and Santa Monica',
    bio: 'Responsible and caring babysitter, coach (softball and volleyball), and tutor. Great with toddlers and school-age children.',
    certifications: ['California Licensed Driver', 'Youth Sports Coach'],
    availability: 'Afternoons, weekends',
    experience: '2 years',
    image: null,
  },
  {
    id: 1003,
    name: 'Lilah Rubinson',
    school: 'Windward High School',
    grade: 11,
    rating: null,
    reviewCount: 0,
    hourlyRateRange: '$20 / hour',
    location: 'Hancock Park / Mid Wilshire',
    locationRange: 'Greater Los Angeles Area',
    bio: 'Very experienced babysitter for kids of all ages.',
    certifications: ['California Licensed Driver'],
    availability: 'Monday–Friday 5:30-10:30 PM',
    experience: '1 year',
    image: null,
  },
  {
    id: 1004,
    name: 'Lila Owens',
    school: 'Windward High School',
    grade: 11,
    rating: null,
    reviewCount: 0,
    hourlyRateRange: '$20 / hour',
    location: 'Westwood',
    locationRange: 'Santa Monica, Brentwood, Westwood, Marina Del Rey and Pacific Palisades',
    bio: 'A responsible and caring babysitter with experience caring for children ages 3+, ensuring their safety and keeping them engaged through fun and educational activities',
    certifications: ['California Licensed Driver'],
    availability: 'Monday-Friday 6:00-10:30 PM, Sundays 8:00 AM-10:00 PM',
    experience: '2 years',
    image: null,
  },
];

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentProfile } = useAuth();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);
      setError(null);
      
      const studentId = parseInt(id);
      
      // First check if it's a core student
      const coreStudent = CORE_STUDENTS.find(s => s.id === studentId);
      if (coreStudent) {
        // Convert core student format to profile format
        setStudent({
          ...coreStudent,
          hourlyRate: coreStudent.hourlyRateRange ? parseFloat(coreStudent.hourlyRateRange.replace(/[^0-9.]/g, '').split('–')[0]) : null,
          phone: null,
          email: null,
          availability: typeof coreStudent.availability === 'string' ? coreStudent.availability : coreStudent.availability,
        });
        setLoading(false);
        return;
      }

      // Otherwise, fetch from API
      try {
        const result = await getStudentProfile(studentId);
        if (result.success && result.data) {
          setStudent(result.data);
        } else {
          setError('Student not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id, getStudentProfile]);

  const reviews = [
    {
      id: 1,
      parentName: 'Sarah Johnson',
      rating: 5,
      date: '2024-01-10',
      comment: 'Alex was amazing with my two kids! They had so much fun and I felt completely comfortable leaving them in her care. Highly recommend!',
    },
    {
      id: 2,
      parentName: 'Mike Chen',
      rating: 5,
      date: '2024-01-05',
      comment: 'Very responsible and punctual. My 3-year-old loved playing with Alex. Will definitely book again.',
    },
    {
      id: 3,
      parentName: 'Lisa Davis',
      rating: 4,
      date: '2023-12-28',
      comment: 'Great babysitter! Very professional and the kids had a wonderful time.',
    },
  ];

  const handleBookNow = () => {
    setBookingDialogOpen(true);
  };

  const handleBookingSubmit = () => {
    setBookingDialogOpen(false);
  };

  const getAvailabilityText = (day, slots) => {
    if (typeof slots === 'string') {
      return slots;
    }
    if (typeof slots === 'object' && slots !== null) {
      const available = Object.entries(slots)
        .filter(([_, available]) => available)
        .map(([timeSlot, _]) => timeSlot);
      
      if (available.length === 0) return 'Not available';
      if (available.length === 3) return 'All day';
      return available.join(', ');
    }
    return 'Not available';
  };

  const renderRate = () => {
    if (!student) return 'Contact for rates';
    if (student.hourlyRateRange) return student.hourlyRateRange;
    if (typeof student.hourlyRate === 'number' && Number.isFinite(student.hourlyRate)) {
      return `$${student.hourlyRate.toFixed(2).replace(/\.00$/, '')} / hour`;
    }
    if (typeof student.hourlyRate === 'string') {
      return student.hourlyRate.includes('$') ? student.hourlyRate : `$${student.hourlyRate}`;
    }
    return 'Contact for rates';
  };

  const renderRating = () => {
    if (!student) return 'New sitter';
    const numericRating = Number(student.rating);
    if (Number.isFinite(numericRating) && numericRating > 0) {
      const reviewCount = Number(student.reviewCount) || 0;
      const reviewsLabel = reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}` : 'rating';
      return `${numericRating.toFixed(1)} (${reviewsLabel})`;
    }
    return 'New sitter';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-light">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-dark mb-4">Student Not Found</h2>
          <p className="text-neutral-light mb-6">{error || 'The student profile you are looking for does not exist.'}</p>
          <PrimaryButton onClick={() => navigate('/parent')}>
            Back to Search
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  const availability = typeof student.availability === 'string' 
    ? student.availability 
    : student.availability;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mr-6">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-dark">{student.name}</h1>
                <p className="text-lg text-neutral-light">Grade {student.grade} • {student.school}</p>
                {(student.rating || student.reviewCount > 0) && (
                  <div className="flex items-center mt-2">
                    {student.rating && Number.isFinite(Number(student.rating)) && Number(student.rating) > 0 && (
                      <div className="flex items-center mr-4">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-lg">
                            {i < Math.floor(Number(student.rating)) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-neutral-dark font-medium">{renderRating()}</span>
                  </div>
                )}
                <p className="text-sm text-neutral-light mt-1 flex items-center">
                  📍 {student.location || 'Location not specified'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-neutral-dark mb-4">About Me</h2>
              <p className="text-neutral-light leading-relaxed">{student.bio}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-neutral-dark mb-4">Certifications & Experience</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {student.certifications.map((cert, index) => (
                  <Badge key={index} color="primary">{cert}</Badge>
                ))}
              </div>
              <p className="text-neutral-light">Experience: {student.experience}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-neutral-dark mb-4">Availability</h2>
              {typeof availability === 'string' ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-neutral-dark">{availability}</p>
                </div>
              ) : availability && typeof availability === 'object' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(availability).map(([day, slots]) => (
                    <div key={day} className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-neutral-dark mb-2 capitalize">{day}</h4>
                      <p className="text-sm text-neutral-light">{getAvailabilityText(day, slots)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-light">Availability not set</p>
              )}
            </div>

            {student.reviewCount > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-neutral-dark mb-4">Reviews</h2>
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <div key={review.id}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-neutral-dark">{review.parentName}</h4>
                          <div className="flex items-center">
                            <div className="flex items-center mr-2">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-yellow-400">
                                  {i < review.rating ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-neutral-light">{review.date}</span>
                          </div>
                        </div>
                        <p className="text-neutral-light">{review.comment}</p>
                        {index < reviews.length - 1 && <div className="border-b border-gray-200 mt-4" />}
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-light">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-8">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Booking Information</h3>
            
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">💰</span>
              <span className="text-3xl font-bold text-primary">{renderRate()}</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-neutral-dark">Background Verified</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-yellow-400 mr-2">⭐</span>
                <span className="text-neutral-dark">{renderRating()}</span>
              </div>
              {student.reviewCount > 0 && (
                <div className="flex items-center text-sm">
                  <span className="text-neutral-light mr-2">📅</span>
                  <span className="text-neutral-dark">{student.reviewCount} Completed Booking{student.reviewCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <PrimaryButton onClick={handleBookNow} className="w-full">
                Book Now
              </PrimaryButton>
              <OutlineButton 
                className="w-full"
                onClick={() => navigate('/parent')}
              >
                Back to Search
              </OutlineButton>
            </div>
          </Card>

          {/* Contact Information */}
          {(student.phone || student.email) && (
            <Card className="p-6 mt-4">
              <h3 className="text-xl font-semibold text-neutral-dark mb-4">Contact Information</h3>
              <div className="space-y-2">
                {student.phone && (
                  <div className="flex items-center text-sm">
                    <span className="text-neutral-light mr-2">📞</span>
                    <span className="text-neutral-dark">{student.phone}</span>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center text-sm">
                    <span className="text-neutral-light mr-2">📧</span>
                    <span className="text-neutral-dark">{student.email}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Booking Dialog */}
      {bookingDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Quick Book {student.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Start Time</label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">End Time</label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Number of Children</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Special Instructions</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Any special needs, allergies, or instructions..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setBookingDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton onClick={handleBookingSubmit} className="flex-1">
                Send Booking Request
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
