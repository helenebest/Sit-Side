import { calculateBillableHours, calculateBookingTotal } from './bookingDuration';

describe('booking duration helpers', () => {
  it('calculates same-day booking duration and total', () => {
    expect(calculateBillableHours('09:00', '12:30')).toBe(3.5);
    expect(calculateBookingTotal('09:00', '12:30', 20)).toBe(70);
  });

  it('treats an end time before the start time as an overnight booking', () => {
    expect(calculateBillableHours('22:00', '02:00')).toBe(4);
    expect(calculateBookingTotal('22:00', '02:00', 25)).toBe(100);
  });

  it('returns zero total for invalid time input', () => {
    expect(calculateBillableHours('not-a-time', '02:00')).toBeNull();
    expect(calculateBookingTotal('not-a-time', '02:00', 25)).toBe(0);
  });
});
