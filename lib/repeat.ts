/* Repeating tasks (spec §2, §3). Rules are standard RRULEs, stored without
 * DTSTART; the task's seriesStart is the day they count from. The form
 * model below is what the Custom… screen edits, and it round-trips. */

import { RRule } from "rrule";

import { addDays, dayOfMonth, diffDays, fromUTC, MONTH_NAMES, monthIndex, shortDate, toUTC, weekday } from "./dates";
import type { Task } from "./types";

export type Freq = "daily" | "weekly" | "monthly" | "yearly";
/** Monday-first, as RRULE numbers them: 0 = Monday … 6 = Sunday. */
export type Wd = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Nth = 1 | 2 | 3 | 4 | -1;

export type MonthlyMode = { mode: "date" } | { mode: "nth"; nth: Nth; weekday: Wd } | { mode: "lastWeekday" };
export type RepeatEnd = { type: "never" } | { type: "until"; until: string } | { type: "count"; count: number };

export type RepeatForm = {
  freq: Freq;
  interval: number;
  weekdays: Wd[];
  monthly: MonthlyMode;
  end: RepeatEnd;
};

export type Preset = "none" | Freq | "custom";

const CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FREQ_CODE: Record<Freq, string> = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY" };
const UNIT: Record<Freq, string> = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };
const ORDINAL: Record<Nth, string> = { 1: "first", 2: "second", 3: "third", 4: "fourth", [-1]: "last" } as Record<
  Nth,
  string
>;

/** Monday-first weekday of a day. */
export const wdOf = (day: string) => ((weekday(day) + 6) % 7) as Wd;

/** Which week of the month a day falls in, as an Nth (5th becomes "last"). */
export function nthOf(day: string): Nth {
  const n = Math.ceil(dayOfMonth(day) / 7);
  return (n >= 5 ? -1 : n) as Nth;
}

export function defaultForm(anchor: string, freq: Freq = "weekly"): RepeatForm {
  return {
    freq,
    interval: 1,
    weekdays: [wdOf(anchor)],
    monthly: { mode: "date" },
    end: { type: "never" },
  };
}

export function toRule(form: RepeatForm, anchor: string): string {
  const parts = [`FREQ=${FREQ_CODE[form.freq]}`];
  if (form.interval > 1) parts.push(`INTERVAL=${Math.floor(form.interval)}`);
  if (form.freq === "weekly") {
    const days = [...new Set(form.weekdays.length ? form.weekdays : [wdOf(anchor)])].sort();
    parts.push(`BYDAY=${days.map((d) => CODES[d]).join(",")}`);
  }
  if (form.freq === "monthly") {
    const m = form.monthly;
    if (m.mode === "date") parts.push(`BYMONTHDAY=${dayOfMonth(anchor)}`);
    if (m.mode === "nth") parts.push(`BYDAY=${m.nth}${CODES[m.weekday]}`);
    if (m.mode === "lastWeekday") parts.push("BYDAY=MO,TU,WE,TH,FR", "BYSETPOS=-1");
  }
  if (form.end.type === "until") parts.push(`UNTIL=${form.end.until.replaceAll("-", "")}T235959Z`);
  if (form.end.type === "count") parts.push(`COUNT=${Math.max(1, Math.floor(form.end.count))}`);
  return parts.join(";");
}

export function fromRule(rule: string, anchor: string): RepeatForm {
  const map = new Map(rule.split(";").map((p) => p.split("=") as [string, string]));
  const freq = (Object.keys(FREQ_CODE) as Freq[]).find((f) => FREQ_CODE[f] === map.get("FREQ")) ?? "weekly";
  const form = defaultForm(anchor, freq);
  form.interval = Number(map.get("INTERVAL") ?? 1);
  const byday = map.get("BYDAY");
  if (freq === "weekly" && byday) {
    form.weekdays = byday.split(",").map((c) => CODES.indexOf(c as (typeof CODES)[number]) as Wd);
  }
  if (freq === "monthly") {
    if (map.get("BYSETPOS") === "-1") form.monthly = { mode: "lastWeekday" };
    else if (byday) {
      const m = /^(-?\d)([A-Z]{2})$/.exec(byday);
      if (m) form.monthly = { mode: "nth", nth: Number(m[1]) as Nth, weekday: CODES.indexOf(m[2] as never) as Wd };
    }
  }
  const until = map.get("UNTIL");
  const count = map.get("COUNT");
  if (until) form.end = { type: "until", until: `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}` };
  else if (count) form.end = { type: "count", count: Number(count) };
  return form;
}

/** The one-tap choices, built from the task's date. */
export function presetRule(preset: Freq, anchor: string): string {
  return toRule(defaultForm(anchor, preset), anchor);
}

export function presetOf(rule: string | null, anchor: string): Preset {
  if (!rule) return "none";
  for (const f of ["daily", "weekly", "monthly", "yearly"] as Freq[]) if (rule === presetRule(f, anchor)) return f;
  return "custom";
}

function list(items: string[]): string {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Plain-English playback: "Every 2 weeks on Tuesday and Thursday, until 1 Mar". */
export function describe(rule: string, anchor: string, ref: string = anchor): string {
  const f = fromRule(rule, anchor);
  const every = f.interval > 1 ? `Every ${f.interval} ${UNIT[f.freq]}s` : `Every ${UNIT[f.freq]}`;
  let when = "";
  if (f.freq === "weekly") {
    const days = [...f.weekdays].sort();
    when = days.join() === "0,1,2,3,4" ? " on weekdays" : ` on ${list(days.map((d) => WEEKDAY_NAMES[d]))}`;
  }
  if (f.freq === "monthly") {
    const m = f.monthly;
    if (m.mode === "date") when = ` on the ${ordinalNumber(dayOfMonth(anchor))}`;
    if (m.mode === "nth") when = ` on the ${ORDINAL[m.nth]} ${WEEKDAY_NAMES[m.weekday]}`;
    if (m.mode === "lastWeekday") when = " on the last weekday";
  }
  if (f.freq === "yearly") when = ` on ${dayOfMonth(anchor)} ${MONTH_NAMES[monthIndex(anchor)]}`;
  let end = "";
  if (f.end.type === "until") end = `, until ${shortDate(f.end.until, ref)}`;
  if (f.end.type === "count") end = `, ${f.end.count} ${f.end.count === 1 ? "time" : "times"}`;
  return `${every}${when}${end}`;
}

export function ordinalNumber(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
}

/** The anchor a repeat counts from: the do date, or the due date if there's none. */
export const anchorOf = (task: Pick<Task, "doDate" | "dueDate">) => task.doDate ?? task.dueDate;

/**
 * The dates of the next occurrence when a repeating task is ticked done, or
 * null when the series has ended. Both dates move by the same gap. The next
 * one always lands after today: a task ticked late was standing in for today,
 * so a daily task doesn't leave a trail of overdue copies or a twin in Today.
 */
export function nextDates(
  task: Pick<Task, "doDate" | "dueDate" | "rrule" | "seriesStart">,
  today: string,
): { doDate: string | null; dueDate: string | null } | null {
  const anchor = anchorOf(task);
  if (!task.rrule || !anchor) return null;
  const rule = new RRule({ ...RRule.parseString(task.rrule), dtstart: toUTC(task.seriesStart ?? anchor) });
  const after = anchor >= today ? anchor : today;
  const next = rule.after(toUTC(after), false);
  if (!next) return null;
  const gap = diffDays(anchor, fromUTC(next));
  return {
    doDate: task.doDate ? addDays(task.doDate, gap) : null,
    dueDate: task.dueDate ? addDays(task.dueDate, gap) : null,
  };
}
