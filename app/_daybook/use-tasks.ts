"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addDays, nextMonday, relativeDay, today as todayOf } from "@/lib/dates";
import { load, STORAGE_KEY, save } from "@/lib/local-store";
import { nextDates } from "@/lib/repeat";
import type { Task } from "@/lib/types";

/* The app's task state, kept in this browser. Every change shows at once and
 * is written to storage straight after. Each change is recorded as
 * before/after pairs so it can be undone. */

type Op = { before: Task | null; after: Task | null };
type Entry = { label: string; ops: Op[] };

export type SaveState = "saving" | "failed";

const UNDO_DEPTH = 10;
const MESSAGE_MS = 8000;

export const newId = () => crypto.randomUUID();

export function blankTask(over: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: "",
    notes: "",
    links: [],
    doDate: null,
    dueDate: null,
    area: "work",
    done: false,
    doneAt: null,
    rrule: null,
    seriesStart: null,
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

const stamp = (t: Task): Task => ({ ...t, updatedAt: new Date().toISOString() });

export function useTasks(initial: Task[] = []) {
  const [tasks, setTasks] = useState<Map<string, Task>>(() => new Map(initial.map((t) => [t.id, t])));
  const [message, setMessage] = useState<string | null>(null);
  const [depth, setDepth] = useState(0);
  const undoStack = useRef<Entry[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((text: string | null) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    if (text) timer.current = setTimeout(() => setMessage(null), MESSAGE_MS);
  }, []);

  /* Load once on this device, then write every change back. */
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    setTasks(new Map(load().tasks.map((t) => [t.id, t])));
    setReady(true);
    // Another tab changed things: pick them up.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setTasks(new Map(load().tasks.map((t) => [t.id, t])));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (ready) setStorageFailed(!save({ tasks: [...tasks.values()] }));
  }, [tasks, ready]);

  const apply = useCallback(
    (label: string | null, ops: Op[], { record = true } = {}) => {
      if (!ops.length) return;
      setTasks((prev) => {
        const next = new Map(prev);
        for (const o of ops) {
          if (o.after) next.set(o.after.id, o.after);
          else if (o.before) next.delete(o.before.id);
        }
        return next;
      });
      if (record && label) {
        undoStack.current = [...undoStack.current, { label, ops }].slice(-UNDO_DEPTH);
        setDepth(undoStack.current.length);
      }
      if (label) say(label);
    },
    [say],
  );

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) {
      say(null);
      return;
    }
    apply(null, entry.ops.map((o) => ({ before: o.after, after: o.before })).reverse(), { record: false });
    setDepth(undoStack.current.length);
    say("Undone");
  }, [apply, say]);

  /* ---- The things a person does ---- */

  const setDone = useCallback(
    (task: Task, done: boolean) => {
      const today = todayOf();
      const after = stamp({ ...task, done, doneAt: done ? new Date().toISOString() : null });
      const ops: Op[] = [{ before: task, after }];
      let label = done ? `Done: ${task.title}` : `Not done: ${task.title}`;
      if (done && task.rrule) {
        const next = nextDates(task, today);
        if (next) {
          const copy = blankTask({
            ...task,
            ...next,
            id: newId(),
            done: false,
            doneAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          ops.push({ before: null, after: copy });
          const on = copy.doDate ?? copy.dueDate;
          if (on) label = `Done. Next one ${relativeDay(on, today)}`;
        } else label = "Done. That was the last one";
      }
      apply(label, ops);
    },
    [apply],
  );

  const moveTo = useCallback(
    (task: Task, date: string | null) => {
      if (task.doDate === date) return;
      const today = todayOf();
      apply(date ? `Moved to ${relativeDay(date, today)}` : "Moved to Unplanned", [
        { before: task, after: stamp({ ...task, doDate: date }) },
      ]);
    },
    [apply],
  );

  const tomorrow = useCallback((task: Task) => moveTo(task, addDays(todayOf(), 1)), [moveTo]);
  const nextWeek = useCallback((task: Task) => moveTo(task, nextMonday(todayOf())), [moveTo]);

  const remove = useCallback((task: Task) => apply(`Deleted: ${task.title}`, [{ before: task, after: null }]), [apply]);

  const duplicate = useCallback(
    (task: Task) => {
      const now = new Date().toISOString();
      const copy: Task = { ...task, id: newId(), done: false, doneAt: null, createdAt: now, updatedAt: now };
      apply(`Duplicated: ${task.title}`, [{ before: null, after: copy }]);
      return copy;
    },
    [apply],
  );

  /** From the sheet: a new task, or an edited one. */
  const commit = useCallback(
    (before: Task | null, after: Task) => {
      if (!after.title.trim()) return;
      if (before && JSON.stringify(before) === JSON.stringify(after)) return;
      apply(before ? "Saved changes" : `Added: ${after.title.trim()}`, [
        { before, after: stamp({ ...after, title: after.title.trim() }) },
      ]);
    },
    [apply],
  );

  return {
    tasks: [...tasks.values()],
    get: (id: string) => tasks.get(id),
    saving: {} as Record<string, SaveState>,
    ready,
    storageFailed,
    replaceAll: (list: Task[]) => {
      undoStack.current = [];
      setDepth(0);
      setTasks(new Map(list.map((t) => [t.id, t])));
    },
    message,
    canUndo: depth > 0,
    undo,
    dismiss: () => say(null),
    retry: (_id: string) => {},
    setDone,
    moveTo,
    tomorrow,
    nextWeek,
    remove,
    duplicate,
    commit,
  };
}

export type TasksApi = ReturnType<typeof useTasks>;
