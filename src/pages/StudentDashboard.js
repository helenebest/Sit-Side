import React, { useState } from 'react';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [profileData, setProfileData] = useState({
    bio: 'Experienced babysitter with CPR certification. Love working with kids of all ages!',
    hourlyRate: 15,
    experience: '2 years',
    certifications: ['CPR Certified', 'First Aid'],
    location: 'Downtown Area',
    availability: {
      monday: { morning: false, afternoon: true, evening: true },
      tuesday: { morning: false, afternoon: true, evening: true },
      wednesday: { morning: false, afternoon: true, evening: true },
      thursday: { morning: false, afternoon: true, evening: true },
      friday: { morning: false, afternoon: true, evening: true },
      saturday: { morning: true, afternoon: true, evening: true },
      sunday: { morning: true, afternoon: true, evening: false },
    },
  });

  const [newAvailability, setNewAvailability] = useState({
    day: '',
    timeSlot: '',
    enabled: true,
  });

  // Bookings will be fetched from API in the future
  const bookings = [];

  const earnings = {
    thisMonth: 0,
    total: 0,
    pending: 0,
  };

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileUpdate = () => {
    setProfileDialogOpen(false);
  };

  const handleAvailabilityUpdate = () => {
    if (!newAvailability.day || !newAvailability.timeSlot) {
      return;
    }

    setProfileData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [newAvailability.day]: {
          ...prev.availability[newAvailability.day],
          [newAvailability.timeSlot]: true,
        },
      },
    }));

    setNewAvailability({ day: '', timeSlot: '', enabled: true });
    setAvailabilityDialogOpen(false);
  };

  const handleAvailabilityToggle = (day, timeSlot) => {
    setProfileData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [timeSlot]: !prev.availability[day][timeSlot],
        },
      },
    }));
  };

  const handleCertificationAdd = () => {
    const trimmed = newCertification.trim();
    if (!trimmed) return;

    setProfileData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(trimmed)
        ? prev.certifications
        : [...prev.certifications, trimmed],
    }));

    setNewCertification('');
    setCertificationDialogOpen(false);
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
      <h1 className="text-4xl font-bold text-neutral-dark mb-8">Student Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mr-4">
                {user?.firstName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-dark">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.name || 'Your Name'}
                </h3>
                <p className="text-neutral-light">
                  {user?.grade ? `Grade ${user.grade}` : ''}
                  {user?.grade && user?.school ? ' • ' : ''}
                  {user?.school || 'Complete your profile'}
                </p>
                <div className="flex items-center mt-1">
                  {user?.rating && user.rating > 0 ? (
                    <>
                      <span className="text-yellow-400 mr-1">⭐</span>
                      <span className="text-sm text-neutral-dark">
                        {user.rating?.toFixed(1)} 
                        {user.reviewCount ? ` (${user.reviewCount} review${user.reviewCount !== 1 ? 's' : ''})` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-neutral-light">New sitter</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-neutral-light mb-4">{profileData.bio}</p>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-neutral-dark mb-2">Certifications:</h4>
              <div className="flex flex-wrap gap-2">
                {profileData.certifications.map((cert, index) => (
                  <Badge key={index} color="primary">{cert}</Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-neutral-light flex items-center">
              📍 {profileData.location}
            </p>
            <div className="mt-4">
              <PrimaryButton onClick={() => setProfileDialogOpen(true)} className="w-full">
                Edit Profile
              </PrimaryButton>
            </div>
          </Card>
        </div>

        {/* Earnings Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4 flex items-center">
              💰 Earnings
            </h3>
            <div className="mb-4">
              <div className="text-3xl font-bold text-primary">${earnings.thisMonth}</div>
              <div className="text-sm text-neutral-light">This Month</div>
            </div>
            <div className="mb-4">
              <div className="text-xl font-semibold text-neutral-dark">${earnings.total}</div>
              <div className="text-sm text-neutral-light">Total Earned</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-yellow-600">${earnings.pending}</div>
              <div className="text-sm text-neutral-light">Pending Payment</div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <OutlineButton 
                onClick={() => {
                  setActiveTab(1);
                  setAvailabilityDialogOpen(true);
                }} 
                className="w-full"
              >
                📅 Update Availability
              </OutlineButton>
              <OutlineButton
                className="w-full"
                onClick={() => setCertificationDialogOpen(true)}
              >
                ➕ Add Certification
              </OutlineButton>
              <OutlineButton
                className="w-full"
                onClick={() => setActiveTab(2)}
              >
                👀 View Reviews
              </OutlineButton>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {['Upcoming Bookings', 'Availability', 'Reviews'].map((tab, index) => (
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
          {/* Upcoming Bookings Tab */}
          {activeTab === 0 && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-dark mb-4">Your Bookings</h3>
              {bookings.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                  No bookings yet. Update your availability to start getting requests!
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
                          <h4 className="font-semibold text-neutral-dark">{booking.parentName}</h4>
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

          {/* Availability Tab */}
          {activeTab === 1 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-neutral-dark">Your Availability</h3>
                <PrimaryButton onClick={() => setAvailabilityDialogOpen(true)}>
                  ➕ Add Time Slot
                </PrimaryButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(profileData.availability).map(([day, slots]) => (
                  <Card key={day} className="p-4">
                    <h4 className="font-semibold text-neutral-dark mb-3 capitalize">{day}</h4>
                    {Object.entries(slots).map(([timeSlot, available]) => (
                      <div key={timeSlot} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={available}
                          onChange={() => handleAvailabilityToggle(day, timeSlot)}
                          className="mr-2"
                        />
                        <span className="text-sm text-neutral-dark capitalize">{timeSlot}</span>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 2 && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-dark mb-4">Your Reviews</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                Reviews will appear here once parents leave feedback after bookings.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Profile Edit Dialog */}
      {profileDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Bio</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Hourly Rate</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={profileData.hourlyRate}
                  onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Experience</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={profileData.experience}
                  onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Location</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setProfileDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton onClick={handleProfileUpdate} className="flex-1">
                Save
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Availability Dialog */}
      {availabilityDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Add Availability</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Day</label>
                <select
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newAvailability.day}
                  onChange={(e) => setNewAvailability({ ...newAvailability, day: e.target.value })}
                >
                  <option value="">Select a day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Time Slot</label>
                <select
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newAvailability.timeSlot}
                  onChange={(e) => setNewAvailability({ ...newAvailability, timeSlot: e.target.value })}
                >
                  <option value="">Select a time slot</option>
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 10 PM)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setAvailabilityDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton onClick={handleAvailabilityUpdate} className="flex-1">
                Add
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Add Certification Dialog */}
      {certificationDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Add Certification</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Certification</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. CPR Certified"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setCertificationDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton onClick={handleCertificationAdd} className="flex-1">
                Add
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
