const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canViewDetailedStudentCalendar,
  publicCalendarBookingShape,
} = require('./bookingVisibility');

test('only the requested student can view detailed calendar bookings', () => {
  assert.equal(
    canViewDetailedStudentCalendar({ userType: 'student', _id: 'student-1' }, 'student-1'),
    true
  );
  assert.equal(
    canViewDetailedStudentCalendar({ userType: 'student', _id: 'student-1' }, 'student-2'),
    false
  );
  assert.equal(
    canViewDetailedStudentCalendar({ userType: 'parent', _id: 'parent-1' }, 'student-1'),
    false
  );
});

test('public calendar bookings omit user details', () => {
  const booking = publicCalendarBookingShape({
    _id: 'booking-1',
    date: '2026-05-17T00:00:00.000Z',
    startTime: '09:00',
    endTime: '11:00',
    status: 'confirmed',
    serviceType: 'babysitter',
    parent: { firstName: 'Private' },
    student: { firstName: 'Student' },
    emergencyContact: '555-0000',
  });

  assert.deepEqual(booking, {
    _id: 'booking-1',
    id: undefined,
    date: '2026-05-17T00:00:00.000Z',
    startTime: '09:00',
    endTime: '11:00',
    status: 'confirmed',
    serviceType: 'babysitter',
  });
});
