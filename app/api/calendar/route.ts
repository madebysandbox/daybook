import { NextResponse } from "next/server";

import { allowedFeed, eventsBetween } from "@/lib/calendar-feed";
import { diffDays, isDay } from "@/lib/dates";

/* POST, so the calendar links (which are secrets) travel in the body and
   never end up in a URL, a log line or browser history. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { urls, from, to } = (body ?? {}) as Record<string, unknown>;
  if (!Array.isArray(urls) || urls.length === 0 || urls.length > 5 || !isDay(from) || !isDay(to)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (diffDays(from, to) < 0 || diffDays(from, to) > 62) {
    return NextResponse.json({ error: "Range too long" }, { status: 400 });
  }
  const allowed = urls.map((u) => (typeof u === "string" ? allowedFeed(u) : null));
  if (allowed.some((u) => u === null)) {
    return NextResponse.json({ error: "Only iCloud calendar links are supported" }, { status: 400 });
  }
  const result = await eventsBetween(allowed as URL[], from, to);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
