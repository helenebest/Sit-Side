import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { normalizeStudentForListing, studentsFromApiResponse } from '../utils/studentDisplay';
import { SERVICE_TYPES } from '../constants/serviceOfferings';
import { formatBookingServiceLine } from '../utils/bookingDisplay';
import { getEffectiveHourlyRateForStudent } from '../utils/serviceRatesClient';
import {
  tutoringOfferingsFromUser,
  coachingOfferingsFromUser,
  tutoringOfferingLabel,
  coachingOfferingLabel,
  offeringKeySubject,
  offeringKeySport,
  parseSubjectOfferingKey,
  parseSportOfferingKey,
} from '../utils/studentOfferingsClient';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getStudents, getMyBookings, createBooking, sendBookingMessage } = useAuth();
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    maxRate: '',
    availability: '',
    experience: '',
  });
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [parentQuickBook, setParentQuickBook] = useState({
    serviceType: 'babysitter',
    date: '',
    startTime: '',
    endTime: '',
    numberOfChildren: 1,
    emergencyContact: '',
    meetupAddress: '',
    specialInstructions: '',
    tutorOfferKey: '',
    coachOfferKey: '',
  });
  const [parentBookSubmitting, setParentBookSubmitting] = useState(false);
  const [parentBookError, setParentBookError] = useState('');
  const [fetchedStudents, setFetchedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  const [bookingEmailBanner, setBookingEmailBanner] = useState('');

  useEffect(() => {
    const n = location.state?.bookingEmailNotification;
    const tab = location.state?.bookingActiveTab;
    if (typeof tab === 'number' && tab >= 0 && tab <= 2) {
      setActiveTab(tab);
    }
    if (!n) {
      if (typeof tab === 'number' && tab >= 0 && tab <= 2) {
        navigate(location.pathname + location.search, { replace: true, state: {} });
      }
      return;
    }
    if (n.status === 'sent') {
      setBookingEmailBanner(
        'SitSide confirmation email was sent to you and your sitter (check spam folders).',
      );
    } else if (n.hint) {
      setBookingEmailBanner(n.hint);
    }
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.state, location.pathname, location.search, navigate]);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const studentMatchesAvailability = (student, slot) => {
    if (!slot) return true;
    const key = String(slot).toLowerCase();
    const av = student.availability;
    if (av && typeof av === 'object' && !Array.isArray(av) && key !== 'weekend') {
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      return days.some((day) => {
        const d = av[day];
        return d && d[key];
      });
    }
    if (key === 'weekend') {
      if (av && typeof av === 'object' && !Array.isArray(av)) {
        return ['saturday', 'sunday'].some((day) => {
          const d = av[day];
          return d && (d.morning || d.afternoon || d.evening);
        });
      }
      const t = `${student.availabilityText || student.bio || ''}`.toLowerCase();
      return /weekend|saturday|sunday|\bsat\b|\bsun\b/.test(t);
    }
    const t = `${student.availabilityText || ''}`.toLowerCase();
    return t.includes(key);
  };

  const loadAllStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const result = await getStudents({ page: 1, limit: 100 });
      if (!result.success) {
        setStudentsError(result.error || 'Unable to fetch students.');
        return;
      }
      const list = studentsFromApiResponse(result.data);
      setFetchedStudents(
        list.map(normalizeStudentForListing).filter(Boolean),
      );
    } catch (error) {
      setStudentsError(error.message || 'Unable to fetch students.');
    } finally {
      setStudentsLoading(false);
    }
  }, [getStudents]);

  const handleSearch = async () => {
    setSearching(true);
    setStudentsError('');
    setStudentsLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (searchFilters.location.trim()) {
        params.location = searchFilters.location.trim();
      }
      if (searchFilters.maxRate !== '' && searchFilters.maxRate != null) {
        const n = parseFloat(String(searchFilters.maxRate));
        if (Number.isFinite(n)) {
          params.maxRate = String(n);
        }
      }
      if (searchFilters.experience.trim()) {
        params.experience = searchFilters.experience.trim();
      }

      const result = await getStudents(params);
      if (!result.success) {
        setStudentsError(result.error || 'Search failed.');
        return;
      }
      let list = studentsFromApiResponse(result.data);
      list = list.map(normalizeStudentForListing).filter(Boolean);
      if (searchFilters.availability) {
        list = list.filter((s) => studentMatchesAvailability(s, searchFilters.availability));
      }
      setFetchedStudents(list);
    } catch (error) {
      setStudentsError(error.message || 'Search failed.');
    } finally {
      setStudentsLoading(false);
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchFilters({
      location: '',
      maxRate: '',
      availability: '',
      experience: '',
    });
    loadAllStudents();
  };

  const handleBookStudent = (student) => {
    const tOff = tutoringOfferingsFromUser(student);
    const cOff = coachingOfferingsFromUser(student);
    setParentQuickBook({
      serviceType: 'babysitter',
      date: '',
      startTime: '',
      endTime: '',
      numberOfChildren: 1,
      emergencyContact: user?.phone || '',
      meetupAddress: '',
      specialInstructions: '',
      tutorOfferKey: tOff[0] ? offeringKeySubject(tOff[0]) : '',
      coachOfferKey: cOff[0] ? offeringKeySport(cOff[0]) : '',
    });
    setParentBookError('');
    setSelectedStudent(student);
    setBookingDialogOpen(true);
  };

  const handleParentQuickBookChange = (event) => {
    const { name, value } = event.target;
    setParentQuickBook((prev) => ({ ...prev, [name]: value }));
  };

  const buildSpecialInstructionsPayload = (meetupAddress, specialInstructions) => {
    const m = (meetupAddress || '').trim();
    const s = (specialInstructions || '').trim();
    const parts = [];
    if (m) parts.push(`Meet-up address: ${m}`);
    if (s) parts.push(s);
    return parts.join('\n\n');
  };

  const handleBookingSubmit = async () => {
    if (!selectedStudent?.id || parentBookSubmitting) return;

    if (
      !parentQuickBook.date ||
      !parentQuickBook.startTime ||
      !parentQuickBook.endTime ||
      !parentQuickBook.emergencyContact.trim()
    ) {
      setParentBookError('Please complete date, times, and emergency contact.');
      return;
    }

    setParentBookSubmitting(true);
    setParentBookError('');

    try {
      const payload = {
        studentId: String(selectedStudent.id),
        serviceType: parentQuickBook.serviceType,
        ...(parentQuickBook.serviceType === 'tutor' &&
          parentQuickBook.tutorOfferKey && {
            tutoringOffering: parseSubjectOfferingKey(parentQuickBook.tutorOfferKey),
          }),
        ...(parentQuickBook.serviceType === 'coach' &&
          parentQuickBook.coachOfferKey && {
            coachingOffering: parseSportOfferingKey(parentQuickBook.coachOfferKey),
          }),
        date: parentQuickBook.date,
        startTime: parentQuickBook.startTime,
        endTime: parentQuickBook.endTime,
        numberOfChildren: Math.min(
          10,
          Math.max(1, parseInt(parentQuickBook.numberOfChildren, 10) || 1),
        ),
        emergencyContact: parentQuickBook.emergencyContact.trim(),
        specialInstructions: buildSpecialInstructionsPayload(
          parentQuickBook.meetupAddress,
          parentQuickBook.specialInstructions,
        ),
      };

      const result = await createBooking(payload);
      if (!result.success) {
        throw new Error(result.error || 'Unable to create booking request.');
      }

      setBookingDialogOpen(false);
      setActiveTab(1);
      const emailNote = result.data?.emailNotification;
      if (emailNote?.status === 'sent') {
        setBookingEmailBanner(
          'SitSide confirmation email was sent to you and your sitter (check spam folders).',
        );
      } else if (emailNote?.hint) {
        setBookingEmailBanner(emailNote.hint);
      }

      const refresh = await getMyBookings();
      if (refresh.success) {
        setBookings(refresh.data.bookings || []);
      }
    } catch (err) {
      setParentBookError(err.message || 'Unable to create booking request.');
    } finally {
      setParentBookSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      setStudentsLoading(true);
      setStudentsError('');
      try {
        const result = await getStudents({ page: 1, limit: 100 });
        if (!isMounted) {
          return;
        }

        if (result.success) {
          const list = studentsFromApiResponse(result.data);
          setFetchedStudents(
            list.map(normalizeStudentForListing).filter(Boolean),
          );
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

    const loadBookings = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const result = await getMyBookings();
        if (!isMounted) {
          return;
        }

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

    loadStudents();
    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [getStudents, getMyBookings]);

  const students = fetchedStudents;

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
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'cancelled': return '✗';
      case 'rejected': return '✗';
      default: return null;
    }
  };

  const formatBookingStatusLabel = (status) => {
    if (status === 'confirmed') return 'Scheduled';
    return status;
  };

  const handleOpenMessageDialog = (booking) => {
    setSelectedBooking(booking);
    setMessageText('');
    setMessageError('');
    setMessageSuccess('');
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedBooking || !messageText.trim()) {
      setMessageError('Please enter a message.');
      return;
    }

    setMessageSubmitting(true);
    setMessageError('');
    setMessageSuccess('');

    try {
      const result = await sendBookingMessage(selectedBooking._id, messageText.trim());
      if (!result.success) {
        throw new Error(result.error || 'Unable to send message.');
      }
      setMessageSuccess('Message sent.');
      setMessageText('');
      if (result.data && result.data.booking) {
        setSelectedBooking(result.data.booking);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-neutral-dark mb-8">Find Babysitters</h1>

      {bookingEmailBanner && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex justify-between gap-4 items-start">
          <span>{bookingEmailBanner}</span>
          <button
            type="button"
            className="shrink-0 text-amber-800 underline text-xs font-medium"
            onClick={() => setBookingEmailBanner('')}
          >
            Dismiss
          </button>
        </div>
      )}

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
          <div className="flex flex-col gap-2">
            <PrimaryButton
              onClick={handleSearch}
              className="w-full"
              disabled={searching || studentsLoading}
            >
              {searching ? 'Searching…' : '🔍 Search'}
            </PrimaryButton>
            <OutlineButton
              type="button"
              onClick={handleClearSearch}
              className="w-full"
              disabled={studentsLoading}
            >
              Clear filters
            </OutlineButton>
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
                  Available Sitters & tutors ({students.length})
                </h3>
              </div>
              {studentsError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {studentsError}
                </div>
              )}
              {studentsLoading && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Loading profiles…
                </div>
              )}
              {!studentsLoading && students.length === 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-6 text-center text-blue-800">
                  No student profiles yet. Invite students to complete their profiles!
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

                    {(tutoringOfferingsFromUser(student).length > 0 ||
                      coachingOfferingsFromUser(student).length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tutoringOfferingsFromUser(student).map((o, i) => (
                          <Badge key={`t-${i}`} variant="primary">
                            Tutoring: {tutoringOfferingLabel(o)}
                          </Badge>
                        ))}
                        {coachingOfferingsFromUser(student).map((o, i) => (
                          <Badge key={`c-${i}`} variant="secondary">
                            Coaching: {coachingOfferingLabel(o)}
                          </Badge>
                        ))}
                      </div>
                    )}

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
                        📍 {student.location || 'Location not set'}
                      </div>
                      <div className="flex items-center text-sm text-neutral-light">
                        📅{' '}
                        {student.availabilityText ||
                          (typeof student.availability === 'string'
                            ? student.availability
                            : null) ||
                          'Availability not set'}
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
                  No bookings yet. Browse available babysitters to get started!
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
                            {booking.student
                              ? `${booking.student.firstName} ${booking.student.lastName}`.trim()
                              : 'Babysitter'}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {formatBookingStatusLabel(booking.status)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-primary mb-0.5">
                          {formatBookingServiceLine(booking)}
                        </p>
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
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <OutlineButton
                          onClick={() => handleOpenMessageDialog(booking)}
                          className="whitespace-nowrap"
                        >
                          💬 Message sitter
                        </OutlineButton>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-backdrop">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Book {selectedStudent.name}</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              {(() => {
                const r = getEffectiveHourlyRateForStudent(
                  selectedStudent,
                  parentQuickBook.serviceType,
                );
                const label = Number.isFinite(r)
                  ? `$${r % 1 === 0 ? r : r.toFixed(2).replace(/\.00$/, '')} / hour`
                  : renderRate(selectedStudent);
                return (
                  <>
                    You&apos;re about to book {selectedStudent.name} at {label}
                  </>
                );
              })()}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Service</label>
                <select
                  name="serviceType"
                  value={parentQuickBook.serviceType}
                  onChange={(e) => {
                    const v = e.target.value;
                    const tOff = tutoringOfferingsFromUser(selectedStudent);
                    const cOff = coachingOfferingsFromUser(selectedStudent);
                    setParentQuickBook((prev) => {
                      const next = { ...prev, serviceType: v };
                      if (v === 'tutor' && tOff.length)
                        next.tutorOfferKey = offeringKeySubject(tOff[0]);
                      if (v === 'coach' && cOff.length) next.coachOfferKey = offeringKeySport(cOff[0]);
                      return next;
                    });
                  }}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {SERVICE_TYPES.map((opt) => {
                    const tOff = tutoringOfferingsFromUser(selectedStudent);
                    const cOff = coachingOfferingsFromUser(selectedStudent);
                    const disabled =
                      (opt.value === 'tutor' && !tOff.length) || (opt.value === 'coach' && !cOff.length);
                    return (
                      <option key={opt.value} value={opt.value} disabled={disabled}>
                        {opt.label}
                        {opt.value === 'tutor' && !tOff.length ? ' (not offered)' : ''}
                        {opt.value === 'coach' && !cOff.length ? ' (not offered)' : ''}
                      </option>
                    );
                  })}
                </select>
                {parentQuickBook.serviceType === 'tutor' &&
                  tutoringOfferingsFromUser(selectedStudent).length === 1 && (
                    <p className="mt-1 text-xs text-neutral-light">
                      Topic:{' '}
                      <span className="font-medium text-neutral-dark">
                        {tutoringOfferingLabel(tutoringOfferingsFromUser(selectedStudent)[0])}
                      </span>
                    </p>
                  )}
                {parentQuickBook.serviceType === 'tutor' &&
                  tutoringOfferingsFromUser(selectedStudent).length > 1 && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-neutral-dark mb-1">Which topic?</label>
                      <select
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={parentQuickBook.tutorOfferKey}
                        name="tutorOfferKey"
                        onChange={handleParentQuickBookChange}
                      >
                        {tutoringOfferingsFromUser(selectedStudent).map((o, i) => (
                          <option key={`t-${i}`} value={offeringKeySubject(o)}>
                            {tutoringOfferingLabel(o)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                {parentQuickBook.serviceType === 'coach' &&
                  coachingOfferingsFromUser(selectedStudent).length === 1 && (
                    <p className="mt-1 text-xs text-neutral-light">
                      Sport:{' '}
                      <span className="font-medium text-neutral-dark">
                        {coachingOfferingLabel(coachingOfferingsFromUser(selectedStudent)[0])}
                      </span>
                    </p>
                  )}
                {parentQuickBook.serviceType === 'coach' &&
                  coachingOfferingsFromUser(selectedStudent).length > 1 && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-neutral-dark mb-1">Which sport?</label>
                      <select
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={parentQuickBook.coachOfferKey}
                        name="coachOfferKey"
                        onChange={handleParentQuickBookChange}
                      >
                        {coachingOfferingsFromUser(selectedStudent).map((o, i) => (
                          <option key={`c-${i}`} value={offeringKeySport(o)}>
                            {coachingOfferingLabel(o)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={parentQuickBook.date}
                  onChange={handleParentQuickBookChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={parentQuickBook.startTime}
                  onChange={handleParentQuickBookChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={parentQuickBook.endTime}
                  onChange={handleParentQuickBookChange}
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
                  value={parentQuickBook.numberOfChildren}
                  onChange={handleParentQuickBookChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={parentQuickBook.emergencyContact}
                  onChange={handleParentQuickBookChange}
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
                  value={parentQuickBook.meetupAddress}
                  onChange={handleParentQuickBookChange}
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
                  value={parentQuickBook.specialInstructions}
                  onChange={handleParentQuickBookChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Allergies, routines, parking, pets, or other notes..."
                />
              </div>
              {parentBookError && (
                <div className="text-sm text-red-600">{parentBookError}</div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setBookingDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton
                onClick={handleBookingSubmit}
                className="flex-1"
                disabled={parentBookSubmitting}
              >
                {parentBookSubmitting ? 'Sending…' : 'Send Booking Request'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Message Sitter Dialog */}
      {messageDialogOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-backdrop">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">
              Message {selectedBooking.student
                ? `${selectedBooking.student.firstName} ${selectedBooking.student.lastName}`.trim()
                : 'your babysitter'}
            </h3>
            <p className="text-sm text-neutral-light mb-3">
              Conversation for this booking. All messages are visible here and to your sitter on the site.
            </p>
            {/* Message thread */}
            <div className="flex-1 min-h-0 overflow-y-auto mb-4 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-48">
              {Array.isArray(selectedBooking.messages) && selectedBooking.messages.length > 0 ? (
                selectedBooking.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.senderRole === 'parent'
                        ? 'bg-primary/10 text-neutral-dark ml-4'
                        : 'bg-gray-200 text-neutral-dark mr-4'
                    }`}
                  >
                    <span className="font-medium text-xs text-neutral-light block mb-0.5">
                      {msg.senderRole === 'parent' ? 'You' : 'Babysitter'}
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
              placeholder="Share arrival time, parking details, bedtime routines, or other updates."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            {messageError && (
              <div className="mt-2 text-sm text-red-600">
                {messageError}
              </div>
            )}
            {messageSuccess && (
              <div className="mt-2 text-sm text-green-600">
                {messageSuccess}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <OutlineButton
                onClick={() => {
                  setMessageDialogOpen(false);
                  setSelectedBooking(null);
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

export default ParentDashboard;
