const DEFAULT_RATE = 15;

/**
 * @param {import('mongoose').Document} student
 * @param {'babysitter'|'tutor'|'coach'} serviceType
 */
function resolveHourlyRateForService(student, serviceType) {
  const base =
    typeof student.hourlyRate === 'number' && Number.isFinite(student.hourlyRate)
      ? student.hourlyRate
      : DEFAULT_RATE;

  if (student.useSameRateForAllServices === false) {
    if (serviceType === 'tutor') {
      const r = student.hourlyRateTutor;
      if (typeof r === 'number' && Number.isFinite(r)) return r;
    }
    if (serviceType === 'coach') {
      const r = student.hourlyRateCoach;
      if (typeof r === 'number' && Number.isFinite(r)) return r;
    }
  }

  return base;
}

module.exports = { resolveHourlyRateForService, DEFAULT_RATE };
