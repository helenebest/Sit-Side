function idString(value) {
  if (!value) return '';
  if (value._id) return String(value._id);
  return String(value);
}

function canViewFullBooking(requester, booking) {
  if (!requester || !booking) return false;

  const requesterId = idString(requester);
  if (!requesterId) return false;

  if (requester.userType === 'student') {
    return idString(booking.student) === requesterId;
  }

  if (requester.userType === 'parent') {
    return idString(booking.parent) === requesterId;
  }

  return false;
}

function toPlainBooking(booking) {
  if (booking && typeof booking.toObject === 'function') {
    return booking.toObject();
  }
  return booking || {};
}

function publicCalendarBooking(booking) {
  const plain = toPlainBooking(booking);
  return {
    _id: plain._id,
    id: plain.id,
    student: idString(plain.student) || undefined,
    date: plain.date,
    startTime: plain.startTime,
    endTime: plain.endTime,
    status: plain.status,
    serviceType: plain.serviceType,
  };
}

function bookingForStudentCalendar(booking, requester) {
  if (canViewFullBooking(requester, booking)) {
    return booking;
  }

  return publicCalendarBooking(booking);
}

module.exports = {
  bookingForStudentCalendar,
  canViewFullBooking,
  publicCalendarBooking,
};
