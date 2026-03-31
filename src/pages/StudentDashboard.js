import React, { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard = () => {
  const { user, getMyBookings, sendBookingMessage, updateUnavailableDates } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [profileData, setProfileData] = useState({
    bio: user?.bio || 'Experienced babysitter with CPR certification. Love working with kids of all ages!',
    hourlyRate: user?.hourlyRate || 15,
    experience: user?.experience || '2 years',
    certifications: user?.certifications?.length ? user.certifications : ['CPR Certified', 'First Aid'],
    location: user?.location || 'Downtown Area',
    availability: user?.availability || {
      monday: { morning: false, afternoon: true, evening: true },
      tuesday: { morning: false, afternoon: true, evening: true },
      wednesday: { morning: false, afternoon: true, evening: true },
      thursday: { morning: false, afternoon: true, evening: true },
      friday: { morning: false, afternoon: true, evening: true },
      saturday: { morning: true, afternoon: true, evening: true },
      sunday: { morning: true, afternoon: true, evening: false },
    },
    slackUserId: user?.slackUserId || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [newAvailability, setNewAvailability] = useState({
    day: '',
    timeSlot: '',
    enabled: true,
  });
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [savingUnavailableDates, setSavingUnavailableDates] = useState(false);
  const unavailableDates = useMemo(
    () =>
      (user?.unavailableDates || []).map((d) => {
        const date = new Date(d);
        // Normalize to midnight for comparisons
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      }),
    [user]
  );

  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedBookingForMessage, setSelectedBookingForMessage] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  const earnings = {
    thisMonth: 0,
    total: 0,
    pending: 0,
  };

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileUpdate = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      // For now we only send fields that map directly to backend profile fields
      // (bio, hourlyRate, experience, location, slackUserId)
      // Availability and certifications are handled by separate flows.
      const { bio, hourlyRate, experience, location, slackUserId } = profileData;

      const response = await fetch(
        (process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api')) +
          '/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token')
              ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
              : {}),
          },
          body: JSON.stringify({
            bio,
            hourlyRate,
            experience,
            location,
            slackUserId: slackUserId?.trim() || '',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setProfileSuccess('Profile updated successfully.');
      setProfileDialogOpen(false);
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
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

  const startOfMonth = useMemo(() => {
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  }, [calendarMonth]);

  const endOfMonth = useMemo(() => {
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  }, [calendarMonth]);

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = startOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = endOfMonth.getDate();

    for (let i = 0; i < firstDayIndex; i += 1) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d));
    }
    return days;
  }, [calendarMonth, startOfMonth, endOfMonth]);

  const bookingsByDate = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      if (!booking.date) return;
      const date = new Date(booking.date);
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(booking);
    });
    return map;
  }, [bookings]);

  const isDateUnavailable = (date) => {
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return unavailableDates.includes(key);
  };

  const handleToggleUnavailableDate = async (date) => {
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const normalizedClicked = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    if (normalizedClicked < normalizedToday) {
      return;
    }

    if (!user) return;

    const currentSet = new Set(unavailableDates);
    if (currentSet.has(normalizedClicked)) {
      currentSet.delete(normalizedClicked);
    } else {
      currentSet.add(normalizedClicked);
    }

    const isoDates = Array.from(currentSet).map((ts) => {
      const d = new Date(ts);
      return d.toISOString();
    });

    setSavingUnavailableDates(true);
    try {
      await updateUnavailableDates(isoDates);
    } finally {
      setSavingUnavailableDates(false);
    }
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

  const handleOpenMessageDialog = (booking) => {
    setSelectedBookingForMessage(booking);
    setMessageText('');
    setMessageError('');
    setMessageSuccess('');
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedBookingForMessage || !messageText.trim()) {
      setMessageError('Please enter a message.');
      return;
    }
    setMessageSubmitting(true);
    setMessageError('');
    setMessageSuccess('');
    try {
      const result = await sendBookingMessage(selectedBookingForMessage._id, messageText.trim());
      if (!result.success) throw new Error(result.error || 'Unable to send message.');
      setMessageSuccess('Message sent.');
      setMessageText('');
      if (result.data && result.data.booking) {
        setSelectedBookingForMessage(result.data.booking);
        setBookings((prev) =>
          prev.map((b) => (b._id === result.data.booking._id ? result.data.booking : b))
        );
      }
    } catch (error) {
      setMessageError(error.message || 'Unable to send message.');
    } finally {
      setMessageSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const result = await getMyBookings();
        if (!isMounted) return;
        if (result.success) {
          setBookings(result.data.bookings || []);
        } else {
          setBookingsError(result.error || 'Unable to fetch bookings.');
        }
      } catch (error) {
        if (isMounted) {
          setBookingsError(error.message || 'Unable to fetch bookings.');
        }
      } finally {
        if (isMounted) {
          setBookingsLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [getMyBookings]);

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
              {bookingsError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {bookingsError}
                </div>
              )}
              {bookingsLoading ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                  Loading your bookings…
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                  No bookings yet. Update your availability to start getting requests!
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="flex items-center p-4 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0 mr-4">
                        <span className="text-lg">{getStatusIcon(booking.status)}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-neutral-dark">
                            {booking.parent
                              ? `${booking.parent.firstName} ${booking.parent.lastName}`.trim()
                              : 'Parent'}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-light">
                          {booking.date ? new Date(booking.date).toLocaleDateString() : ''} •{' '}
                          {booking.startTime} – {booking.endTime}
                        </p>
                        <p className="text-sm text-neutral-light">
                          {booking.numberOfChildren} child(ren){' '}
                          {Array.isArray(booking.childrenAges) && booking.childrenAges.length > 0
                            ? ` (ages ${booking.childrenAges.join(', ')})`
                            : ''}
                        </p>
                        <p className="text-sm font-medium text-primary">${booking.totalAmount}</p>
                        {Array.isArray(booking.messages) && booking.messages.length > 0 && (
                          <p className="mt-2 text-xs text-neutral-light">
                            {booking.messages.length} message{booking.messages.length !== 1 ? 's' : ''} in thread
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <OutlineButton
                          onClick={() => handleOpenMessageDialog(booking)}
                          className="whitespace-nowrap"
                        >
                          💬 Message parent
                        </OutlineButton>
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
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-dark">Weekly Availability</h3>
                  <p className="text-sm text-neutral-light mt-1">
                    Use this to set your general weekly pattern (mornings / afternoons / evenings).
                  </p>
                </div>
                <PrimaryButton onClick={() => setAvailabilityDialogOpen(true)}>
                  ➕ Add Time Slot
                </PrimaryButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {Object.entries(profileData.availability).map(([day, slots]) => (
                  <Card key={day} className="p-4">
                    <h4 className="font-semibold text-neutral-dark mb-3 capitalize">{day}</h4>
                    {Object.entries(slots).map(([timeSlot, available]) => (
                      <div key={timeSlot} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={!!available}
                          onChange={() => handleAvailabilityToggle(day, timeSlot)}
                          className="mr-2"
                        />
                        <span className="text-sm text-neutral-dark capitalize">{timeSlot}</span>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-dark">Calendar</h3>
                    <p className="text-sm text-neutral-light">
                      Tap on a future date to block or unblock it if you&apos;re unavailable. Bookings are shown on their dates.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OutlineButton
                      onClick={() =>
                        setCalendarMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                        )
                      }
                    >
                      ← Previous
                    </OutlineButton>
                    <span className="text-sm font-medium text-neutral-dark">
                      {calendarMonth.toLocaleString(undefined, {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <OutlineButton
                      onClick={() =>
                        setCalendarMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                        )
                      }
                    >
                      Next →
                    </OutlineButton>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-neutral-light mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} />;
                    }

                    const today = new Date();
                    const isToday =
                      date.getFullYear() === today.getFullYear() &&
                      date.getMonth() === today.getMonth() &&
                      date.getDate() === today.getDate();

                    const normalizedKey = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate()
                    ).getTime();
                    const dateBookings = bookingsByDate.get(normalizedKey) || [];
                    const hasBookings = dateBookings.length > 0;
                    const unavailable = isDateUnavailable(date);

                    const isPast =
                      normalizedKey <
                      new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      ).getTime();

                    let bg = 'bg-white';
                    if (unavailable) bg = 'bg-red-50';
                    if (hasBookings) bg = 'bg-blue-50';
                    if (unavailable && hasBookings) bg = 'bg-purple-50';

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        disabled={isPast || savingUnavailableDates}
                        onClick={() => handleToggleUnavailableDate(date)}
                        className={`min-h-[72px] rounded-xl border text-left p-1 text-xs ${
                          bg
                        } ${
                          isPast
                            ? 'border-gray-100 text-neutral-light cursor-default'
                            : 'border-gray-200 hover:border-primary cursor-pointer'
                        } ${isToday ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-neutral-dark text-xs">
                            {date.getDate()}
                          </span>
                          {unavailable && (
                            <span className="text-[10px] text-red-600 font-medium">
                              Unavailable
                            </span>
                          )}
                        </div>
                        {hasBookings && (
                          <div className="space-y-0.5">
                            {dateBookings.slice(0, 2).map((b) => (
                              <div
                                key={b._id}
                                className="rounded bg-blue-100 text-[10px] px-1 py-0.5 text-blue-800 truncate"
                              >
                                {b.startTime}–{b.endTime}{' '}
                                {b.parent
                                  ? `${b.parent.firstName || ''}`.trim()
                                  : ''}
                              </div>
                            ))}
                            {dateBookings.length > 2 && (
                              <div className="text-[10px] text-neutral-light">
                                +{dateBookings.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-neutral-light">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-blue-50 border border-blue-100" />
                    <span>Has bookings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-100" />
                    <span>Blocked (unavailable)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-purple-50 border border-purple-100" />
                    <span>Blocked and booked</span>
                  </div>
                </div>
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
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  Slack User ID (optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. U012ABCDE"
                  value={profileData.slackUserId}
                  onChange={(e) => setProfileData({ ...profileData, slackUserId: e.target.value })}
                />
                <p className="mt-1 text-xs text-neutral-light">
                  Used to send you booking messages via Slack. You can find this in your Slack profile
                  or from your admin.
                </p>
              </div>
              {profileError && (
                <div className="text-sm text-red-600">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="text-sm text-green-600">
                  {profileSuccess}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setProfileDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton onClick={handleProfileUpdate} className="flex-1" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save'}
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

      {/* Message Parent Dialog */}
      {messageDialogOpen && selectedBookingForMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">
              Message {selectedBookingForMessage.parent
                ? `${selectedBookingForMessage.parent.firstName} ${selectedBookingForMessage.parent.lastName}`.trim()
                : 'parent'}
            </h3>
            <p className="text-sm text-neutral-light mb-3">
              Conversation for this booking. All messages are visible here and to the parent on the site.
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto mb-4 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-48">
              {Array.isArray(selectedBookingForMessage.messages) && selectedBookingForMessage.messages.length > 0 ? (
                selectedBookingForMessage.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.senderRole === 'student'
                        ? 'bg-primary/10 text-neutral-dark ml-4'
                        : 'bg-gray-200 text-neutral-dark mr-4'
                    }`}
                  >
                    <span className="font-medium text-xs text-neutral-light block mb-0.5">
                      {msg.senderRole === 'student' ? 'You' : 'Parent'}
                      {msg.sentAt && (
                        <span className="ml-2">
                          {new Date(msg.sentAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      )}
                    </span>
                    <span className="text-neutral-dark">{msg.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-light italic">No messages yet. Send one below.</p>
              )}
            </div>
            <textarea
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Reply to the parent or ask a question about the booking."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            {messageError && <div className="mt-2 text-sm text-red-600">{messageError}</div>}
            {messageSuccess && <div className="mt-2 text-sm text-green-600">{messageSuccess}</div>}
            <div className="flex gap-3 mt-4">
              <OutlineButton
                onClick={() => {
                  setMessageDialogOpen(false);
                  setSelectedBookingForMessage(null);
                }}
                className="flex-1"
              >
                Close
              </OutlineButton>
              <PrimaryButton
                onClick={handleSendMessage}
                className="flex-1"
                disabled={messageSubmitting}
              >
                {messageSubmitting ? 'Sending…' : 'Send Message'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;