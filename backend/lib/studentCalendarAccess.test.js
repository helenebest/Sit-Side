const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canRequestStudentCalendar,
  serializeStudentCalendarBooking,
} = require('./studentCalendarAccess');

const booking = {
  _id: 'booking-1',
  student: { _id: 'student-1', firstName: 'Stu', lastName: 'Dent' },
  parent: { _id: 'parent-1', firstName: 'Pat', lastName: 'Parent' },
  date: '2026-06-01T00:00:00.000Z',
  startTime: '10:00',
  endTime: '12:00',
  status: 'pending',
  serviceType: 'babysitter',
  emergencyContact: '555-1212',
  specialInstructions: 'Gate code 1234',
  messages: [{ senderRole: 'parent', text: 'Private note' }],
  totalAmount: 40,
};

test('students can only request their own booking calendar', () => {
  assert.equal(
    canRequestStudentCalendar({ _id: 'student-1', userType: 'student' }, 'student-1'),
    true
  );
  assert.equal(
    canRequestStudentCalendar({ _id: 'student-2', userType: 'student' }, 'student-1'),
    false
  );
});

test('redacts non-owned bookings from parent calendar views', () => {
  const serialized = serializeStudentCalendarBooking(
    booking,
    { _id: 'parent-2', userType: 'parent' },
    'student-1'
  );

  assert.deepEqual(Object.keys(serialized).sort(), [
    '_id',
    'date',
    'endTime',
    'serviceType',
    'startTime',
    'status',
    'student',
  ]);
  assert.equal(serialized.parent, undefined);
  assert.equal(serialized.emergencyContact, undefined);
  assert.equal(serialized.messages, undefined);
  assert.equal(serialized.totalAmount, undefined);
});

test('keeps full booking details for the owning student or parent', () => {
  assert.equal(
    serializeStudentCalendarBooking(booking, { _id: 'student-1', userType: 'student' }, 'student-1'),
    booking
  );
  assert.equal(
    serializeStudentCalendarBooking(booking, { _id: 'parent-1', userType: 'parent' }, 'student-1'),
    booking
  );
});
