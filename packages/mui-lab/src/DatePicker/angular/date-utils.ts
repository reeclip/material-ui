/** Weekday labels starting from Sunday. */
export const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

/** Month names. */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** Short month names. */
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

/** Returns true if two dates represent the same calendar day. */
export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns true if a date is today. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Build the 6-row calendar grid for a given month. */
export function buildCalendarGrid(
  year: number,
  month: number,
  selectedDate: Date | null,
  minDate: Date | null,
  maxDate: Date | null,
): CalendarWeek[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Start from the Sunday of the week containing the 1st
  const gridStart = new Date(year, month, 1 - startDayOfWeek);

  const weeks: CalendarWeek[] = [];
  const current = new Date(gridStart);

  for (let w = 0; w < 6; w++) {
    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(current);
      const isCurrentMonth = date.getMonth() === month;

      let isDisabled = false;
      if (minDate && date < startOfDay(minDate)) isDisabled = true;
      if (maxDate && date > endOfDay(maxDate)) isDisabled = true;

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate),
        isDisabled,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push({ days });
  }

  return weeks;
}

/** Build year list for the year picker view. */
export function buildYearList(currentYear: number, range = 100): number[] {
  const start = currentYear - Math.floor(range / 2);
  return Array.from({ length: range }, (_, i) => start + i);
}

/** Format a date as MM/DD/YYYY. */
export function formatDate(date: Date | null): string {
  if (!date) return '';
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

/** Parse a date string in MM/DD/YYYY format. Returns null if invalid. */
export function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, mStr, dStr, yStr] = match;
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);
  const y = parseInt(yStr, 10);
  const date = new Date(y, m, d);
  if (date.getMonth() !== m || date.getDate() !== d || date.getFullYear() !== y) {
    return null;
  }
  return date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
