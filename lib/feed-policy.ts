/* Which links the calendar route will fetch: https on icloud.com only, so
 * Daybook's server can't be used to fetch anything else. */

import { feedUrl } from "./ics";

export function allowedFeed(raw: string): URL | null {
  try {
    const url = new URL(feedUrl(raw));
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !(host === "icloud.com" || host.endsWith(".icloud.com"))) return null;
    return url;
  } catch {
    return null;
  }
}
