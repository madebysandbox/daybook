"use client";

import { Button } from "@ds/button/button";
import { FieldLabel, input, SectionLabel } from "@ds/field/field";
import { Sheet } from "@ds/sheet/sheet";
import { CalendarDays, Download, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { addDays, today as todayOf } from "@/lib/dates";
import { feedUrl } from "@/lib/ics";
import { load, parseSaved, save } from "@/lib/local-store";
import type { Task } from "@/lib/types";

import { fetchEvents } from "./use-events";

const host = (u: string) => {
  try {
    return new URL(feedUrl(u)).host;
  } catch {
    return u;
  }
};

/* Settings: where your tasks live, moving them between devices, and the
   iCloud calendar links. The links are secrets, so they're only ever shown
   back by host. */
export function SettingsSheet({
  open,
  onOpenChange,
  tasks,
  onImport,
  onCalendarsChanged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tasks: Task[];
  onImport: (tasks: Task[]) => void;
  onCalendarsChanged: () => void;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUrls(load().icsUrls);
      setImportNote(null);
    }
  }, [open]);

  const store = (next: string[]) => {
    save({ icsUrls: next });
    setUrls(next);
    onCalendarsChanged();
  };

  const add = () =>
    start(async () => {
      setError(null);
      const link = url.trim();
      const today = todayOf();
      const res = await fetchEvents([link], today, addDays(today, 30)).catch(() => null);
      if (!res || res.failed) {
        setError("Couldn't read a calendar from that link. Daybook works with iCloud public calendar links.");
        return;
      }
      store([...urls.filter((u) => u !== link), link]);
      setUrl("");
    });

  const exportFile = () => {
    const blob = new Blob([JSON.stringify({ app: "daybook", version: 1, tasks }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `daybook-${todayOf()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = async (file: File) => {
    try {
      const { tasks: incoming } = parseSaved(JSON.parse(await file.text()));
      if (!incoming.length) {
        setImportNote("That file didn't have any Daybook tasks in it.");
        return;
      }
      // Merge: the imported copy of a task wins over this device's.
      const merged = new Map(tasks.map((t) => [t.id, t]));
      for (const t of incoming) merged.set(t.id, t);
      onImport([...merged.values()]);
      setImportNote(`Imported ${incoming.length} ${incoming.length === 1 ? "task" : "tasks"}.`);
    } catch {
      setImportNote("Couldn't read that file. Choose a file exported from Daybook.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Settings">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3" aria-labelledby="data-heading">
          <h2 id="data-heading">
            <SectionLabel>Your tasks</SectionLabel>
          </h2>
          <p className="text-sm text-muted-foreground">
            Daybook keeps your tasks in this browser, on this device. There's no account and nothing is sent to a
            server. Clearing your browser's data deletes them, so export a copy now and then.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportFile} disabled={!tasks.length}>
              <Download className="size-(--size-xs)" aria-hidden />
              Export {tasks.length ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}` : ""}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-(--size-xs)" aria-hidden />
              Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import a Daybook file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            To use another device, export here and import the file there. Importing adds to what's already there.
          </p>
          {importNote ? (
            <p role="status" className="text-sm">
              {importNote}
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="cal-heading">
          <h2 id="cal-heading">
            <SectionLabel>iCloud calendar</SectionLabel>
          </h2>
          <p className="text-sm text-muted-foreground">
            Show your events alongside your tasks. Daybook only reads them and never changes your calendar. The link is
            kept in this browser; Daybook's server fetches the calendar for you each time and keeps nothing.
          </p>

          {urls.length ? (
            <ul className="border-t border-border">
              {urls.map((u, i) => (
                <li key={u} className="flex items-center gap-3 border-b border-border">
                  <CalendarDays className="size-(--size-xs) text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    Calendar {i + 1} · {host(u)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove calendar ${i + 1}`}
                    onClick={() => store(urls.filter((x) => x !== u))}
                  >
                    <X className="size-(--size-xs)" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No calendar connected.</p>
          )}

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) add();
            }}
          >
            <FieldLabel htmlFor="ics-url">{urls.length ? "Add another calendar" : "Calendar link"}</FieldLabel>
            <div className="flex gap-2">
              <input
                id="ics-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="webcal://p…-caldav.icloud.com/published/…"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "ics-error" : "ics-help"}
                className={input()}
              />
              <Button type="submit" disabled={pending || !url.trim() || urls.length >= 5}>
                {pending ? "Checking" : "Add"}
              </Button>
            </div>
            {error ? (
              <p id="ics-error" role="alert" className="motion-shake text-sm text-destructive-subdued-foreground">
                {error}
              </p>
            ) : null}
            <details id="ics-help" className="text-sm text-muted-foreground">
              <summary className="text-canvas-foreground">Where do I find the link?</summary>
              <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
                <li>On your iPhone, open Calendar and tap Calendars at the bottom.</li>
                <li>Tap the (i) next to the calendar you want.</li>
                <li>Turn on Public Calendar, tap Share Link, then Copy.</li>
                <li>Paste it here. Repeat for each calendar you want to see.</li>
              </ol>
              <p className="mt-2">Anyone with that link can read the calendar, so don't share it anywhere else.</p>
            </details>
          </form>
        </section>
      </div>
    </Sheet>
  );
}
