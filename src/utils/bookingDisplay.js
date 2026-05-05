/** Short label for booking lists (matches stored booking fields). */
export function formatBookingServiceLine(booking) {
  if (!booking?.serviceType || booking.serviceType === 'babysitter') {
    return 'Babysitting';
  }
  if (booking.serviceType === 'tutor') {
    let detail = booking.tutoringSubject || '';
    if (detail === 'Other' && booking.tutoringSubjectOther) {
      detail = `Other (${booking.tutoringSubjectOther})`;
    }
    return detail ? `Tutoring · ${detail}` : 'Tutoring';
  }
  if (booking.serviceType === 'coach') {
    let detail = booking.coachingSport || '';
    if (detail === 'Other' && booking.coachingSportOther) {
      detail = `Other (${booking.coachingSportOther})`;
    }
    return detail ? `Coaching · ${detail}` : 'Coaching';
  }
  return 'Booking';
}
