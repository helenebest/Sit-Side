/**
 * Calendar spanning segments for bookings (overnight = multi-day; same-day = one column).
 * Uses local date/time from booking.date + startTime/endTime strings (HTML time input shape).
 */

function dayBounds(d) {
  const x = new Date(d);
  const start = new Date(x.getFullYear(), x.getMonth(), x.getDate(), 0, 0, 0, 0);
  const end = new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999);
  return { start, end };
}

function parseTimeOnDay(dayDate, timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [hPart, mPart] = timeStr.trim().split(':');
  const h = parseInt(hPart, 10);
  const m = parseInt(mPart ?? '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const base = new Date(dayDate);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0);
}

/**
 * @returns {{ start: Date, end: Date, booking: object } | null}
 */
export function getBookingRange(booking) {
  if (!booking?.date || !booking.startTime || !booking.endTime) return null;
  const d = new Date(booking.date);
  const start = parseTimeOnDay(d, booking.startTime);
  const end = parseTimeOnDay(d, booking.endTime);
  if (!start || !end) return null;
  let endAt = end;
  if (endAt <= start) {
    endAt = new Date(endAt);
    endAt.setDate(endAt.getDate() + 1);
  }
  return { start, end: endAt, booking };
}

function segmentInRow(range, rowCells) {
  let colStart = -1;
  let colEnd = -1;
  for (let c = 0; c < 7; c += 1) {
    const { start: ds, end: de } = dayBounds(rowCells[c].date);
    if (range.start <= de && range.end >= ds) {
      if (colStart === -1) colStart = c;
      colEnd = c;
    }
  }
  if (colStart === -1) return null;
  return { colStart, colEnd };
}

function assignLanes(rowSegs) {
  const sorted = [...rowSegs].sort(
    (x, y) => x.colStart - y.colStart || x.colEnd - y.colEnd
  );
  const laneEnds = [];
  const out = [];
  for (const s of sorted) {
    let lane = 0;
    while (lane < laneEnds.length && s.colStart <= laneEnds[lane]) {
      lane += 1;
    }
    if (lane === laneEnds.length) {
      laneEnds.push(s.colEnd);
    } else {
      laneEnds[lane] = s.colEnd;
    }
    out.push({ ...s, lane });
  }
  return out;
}

function shortLabel(booking) {
  const t = booking.startTime || '';
  const parent = booking.parent;
  const name = parent
    ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || 'Booking'
    : 'Booking';
  return `${t} ${name}`.trim();
}

/** Theme classes live in `src/index.css` (`.cal-bar-theme-*`) — not Tailwind. */
const HASH_THEMES = [
  'cal-bar-theme-0',
  'cal-bar-theme-1',
  'cal-bar-theme-2',
  'cal-bar-theme-3',
  'cal-bar-theme-4',
  'cal-bar-theme-5',
];

export function themeClassForBooking(booking) {
  const id = String(booking?._id ?? booking?.id ?? '');
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return HASH_THEMES[Math.abs(hash) % HASH_THEMES.length];
}

/**
 * @param {object[]} bookings
 * @param {{ date: Date, inCurrentMonth: boolean }[]} cells length 42
 * @returns {object[]}
 */
export function computeBookingSpanSegments(bookings, cells) {
  if (!Array.isArray(bookings) || !cells?.length) return [];

  const ranges = bookings
    .filter((b) => b && b.status !== 'cancelled')
    .map(getBookingRange)
    .filter(Boolean);

  const segments = [];

  for (let row = 0; row < 6; row += 1) {
    const rowCells = cells.slice(row * 7, row * 7 + 7);
    const rawSegs = [];
    for (const r of ranges) {
      const seg = segmentInRow(r, rowCells);
      if (seg) {
        rawSegs.push({
          colStart: seg.colStart,
          colEnd: seg.colEnd,
          booking: r.booking,
        });
      }
    }
    const withLanes = assignLanes(rawSegs);
    for (const s of withLanes) {
      segments.push({
        key: `span-${row}-${s.booking._id ?? s.booking.id}-${s.colStart}-${s.colEnd}`,
        row,
        colStart: s.colStart,
        colEnd: s.colEnd,
        lane: s.lane,
        booking: s.booking,
        label: shortLabel(s.booking),
        themeClass: themeClassForBooking(s.booking),
      });
    }
  }

  return segments;
}
