import React, { useMemo } from 'react';
import { buildMonthGrid, WEEKDAY_LABELS_SHORT } from '../utils/buildMonthGrid';
import { getBookingRange, themeClassForBooking } from '../utils/bookingCalendarSpans';

/**
 * Traditional rectangular month calendar: header row + 6×7 grid with borders.
 * Optional `bookings` renders multi-day / overnight spans as continuous bars (under day cells).
 */
const MonthCalendarGrid = ({
  monthDate,
  toolbar,
  renderDay,
  bookings = [],
  className = '',
}) => {
  const cells = useMemo(
    () => buildMonthGrid(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate]
  );

  const weeks = useMemo(
    () => Array.from({ length: 6 }, (_, rowIdx) => cells.slice(rowIdx * 7, rowIdx * 7 + 7)),
    [cells]
  );

  const bookingLabelsByDay = useMemo(() => {
    const byDay = new Map();
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return byDay;
    }

    for (const booking of bookings) {
      if (!booking || booking.status === 'cancelled') continue;
      const range = getBookingRange(booking);
      if (!range) continue;

      for (const cell of cells) {
        const date = cell.date;
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          23,
          59,
          59,
          999
        );
        if (range.start > dayEnd || range.end < dayStart) continue;

        const key = dayStart.getTime();
        const labels = byDay.get(key) ?? [];
        const parentName = booking.parent
          ? `${booking.parent.firstName || ''} ${booking.parent.lastName || ''}`.trim()
          : '';
        labels.push({
          key: `${String(booking._id ?? booking.id ?? key)}-${labels.length}`,
          text: `${booking.startTime || ''}${parentName ? ` ${parentName}` : ''}`.trim() || 'Booking',
          themeClass: themeClassForBooking(booking),
        });
        byDay.set(key, labels);
      }
    }

    return byDay;
  }, [bookings, cells]);

  return (
    <div
      className={`month-cal ${className}`}
      style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
    >
      {toolbar ? <div className="month-cal-toolbar">{toolbar}</div> : null}

      <table className="month-cal-table" role="grid" aria-label="Month calendar">
        <thead>
          <tr>
            {WEEKDAY_LABELS_SHORT.map((label, i) => (
              <th
                key={label}
                className={`month-cal-weekday ${i === 0 ? 'month-cal-weekday--sun' : ''}`}
                scope="col"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, rowIdx) => (
            <tr key={`week-${rowIdx}`}>
              {week.map((cell, colIdx) => {
                const dayKey = new Date(
                  cell.date.getFullYear(),
                  cell.date.getMonth(),
                  cell.date.getDate(),
                  0,
                  0,
                  0,
                  0
                ).getTime();
                const dayBookings = bookingLabelsByDay.get(dayKey) ?? [];
                const visibleBookings = dayBookings.slice(0, 2);

                return (
                  <td
                    key={`${cell.date.getTime()}-${rowIdx}-${colIdx}`}
                    className="month-cal-cell"
                  >
                    {renderDay(cell, rowIdx * 7 + colIdx)}
                    {visibleBookings.length > 0 ? (
                      <div className="month-cal-day-bookings" aria-hidden>
                        {visibleBookings.map((item) => (
                          <div
                            key={item.key}
                            className={`month-cal-day-booking-chip ${item.themeClass}`}
                            title={item.text}
                          >
                            {item.text}
                          </div>
                        ))}
                        {dayBookings.length > visibleBookings.length ? (
                          <div className="month-cal-day-booking-more">
                            +{dayBookings.length - visibleBookings.length} more
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthCalendarGrid;
