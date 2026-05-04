import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import MonthCalendarGrid from '../components/MonthCalendarGrid';
import { useAuth } from '../contexts/AuthContext';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getStudentProfile, getStudentBookings, createBooking } = useAuth();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [quickBookingData, setQuickBookingData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    numberOfChildren: 1,
    meetupAddress: '',
    specialInstructions: '',
    emergencyContact: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSubmitError, setBookingSubmitError] = useState('');
  const [bookingSubmitSuccess, setBookingSubmitSuccess] = useState('');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentBookings, setStudentBookings] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [studentBookingsRefreshKey, setStudentBookingsRefreshKey] = useState(0);

  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);
      setError(null);

      if (!id) {
        setError('Student not found');
        setLoading(false);
        return;
      }

      try {
        const result = await getStudentProfile(id);
        const raw = result.data?.student ?? result.data;
        if (result.success && raw) {
          const name =
            [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() ||
            raw.name ||
            'Student';
          const hourlyRateRange =
            raw.hourlyRateRange ||
            (typeof raw.hourlyRate === 'number' && Number.isFinite(raw.hourlyRate)
              ? `$${raw.hourlyRate % 1 === 0 ? raw.hourlyRate : raw.hourlyRate.toFixed(2)} / hour`
              : null);
          setStudent({
            ...raw,
            name,
            hourlyRateRange,
          });
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

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setStudentBookings([]);
      return undefined;
    }
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const firstOfMonth = new Date(y, m, 1);
    const fromDate = new Date(firstOfMonth);
    fromDate.setDate(fromDate.getDate() - firstOfMonth.getDay());
    fromDate.setHours(0, 0, 0, 0);
    const lastOfMonth = new Date(y, m + 1, 0);
    const toDate = new Date(lastOfMonth);
    toDate.setDate(toDate.getDate() + (6 - lastOfMonth.getDay()));
    toDate.setHours(23, 59, 59, 999);
    const from = fromDate.toISOString();
    const to = toDate.toISOString();
    (async () => {
      const res = await getStudentBookings(id, { from, to });
      if (cancelled) return;
      setStudentBookings(res.success && res.data?.bookings ? res.data.bookings : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, calendarMonth, studentBookingsRefreshKey, getStudentBookings]);

  const buildSpecialInstructionsPayload = (meetupAddress, specialInstructions) => {
    const m = (meetupAddress || '').trim();
    const s = (specialInstructions || '').trim();
    const parts = [];
    if (m) parts.push(`Meet-up address: ${m}`);
    if (s) parts.push(s);
    return parts.join('\n\n');
  };

  const handleBookNow = () => {
    setQuickBookingData({
      date: '',
      startTime: '',
      endTime: '',
      numberOfChildren: 1,
      meetupAddress: '',
      specialInstructions: '',
      emergencyContact: user?.phone || '',
    });
    setBookingSubmitError('');
    setBookingSubmitSuccess('');
    setBookingDialogOpen(true);
  };

  const handleBookingFieldChange = (event) => {
    const { name, value } = event.target;
    setQuickBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBookingSubmit = async () => {
    if ((!student?._id && !student?.id) || bookingSubmitting) return;

    if (
      !quickBookingData.date ||
      !quickBookingData.startTime ||
      !quickBookingData.endTime ||
      !quickBookingData.emergencyContact.trim()
    ) {
      setBookingSubmitError('Please complete date, time, and emergency contact.');
      return;
    }

    setBookingSubmitting(true);
    setBookingSubmitError('');
    setBookingSubmitSuccess('');

    try {
      const payload = {
        studentId: String(student._id || student.id),
        date: quickBookingData.date,
        startTime: quickBookingData.startTime,
        endTime: quickBookingData.endTime,
        numberOfChildren: Math.min(
          10,
          Math.max(1, parseInt(quickBookingData.numberOfChildren, 10) || 1),
        ),
        specialInstructions: buildSpecialInstructionsPayload(
          quickBookingData.meetupAddress,
          quickBookingData.specialInstructions,
        ),
        emergencyContact: quickBookingData.emergencyContact.trim(),
      };

      const result = await createBooking(payload);
      if (!result.success) {
        throw new Error(result.error || 'Unable to create booking request.');
      }

      setBookingSubmitSuccess('Booking request sent successfully.');
      setBookingDialogOpen(false);
      setStudentBookingsRefreshKey((k) => k + 1);
    } catch (submitError) {
      setBookingSubmitError(submitError.message || 'Unable to create booking request.');
    } finally {
      setBookingSubmitting(false);
    }
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

  const unavailableDates = (student?.unavailableDates || []).map((d) => {
    const date = new Date(d);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  });

  const isDateUnavailable = (date) => {
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return unavailableDates.includes(key);
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
                {(student.name || '?').charAt(0)}
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
                {(student.certifications || []).map((cert, index) => (
                  <Badge key={index} color="primary">{cert}</Badge>
                ))}
              </div>
              <p className="text-neutral-light">
                Experience: {student.experience || 'Not specified'}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-dark mb-4">Weekly Availability</h2>
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

              <div>
                <h2 className="text-xl font-semibold text-neutral-dark mb-2">Calendar</h2>
                <p className="text-sm text-neutral-light mb-4">
                  View {student.name}&apos;s blocked days and bookings. Gray numbers are outside this month.
                </p>

                <MonthCalendarGrid
                  monthDate={calendarMonth}
                  bookings={studentBookings}
                  toolbar={
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                      <OutlineButton
                        onClick={() =>
                          setCalendarMonth(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                          )
                        }
                      >
                        ← Previous
                      </OutlineButton>
                      <span className="text-sm font-semibold text-neutral-dark">
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
                  }
                  renderDay={(cell) => {
                    const { date, inCurrentMonth } = cell;
                    const today = new Date();
                    const isToday =
                      date.getFullYear() === today.getFullYear() &&
                      date.getMonth() === today.getMonth() &&
                      date.getDate() === today.getDate();
                    const unavailable = isDateUnavailable(date);
                    const isSunday = date.getDay() === 0;

                    if (!inCurrentMonth) {
                      return (
                        <div className="month-cal-day-out">
                          <span
                            className={`month-cal-day-out-num ${
                              isSunday ? 'text-red-300' : 'text-neutral-400'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        className={`month-cal-day-static ${
                          unavailable ? 'month-cal-day-static--unavail' : ''
                        } ${isToday ? 'month-cal-day-static--today' : ''}`}
                      >
                        <div className="month-cal-day-row">
                          <span
                            className={`month-cal-day-num ${
                              isToday
                                ? 'month-cal-day-num--today'
                                : isSunday
                                  ? 'month-cal-day-num--sun'
                                  : 'month-cal-day-num--default'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {unavailable ? (
                            <span className="month-cal-off-label">Off</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  }}
                />

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-light">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-6 rounded-sm bg-primary" />
                    <span>Bookings (colors vary by request)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 border border-red-200 bg-red-50" />
                    <span>Blocked day</span>
                  </div>
                </div>
              </div>
            </div>

            {Array.isArray(student.reviews) && student.reviews.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-neutral-dark mb-4">Reviews</h2>
                <div className="space-y-6">
                  {student.reviews.map((review, index) => (
                    <div key={review._id || review.id || index}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-neutral-dark">{review.parentName || 'Parent'}</h4>
                        <div className="flex items-center">
                          <div className="flex items-center mr-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-yellow-400">
                                {i < (Number(review.rating) || 0) ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-neutral-light">
                            {review.date ? new Date(review.date).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-neutral-light">{review.comment}</p>
                      {index < student.reviews.length - 1 && (
                        <div className="border-b border-gray-200 mt-4" />
                      )}
                    </div>
                  ))}
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

      {bookingSubmitSuccess && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {bookingSubmitSuccess}
        </div>
      )}

      {/* Quick Booking Dialog */}
      {bookingDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-backdrop">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Quick Book {student.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={quickBookingData.date}
                  onChange={handleBookingFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={quickBookingData.startTime}
                  onChange={handleBookingFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={quickBookingData.endTime}
                  onChange={handleBookingFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Number of Children</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  name="numberOfChildren"
                  value={quickBookingData.numberOfChildren}
                  onChange={handleBookingFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={quickBookingData.emergencyContact}
                  onChange={handleBookingFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Phone number we can reach during the booking"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Meet-up address</label>
                <input
                  type="text"
                  name="meetupAddress"
                  value={quickBookingData.meetupAddress}
                  onChange={handleBookingFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Street address or where the sitter should meet you"
                />
                <p className="mt-1 text-xs text-neutral-light">
                  Include enough detail so your sitter knows where to go (building, gate code, etc.).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Special Instructions</label>
                <textarea
                  name="specialInstructions"
                  value={quickBookingData.specialInstructions}
                  onChange={handleBookingFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Allergies, routines, parking, pets, or other notes..."
                />
              </div>
              {bookingSubmitError && (
                <div className="text-sm text-red-600">
                  {bookingSubmitError}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setBookingDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton
                onClick={handleBookingSubmit}
                className="flex-1"
                disabled={bookingSubmitting}
              >
                {bookingSubmitting ? 'Sending…' : 'Send Booking Request'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;