import React, { useMemo } from 'react';
import { buildMonthGrid, WEEKDAY_LABELS_SHORT } from '../utils/buildMonthGrid';
import { computeBookingSpanSegments } from '../utils/bookingCalendarSpans';

const ROW_TEMPLATE = 'repeat(6, minmax(5.75rem, auto))';
const BAR_TOP_BASE_PX = 30;
const BAR_LANE_STEP_PX = 22;

/** Inline so layout survives stale CDN CSS or missing hand-rolled utilities. */
const GRID_7_COL = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
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

  const spanSegments = useMemo(
    () => computeBookingSpanSegments(bookings, cells),
    [bookings, cells]
  );

  return (
    <div
      className={`month-cal ${className}`}
      style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
    >
      {toolbar ? <div className="month-cal-toolbar">{toolbar}</div> : null}

      <div className="month-cal-weekdays" style={GRID_7_COL}>
        {WEEKDAY_LABELS_SHORT.map((label, i) => (
          <div
            key={label}
            className={`month-cal-weekday ${i === 0 ? 'month-cal-weekday--sun' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className="month-cal-body"
        style={{ position: 'relative', width: '100%', minWidth: 0 }}
      >
        <div
          className="month-cal-grid month-cal-grid--cells"
          style={{ ...GRID_7_COL, gridTemplateRows: ROW_TEMPLATE }}
        >
          {cells.map((cell, index) => (
            <div
              key={`${cell.date.getTime()}-${index}`}
              className="month-cal-cell"
            >
              {renderDay(cell, index)}
            </div>
          ))}
        </div>

        <div
          className="month-cal-grid month-cal-grid--overlay"
          style={{
            ...GRID_7_COL,
            gridTemplateRows: ROW_TEMPLATE,
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1,
          }}
          aria-hidden
        >
          {spanSegments.map((seg) => (
            <div
              key={seg.key}
              style={{
                gridRow: seg.row + 1,
                gridColumn: `${seg.colStart + 1} / ${seg.colEnd + 2}`,
                paddingTop: BAR_TOP_BASE_PX + seg.lane * BAR_LANE_STEP_PX,
              }}
              className="month-cal-span-slot"
            >
              <div
                className={`month-cal-bar ${seg.themeClass}`}
                title={`${seg.booking.startTime}–${seg.booking.endTime} · ${seg.label}`}
              >
                {seg.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthCalendarGrid;
