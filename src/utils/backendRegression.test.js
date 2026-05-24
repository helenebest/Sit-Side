const {
  calculateBookingTotalAmount,
  getBookingDurationHours,
} = require('../../backend/lib/bookingTime');
const {
  normalizedTutoringOfferings,
  normalizedCoachingOfferings,
} = require('../../backend/lib/studentOfferings');

describe('backend booking regressions', () => {
  it('charges overnight bookings instead of clamping them to zero', () => {
    expect(
      getBookingDurationHours(new Date('2026-05-24T00:00:00Z'), '22:00', '02:00')
    ).toBe(4);
    expect(
      calculateBookingTotalAmount({
        date: new Date('2026-05-24T00:00:00Z'),
        startTime: '22:00',
        endTime: '02:00',
        hourlyRate: 25,
      })
    ).toBe(100);
  });

  it('falls back to valid legacy tutoring and coaching fields if migrated arrays are unusable', () => {
    expect(
      normalizedTutoringOfferings({
        tutoringOfferings: [{ subject: 'NoSuchSubject', detail: '' }],
        tutoringSubject: 'Math',
      })
    ).toEqual([{ subject: 'Math', detail: '' }]);

    expect(
      normalizedCoachingOfferings({
        coachingOfferings: [{ sport: 'NoSuchSport', detail: '' }],
        coachingSport: 'Soccer',
      })
    ).toEqual([{ sport: 'Soccer', detail: '' }]);
  });
});
