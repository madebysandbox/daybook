import "server-only";

import { parseIcs } from "./ics";
import type { CalEvent } from "./types";

export { allowedFeed } from "./feed-policy";

/* The one thing Daybook's server does: fetch an iCloud calendar feed for the
 * browser, which can't fetch it itself (iCloud sends no CORS headers). It is
 * not a general proxy: only https links on icloud.com, a size cap, a timeout,
 * and nothing stored. Raw text is cached for 15 minutes per server instance. */

const TTL = 15 * 60_000;
const MAX_BYTES = 5_000_000;
const cache = new Map<string, { at: number; text: string }>();

async function fetchFeed(url: URL): Promise<string> {
  const key = url.href;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.text;
  const res = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Feed answered ${res.status}`);
  if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("Feed too large");
  const text = await res.text();
  if (text.length > MAX_BYTES || !text.includes("BEGIN:VCALENDAR")) throw new Error("Not a calendar feed");
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), text });
  return text;
}

export async function eventsBetween(
  urls: URL[],
  from: string,
  to: string,
): Promise<{ events: CalEvent[]; failed: number }> {
  const results = await Promise.allSettled(urls.map(async (u) => parseIcs(await fetchFeed(u), from, to)));
  return {
    events: results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
