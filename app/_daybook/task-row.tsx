"use client";

import { AreaDot } from "@ds/area-dot/area-dot";
import { Tick } from "@ds/tick/tick";
import { ArrowRight, Check, Link2, Repeat, StickyNote } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";

import { relativeDay } from "@/lib/dates";
import type { Task } from "@/lib/types";

import { DueTag } from "./due-tag";
import { useCoarsePointer } from "./use-coarse-pointer";
import type { SaveState } from "./use-tasks";

/* One line per task (spec §3a). On a touch screen: swipe right to tick it
   done, left to move it to tomorrow. What's behind the row says what the
   swipe will do, and it commits past a clear threshold. The same actions are
   always reachable without the gesture: the tick, the row's hover buttons,
   the keys, and the sheet. */

const THRESHOLD = 88;

export function TaskRow({
  task,
  today,
  rolledFrom = null,
  showArea,
  state,
  onToggle,
  onTomorrow,
  onOpen,
  onRetry,
  onDelete,
}: {
  task: Task;
  today: string;
  rolledFrom?: string | null;
  showArea: boolean;
  state?: SaveState;
  onToggle: (done: boolean) => void;
  onTomorrow: () => void;
  onOpen: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const touch = useCoarsePointer();
  const x = useMotionValue(0);
  const doneOpacity = useTransform(x, [0, THRESHOLD], [0, 1]);
  const laterOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0]);
  const dragged = useRef(false);
  const armed = useRef<"done" | "later" | null>(null);

  const hasNotes = task.notes.trim().length > 0;
  const hasLinks = task.links.length > 0;
  const meta: string[] = [];
  if (rolledFrom) meta.push(`from ${relativeDay(rolledFrom, today)}`);

  return (
    <li data-slot="task-row" className="relative overflow-hidden" data-done={task.done || undefined}>
      {touch ? (
        <div aria-hidden className="absolute inset-0 flex items-center justify-between text-sm font-medium">
          <motion.span
            style={{ opacity: doneOpacity }}
            className="flex h-full items-center gap-2 bg-canvas-foreground px-5 text-canvas"
          >
            <Check className="size-(--size-sm)" />
            {task.done ? "Not done" : "Done"}
          </motion.span>
          <motion.span style={{ opacity: laterOpacity }} className="flex h-full items-center gap-2 bg-muted px-5">
            Tomorrow
            <ArrowRight className="size-(--size-sm)" />
          </motion.span>
        </div>
      ) : null}

      <motion.div
        data-slot="task-row-body"
        style={{ x }}
        drag={touch ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        dragSnapToOrigin
        onDragStart={() => {
          dragged.current = true;
        }}
        onDrag={(_, info) => {
          const next = info.offset.x > THRESHOLD ? "done" : info.offset.x < -THRESHOLD ? "later" : null;
          if (next && next !== armed.current) navigator.vibrate?.(8);
          armed.current = next;
        }}
        onDragEnd={() => {
          const a = armed.current;
          armed.current = null;
          if (a === "done") onToggle(!task.done);
          if (a === "later") onTomorrow();
          void animate(x, 0, { type: "spring", stiffness: 700, damping: 2 * 0.9 * Math.sqrt(700) });
          setTimeout(() => {
            dragged.current = false;
          }, 0);
        }}
        className="group relative flex min-h-(--size-2xl) touch-pan-y items-center gap-3 border-b border-border bg-canvas px-4"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.rowOpen) return;
          if (e.key === "x") {
            e.preventDefault();
            onToggle(!task.done);
          } else if (e.key === "t") {
            e.preventDefault();
            onTomorrow();
          } else if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            onDelete();
          }
        }}
      >
        <Tick checked={task.done} onChange={onToggle} area={task.area} label={`Done: ${task.title}`} />

        <button
          type="button"
          data-row-open="true"
          data-slot="task-row-open"
          onClick={() => {
            if (!dragged.current) onOpen();
          }}
          className="flex min-w-0 flex-1 flex-col items-start py-2.5 text-left outline-offset-[-2px]"
        >
          <span
            data-slot="task-row-title"
            className={`max-w-full truncate leading-snug ${task.done ? "text-muted-foreground line-through decoration-1" : ""}`}
          >
            {task.title}
          </span>
          {meta.length || hasNotes || hasLinks || task.rrule ? (
            <span data-slot="task-row-meta" className="flex items-center gap-2 text-xs text-muted-foreground">
              {meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
              {task.rrule ? <Repeat className="size-3" aria-label="Repeats" /> : null}
              {hasNotes ? <StickyNote className="size-3" aria-label="Has notes" /> : null}
              {hasLinks ? <Link2 className="size-3" aria-label="Has links" /> : null}
            </span>
          ) : null}
        </button>

        {state === "failed" ? (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-xs font-medium text-destructive-subdued-foreground underline underline-offset-2"
          >
            Not saved · Retry
          </button>
        ) : null}

        <DueTag task={task} today={today} />
        {showArea ? <AreaDot area={task.area} /> : null}

        {!touch ? (
          <button
            type="button"
            onClick={onTomorrow}
            aria-label={`Move ${task.title} to tomorrow`}
            title="Tomorrow (t)"
            className="motion-hover -mr-2 flex size-(--size-lg) shrink-0 items-center justify-center text-muted-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:text-canvas-foreground focus-visible:opacity-100"
          >
            <ArrowRight className="size-(--size-xs)" aria-hidden />
          </button>
        ) : null}
      </motion.div>
    </li>
  );
}
