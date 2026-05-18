const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CALENDAR_BUSY_STATUSES,
  publicCalendarBookingShape,
} = require('./bookingCalendarVisibility');

test('calendar busy statuses omit rejected and cancelled bookings', () => {
  assert.deepEqual(CALENDAR_BUSY_STATUSES, ['pending', 'confirmed', 'completed']);
  assert.equal(CALENDAR_BUSY_STATUSES.includes('rejected'), false);
  assert.equal(CALENDAR_BUSY_STATUSES.includes('cancelled'), false);
});

test('public calendar booking shape strips participant and private fields', () => {
  const shaped = publicCalendarBookingShape({
    _id: 'booking-1',
    date: '2026-05-20T00:00:00.000Z',
    startTime: '14:00',
    endTime: '16:00',
    status: 'confirmed',
    student: { firstName: 'Student' },
    parent: { firstName: 'Parent' },
    emergencyContact: '555-0100',
    specialInstructions: 'Gate code 1234',
  });

  assert.deepEqual(shaped, {
    _id: 'booking-1',
    date: '2026-05-20T00:00:00.000Z',
    startTime: '14:00',
    endTime: '16:00',
  });
});
