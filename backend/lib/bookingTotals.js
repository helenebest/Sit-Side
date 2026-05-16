const BOOKING_TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function parseBookingTime(time) {
  if (typeof time !== 'string') {
    return null;
  }

  const match = BOOKING_TIME_RE.exec(time.trim());
  if (!match) {
    return null;
  }

  const date = new Date('2000-01-01T00:00:00.000Z');
  date.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

function isValidBookingTime(time) {
  return parseBookingTime(time) !== null;
}

function calculateBookingTotalAmount({ startTime, endTime, hourlyRate }) {
  const rate = Number(hourlyRate);
  if (!Number.isFinite(rate)) {
    return null;
  }

  const start = parseBookingTime(startTime);
  const end = parseBookingTime(endTime);
  if (!start || !end) {
    return null;
  }

  if (end <= start) {
    end.setUTCDate(end.getUTCDate() + 1);
  }

  const hours = (end - start) / (1000 * 60 * 60);
  if (!Number.isFinite(hours)) {
    return null;
  }

  return Math.round(hours * rate * 100) / 100;
}

module.exports = {
  calculateBookingTotalAmount,
  isValidBookingTime,
};
