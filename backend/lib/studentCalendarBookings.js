const PUBLIC_STUDENT_CALENDAR_STATUSES = ['pending', 'confirmed'];

function isPublicStudentCalendarStatus(status) {
  return PUBLIC_STUDENT_CALENDAR_STATUSES.includes(status);
}

function plainBooking(booking) {
  if (booking && typeof booking.toObject === 'function') {
    return booking.toObject();
  }
  return booking || {};
}

function publicStudentCalendarBooking(booking) {
  const plain = plainBooking(booking);
  const out = {
    _id: plain._id,
    date: plain.date,
    startTime: plain.startTime,
    endTime: plain.endTime,
    status: plain.status,
    serviceType: plain.serviceType,
  };

  if (plain.id !== undefined) {
    out.id = plain.id;
  }

  return out;
}

module.exports = {
  PUBLIC_STUDENT_CALENDAR_STATUSES,
  isPublicStudentCalendarStatus,
  publicStudentCalendarBooking,
};
