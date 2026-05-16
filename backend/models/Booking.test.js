const test = require('node:test');
const assert = require('node:assert/strict');
const Booking = require('./Booking');

function buildBooking(overrides = {}) {
  return new Booking({
    student: '507f1f77bcf86cd799439011',
    parent: '507f1f77bcf86cd799439012',
    date: new Date('2026-06-01T00:00:00.000Z'),
    startTime: '10:00',
    endTime: '12:00',
    numberOfChildren: 1,
    emergencyContact: '555-1212',
    hourlyRate: 20,
    ...overrides,
  });
}

test('pre-validation calculates totalAmount for overnight bookings', async () => {
  const booking = buildBooking({
    startTime: '22:00',
    endTime: '02:00',
    hourlyRate: 25,
  });

  await booking.validate();

  assert.equal(booking.totalAmount, 100);
});

test('pre-validation rejects malformed booking times', async () => {
  const booking = buildBooking({
    startTime: '24:00',
  });

  await assert.rejects(
    () => booking.validate(),
    (error) => Boolean(error.errors && error.errors.startTime)
  );
});
