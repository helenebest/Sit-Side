import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

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
    availability: 'Evenings, weekends',
    experience: '2 years',
    image: null,
  },
];

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { getStudents } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    maxRate: '',
    availability: '',
    experience: '',
  });
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fetchedStudents, setFetchedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  // Mock booking data
  const bookings = [
    {
      id: 1,
      studentName: 'Alex Thompson',
      date: '2024-01-15',
      time: '6:00 PM - 10:00 PM',
      status: 'confirmed',
      amount: 60,
      children: '2 kids (ages 5 & 8)',
    },
    {
      id: 2,
      studentName: 'Emma Rodriguez',
      date: '2024-01-18',
      time: '4:00 PM - 8:00 PM',
      status: 'pending',
      amount: 72,
      children: '1 kid (age 3)',
    },
  ];

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const handleSearch = () => {
    console.log('Searching with filters:', searchFilters);
  };

  const handleBookStudent = (student) => {
    setSelectedStudent(student);
    setBookingDialogOpen(true);
  };

  const handleBookingSubmit = () => {
    setBookingDialogOpen(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      setStudentsLoading(true);
      setStudentsError('');
      try {
        const result = await getStudents();
        if (!isMounted) {
          return;
        }

        if (result.success) {
          // Prevent duplicates: filter out students that match core students by ID
          // Note: For testing, we only filter by ID (not name) so core group members
          // (Ava, Lila, Lilah) can create test accounts and see their own profiles.
          // In production, you may want to also filter by name/email to prevent true duplicates.
          const coreIds = new Set(CORE_STUDENTS.map((student) => String(student.id)));
          const uniqueStudents = (result.data || []).filter(
            (student) => !coreIds.has(String(student.id)),
          );
          setFetchedStudents(uniqueStudents);
        } else {
          setStudentsError(result.error || 'Unable to fetch students.');
        }
      } catch (error) {
        if (isMounted) {
          setStudentsError(error.message || 'Unable to fetch students.');
        }
      } finally {
        if (isMounted) {
          setStudentsLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, [getStudents]);

  const students = useMemo(() => {
    if (!fetchedStudents.length) {
      return CORE_STUDENTS;
    }
    return [...CORE_STUDENTS, ...fetchedStudents];
  }, [fetchedStudents]);

  const renderRate = (student) => {
    if (student.hourlyRateRange) {
      return student.hourlyRateRange;
    }
    if (typeof student.hourlyRate === 'number' && Number.isFinite(student.hourlyRate)) {
      return `$${student.hourlyRate.toFixed(2).replace(/\.00$/, '')} / hour`;
    }
    if (typeof student.hourlyRate === 'string') {
      return student.hourlyRate.includes('$') ? student.hourlyRate : `$${student.hourlyRate}`;
    }
    return 'Contact for rates';
  };

  const renderRating = (student) => {
    const numericRating = Number(student.rating);
    if (Number.isFinite(numericRating) && numericRating > 0) {
      const reviewCount = Number(student.reviewCount) || 0;
      const reviewsLabel = reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}` : 'rating';
      return `${numericRating.toFixed(1)} (${reviewsLabel})`;
    }
    return 'New sitter';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'cancelled': return '✗';
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-neutral-dark mb-8">Find Babysitters</h1>

      {/* Search and Filters */}
      <Card className="p-6 mb-8">
        <h3 className="text-xl font-semibold text-neutral-dark mb-4">Search Babysitters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-dark mb-2">Location</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your area"
              value={searchFilters.location}
              onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">Max Rate</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-neutral-light">$</span>
              <input
                type="number"
                className="w-full rounded-xl border border-gray-300 px-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchFilters.maxRate}
                onChange={(e) => setSearchFilters({ ...searchFilters, maxRate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">Availability</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchFilters.availability}
              onChange={(e) => setSearchFilters({ ...searchFilters, availability: e.target.value })}
            >
              <option value="">Any</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>
          <div>
            <PrimaryButton onClick={handleSearch} className="w-full">
              🔍 Search
            </PrimaryButton>
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {['Available Babysitters', 'My Bookings', 'Favorites'].map((tab, index) => (
              <button
                key={tab}
                onClick={() => handleTabChange(index)}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === index
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-light hover:text-neutral-dark'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Available Babysitters Tab */}
          {activeTab === 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-neutral-dark">
                  Available Babysitters ({students.length})
                </h3>
              </div>
              {studentsError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {studentsError}
                </div>
              )}
              {studentsLoading && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Loading babysitters…
                </div>
              )}
              {!studentsLoading && students.length === 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-6 text-center text-blue-800">
                  No babysitters yet. Invite students to complete their profiles!
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <Card key={student.id} className="p-6 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center mb-4">
                      <div className="h-16 w-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-xl mr-4">
                        {student.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-neutral-dark">{student.name}</h4>
                        <p className="text-sm text-neutral-light">Grade {student.grade} • {student.school}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-400 mr-1">⭐</span>
                          <span className="text-sm text-neutral-dark">{renderRating(student)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-neutral-light text-sm mb-4">{student.bio}</p>

                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-neutral-dark mb-2">Certifications:</h5>
                      <div className="flex flex-wrap gap-2">
                        {(student.certifications || []).length > 0 ? (
                          student.certifications.map((certification) => (
                            <Badge key={certification} color="primary">{certification}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-light">No certifications listed</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-neutral-light">
                        📍 {student.location}
                      </div>
                      <div className="flex items-center text-sm text-neutral-light">
                        📅 {student.availability || 'Availability not set'}
                      </div>
                      <div className="flex items-center text-sm text-neutral-light">
                        💰 {renderRate(student)}
                      </div>
                      {student.locationRange && (
                        <div className="flex items-center text-sm text-neutral-light">
                          📍 Service area: {student.locationRange}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <OutlineButton 
                        className="flex-1"
                        onClick={() => navigate(`/student/${student.id}`)}
                      >
                        View Profile
                      </OutlineButton>
                      <PrimaryButton 
                        className="flex-1"
                        onClick={() => handleBookStudent(student)}
                      >
                        Book Now
                      </PrimaryButton>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* My Bookings Tab */}
          {activeTab === 1 && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-dark mb-4">Your Bookings</h3>
              {bookings.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                  No bookings yet. Browse available babysitters to get started!
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center p-4 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0 mr-4">
                        <span className="text-lg">{getStatusIcon(booking.status)}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-neutral-dark">{booking.studentName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-light">{booking.date} • {booking.time}</p>
                        <p className="text-sm text-neutral-light">{booking.children}</p>
                        <p className="text-sm font-medium text-primary">${booking.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 2 && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-dark mb-4">Your Favorites</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                Save your favorite babysitters here for quick booking!
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Booking Dialog */}
      {bookingDialogOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Book {selectedStudent.name}</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              You're about to book {selectedStudent.name} at {renderRate(selectedStudent)}
            </div>
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

export default ParentDashboard;
