"use client";

import { Button } from "@ds/button/button";
import { Chip } from "@ds/chip/chip";
import { FieldLabel, input, SectionLabel } from "@ds/field/field";
import { Segmented } from "@ds/segmented/segmented";
import { Sheet } from "@ds/sheet/sheet";
import { ArrowRight, Copy, ExternalLink, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { addDays, nextMonday, relativeDay, shortDate, thisWeekend, today as todayOf } from "@/lib/dates";
import { anchorOf, defaultForm, describe, type Freq, presetOf, presetRule, toRule } from "@/lib/repeat";
import type { Area, Task, TaskLink } from "@/lib/types";

import { DateChip } from "./date-chip";
import { RepeatEditor } from "./repeat-editor";

/* One sheet for every task (spec §3a). It saves when it closes, so there's
   no Save button to forget and nothing asks "are you sure"; every change can
   be undone from the bar afterwards. */

export type SheetAction = "tomorrow" | "next-week" | "duplicate" | "delete";

const URL_RE = /\bhttps?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/gi;

const host = (u: string) => {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export function TaskSheet({
  open,
  original,
  draft: initial,
  onClose,
  onAction,
}: {
  open: boolean;
  /** null for a new task. */
  original: Task | null;
  draft: Task;
  onClose: (draft: Task) => void;
  /** Footer actions act on the task as edited so far, then close the sheet. */
  onAction: (action: SheetAction, draft: Task) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [customOpen, setCustomOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const today = todayOf();

  useEffect(() => {
    setDraft(initial);
    setCustomOpen(presetOf(initial.rrule, anchorOf(initial) ?? today) === "custom");
    setLinkText("");
  }, [initial, today]);

  const set = (patch: Partial<Task>) => setDraft((d) => ({ ...d, ...patch }));
  const isNew = original === null;
  const anchor = anchorOf(draft);
  const preset = presetOf(draft.rrule, anchor ?? today);

  const close = () => onClose(withPendingLink(draft, linkText));

  const setRepeat = (choice: Freq | "none" | "custom") => {
    if (choice === "none") {
      set({ rrule: null, seriesStart: null });
      setCustomOpen(false);
      return;
    }
    // A repeat needs a day to count from: default to doing it today.
    const doDate = draft.doDate ?? (draft.dueDate ? null : today);
    const a = doDate ?? draft.dueDate ?? today;
    if (choice === "custom") {
      setCustomOpen(true);
      set({ doDate, seriesStart: a, rrule: draft.rrule ?? toRule(defaultForm(a), a) });
      return;
    }
    setCustomOpen(false);
    set({ doDate, seriesStart: a, rrule: presetRule(choice, a) });
  };

  const tomorrow = addDays(today, 1);
  const weekend = thisWeekend(today);
  const doShortcuts: [string, string][] = [
    ["Today", today],
    ["Tomorrow", tomorrow],
    ...(weekend !== today && weekend !== tomorrow ? [["Weekend", weekend] as [string, string]] : []),
    ["Next week", nextMonday(today)],
  ];
  const doIsShortcut = doShortcuts.some(([, d]) => d === draft.doDate);
  const notesLinks = [...new Set(draft.notes.match(URL_RE) ?? [])].filter((u) => !draft.links.some((l) => l.url === u));

  const addLink = () => {
    const next = withPendingLink(draft, linkText);
    if (next !== draft) {
      setDraft(next);
      setLinkText("");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
      title={isNew ? "New task" : "Task"}
      initialFocus={isNew ? titleRef : undefined}
      footer={
        isNew ? (
          <Button className="w-full" size="lg" onClick={close} disabled={!draft.title.trim()}>
            Add task
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onAction("tomorrow", withPendingLink(draft, linkText))}>
              Tomorrow
              <ArrowRight className="size-(--size-xs)" aria-hidden />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAction("next-week", withPendingLink(draft, linkText))}>
              Next week
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAction("duplicate", withPendingLink(draft, linkText))}>
              <Copy className="size-(--size-xs)" aria-hidden />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              intent="destructive"
              size="sm"
              className="ml-auto"
              onClick={() => onAction("delete", draft)}
            >
              <Trash2 className="size-(--size-xs)" aria-hidden />
              Delete
            </Button>
          </div>
        )
      }
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.title.trim()) close();
        }}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="task-title" className="sr-only">
            Title
          </label>
          <input
            id="task-title"
            ref={titleRef}
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="What needs doing?"
            autoComplete="off"
            enterKeyHint="done"
            className="w-full bg-transparent text-2xl leading-tight font-light tracking-tight placeholder:text-muted-foreground focus-visible:outline-none"
          />
          {!isNew ? (
            <p className="text-xs text-muted-foreground">Created {shortDate(draft.createdAt.slice(0, 10), today)}</p>
          ) : null}
        </div>

        <Segmented<Area>
          label="Area"
          size="md"
          value={draft.area}
          onChange={(area) => set({ area })}
          options={[
            { value: "work", label: "Work" },
            { value: "home", label: "Home" },
          ]}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">
            <SectionLabel>Do</SectionLabel>
          </legend>
          <div className="flex flex-wrap gap-1">
            {doShortcuts.map(([label, d]) => (
              <Chip
                key={label}
                pressed={draft.doDate === d}
                onClick={() => set({ doDate: draft.doDate === d ? null : d })}
              >
                {label}
              </Chip>
            ))}
            <DateChip
              label="Pick a do date"
              value={draft.doDate}
              onChange={(doDate) => set({ doDate })}
              text={draft.doDate && !doIsShortcut ? relativeDay(draft.doDate, today) : "Pick"}
              pressed={Boolean(draft.doDate) && !doIsShortcut}
            />
            {draft.doDate ? (
              <Button variant="ghost" size="sm" onClick={() => set({ doDate: null })} aria-label="Clear do date">
                <X className="size-(--size-xs)" aria-hidden />
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {draft.doDate ? `Planned for ${relativeDay(draft.doDate, today)}.` : "No do date: it waits in Unplanned."}
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">
            <SectionLabel>Due</SectionLabel>
          </legend>
          <div className="flex flex-wrap gap-1">
            <DateChip
              label="Pick a due date"
              value={draft.dueDate}
              onChange={(dueDate) => set({ dueDate })}
              text={draft.dueDate ? relativeDay(draft.dueDate, today) : "No deadline"}
              pressed={Boolean(draft.dueDate)}
            />
            {draft.dueDate ? (
              <Button variant="ghost" size="sm" onClick={() => set({ dueDate: null })} aria-label="Clear due date">
                <X className="size-(--size-xs)" aria-hidden />
              </Button>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">
            <SectionLabel>Repeat</SectionLabel>
          </legend>
          <div className="flex flex-wrap gap-1">
            {(["none", "daily", "weekly", "monthly", "yearly"] as const).map((p) => (
              <Chip key={p} pressed={preset === p && !customOpen} onClick={() => setRepeat(p)}>
                {p === "none" ? "Never" : p[0].toUpperCase() + p.slice(1)}
              </Chip>
            ))}
            <Chip pressed={preset === "custom" || customOpen} onClick={() => setRepeat("custom")}>
              Custom…
            </Chip>
          </div>
          {draft.rrule && anchor ? (
            <p className="text-sm" aria-live="polite">
              {describe(draft.rrule, anchor, today)}
            </p>
          ) : null}
          <div className="motion-reveal" data-open={(customOpen && draft.rrule && anchor) || undefined}>
            <div>
              {customOpen && draft.rrule && anchor ? (
                <RepeatEditor
                  rule={draft.rrule}
                  anchor={anchor}
                  onChange={(rrule) => set({ rrule, seriesStart: anchor })}
                />
              ) : null}
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-notes">Notes</FieldLabel>
          <textarea
            id="task-notes"
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            rows={4}
            placeholder="Anything worth remembering"
            className={input({ kind: "area", className: "field-sizing-content resize-none" })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-link">Links</FieldLabel>
          {draft.links.length || notesLinks.length ? (
            <ul className="flex flex-col border-t border-border">
              {[...draft.links, ...notesLinks.map((url): TaskLink => ({ url }))].map((l) => {
                const fromNotes = !draft.links.includes(l);
                return (
                  <li key={l.url} className="flex items-center gap-2 border-b border-border">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex min-h-(--size-xl) min-w-0 flex-1 items-center gap-2 text-sm underline-offset-4 hover:underline"
                    >
                      <ExternalLink className="size-(--size-xs) shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{l.label ?? host(l.url)}</span>
                      {fromNotes ? <span className="shrink-0 text-xs text-muted-foreground">in notes</span> : null}
                    </a>
                    {!fromNotes ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove link ${l.label ?? host(l.url)}`}
                        onClick={() => set({ links: draft.links.filter((x) => x !== l) })}
                      >
                        <X className="size-(--size-xs)" aria-hidden />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="flex gap-2">
            <input
              id="task-link"
              type="url"
              inputMode="url"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
              placeholder="Paste a link"
              className={input()}
            />
            <Button variant="outline" onClick={addLink} disabled={!linkText.trim()}>
              Add
            </Button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}

/** A link typed but not yet added is kept, not lost, when the sheet closes. */
function withPendingLink(task: Task, text: string): Task {
  let url = text.trim();
  if (!url) return task;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    new URL(url);
  } catch {
    return task;
  }
  if (task.links.some((l) => l.url === url)) return task;
  return { ...task, links: [...task.links, { url }] };
}
