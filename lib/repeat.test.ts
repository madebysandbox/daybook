import type { RepeatForm } from "./repeat";
import { describe as describeRule, fromRule, nextDates, presetOf, presetRule, toRule } from "./repeat";

const TODAY = "2026-10-14"; // Wednesday

const series = (rrule: string, doDate: string, extra: { dueDate?: string | null; seriesStart?: string } = {}) => ({
  rrule,
  doDate,
  dueDate: extra.dueDate ?? null,
  seriesStart: extra.seriesStart ?? doDate,
});

describe("nextDates", () => {
  it("weekly: the same weekday next week", () => {
    expect(nextDates(series(presetRule("weekly", TODAY), TODAY), TODAY)).toEqual({
      doDate: "2026-10-21",
      dueDate: null,
    });
  });

  it("moves the due date by the same gap", () => {
    const t = series(presetRule("weekly", TODAY), TODAY, { dueDate: "2026-10-16" });
    expect(nextDates(t, TODAY)).toEqual({ doDate: "2026-10-21", dueDate: "2026-10-23" });
  });

  it("2nd Thursday of the month", () => {
    // 8 Oct 2026 is the 2nd Thursday; the next is 12 Nov.
    expect(nextDates(series("FREQ=MONTHLY;BYDAY=2TH", "2026-10-08"), "2026-10-08")).toEqual({
      doDate: "2026-11-12",
      dueDate: null,
    });
  });

  it("last weekday of the month", () => {
    // Oct 2026 ends on Saturday 31st, so the last weekday is Fri 30. Nov ends Mon 30.
    expect(nextDates(series("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1", "2026-10-30"), TODAY)?.doDate).toBe(
      "2026-11-30",
    );
  });

  it("ends after N times", () => {
    const rule = "FREQ=WEEKLY;BYDAY=WE;COUNT=2";
    const first = series(rule, TODAY);
    const second = nextDates(first, TODAY);
    expect(second?.doDate).toBe("2026-10-21");
    expect(nextDates({ ...first, doDate: "2026-10-21" }, "2026-10-21")).toBeNull();
  });

  it("ends on a date", () => {
    expect(nextDates(series("FREQ=WEEKLY;BYDAY=WE;UNTIL=20261020T235959Z", TODAY), TODAY)).toBeNull();
  });

  it("skips occurrences already in the past when ticked late", () => {
    // Daily from Mon 12, ticked on Wed 14: next is Thu 15, not Tue 13.
    expect(nextDates(series("FREQ=DAILY", "2026-10-12"), TODAY)?.doDate).toBe("2026-10-15");
  });

  it("works from a due date when there's no do date", () => {
    const t = { rrule: "FREQ=MONTHLY;BYMONTHDAY=20", doDate: null, dueDate: "2026-10-20", seriesStart: "2026-10-20" };
    expect(nextDates(t, TODAY)).toEqual({ doDate: null, dueDate: "2026-11-20" });
  });
});

describe("rules round-trip through the form", () => {
  const anchor = "2026-10-08";
  const forms: RepeatForm[] = [
    { freq: "weekly", interval: 2, weekdays: [1, 3], monthly: { mode: "date" }, end: { type: "never" } },
    {
      freq: "monthly",
      interval: 1,
      weekdays: [3],
      monthly: { mode: "nth", nth: 2, weekday: 3 },
      end: { type: "count", count: 6 },
    },
    {
      freq: "monthly",
      interval: 1,
      weekdays: [3],
      monthly: { mode: "lastWeekday" },
      end: { type: "until", until: "2027-03-01" },
    },
  ];
  it.each(forms)("%j", (form) => {
    expect(toRule(fromRule(toRule(form, anchor), anchor), anchor)).toBe(toRule(form, anchor));
  });
});

describe("presets and playback", () => {
  it("recognises its own presets", () => {
    expect(presetOf(presetRule("monthly", TODAY), TODAY)).toBe("monthly");
    expect(presetOf("FREQ=WEEKLY;INTERVAL=2;BYDAY=WE", TODAY)).toBe("custom");
    expect(presetOf(null, TODAY)).toBe("none");
  });
  it("reads back in plain English", () => {
    expect(describeRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;UNTIL=20270301T235959Z", TODAY)).toBe(
      "Every 2 weeks on Tuesday and Thursday, until 1 Mar 2027",
    );
    expect(describeRule("FREQ=MONTHLY;BYDAY=2TH", "2026-10-08")).toBe("Every month on the second Thursday");
    expect(describeRule("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1", TODAY)).toBe(
      "Every month on the last weekday",
    );
    expect(describeRule("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", TODAY)).toBe("Every week on weekdays");
  });
});
