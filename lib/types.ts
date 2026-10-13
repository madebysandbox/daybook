/* The one kind of thing in Daybook (spec §2). Dates are calendar days
 * ("YYYY-MM-DD"), never timestamps, so a task can't drift a day between
 * devices. */

export type Area = "work" | "home";

export type TaskLink = { url: string; label?: string };

export type Task = {
  id: string;
  title: string;
  notes: string;
  links: TaskLink[];
  doDate: string | null;
  dueDate: string | null;
  area: Area;
  done: boolean;
  doneAt: string | null;
  /** RFC 5545 rule without DTSTART, e.g. "FREQ=WEEKLY;BYDAY=TU". */
  rrule: string | null;
  /** The day the repeat rule counts from (its DTSTART). */
  seriesStart: string | null;
  createdAt: string;
  updatedAt: string;
};

/** An event from the iCloud feed. Timed: ISO instants. All-day: days, end exclusive. */
export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};
