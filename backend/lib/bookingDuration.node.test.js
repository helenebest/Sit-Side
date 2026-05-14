const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBillableHours, calculateBookingTotal } = require('./bookingDuration');

test('calculates same-day booking duration and total', () => {
  assert.equal(calculateBillableHours('09:00', '12:30'), 3.5);
  assert.equal(calculateBookingTotal('09:00', '12:30', 20), 70);
});

test('treats an end time before the start time as an overnight booking', () => {
  assert.equal(calculateBillableHours('22:00', '02:00'), 4);
  assert.equal(calculateBookingTotal('22:00', '02:00', 25), 100);
});

test('returns zero total for invalid time input', () => {
  assert.equal(calculateBillableHours('not-a-time', '02:00'), null);
  assert.equal(calculateBookingTotal('not-a-time', '02:00', 25), 0);
});
