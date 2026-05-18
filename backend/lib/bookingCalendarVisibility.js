const CALENDAR_BUSY_STATUSES = ['pending', 'confirmed', 'completed'];

function publicCalendarBookingShape(booking) {
  const source = typeof booking?.toObject === 'function' ? booking.toObject() : booking;
  return {
    _id: source._id,
    date: source.date,
    startTime: source.startTime,
    endTime: source.endTime,
  };
}

module.exports = {
  CALENDAR_BUSY_STATUSES,
  publicCalendarBookingShape,
};
