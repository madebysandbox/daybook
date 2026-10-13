/* Reading an iCloud .ics feed (spec §3). Pure: text in, events out for a
 * range, with repeating events expanded and their exceptions applied. */

import ICAL from "ical.js";

import type { CalEvent } from "./types";

/** Guard against a runaway rule (e.g. a daily event since 2009). */
const MAX_STEPS = 20_000;

type ICALTime = InstanceType<typeof ICAL.Time>;

function bound(t: ICALTime): string {
  return t.isDate ? t.toString().slice(0, 10) : t.toJSDate().toISOString();
}

function overlaps(start: ICALTime, end: ICALTime, from: string, to: string): boolean {
  // Compare as instants; an all-day day starts at its UTC midnight, which is
  // close enough for a range filter padded by a day either side.
  const s = start.isDate ? `${start.toString().slice(0, 10)}T00:00:00Z` : start.toJSDate().toISOString();
  const e = end.isDate ? `${end.toString().slice(0, 10)}T00:00:00Z` : end.toJSDate().toISOString();
  return s < `${to}T23:59:59Z` && e > `${from}T00:00:00Z`;
}

/** Normalise the link people paste: webcal:// is just https://. */
export const feedUrl = (raw: string) => raw.trim().replace(/^webcals?:\/\//i, "https://");

/** Events overlapping [from, to] (days, inclusive). */
export function parseIcs(text: string, from: string, to: string): CalEvent[] {
  const root = new ICAL.Component(ICAL.parse(text));
  for (const tz of root.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(tz);

  const masters = new Map<string, InstanceType<typeof ICAL.Event>>();
  const exceptions: InstanceType<typeof ICAL.Event>[] = [];
  for (const ve of root.getAllSubcomponents("vevent")) {
    const ev = new ICAL.Event(ve);
    if (ev.isRecurrenceException()) exceptions.push(ev);
    else masters.set(ev.uid, ev);
  }
  const orphans: InstanceType<typeof ICAL.Event>[] = [];
  for (const ex of exceptions) {
    const master = masters.get(ex.uid);
    if (master) master.relateException(ex);
    else orphans.push(ex);
  }

  const out: CalEvent[] = [];
  const push = (uid: string, title: string, start: ICALTime, end: ICALTime) => {
    if (!overlaps(start, end, from, to)) return;
    out.push({
      id: `${uid}@${bound(start)}`,
      title: title || "Busy",
      start: bound(start),
      end: bound(end),
      allDay: start.isDate,
    });
  };
  const endOf = (ev: InstanceType<typeof ICAL.Event>) => {
    if (ev.endDate) return ev.endDate;
    const e = ev.startDate.clone();
    if (e.isDate) e.day += 1;
    return e;
  };

  for (const ev of [...masters.values(), ...orphans]) {
    if (!ev.startDate) continue;
    if (!ev.isRecurring()) {
      push(ev.uid, ev.summary, ev.startDate, endOf(ev));
      continue;
    }
    const it = ev.iterator();
    const stop = `${to}T23:59:59Z`;
    for (let i = 0, next = it.next(); next && i < MAX_STEPS; i++, next = it.next()) {
      const det = ev.getOccurrenceDetails(next);
      if (bound(det.startDate) > stop) break;
      push(ev.uid, det.item.summary, det.startDate, det.endDate);
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}
