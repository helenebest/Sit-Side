/**
 * Builds a fixed 6×7 grid (42 cells) for a month view: leading/trailing
 * days from adjacent months fill the first/last week so the grid is rectangular.
 * @param {number} year - full year
 * @param {number} monthIndex - 0–11
 * @returns {{ date: Date, inCurrentMonth: boolean }[]}
 */
export function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const padStart = first.getDay();
  const daysInMonth = last.getDate();
  const cells = [];

  const prevMonthLastDate = new Date(year, monthIndex, 0).getDate();
  for (let i = 0; i < padStart; i += 1) {
    const day = prevMonthLastDate - padStart + i + 1;
    cells.push({
      date: new Date(year, monthIndex - 1, day),
      inCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({
      date: new Date(year, monthIndex, d),
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(year, monthIndex + 1, nextDay),
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  while (cells.length < 42) {
    cells.push({
      date: new Date(year, monthIndex + 1, nextDay),
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export const WEEKDAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
