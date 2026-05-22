const assert = require('assert/strict');
const mongoose = require('../backend/mongoose');
const Booking = require('../backend/models/Booking');
const { calculateBookingHours, parseTimeMinutes } = require('../backend/lib/bookingDuration');
const { resolveBookingServiceType } = require('../backend/lib/bookingServiceType');
const {
  normalizedTutoringOfferings,
  normalizedCoachingOfferings,
} = require('../backend/lib/studentOfferings');

function buildBooking(overrides = {}) {
  return new Booking({
    student: new mongoose.Types.ObjectId(),
    parent: new mongoose.Types.ObjectId(),
    date: new Date('2026-01-01T00:00:00Z'),
    startTime: '17:00',
    endTime: '20:00',
    numberOfChildren: 2,
    emergencyContact: '555-0100',
    hourlyRate: 20,
    ...overrides,
  });
}

async function run() {
  assert.equal(parseTimeMinutes('09:30'), 570);
  assert.equal(parseTimeMinutes('24:00'), null);
  assert.equal(calculateBookingHours('17:00', '20:00'), 3);
  assert.equal(calculateBookingHours('22:00', '02:00'), 4);
  assert.equal(calculateBookingHours('09:00', '09:00'), null);
  assert.equal(calculateBookingHours('bad', '11:00'), null);

  const sameDay = buildBooking();
  await sameDay.validate();
  assert.equal(sameDay.totalAmount, 60);

  const overnight = buildBooking({ startTime: '22:00', endTime: '02:00' });
  await overnight.validate();
  assert.equal(overnight.totalAmount, 80);

  const zeroLength = buildBooking({ startTime: '09:00', endTime: '09:00' });
  await assert.rejects(
    () => zeroLength.validate(),
    /Booking end time must differ from start time/
  );

  assert.deepEqual(resolveBookingServiceType({}), { serviceType: 'babysitter' });
  assert.deepEqual(resolveBookingServiceType({ serviceType: ' tutor ' }), { serviceType: 'tutor' });
  assert.equal(resolveBookingServiceType({ serviceType: 'Tutor' }).error, 'Invalid service type');
  assert.equal(
    resolveBookingServiceType({ tutoringOffering: { subject: 'Math' } }).error,
    'Tutoring offering requires tutor service type'
  );
  assert.equal(
    resolveBookingServiceType({ serviceType: 'babysitter', coachingOffering: { sport: 'Soccer' } }).error,
    'Coaching offering requires coach service type'
  );

  assert.deepEqual(
    normalizedTutoringOfferings({
      tutoringOfferings: [{ subject: 'Not Real', detail: '' }],
      tutoringSubject: 'Math',
    }),
    [{ subject: 'Math', detail: '' }]
  );
  assert.deepEqual(
    normalizedCoachingOfferings({
      coachingOfferings: [{ sport: 'Not Real', detail: '' }],
      coachingSport: 'Soccer',
    }),
    [{ sport: 'Soccer', detail: '' }]
  );
}

run()
  .then(() => {
    console.log('critical booking fixes tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
