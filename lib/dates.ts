/* Calendar-day maths on "YYYY-MM-DD" strings. Everything goes through UTC
 * midnight so no time zone or clock change can shift a day. */

const DAY = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

export const toUTC = (day: string) => new Date(`${day}T00:00:00Z`);
export const fromUTC = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Today on this device's clock. */
export const today = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** The device-local day an instant falls on. */
export const localDay = (iso: string) => today(new Date(iso));

export const addDays = (day: string, n: number) => fromUTC(new Date(toUTC(day).getTime() + n * DAY));
export const diffDays = (from: string, to: string) => Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / DAY);
export const weekday = (day: string) => toUTC(day).getUTCDay(); // 0 = Sunday

export function addMonths(day: string, n: number): string {
  const d = toUTC(day);
  return fromUTC(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)));
}

export const startOfMonth = (day: string) => `${day.slice(0, 8)}01`;

/** Monday on or before the day. */
export const startOfWeek = (day: string) => addDays(day, -((weekday(day) + 6) % 7));

/** Six Monday-first weeks covering the month the day is in. */
export function monthGrid(day: string): string[] {
  const first = startOfWeek(startOfMonth(day));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

/** Next Saturday, or today if it's already the weekend. */
export function thisWeekend(day: string): string {
  const w = weekday(day);
  if (w === 6 || w === 0) return day;
  return addDays(day, 6 - w);
}

export const nextMonday = (day: string) => addDays(startOfWeek(day), 7);

export const shortWeekday = (day: string) => WEEKDAYS[weekday(day)];
export const dayOfMonth = (day: string) => Number(day.slice(8, 10));
export const monthIndex = (day: string) => Number(day.slice(5, 7)) - 1;
export const year = (day: string) => Number(day.slice(0, 4));

/** "TUE 14" style header label pieces. */
export const dayLabel = (day: string) => `${shortWeekday(day)} ${dayOfMonth(day)}`;

/** "14 Oct", or "14 Oct 2027" outside this year. */
export function shortDate(day: string, ref: string): string {
  const base = `${dayOfMonth(day)} ${MONTHS[monthIndex(day)]}`;
  return year(day) === year(ref) ? base : `${base} ${year(day)}`;
}

/** How a date reads relative to today: "today", "tomorrow", "Fri", "14 Oct". */
export function relativeDay(day: string, ref: string): string {
  const d = diffDays(ref, day);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d > 1 && d < 7) return shortWeekday(day);
  return shortDate(day, ref);
}

export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
