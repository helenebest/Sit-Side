import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    maxRate: '',
    availability: '',
    experience: '',
  });
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
];
  const students = [
    {
      id: 1,
      name: 'Helen Best',
      school: 'Windward High School',
      grade: 11,
      rating: null,
      reviewCount: null,
      hourlyRate: 18-25,
      location: 'Venice, Los Angeles',
      locationRange: 'Westside of LA and Santa Monica.',
      bio: 'Experienced babysitter with Retail Experience. Tutoring in math also available. Love working with kids of all ages!',
      certifications: ['California Licensed Driver'],
      availability: 'Saturdays, Evenings After 5:30 PM',
      experience: '2 years',
      image: null,
    },
    {
      id: 2,
      name: 'Ava Parker',
      school: 'Windward High School',
      grade: 11,
      rating: null,
      reviewCount: null,
      hourlyRate: 20,
      location: 'Ladera Heights',
      locationRange: 'Los Angeles and Santa Monica City.',
      bio: 'Responsible and caring babysitter, coach (Softball and Volleyball), and tutor. Great with toddlers and school-age children.',
      availability: 'Afternoons, Weekends',
      experience: '2 years',
      image: null,
    },
    {
      id: 3,
      name: 'Lilah Rubinson',
      school: 'Windward High School',
      grade: 11,
      rating: null,
      reviewCount: null,
      hourlyRate: 20,
      location: 'Hancock Park/Mid Wilshire',
      locationRange: 'Greater Los Angeles Area.',
      bio: 'Very experienced babysitter for kids of all ages.',
      certifications: ['California Licensed Driver'],
      availability: 'Monday-Friday evenings ',
      experience: '1 year',
      image: null,
    },
    {
      id: 4,
      name: 'Lila Owens',
      school: 'Windward High School',
      grade: 11,
      rating: null,
      reviewCount: null,
      hourlyRate: 20,
      location: 'Santa Monica',
      locationRange: 'Santa Monica, Brentwood, and Palisades.',
      bio: 'Energetic and fun babysitter who loves arts and crafts with kids.',
      certifications: ['California Licensed Driver'],
      availability: 'Evenings, Weekends',
      experience: '2 years',
      image: null,
    },
  ];

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <Card key={student.id} className="p-6 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center mb-4">
                      <div className="h-16 w-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-xl mr-4">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-neutral-dark">{student.name}</h4>
                        <p className="text-sm text-neutral-light">Grade {student.grade} • {student.school}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-400 mr-1">⭐</span>
                          <span className="text-sm text-neutral-dark">{student.rating} ({student.reviewCount} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-neutral-light text-sm mb-4">{student.bio}</p>

                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-neutral-dark mb-2">Certifications:</h5>
                      <div className="flex flex-wrap gap-2">
                        {student.certifications.map((cert, index) => (
                          <Badge key={index} color="primary">{cert}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-neutral-light">
                        📍 {student.location}
                      </div>
                      <div className="flex items-center text-sm text-neutral-light">
                        📅 {student.availability}
                      </div>
                      <div className="flex items-center text-sm text-neutral-light">
                        💰 ${student.hourlyRate}/hour
                      </div>
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
              You're about to book {selectedStudent.name} at ${selectedStudent.hourlyRate}/hour
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
