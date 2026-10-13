import { allowedFeed } from "./feed-policy";
import { parseSaved } from "./local-store";

describe("allowedFeed", () => {
  it("accepts iCloud public calendar links, webcal or https", () => {
    expect(allowedFeed("webcal://p52-caldav.icloud.com/published/2/abc")?.href).toBe(
      "https://p52-caldav.icloud.com/published/2/abc",
    );
  });
  it.each([
    "https://example.com/cal.ics",
    "http://p52-caldav.icloud.com/published/2/abc",
    "https://icloud.com.evil.example/cal.ics",
    "https://evilicloud.com/cal.ics",
    "https://localhost/cal.ics",
    "not a url",
  ])("refuses %s", (u) => {
    expect(allowedFeed(u)).toBeNull();
  });
});

describe("parseSaved", () => {
  it("keeps valid tasks and drops broken ones", () => {
    const saved = parseSaved({
      tasks: [
        {
          id: "abcdefgh-1234",
          title: "Buy milk",
          area: "home",
          doDate: "2026-10-14",
          links: [{ url: "javascript:alert(1)" }],
        },
        { id: "short", title: "No good id" },
        { id: "abcdefgh-5678", title: "" },
        "nonsense",
      ],
      icsUrls: ["https://p1-caldav.icloud.com/x", 42],
    });
    expect(saved.tasks.map((t) => t.title)).toEqual(["Buy milk"]);
    expect(saved.tasks[0].links).toEqual([]);
    expect(saved.icsUrls).toEqual(["https://p1-caldav.icloud.com/x"]);
  });
  it("survives garbage", () => {
    expect(parseSaved(null)).toEqual({ tasks: [], icsUrls: [] });
    expect(parseSaved("x")).toEqual({ tasks: [], icsUrls: [] });
  });
});
