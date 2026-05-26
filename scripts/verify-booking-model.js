const mongoose = require('../backend/mongoose');
const Booking = require('../backend/models/Booking');

function baseBooking(overrides = {}) {
  return new Booking({
    student: new mongoose.Types.ObjectId(),
    parent: new mongoose.Types.ObjectId(),
    date: new Date('2026-05-26T00:00:00.000Z'),
    startTime: '10:00',
    endTime: '12:30',
    numberOfChildren: 1,
    emergencyContact: '555-0100',
    hourlyRate: 20,
    ...overrides,
  });
}

async function validateAmount(overrides, expectedAmount) {
  const booking = baseBooking(overrides);
  await booking.validate();
  if (booking.totalAmount !== expectedAmount) {
    throw new Error(
      `Expected totalAmount ${expectedAmount}, got ${booking.totalAmount} for ${booking.startTime}-${booking.endTime}`
    );
  }
}

(async () => {
  await validateAmount({}, 50);
  await validateAmount({ startTime: '20:00', endTime: '02:00', hourlyRate: 18 }, 108);

  try {
    await baseBooking({ startTime: '25:00' }).validate();
    throw new Error('Expected invalid startTime to fail validation');
  } catch (error) {
    if (!error.errors?.startTime) {
      throw error;
    }
  }

  console.log('OK: booking totalAmount handles same-day, overnight, and invalid times.');
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
