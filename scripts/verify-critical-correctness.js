const assert = require('assert');
const mongoose = require('../backend/mongoose');
const Booking = require('../backend/models/Booking');

async function validateBookingTotal({ startTime, endTime, hourlyRate, expected }) {
  const booking = new Booking({
    student: new mongoose.Types.ObjectId(),
    parent: new mongoose.Types.ObjectId(),
    date: new Date('2026-05-23T00:00:00.000Z'),
    startTime,
    endTime,
    numberOfChildren: 1,
    emergencyContact: '555-0100',
    hourlyRate,
  });

  await booking.validate();
  assert.strictEqual(booking.totalAmount, expected);
}

(async () => {
  await validateBookingTotal({
    startTime: '09:00',
    endTime: '12:30',
    hourlyRate: 20,
    expected: 70,
  });

  await validateBookingTotal({
    startTime: '22:00',
    endTime: '02:00',
    hourlyRate: 20,
    expected: 80,
  });

  await validateBookingTotal({
    startTime: '10:00',
    endTime: '10:00',
    hourlyRate: 15,
    expected: 360,
  });

  await mongoose.disconnect();
  console.log('Critical correctness checks passed.');
})().catch(async (error) => {
  await mongoose.disconnect();
  console.error(error);
  process.exit(1);
});
