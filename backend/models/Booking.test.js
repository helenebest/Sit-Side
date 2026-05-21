const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('../mongoose');
const Booking = require('./Booking');

function buildBooking(overrides = {}) {
  return new Booking({
    student: new mongoose.Types.ObjectId(),
    parent: new mongoose.Types.ObjectId(),
    date: new Date('2026-05-21T00:00:00.000Z'),
    startTime: '18:00',
    endTime: '20:30',
    numberOfChildren: 1,
    emergencyContact: '555-0100',
    hourlyRate: 20,
    ...overrides,
  });
}

test('calculates totalAmount for same-day bookings', async () => {
  const booking = buildBooking();

  await booking.validate();

  assert.equal(booking.totalAmount, 50);
});

test('calculates totalAmount for overnight bookings across midnight', async () => {
  const booking = buildBooking({
    startTime: '22:00',
    endTime: '02:00',
    hourlyRate: 25,
  });

  await booking.validate();

  assert.equal(booking.totalAmount, 100);
});
