import { buildTimeline, dueTag, placeOf } from "./placement";
import type { Task } from "./types";

const TODAY = "2026-10-14"; // a Wednesday

let n = 0;
const task = (over: Partial<Task> = {}): Task => ({
  id: `t${n++}`,
  title: "Task",
  notes: "",
  links: [],
  doDate: null,
  dueDate: null,
  area: "work",
  done: false,
  doneAt: null,
  rrule: null,
  seriesStart: null,
  createdAt: `2026-10-01T09:00:0${n % 10}Z`,
  updatedAt: "2026-10-01T09:00:00Z",
  ...over,
});

describe("placeOf", () => {
  it("puts a task with no do date in Unplanned", () => {
    expect(placeOf(task(), TODAY)).toBe("unplanned");
  });
  it("hides a done task with no do date", () => {
    expect(placeOf(task({ done: true }), TODAY)).toBeNull();
  });
  it("places a task on its do date", () => {
    expect(placeOf(task({ doDate: "2026-10-16" }), TODAY)).toEqual({ date: "2026-10-16", rolledFrom: null });
  });
  it("rolls an open past task to today, remembering where it came from", () => {
    expect(placeOf(task({ doDate: "2026-10-12" }), TODAY)).toEqual({ date: TODAY, rolledFrom: "2026-10-12" });
  });
  it("leaves a done past task as history", () => {
    expect(placeOf(task({ doDate: "2026-10-12", done: true }), TODAY)).toBeNull();
  });
  it("keeps a task done today on today", () => {
    expect(placeOf(task({ doDate: TODAY, done: true }), TODAY)).toEqual({ date: TODAY, rolledFrom: null });
  });
});

describe("buildTimeline", () => {
  const tasks = [
    task({ title: "unplanned" }),
    task({ title: "rolled", doDate: "2026-10-10" }),
    task({ title: "today done", doDate: TODAY, done: true }),
    task({ title: "today open", doDate: TODAY, area: "home" }),
    task({ title: "far", doDate: "2026-12-25" }),
  ];

  it("always shows 14 days from today, plus later days with tasks", () => {
    const t = buildTimeline(tasks, TODAY);
    expect(t.days).toHaveLength(15);
    expect(t.days[0].date).toBe(TODAY);
    expect(t.days[13].date).toBe("2026-10-27");
    expect(t.days[14].date).toBe("2026-12-25");
  });

  it("lists open tasks before done ones", () => {
    const titles = buildTimeline(tasks, TODAY).days[0].items.map((p) => p.task.title);
    expect(titles).toEqual(["rolled", "today open", "today done"]);
  });

  it("filters by area and hides done", () => {
    const t = buildTimeline(tasks, TODAY, { area: "home", hideDone: true });
    expect(t.days[0].items.map((p) => p.task.title)).toEqual(["today open"]);
    expect(t.unplanned).toHaveLength(0);
  });
});

describe("dueTag", () => {
  it("is neutral more than two days out", () => {
    expect(dueTag({ dueDate: "2026-10-20", done: false }, TODAY)).toEqual({ state: "later", label: "due Tue" });
  });
  it("is amber within two days", () => {
    expect(dueTag({ dueDate: "2026-10-16", done: false }, TODAY)?.state).toBe("soon");
    expect(dueTag({ dueDate: "2026-10-15", done: false }, TODAY)?.label).toBe("due tomorrow");
  });
  it("is red on the day and after", () => {
    expect(dueTag({ dueDate: TODAY, done: false }, TODAY)?.state).toBe("today");
    expect(dueTag({ dueDate: "2026-10-01", done: false }, TODAY)).toEqual({ state: "overdue", label: "due 1 Oct" });
  });
  it("calms down once the task is done", () => {
    expect(dueTag({ dueDate: "2026-10-01", done: true }, TODAY)?.state).toBe("later");
  });
});
