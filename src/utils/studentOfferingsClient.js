import { TUTORING_SUBJECTS, COACHING_SPORTS } from '../constants/serviceOfferings';

export function tutoringOfferingLabel(o) {
  if (!o?.subject) return '';
  if (o.subject === 'Other' && o.detail) return `Other (${o.detail})`;
  return o.subject;
}

export function coachingOfferingLabel(o) {
  if (!o?.sport) return '';
  if (o.sport === 'Other' && o.detail) return `Other (${o.detail})`;
  return o.sport;
}

/** Serialize for <select option value=""> */
export function offeringKeySubject(o) {
  return `${(o.subject || '').trim()}\u0001${(o.detail || '').trim()}`;
}

export function parseSubjectOfferingKey(key) {
  const [subject = '', detail = ''] = String(key || '').split('\u0001');
  return { subject: subject.trim(), detail: detail.trim() };
}

export function offeringKeySport(o) {
  return `${(o.sport || '').trim()}\u0001${(o.detail || '').trim()}`;
}

export function parseSportOfferingKey(key) {
  const [sport = '', detail = ''] = String(key || '').split('\u0001');
  return { sport: sport.trim(), detail: detail.trim() };
}

/** Merge API user into concrete arrays for forms (prefer tutoringOfferings, then legacy fields). */
export function tutoringOfferingsFromUser(user) {
  const arr = user?.tutoringOfferings;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr
      .map((x) => ({ subject: (x.subject || '').trim(), detail: (x.detail || '').trim() }))
      .filter((x) => x.subject && TUTORING_SUBJECTS.includes(x.subject))
      .filter((x) => x.subject !== 'Other' || x.detail);
  }
  const legacy = (user?.tutoringSubject || '').trim();
  if (!legacy || !TUTORING_SUBJECTS.includes(legacy)) return [];
  return [
    {
      subject: legacy,
      detail: legacy === 'Other' ? (user.tutoringSubjectOther || '').trim() : '',
    },
  ].filter((x) => x.subject !== 'Other' || x.detail);
}

export function coachingOfferingsFromUser(user) {
  const arr = user?.coachingOfferings;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr
      .map((x) => ({ sport: (x.sport || '').trim(), detail: (x.detail || '').trim() }))
      .filter((x) => x.sport && COACHING_SPORTS.includes(x.sport))
      .filter((x) => x.sport !== 'Other' || x.detail);
  }
  const legacy = (user?.coachingSport || '').trim();
  if (!legacy || !COACHING_SPORTS.includes(legacy)) return [];
  return [
    {
      sport: legacy,
      detail: legacy === 'Other' ? (user.coachingSportOther || '').trim() : '',
    },
  ].filter((x) => x.sport !== 'Other' || x.detail);
}
