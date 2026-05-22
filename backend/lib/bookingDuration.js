const MINUTES_PER_DAY = 24 * 60;

function parseTimeMinutes(timeStr) {
  if (typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function calculateBookingHours(startTime, endTime) {
  const start = parseTimeMinutes(startTime);
  const end = parseTimeMinutes(endTime);
  if (start == null || end == null || start === end) return null;

  const durationMinutes = end > start ? end - start : end + MINUTES_PER_DAY - start;
  return durationMinutes / 60;
}

module.exports = {
  calculateBookingHours,
  parseTimeMinutes,
};
