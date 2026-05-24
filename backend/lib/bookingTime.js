function parseTimeOnDate(date, timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [hourRaw, minuteRaw = '0'] = timeStr.trim().split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const base = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute, 0, 0);
}

function getBookingDurationHours(date, startTime, endTime) {
  const baseDate = date instanceof Date ? date : new Date(date);
  const start = parseTimeOnDate(baseDate, startTime);
  const end = parseTimeOnDate(baseDate, endTime);
  if (!start || !end) return null;

  const endAt = new Date(end);
  if (endAt <= start) {
    endAt.setDate(endAt.getDate() + 1);
  }

  const hours = (endAt - start) / (1000 * 60 * 60);
  return Number.isFinite(hours) && hours > 0 ? hours : null;
}

function calculateBookingTotalAmount({ date, startTime, endTime, hourlyRate }) {
  const rate = Number(hourlyRate);
  const hours = getBookingDurationHours(date, startTime, endTime);
  if (!hours || !Number.isFinite(rate)) return null;
  return Math.round(hours * rate * 100) / 100;
}

module.exports = {
  parseTimeOnDate,
  getBookingDurationHours,
  calculateBookingTotalAmount,
};
