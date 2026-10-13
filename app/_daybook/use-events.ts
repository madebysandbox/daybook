"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addDays, addMonths, localDay, startOfMonth, startOfWeek } from "@/lib/dates";
import { load } from "@/lib/local-store";
import type { CalEvent } from "@/lib/types";

/* iCloud events, fetched a month at a time (the six-week grid around it) and
 * kept. The links live in this browser and go to Daybook's server in the
 * body of a request, which fetches the feeds (iCloud blocks browsers from
 * doing it directly). A failed feed shows one quiet message; tasks never
 * wait on it. */

type EventsResponse = { events: CalEvent[]; failed: number };

export async function fetchEvents(urls: string[], from: string, to: string): Promise<EventsResponse> {
  const res = await fetch("/api/calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, from, to }),
  });
  if (!res.ok) throw new Error(`Calendar answered ${res.status}`);
  return (await res.json()) as EventsResponse;
}

export type EventsStatus = "idle" | "ok" | "unconfigured" | "failed";

export function useEvents() {
  const [events, setEvents] = useState<Map<string, CalEvent>>(new Map());
  const [status, setStatus] = useState<EventsStatus>("idle");
  const loaded = useRef(new Set<string>());

  const ensureMonth = useCallback(async (day: string) => {
    const month = startOfMonth(day);
    if (loaded.current.has(month)) return;
    loaded.current.add(month);
    const from = startOfWeek(month);
    try {
      const { icsUrls } = load();
      if (!icsUrls.length) {
        setStatus("unconfigured");
        return;
      }
      const res = await fetchEvents(icsUrls, from, addDays(from, 41));
      setStatus(res.failed ? "failed" : "ok");
      setEvents((prev) => {
        const next = new Map(prev);
        for (const e of res.events) next.set(e.id, e);
        return next;
      });
    } catch {
      loaded.current.delete(month);
      setStatus("failed");
    }
  }, []);

  const reload = useCallback(
    (around: string) => {
      loaded.current.clear();
      setEvents(new Map());
      void ensureMonth(around);
      void ensureMonth(addMonths(around, 1));
    },
    [ensureMonth],
  );

  const on = useCallback(
    (day: string) =>
      [...events.values()]
        .filter((e) =>
          e.allDay
            ? e.start <= day && day < e.end
            : localDay(e.start) <= day && day <= localDay(new Date(new Date(e.end).getTime() - 1).toISOString()),
        )
        .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start)),
    [events],
  );

  return { on, status, ensureMonth, reload };
}

export type EventsApi = ReturnType<typeof useEvents>;

/** Load the months a set of days falls in. */
export function useEnsureMonths(api: EventsApi, days: string[]) {
  const key = [...new Set(days.map(startOfMonth))].join();
  useEffect(() => {
    for (const m of key.split(",")) if (m) void api.ensureMonth(m);
  }, [key, api.ensureMonth]);
}
