function idString(value) {
  if (value == null) {
    return '';
  }
  return String(value._id || value.id || value);
}

function idsEqual(a, b) {
  const left = idString(a);
  const right = idString(b);
  return Boolean(left && right && left === right);
}

function canRequestStudentCalendar(user, studentId) {
  if (!user) {
    return false;
  }
  if (user.userType === 'student') {
    return idsEqual(user._id, studentId);
  }
  return user.userType === 'parent';
}

function isOwnedCalendarBooking(booking, user, studentId) {
  if (!booking || !user) {
    return false;
  }
  if (user.userType === 'student') {
    return idsEqual(user._id, studentId || booking.student);
  }
  if (user.userType === 'parent') {
    return idsEqual(user._id, booking.parent);
  }
  return false;
}

function serializeStudentCalendarBooking(booking, user, studentId) {
  if (isOwnedCalendarBooking(booking, user, studentId)) {
    return booking;
  }

  return {
    _id: booking._id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    serviceType: booking.serviceType,
    student: booking.student,
  };
}

module.exports = {
  canRequestStudentCalendar,
  serializeStudentCalendarBooking,
};
