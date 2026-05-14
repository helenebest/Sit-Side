export function timeToMinutes(timeStr) {
  if (typeof timeStr !== 'string') return null;

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return hours * 60 + minutes + seconds / 60;
}

export function calculateBillableHours(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start == null || end == null) return null;

  let minutes = end - start;
  if (minutes <= 0) {
    minutes += 24 * 60;
  }

  return minutes / 60;
}

export function calculateBookingTotal(startTime, endTime, hourlyRate) {
  const rate = Number(hourlyRate);
  if (!Number.isFinite(rate)) return 0;

  const hours = calculateBillableHours(startTime, endTime);
  if (hours == null || !Number.isFinite(hours)) return 0;

  return Math.round(Math.max(0, hours * rate) * 100) / 100;
}
