import { feedUrl, parseIcs } from "./ics";

/* A trimmed iCloud-style feed: a London time zone, a one-off timed event, an
 * all-day event spanning two days, and a weekly event with one moved and one
 * cancelled occurrence. */
const FEED = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Apple Inc.//macOS 15//EN
BEGIN:VTIMEZONE
TZID:Europe/London
BEGIN:DAYLIGHT
TZOFFSETFROM:+0000
TZOFFSETTO:+0100
TZNAME:BST
DTSTART:19810329T010000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0100
TZOFFSETTO:+0000
TZNAME:GMT
DTSTART:19961027T020000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:dentist
DTSTART;TZID=Europe/London:20261015T093000
DTEND;TZID=Europe/London:20261015T100000
SUMMARY:Dentist
END:VEVENT
BEGIN:VEVENT
UID:trip
DTSTART;VALUE=DATE:20261017
DTEND;VALUE=DATE:20261019
SUMMARY:Bath weekend
END:VEVENT
BEGIN:VEVENT
UID:fives
DTSTART;TZID=Europe/London:20261006T190000
DTEND;TZID=Europe/London:20261006T200000
RRULE:FREQ=WEEKLY;BYDAY=TU
EXDATE;TZID=Europe/London:20261027T190000
SUMMARY:Five-a-side
END:VEVENT
BEGIN:VEVENT
UID:fives
RECURRENCE-ID;TZID=Europe/London:20261020T190000
DTSTART;TZID=Europe/London:20261021T183000
DTEND;TZID=Europe/London:20261021T193000
SUMMARY:Five-a-side (moved)
END:VEVENT
END:VCALENDAR`;

describe("parseIcs", () => {
  const events = parseIcs(FEED, "2026-10-12", "2026-11-08");
  const titled = (t: string) => events.filter((e) => e.title === t);

  it("reads a timed event in London time as the right instant", () => {
    // 09:30 BST on 15 Oct is 08:30 UTC.
    expect(titled("Dentist")).toEqual([
      {
        id: "dentist@2026-10-15T08:30:00.000Z",
        title: "Dentist",
        start: "2026-10-15T08:30:00.000Z",
        end: "2026-10-15T09:00:00.000Z",
        allDay: false,
      },
    ]);
  });

  it("keeps all-day events as days, end exclusive", () => {
    expect(titled("Bath weekend")[0]).toMatchObject({ start: "2026-10-17", end: "2026-10-19", allDay: true });
  });

  it("expands a weekly event across a clock change, skipping EXDATEs and applying moves", () => {
    expect(titled("Five-a-side").map((e) => e.start)).toEqual([
      "2026-10-13T18:00:00.000Z", // BST
      "2026-11-03T19:00:00.000Z", // GMT after 25 Oct
    ]);
    expect(titled("Five-a-side (moved)").map((e) => e.start)).toEqual(["2026-10-21T17:30:00.000Z"]);
  });

  it("leaves out events outside the range", () => {
    expect(parseIcs(FEED, "2026-12-01", "2026-12-07").filter((e) => e.title !== "Five-a-side")).toEqual([]);
  });
});

describe("feedUrl", () => {
  it("turns webcal links into https", () => {
    expect(feedUrl(" webcal://p52-caldav.icloud.com/published/2/abc ")).toBe(
      "https://p52-caldav.icloud.com/published/2/abc",
    );
  });
});
