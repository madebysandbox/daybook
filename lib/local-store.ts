/* Everything Daybook keeps lives in this browser, under one key (no
 * accounts, no database). Read defensively: storage can be missing, blocked
 * or hand-edited, so every task is checked on the way in. */

import { sanitizeTask } from "./sanitize";
import type { Task } from "./types";

const KEY = "daybook:v1";

export type Saved = { tasks: Task[]; icsUrls: string[] };

const EMPTY: Saved = { tasks: [], icsUrls: [] };

export function parseSaved(raw: unknown): Saved {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Record<string, unknown>;
  const tasks = (Array.isArray(r.tasks) ? r.tasks : []).map(sanitizeTask).filter((t): t is Task => t !== null);
  const icsUrls = (Array.isArray(r.icsUrls) ? r.icsUrls : [])
    .filter((u): u is string => typeof u === "string")
    .slice(0, 5);
  return { tasks, icsUrls };
}

export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseSaved(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** False when the browser refuses (full, or storage blocked). */
export function save(patch: Partial<Saved>): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...load(), ...patch }));
    return true;
  } catch {
    return false;
  }
}

export const STORAGE_KEY = KEY;
