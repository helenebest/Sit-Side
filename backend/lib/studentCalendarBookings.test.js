const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PUBLIC_STUDENT_CALENDAR_STATUSES,
  isPublicStudentCalendarStatus,
  publicStudentCalendarBooking,
} = require('./studentCalendarBookings');

test('public calendar status allowlist only includes active requests', () => {
  assert.deepEqual(PUBLIC_STUDENT_CALENDAR_STATUSES, ['pending', 'confirmed']);
  assert.equal(isPublicStudentCalendarStatus('pending'), true);
  assert.equal(isPublicStudentCalendarStatus('confirmed'), true);
  assert.equal(isPublicStudentCalendarStatus('cancelled'), false);
  assert.equal(isPublicStudentCalendarStatus('rejected'), false);
  assert.equal(isPublicStudentCalendarStatus('completed'), false);
});

test('public calendar shape omits private booking and parent details', () => {
  const date = new Date('2026-05-15T00:00:00.000Z');
  const publicBooking = publicStudentCalendarBooking({
    _id: 'booking-1',
    parent: { firstName: 'Private', lastName: 'Parent', email: 'parent@example.com' },
    student: { firstName: 'Sam', lastName: 'Student' },
    date,
    startTime: '18:00',
    endTime: '20:00',
    status: 'confirmed',
    serviceType: 'babysitter',
    emergencyContact: '555-0100',
    specialInstructions: 'Gate code 1234',
    hourlyRate: 25,
    totalAmount: 50,
    messages: [{ text: 'private note' }],
  });

  assert.deepEqual(publicBooking, {
    _id: 'booking-1',
    date,
    startTime: '18:00',
    endTime: '20:00',
    status: 'confirmed',
    serviceType: 'babysitter',
  });
});
