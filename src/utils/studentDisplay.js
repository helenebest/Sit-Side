/** Normalize API user documents for parent-facing lists and routes. */
export function studentsFromApiResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.students)) return data.students;
  return [];
}

export function normalizeStudentForListing(u) {
  if (!u) return null;
  const id = u._id != null ? String(u._id) : String(u.id ?? '');
  const name =
    u.name ||
    [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
    'Student';
  let hourlyRateRange = u.hourlyRateRange;
  if (
    !hourlyRateRange &&
    typeof u.hourlyRate === 'number' &&
    Number.isFinite(u.hourlyRate)
  ) {
    const r = u.hourlyRate;
    hourlyRateRange = `$${r % 1 === 0 ? r : r.toFixed(2)} / hour`;
  }
  return {
    ...u,
    id,
    name,
    hourlyRateRange,
  };
}
