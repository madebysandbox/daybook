"use client";

import { AreaDot } from "@ds/area-dot/area-dot";
import { Button } from "@ds/button/button";
import { SectionLabel } from "@ds/field/field";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  addMonths,
  dayLabel,
  dayOfMonth,
  MONTH_NAMES,
  monthGrid,
  monthIndex,
  today as todayOf,
  year,
} from "@/lib/dates";
import type { AreaFilter } from "@/lib/placement";
import type { Task } from "@/lib/types";

import { EventLine } from "./event-line";
import { TaskRow } from "./task-row";
import { type EventsApi, useEnsureMonths } from "./use-events";
import type { TasksApi } from "./use-tasks";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const count = (n: number, noun: string) => (n ? `, ${n} ${noun}${n === 1 ? "" : "s"}` : "");

/* A month grid (spec §2): tasks by do date, a mark for anything due, and
   iCloud events behind them. Tap a day to see it underneath. */
export function Calendar({
  api,
  events,
  area,
  hideDone,
  month,
  onMonth,
  selected,
  onSelect,
  onOpen,
  onAdd,
}: {
  api: TasksApi;
  events: EventsApi;
  area: AreaFilter;
  hideDone: boolean;
  month: string;
  onMonth: (m: string) => void;
  selected: string;
  onSelect: (d: string) => void;
  onOpen: (task: Task) => void;
  onAdd: (doDate: string | null) => void;
}) {
  const today = todayOf();
  const grid = monthGrid(month);
  useEnsureMonths(events, [month]);

  const visible = api.tasks.filter((t) => (area === "all" || t.area === area) && !(hideDone && t.done));
  const doing = (d: string) => visible.filter((t) => t.doDate === d);
  const due = (d: string) => visible.filter((t) => t.dueDate === d && t.doDate !== d && !t.done);

  const dayTasks = doing(selected).sort((a, b) => Number(a.done) - Number(b.done));
  const dayDue = due(selected);
  const dayEvents = events.on(selected);

  return (
    <div data-slot="calendar">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <h2 className="mr-auto text-3xl leading-tight font-light tracking-tight">
          {MONTH_NAMES[monthIndex(month)]} <span className="text-muted-foreground">{year(month)}</span>
        </h2>
        <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => onMonth(addMonths(month, -1))}>
          <ChevronLeft className="size-(--size-sm)" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onMonth(today);
            onSelect(today);
          }}
        >
          Today
        </Button>
        <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => onMonth(addMonths(month, 1))}>
          <ChevronRight className="size-(--size-sm)" aria-hidden />
        </Button>
      </div>

      <div className="border-t border-l border-border">
        <div className="grid grid-cols-7" aria-hidden>
          {WEEK.map((w, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed weekday header
              key={i}
              className="border-r border-b border-border py-1 text-center text-xs font-medium tracking-wide text-muted-foreground"
            >
              {w}
            </div>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((w) => (
          <div key={w} className="grid grid-cols-7">
            {grid.slice(w * 7, w * 7 + 7).map((d) => {
              const inMonth = monthIndex(d) === monthIndex(month);
              const tasks = doing(d);
              const hasDue = due(d).length > 0;
              const evs = events.on(d);
              const isToday = d === today;
              const isSel = d === selected;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`${dayLabel(d)}${count(tasks.length, "task")}${hasDue ? ", something due" : ""}${count(evs.length, "event")}`}
                  onClick={() => onSelect(d)}
                  className={[
                    "motion-hover relative flex min-h-14 flex-col items-stretch gap-1 border-r border-b border-border p-1 text-left lg:min-h-20",
                    inMonth ? "" : "text-muted-foreground/60",
                    isSel ? "bg-muted" : "hover:bg-muted/50",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={`flex size-6 items-center justify-center text-xs tabular-nums ${isToday ? "bg-canvas-foreground font-medium text-canvas" : ""}`}
                    >
                      {dayOfMonth(d)}
                    </span>
                    {hasDue ? <span aria-hidden className="size-1.5 bg-destructive-subdued-foreground" /> : null}
                  </span>
                  {/* Phone: dots. Laptop: the first titles. */}
                  <span className="flex flex-wrap gap-1 px-0.5 lg:hidden" aria-hidden>
                    {tasks.slice(0, 4).map((t) => (
                      <AreaDot key={t.id} area={t.area} className={t.done ? "opacity-30" : ""} />
                    ))}
                    {evs.length ? <span className="size-2 rounded-full border border-muted-foreground" /> : null}
                  </span>
                  <span className="hidden min-w-0 flex-col gap-0.5 lg:flex" aria-hidden>
                    {evs.slice(0, 1).map((e) => (
                      <span key={e.id} className="truncate text-xs leading-tight text-muted-foreground">
                        {e.title}
                      </span>
                    ))}
                    {tasks.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className={`flex items-center gap-1 text-xs leading-tight ${t.done ? "text-muted-foreground line-through" : ""}`}
                      >
                        <AreaDot area={t.area} className="size-1.5" />
                        <span className="truncate">{t.title}</span>
                      </span>
                    ))}
                    {tasks.length + evs.length > Math.min(tasks.length, 2) + Math.min(evs.length, 1) ? (
                      <span className="text-xs text-muted-foreground">
                        +{tasks.length + evs.length - Math.min(tasks.length, 2) - Math.min(evs.length, 1)}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <section aria-label={dayLabel(selected)} data-slot="calendar-day" className="pb-32">
        <header className="flex h-(--size-xl) items-center justify-between border-b border-border px-4">
          <SectionLabel className="text-canvas-foreground">
            {selected === today ? "Today · " : ""}
            {dayLabel(selected)}
          </SectionLabel>
          <Button variant="text" size="sm" onClick={() => onAdd(selected)}>
            Add on this day
          </Button>
        </header>
        {dayEvents.length ? (
          <ul className="border-b border-border py-1">
            {dayEvents.map((e) => (
              <EventLine key={e.id} event={e} day={selected} />
            ))}
          </ul>
        ) : null}
        <ul>
          {[...dayTasks, ...dayDue].map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              today={today}
              showArea={area === "all"}
              state={api.saving[t.id]}
              onToggle={(done) => api.setDone(t, done)}
              onTomorrow={() => api.tomorrow(t)}
              onOpen={() => onOpen(t)}
              onRetry={() => api.retry(t.id)}
              onDelete={() => api.remove(t)}
            />
          ))}
        </ul>
        {!dayTasks.length && !dayDue.length && !dayEvents.length ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">Nothing on this day.</p>
        ) : null}
      </section>
    </div>
  );
}
