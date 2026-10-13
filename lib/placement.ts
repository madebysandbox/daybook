/* Where a task shows up (spec §2, timeline). Pure, so it's unit-tested. */

import { addDays, diffDays, relativeDay } from "./dates";
import type { Area, Task } from "./types";

export type AreaFilter = Area | "all";

export type Placed = { task: Task; rolledFrom: string | null };
export type TimelineDay = { date: string; items: Placed[] };
export type Timeline = { unplanned: Task[]; days: TimelineDay[] };

/** Days always shown, today included, even when empty. */
export const ALWAYS_SHOWN = 14;

const byDueThenCreated = (a: Task, b: Task) =>
  (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.createdAt.localeCompare(b.createdAt);

function order(items: Placed[]): Placed[] {
  return [...items].sort((a, b) => Number(a.task.done) - Number(b.task.done) || byDueThenCreated(a.task, b.task));
}

/** The day a task sits on in the timeline, or null for the Unplanned tray / hidden. */
export function placeOf(task: Task, today: string): { date: string; rolledFrom: string | null } | "unplanned" | null {
  if (!task.doDate) return task.done ? null : "unplanned";
  if (task.doDate >= today) return { date: task.doDate, rolledFrom: null };
  // In the past: open tasks roll to today; done ones are history.
  return task.done ? null : { date: today, rolledFrom: task.doDate };
}

export function buildTimeline(
  tasks: Task[],
  today: string,
  { area = "all", hideDone = false }: { area?: AreaFilter; hideDone?: boolean } = {},
): Timeline {
  const unplanned: Task[] = [];
  const byDay = new Map<string, Placed[]>();
  for (let i = 0; i < ALWAYS_SHOWN; i++) byDay.set(addDays(today, i), []);

  for (const task of tasks) {
    if (area !== "all" && task.area !== area) continue;
    if (hideDone && task.done) continue;
    const place = placeOf(task, today);
    if (place === null) continue;
    if (place === "unplanned") {
      unplanned.push(task);
      continue;
    }
    const list = byDay.get(place.date) ?? [];
    list.push({ task, rolledFrom: place.rolledFrom });
    byDay.set(place.date, list);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items: order(items) }));

  return { unplanned: unplanned.sort(byDueThenCreated), days };
}

export type DueState = "later" | "soon" | "today" | "overdue";

/** The due tag: neutral beyond 2 days, amber within 2, red on the day or after. */
export function dueTag(task: Pick<Task, "dueDate" | "done">, today: string): { state: DueState; label: string } | null {
  if (!task.dueDate) return null;
  const d = diffDays(today, task.dueDate);
  const label = `due ${relativeDay(task.dueDate, today)}`;
  if (task.done) return { state: "later", label };
  if (d < 0) return { state: "overdue", label };
  if (d === 0) return { state: "today", label };
  if (d <= 2) return { state: "soon", label };
  return { state: "later", label };
}
