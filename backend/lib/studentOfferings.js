const { TUTORING_SUBJECTS, COACHING_SPORTS } = require('../constants/serviceOfferings');

function normalizedTutoringOfferings(user) {
  if (!user) return [];
  const arr = user.tutoringOfferings;
  if (Array.isArray(arr) && arr.length > 0) {
    const normalized = arr
      .map((o) => ({
        subject: (o.subject || '').trim(),
        detail: (o.detail || '').trim(),
      }))
      .filter((o) => o.subject && TUTORING_SUBJECTS.includes(o.subject));
    if (normalized.length > 0) return normalized;
  }
  const legacy = (user.tutoringSubject || '').trim();
  if (!legacy || !TUTORING_SUBJECTS.includes(legacy)) return [];
  return [
    {
      subject: legacy,
      detail: legacy === 'Other' ? (user.tutoringSubjectOther || '').trim() : '',
    },
  ].filter((o) => o.subject !== 'Other' || o.detail);
}

function normalizedCoachingOfferings(user) {
  if (!user) return [];
  const arr = user.coachingOfferings;
  if (Array.isArray(arr) && arr.length > 0) {
    const normalized = arr
      .map((o) => ({
        sport: (o.sport || '').trim(),
        detail: (o.detail || '').trim(),
      }))
      .filter((o) => o.sport && COACHING_SPORTS.includes(o.sport));
    if (normalized.length > 0) return normalized;
  }
  const legacy = (user.coachingSport || '').trim();
  if (!legacy || !COACHING_SPORTS.includes(legacy)) return [];
  return [
    {
      sport: legacy,
      detail: legacy === 'Other' ? (user.coachingSportOther || '').trim() : '',
    },
  ].filter((o) => o.sport !== 'Other' || o.detail);
}

function tutoringKey(o) {
  return `${(o.subject || '').toLowerCase()}\u0000${(o.detail || '').toLowerCase()}`;
}

function coachingKey(o) {
  return `${(o.sport || '').toLowerCase()}\u0000${(o.detail || '').toLowerCase()}`;
}

function sanitizedTutoringOfferingsInput(bodyArr) {
  if (!Array.isArray(bodyArr)) return [];
  return bodyArr
    .map((item) => ({
      subject: typeof item.subject === 'string' ? item.subject.trim() : '',
      detail: typeof item.detail === 'string' ? item.detail.trim() : '',
    }))
    .filter((o) => o.subject);
}

function sanitizedCoachingOfferingsInput(bodyArr) {
  if (!Array.isArray(bodyArr)) return [];
  return bodyArr
    .map((item) => ({
      sport: typeof item.sport === 'string' ? item.sport.trim() : '',
      detail: typeof item.detail === 'string' ? item.detail.trim() : '',
    }))
    .filter((o) => o.sport);
}

function validateTutoringOfferings(arr) {
  if (arr.length > 24) return 'Too many tutoring subjects';
  const seen = new Set();
  for (const o of arr) {
    if (!TUTORING_SUBJECTS.includes(o.subject)) return 'Invalid tutoring subject';
    if (o.subject !== 'Other' && o.detail) {
      return 'Use “Other” and the description field for subjects not listed';
    }
    if (o.subject === 'Other') {
      if (!o.detail) return 'Describe each custom tutoring subject (Other)';
      if (o.detail.length > 120) return 'Subject description is too long';
    }
    const k = tutoringKey(o);
    if (seen.has(k)) return 'Duplicate tutoring subjects';
    seen.add(k);
  }
  return null;
}

function validateCoachingOfferings(arr) {
  if (arr.length > 24) return 'Too many coaching sports';
  const seen = new Set();
  for (const o of arr) {
    if (!COACHING_SPORTS.includes(o.sport)) return 'Invalid coaching sport';
    if (o.sport !== 'Other' && o.detail) {
      return 'Use “Other” and the description field for sports not listed';
    }
    if (o.sport === 'Other') {
      if (!o.detail) return 'Describe each custom sport (Other)';
      if (o.detail.length > 120) return 'Sport description is too long';
    }
    const k = coachingKey(o);
    if (seen.has(k)) return 'Duplicate coaching sports';
    seen.add(k);
  }
  return null;
}

/**
 * @returns {{ tutoringSubject: string, tutoringSubjectOther?: string } | null} snapshot fields for Booking model
 */
function resolveTutorBookingSnapshot(student, body) {
  const offerings = normalizedTutoringOfferings(student);
  if (!offerings.length) {
    return { error: 'This sitter has not set up tutoring on their profile.' };
  }

  let sel = body.tutoringOffering;
  if (offerings.length === 1 && (!sel || typeof sel !== 'object' || !String(sel.subject || '').trim())) {
    sel = offerings[0];
  }

  if (!sel || typeof sel !== 'object') {
    return { error: 'Choose which subject you want tutoring in for this booking.' };
  }

  const subject = String(sel.subject || '').trim();
  const detail = String(sel.detail || '').trim();
  const match = offerings.find((o) => o.subject === subject && (o.detail || '') === (detail || ''));
  if (!match) {
    return { error: 'Pick a tutoring subject this sitter offers.' };
  }

  return {
    tutoringSubject: match.subject,
    tutoringSubjectOther: match.subject === 'Other' ? match.detail : undefined,
  };
}

function resolveCoachBookingSnapshot(student, body) {
  const offerings = normalizedCoachingOfferings(student);
  if (!offerings.length) {
    return { error: 'This sitter has not set up sports coaching on their profile.' };
  }

  let sel = body.coachingOffering;
  if (offerings.length === 1 && (!sel || typeof sel !== 'object' || !String(sel.sport || '').trim())) {
    sel = offerings[0];
  }

  if (!sel || typeof sel !== 'object') {
    return { error: 'Choose which sport you want coaching for in this booking.' };
  }

  const sport = String(sel.sport || '').trim();
  const detail = String(sel.detail || '').trim();
  const match = offerings.find((o) => o.sport === sport && (o.detail || '') === (detail || ''));
  if (!match) {
    return { error: 'Pick a sport this sitter offers for coaching.' };
  }

  return {
    coachingSport: match.sport,
    coachingSportOther: match.sport === 'Other' ? match.detail : undefined,
  };
}

module.exports = {
  normalizedTutoringOfferings,
  normalizedCoachingOfferings,
  sanitizedTutoringOfferingsInput,
  sanitizedCoachingOfferingsInput,
  validateTutoringOfferings,
  validateCoachingOfferings,
  resolveTutorBookingSnapshot,
  resolveCoachBookingSnapshot,
};
