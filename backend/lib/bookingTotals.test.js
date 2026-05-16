const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateBookingTotalAmount,
  isValidBookingTime,
} = require('./bookingTotals');

test('calculates same-day booking totals', () => {
  assert.equal(
    calculateBookingTotalAmount({
      startTime: '09:00',
      endTime: '11:30',
      hourlyRate: 20,
    }),
    50
  );
});

test('calculates overnight booking totals instead of clamping to zero', () => {
  assert.equal(
    calculateBookingTotalAmount({
      startTime: '22:00',
      endTime: '02:00',
      hourlyRate: 25,
    }),
    100
  );
});

test('rejects malformed booking times', () => {
  assert.equal(isValidBookingTime('24:00'), false);
  assert.equal(isValidBookingTime('09:75'), false);
  assert.equal(
    calculateBookingTotalAmount({ startTime: 'bad', endTime: '11:00', hourlyRate: 20 }),
    null
  );
});
