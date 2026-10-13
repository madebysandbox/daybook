"use client";

import { SectionLabel } from "@ds/field/field";
import { Plus } from "lucide-react";

import { dayLabel, diffDays, today as todayOf } from "@/lib/dates";
import { type AreaFilter, buildTimeline } from "@/lib/placement";
import type { Task } from "@/lib/types";

import { EventLine } from "./event-line";
import { TaskRow } from "./task-row";
import { type EventsApi, useEnsureMonths } from "./use-events";
import type { TasksApi } from "./use-tasks";

/* The default view (spec §2): Unplanned, then Today, then each day. Compact,
   like Reminders; an empty day is one thin line. */
export function Timeline({
  api,
  events,
  area,
  hideDone,
  onOpen,
  onAdd,
}: {
  api: TasksApi;
  events: EventsApi;
  area: AreaFilter;
  hideDone: boolean;
  onOpen: (task: Task) => void;
  onAdd: (doDate: string | null) => void;
}) {
  const today = todayOf();
  const { unplanned, days } = buildTimeline(api.tasks, today, { area, hideDone });
  useEnsureMonths(
    events,
    days.map((d) => d.date),
  );

  const row = (task: Task, rolledFrom: string | null = null) => (
    <TaskRow
      key={task.id}
      task={task}
      today={today}
      rolledFrom={rolledFrom}
      showArea={area === "all"}
      state={api.saving[task.id]}
      onToggle={(done) => api.setDone(task, done)}
      onTomorrow={() => api.tomorrow(task)}
      onOpen={() => onOpen(task)}
      onRetry={() => api.retry(task.id)}
      onDelete={() => api.remove(task)}
    />
  );

  return (
    <div data-slot="timeline" className="pb-32">
      {api.tasks.length === 0 ? (
        <section data-slot="welcome" className="flex flex-col gap-2 border-b border-border px-4 py-5">
          <h2 className="text-2xl leading-tight font-light tracking-tight">Plan your days, one task at a time.</h2>
          <p className="text-sm text-muted-foreground">
            Give a task a day to do it and, if it has one, a deadline. Swipe right to tick it off, left to move it to
            tomorrow. Unfinished tasks roll forward to today. Everything stays in this browser: no account, no server.
          </p>
          <div>
            <button
              type="button"
              onClick={() => onAdd(todayOf())}
              className="motion-press mt-2 h-(--size-xl) border border-canvas-foreground bg-canvas-foreground px-4 text-sm font-medium text-canvas"
            >
              Add your first task
            </button>
          </div>
        </section>
      ) : null}
      {unplanned.length ? (
        <section
          aria-labelledby="unplanned"
          data-slot="timeline-unplanned"
          className="border-b border-border bg-muted/40"
        >
          <header className="flex h-(--size-xl) items-center justify-between px-4">
            <h2 id="unplanned">
              <SectionLabel>Unplanned · {unplanned.length}</SectionLabel>
            </h2>
          </header>
          <ul>{unplanned.map((t) => row(t))}</ul>
        </section>
      ) : null}

      {days.map(({ date, items }) => {
        const dayEvents = events.on(date);
        const isToday = date === today;
        const empty = !items.length && !dayEvents.length;
        const gap = diffDays(today, date);
        const label = isToday ? "Today" : gap === 1 ? "Tomorrow" : null;
        return (
          <section
            key={date}
            id={`day-${date}`}
            aria-label={`${label ?? ""} ${dayLabel(date)}`.trim()}
            data-slot="timeline-day"
            data-today={isToday || undefined}
            className="scroll-mt-28"
          >
            <header
              className={`group flex items-center gap-3 border-b border-border px-4 ${empty ? "h-(--size-lg)" : "h-(--size-xl)"}`}
            >
              <h2 className="flex items-baseline gap-2">
                {isToday ? (
                  <span className="bg-canvas-foreground px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-canvas">
                    Today
                  </span>
                ) : label ? (
                  <SectionLabel className="text-canvas-foreground">{label}</SectionLabel>
                ) : null}
                <span
                  className={`text-xs font-medium uppercase tracking-wide tabular-nums ${empty ? "text-muted-foreground" : isToday || label ? "text-muted-foreground" : "text-canvas-foreground"}`}
                >
                  {dayLabel(date)}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => onAdd(date)}
                aria-label={`Add a task on ${dayLabel(date)}`}
                className="motion-hover -mr-2 ml-auto flex size-(--size-lg) items-center justify-center text-muted-foreground opacity-60 hover:text-canvas-foreground hover:opacity-100 focus-visible:opacity-100"
              >
                <Plus className="size-(--size-xs)" aria-hidden />
              </button>
            </header>
            {dayEvents.length ? (
              <ul data-slot="timeline-events" className="border-b border-border py-1">
                {dayEvents.map((e) => (
                  <EventLine key={e.id} event={e} day={date} />
                ))}
              </ul>
            ) : null}
            {items.length ? <ul>{items.map((p) => row(p.task, p.rolledFrom))}</ul> : null}
            {isToday && !items.length && !dayEvents.length ? (
              <p className="border-b border-border px-4 py-4 text-sm text-muted-foreground">
                Nothing planned for today.{" "}
                <button
                  type="button"
                  onClick={() => onAdd(date)}
                  className="text-canvas-foreground underline underline-offset-4"
                >
                  Add something
                </button>
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
