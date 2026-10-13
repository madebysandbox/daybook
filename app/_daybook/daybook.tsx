"use client";

import { Segmented } from "@ds/segmented/segmented";
import { UndoBar } from "@ds/undo-bar/undo-bar";
import { CalendarDays, ListTodo, Plus, Settings } from "lucide-react";
import { MotionConfig } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { addDays, nextMonday, today as todayOf } from "@/lib/dates";
import type { AreaFilter } from "@/lib/placement";
import type { Task } from "@/lib/types";

import { Calendar } from "./calendar";
import { SettingsSheet } from "./settings-sheet";
import { type SheetAction, TaskSheet } from "./task-sheet";
import { Timeline } from "./timeline";
import { useEvents } from "./use-events";
import { blankTask, useTasks } from "./use-tasks";

type View = "timeline" | "calendar";

/* Per-device preferences (spec §2): filter, view, hide done. Browser storage
   is fine for these and only these; it can be unavailable, so every read and
   write is guarded and the defaults always work. */
function usePref<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    try {
      const v = localStorage.getItem(`daybook:${key}`);
      if (v) setValue(v as T);
    } catch {}
  }, [key]);
  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(`daybook:${key}`, v);
      } catch {}
    },
    [key],
  );
  return [value, set];
}

export function Daybook() {
  const api = useTasks();
  const events = useEvents();
  const [area, setArea] = usePref<AreaFilter>("area", "all");
  const [view, setView] = usePref<View>("view", "timeline");
  const [hideDone, setHideDone] = usePref<"yes" | "no">("hide-done", "no");
  const today = todayOf();
  const [month, setMonth] = useState(today);
  const [selected, setSelected] = useState(today);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; original: Task | null; draft: Task }>(() => ({
    open: false,
    original: null,
    draft: blankTask(),
  }));

  const openTask = useCallback((task: Task) => setSheet({ open: true, original: task, draft: task }), []);
  const addTask = useCallback(
    (doDate: string | null) =>
      setSheet({ open: true, original: null, draft: blankTask({ doDate, area: area === "all" ? "work" : area }) }),
    [area],
  );

  const closeSheet = (draft: Task) => {
    api.commit(sheet.original, draft);
    setSheet((s) => ({ ...s, open: false }));
  };

  const sheetAction = (action: SheetAction, draft: Task) => {
    const original = sheet.original;
    setSheet((s) => ({ ...s, open: false }));
    if (!original) return;
    if (action === "delete") return api.remove(original);
    // Keep any edits made in the sheet, then do the thing.
    const edited = { ...draft, title: draft.title.trim() || original.title };
    if (action === "tomorrow") return api.commit(original, { ...edited, doDate: addDays(todayOf(), 1) });
    if (action === "next-week") return api.commit(original, { ...edited, doDate: nextMonday(todayOf()) });
    if (action === "duplicate") {
      api.commit(original, edited);
      api.duplicate(edited);
    }
  };

  /* Keyboard (spec §3a): n new, ⌘/Ctrl+Z undo. Row keys live on the row. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.closest("input, textarea, select, [contenteditable]") !== null;
      if (typing || sheet.open || settingsOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        api.undo();
      } else if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        addTask(view === "calendar" ? selected : todayOf());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api.undo, addTask, sheet.open, settingsOpen, view, selected]);

  const shared = { api, events, area, hideDone: hideDone === "yes", onOpen: openTask, onAdd: addTask };

  return (
    <MotionConfig reducedMotion="user">
      <div data-slot="daybook" className="mx-auto min-h-dvh max-w-6xl lg:border-x lg:border-border">
        <header
          data-slot="app-header"
          className="sticky top-0 z-30 flex flex-col gap-2 border-b border-border bg-canvas px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3"
        >
          <div className="flex items-center gap-3">
            <h1 className="mr-auto text-sm font-medium uppercase tracking-wide">Daybook</h1>
            <Segmented<View>
              label="View"
              className="w-56 lg:hidden"
              value={view}
              onChange={setView}
              options={[
                {
                  value: "timeline",
                  label: (
                    <>
                      <ListTodo className="size-(--size-xs)" aria-hidden /> List
                    </>
                  ),
                },
                {
                  value: "calendar",
                  label: (
                    <>
                      <CalendarDays className="size-(--size-xs)" aria-hidden /> Month
                    </>
                  ),
                },
              ]}
            />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="motion-press -mr-2 flex size-(--size-2xl) items-center justify-center text-muted-foreground hover:text-canvas-foreground lg:size-(--size-xl)"
            >
              <Settings className="size-(--size-sm)" aria-hidden />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Segmented<AreaFilter>
              label="Show"
              className="flex-1 lg:max-w-sm"
              value={area}
              onChange={setArea}
              options={[
                { value: "all", label: "All" },
                { value: "work", label: "Work" },
                { value: "home", label: "Home" },
              ]}
            />
            <button
              type="button"
              aria-pressed={hideDone === "yes"}
              onClick={() => setHideDone(hideDone === "yes" ? "no" : "yes")}
              className="motion-hover h-(--size-lg) shrink-0 border border-border px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:border-canvas-foreground hover:text-canvas-foreground aria-pressed:border-canvas-foreground aria-pressed:bg-canvas-foreground aria-pressed:text-canvas"
            >
              Hide done
            </button>
          </div>
          {api.storageFailed ? (
            <p role="alert" className="text-xs text-destructive-subdued-foreground">
              This browser isn't letting Daybook save. Changes will be lost when you close the page.
            </p>
          ) : null}
          {events.status === "failed" ? (
            <p role="status" className="text-xs text-muted-foreground">
              Your calendar couldn't load. Tasks are fine.
            </p>
          ) : null}
        </header>

        {!api.ready ? (
          <p role="status" className="px-4 py-6 text-sm text-muted-foreground">
            Loading your tasks…
          </p>
        ) : null}
        <main className={`${api.ready ? "lg:grid" : "hidden"} lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]`}>
          <section
            aria-label="Month"
            className={`${view === "calendar" ? "" : "hidden"} lg:sticky lg:top-24 lg:block lg:h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:border-r lg:border-border`}
          >
            <Calendar
              {...shared}
              month={month}
              onMonth={setMonth}
              selected={selected}
              onSelect={(d) => {
                setSelected(d);
                document.getElementById(`day-${d}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
              }}
            />
          </section>
          <section aria-label="Day by day" className={`${view === "timeline" ? "" : "hidden"} lg:block`}>
            <Timeline {...shared} />
          </section>
        </main>

        <button
          type="button"
          onClick={() => addTask(view === "calendar" ? selected : null)}
          aria-label="New task"
          title="New task (n)"
          className="motion-press fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-30 flex size-14 items-center justify-center bg-canvas-foreground text-canvas shadow-md lg:right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] lg:bottom-8"
        >
          <Plus className="size-(--size-md)" aria-hidden />
        </button>

        <UndoBar
          message={api.message}
          onUndo={api.canUndo ? api.undo : api.dismiss}
          actionLabel={api.canUndo ? "Undo" : "OK"}
        />

        <TaskSheet
          open={sheet.open}
          original={sheet.original}
          draft={sheet.draft}
          onClose={closeSheet}
          onAction={sheetAction}
        />
        <SettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          tasks={api.tasks}
          onImport={api.replaceAll}
          onCalendarsChanged={() => events.reload(today)}
        />
      </div>
    </MotionConfig>
  );
}
