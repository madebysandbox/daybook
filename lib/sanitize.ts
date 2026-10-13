/* Checks every task read from storage or an imported file: both can be
 * hand-edited, so nothing is trusted as typed. */

import { isDay } from "./dates";
import type { Task, TaskLink } from "./types";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const day = (v: unknown) => (isDay(v) ? v : null);
const iso = (v: unknown, fallback: string) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : fallback;

function link(v: unknown): TaskLink | null {
  if (!v || typeof v !== "object") return null;
  const { url, label } = v as Record<string, unknown>;
  const u = str(url, 2000).trim();
  if (!/^https?:\/\//i.test(u)) return null;
  const l = str(label, 200).trim();
  return l ? { url: u, label: l } : { url: u };
}

export function sanitizeTask(v: unknown): Task | null {
  if (!v || typeof v !== "object") return null;
  const t = v as Record<string, unknown>;
  const id = str(t.id, 64);
  const title = str(t.title, 500).trim();
  if (!/^[\w-]{8,64}$/.test(id) || !title) return null;
  const now = new Date().toISOString();
  const rrule = str(t.rrule, 300);
  return {
    id,
    title,
    notes: str(t.notes, 20_000),
    links: (Array.isArray(t.links) ? t.links : [])
      .slice(0, 50)
      .map(link)
      .filter((l): l is TaskLink => l !== null),
    doDate: day(t.doDate),
    dueDate: day(t.dueDate),
    area: t.area === "home" ? "home" : "work",
    done: t.done === true,
    doneAt: t.done === true ? iso(t.doneAt, now) : null,
    rrule: /^FREQ=[A-Z0-9=;,-]+$/.test(rrule) ? rrule : null,
    seriesStart: day(t.seriesStart),
    createdAt: iso(t.createdAt, now),
    updatedAt: iso(t.updatedAt, now),
  };
}
