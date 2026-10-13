import { localDay } from "@/lib/dates";
import type { CalEvent } from "@/lib/types";

/* An iCloud event: context, not a to-do. Muted, no tick, can't be edited. */
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function EventLine({ event, day }: { event: CalEvent; day: string }) {
  const startsToday = event.allDay || localDay(event.start) === day;
  const when = event.allDay ? "All day" : startsToday ? time(event.start) : "cont.";
  return (
    <li data-slot="event-line" className="flex min-h-8 items-center gap-3 px-4 text-sm text-muted-foreground">
      <span className="w-(--size-xl) shrink-0 text-xs tabular-nums">{when}</span>
      <span className="min-w-0 truncate">{event.title}</span>
    </li>
  );
}
