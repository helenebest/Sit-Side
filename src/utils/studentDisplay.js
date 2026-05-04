const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/** Human-readable summary when availability is the weekly object from the API. */
export function formatAvailabilitySummary(availability) {
  if (!availability || typeof availability !== 'object') return '';
  const parts = [];
  for (const day of DAY_ORDER) {
    const slots = availability[day];
    if (!slots || typeof slots !== 'object') continue;
    const active = ['morning', 'afternoon', 'evening'].filter((k) => slots[k]);
    if (active.length) {
      parts.push(`${day.slice(0, 3)}: ${active.join(', ')}`);
    }
  }
  return parts.length ? parts.join(' · ') : '';
}

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
  const availabilityText =
    typeof u.availability === 'string' && u.availability.trim()
      ? u.availability.trim()
      : formatAvailabilitySummary(u.availability);
  return {
    ...u,
    id,
    name,
    hourlyRateRange,
    availabilityText,
  };
}
