import React, { useMemo } from 'react';
import { buildMonthGrid, WEEKDAY_LABELS_SHORT } from '../utils/buildMonthGrid';
import { getBookingRange, themeClassForBooking } from '../utils/bookingCalendarSpans';

const STRUCTURE = {
  outer: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    border: '1px solid #bfc7d1',
    borderRadius: 0,
    background: '#fff',
    overflow: 'hidden',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    borderBottom: '1px solid #bfc7d1',
    background: '#eef2f6',
  },
  weekdayCell: {
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#1f2937',
    borderRight: '1px solid #bfc7d1',
    padding: '8px 0',
  },
  weeks: {
    display: 'grid',
    gridTemplateRows: 'repeat(6, minmax(108px, auto))',
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  },
  dayCell: {
    borderRight: '1px solid #bfc7d1',
    borderBottom: '1px solid #bfc7d1',
    padding: '3px',
    minHeight: '108px',
    boxSizing: 'border-box',
    verticalAlign: 'top',
  },
};

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
      style={STRUCTURE.outer}
    >
      {toolbar ? <div className="month-cal-toolbar">{toolbar}</div> : null}

      <div style={STRUCTURE.weekdays} role="row">
        {WEEKDAY_LABELS_SHORT.map((label, i) => (
          <div
            key={label}
            className={i === 0 ? 'month-cal-weekday--sun' : ''}
            style={{
              ...STRUCTURE.weekdayCell,
              borderRight: i === 6 ? 'none' : STRUCTURE.weekdayCell.borderRight,
              color: i === 0 ? '#dc2626' : STRUCTURE.weekdayCell.color,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={STRUCTURE.weeks} role="grid" aria-label="Month calendar">
        {weeks.map((week, rowIdx) => (
          <div key={`week-${rowIdx}`} style={STRUCTURE.weekRow} role="row">
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
                <div
                  key={`${cell.date.getTime()}-${rowIdx}-${colIdx}`}
                  className="month-cal-cell"
                  role="gridcell"
                  style={{
                    ...STRUCTURE.dayCell,
                    borderRight: colIdx === 6 ? 'none' : STRUCTURE.dayCell.borderRight,
                    borderBottom: rowIdx === 5 ? 'none' : STRUCTURE.dayCell.borderBottom,
                  }}
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
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthCalendarGrid;
