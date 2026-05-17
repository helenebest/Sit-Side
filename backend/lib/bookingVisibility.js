function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function canViewDetailedStudentCalendar(user, studentId) {
  return user?.userType === 'student' && sameId(user._id, studentId);
}

function publicCalendarBookingShape(booking) {
  const source = booking?.toObject ? booking.toObject() : booking;
  return {
    _id: source?._id,
    id: source?.id,
    date: source?.date,
    startTime: source?.startTime,
    endTime: source?.endTime,
    status: source?.status,
    serviceType: source?.serviceType,
  };
}

module.exports = {
  canViewDetailedStudentCalendar,
  publicCalendarBookingShape,
};
