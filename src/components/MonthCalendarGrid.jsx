import React, { useMemo } from 'react';
import { buildMonthGrid, WEEKDAY_LABELS_SHORT } from '../utils/buildMonthGrid';
import { computeBookingSpanSegments } from '../utils/bookingCalendarSpans';

const ROW_TEMPLATE = 'repeat(6, minmax(5.75rem, auto))';
const BAR_TOP_BASE_PX = 30;
const BAR_LANE_STEP_PX = 22;

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
      className={`rounded-lg border border-neutral-300 bg-white shadow-sm overflow-hidden ${className}`}
    >
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-300 bg-neutral-50 px-3 py-2.5">
          {toolbar}
        </div>
      ) : null}

      <div className="grid grid-cols-7 border-b border-neutral-300 bg-gradient-to-b from-sky-50/80 to-slate-50/90">
        {WEEKDAY_LABELS_SHORT.map((label, i) => (
          <div
            key={label}
            className={`py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-600 border-r border-neutral-300 last:border-r-0 ${
              i === 0 ? 'text-red-600' : ''
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="relative bg-slate-50/30">
        <div
          className="relative z-[2] grid grid-cols-7 grid-rows-6"
          style={{ gridTemplateRows: ROW_TEMPLATE }}
        >
          {cells.map((cell, index) => (
            <div
              key={`${cell.date.getTime()}-${index}`}
              className="min-h-0 border-r border-b border-neutral-200 [&:nth-child(7n)]:border-r-0 p-0.5 sm:p-1 align-top box-border"
            >
              {renderDay(cell, index)}
            </div>
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] grid grid-cols-7 grid-rows-6"
          style={{ gridTemplateRows: ROW_TEMPLATE }}
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
              className="px-0.5"
            >
              <div
                className={`flex h-[20px] w-full items-center rounded-sm px-1.5 text-[10px] font-semibold leading-tight shadow-sm truncate ${seg.themeClass}`}
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
