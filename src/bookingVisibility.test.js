const {
  bookingForStudentCalendar,
  canViewFullBooking,
  publicCalendarBooking,
} = require('../backend/lib/bookingVisibility');

const privateBooking = {
  _id: 'booking-1',
  id: 'booking-1',
  student: { _id: 'student-1', firstName: 'Sam', lastName: 'Student' },
  parent: { _id: 'parent-2', firstName: 'Pat', lastName: 'Parent' },
  date: '2026-06-01T00:00:00.000Z',
  startTime: '09:00',
  endTime: '11:00',
  status: 'confirmed',
  serviceType: 'babysitter',
  numberOfChildren: 2,
  childrenAges: [4, 7],
  specialInstructions: 'Meet-up address: 123 Private Way',
  emergencyContact: '555-0100',
  messages: [{ senderRole: 'parent', text: 'Gate code is 1234' }],
};

describe('booking visibility for student calendars', () => {
  it('keeps full details for the booked student', () => {
    const requester = { _id: 'student-1', userType: 'student' };

    expect(canViewFullBooking(requester, privateBooking)).toBe(true);
    expect(bookingForStudentCalendar(privateBooking, requester)).toBe(privateBooking);
  });

  it('keeps full details for the parent on the booking', () => {
    const requester = { _id: 'parent-2', userType: 'parent' };

    expect(canViewFullBooking(requester, privateBooking)).toBe(true);
    expect(bookingForStudentCalendar(privateBooking, requester)).toBe(privateBooking);
  });

  it('redacts private fields for other parents viewing a student calendar', () => {
    const requester = { _id: 'parent-9', userType: 'parent' };

    const visibleBooking = bookingForStudentCalendar(privateBooking, requester);

    expect(visibleBooking).toEqual({
      _id: 'booking-1',
      id: 'booking-1',
      student: 'student-1',
      date: '2026-06-01T00:00:00.000Z',
      startTime: '09:00',
      endTime: '11:00',
      status: 'confirmed',
      serviceType: 'babysitter',
    });
    expect(visibleBooking).not.toHaveProperty('parent');
    expect(visibleBooking).not.toHaveProperty('childrenAges');
    expect(visibleBooking).not.toHaveProperty('specialInstructions');
    expect(visibleBooking).not.toHaveProperty('emergencyContact');
    expect(visibleBooking).not.toHaveProperty('messages');
  });

  it('redacts private fields from mongoose-like documents', () => {
    const doc = {
      toObject: () => privateBooking,
      student: privateBooking.student,
      parent: privateBooking.parent,
    };

    expect(publicCalendarBooking(doc)).toMatchObject({
      _id: 'booking-1',
      student: 'student-1',
      startTime: '09:00',
    });
  });
});
