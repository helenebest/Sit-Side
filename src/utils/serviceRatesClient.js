const DEFAULT_RATE = 15;

/** Mirrors backend `resolveHourlyRateForService` for UI totals. */
export function getEffectiveHourlyRateForStudent(student, serviceType) {
  if (!student) return DEFAULT_RATE;
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
