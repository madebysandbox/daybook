# Daybook

A calm to-do list that merges the useful parts of a reminders app, a notes app and a calendar.

- **One kind of thing: a task.** It can carry notes and links, a day you plan to **do** it, and a separate **due** date.
- **Two views of the same tasks:** a day-by-day list and a month calendar. Tasks without a do date wait in **Unplanned**; unfinished ones roll forward to **Today**.
- **Gestures first, never gestures only.** On a phone, swipe right to tick a task off and left to move it to tomorrow. The same actions are always one visible tap away, with keyboard shortcuts on a laptop (`n` new, `x` done, `t` tomorrow, `⌘Z` undo).
- **Undo instead of "Are you sure?"** Every change can be undone from the bar that appears.
- **Repeats,** from "every week" to "the last weekday of the month, six times", with the detailed rules tucked behind *Custom…*.
- **Your iCloud calendar alongside,** read-only, from its public calendar link.
- **Work / Home** as the only organising, and no notifications.

## Your data

There's no account and no database. Tasks are kept in your browser's storage on the device you use; clearing your browser data deletes them. Use **Settings → Export** to keep a copy or to move your tasks to another device (**Import** there).

The only thing that touches the server is your calendar: iCloud doesn't let browsers fetch calendar feeds directly, so the site's server fetches it for you each time. The link is sent in the body of the request, only `icloud.com` links are accepted, and nothing is stored.

## Running it

```bash
pnpm install
pnpm dev
```

Tests: `pnpm test`. Built with Next.js, Tailwind (over generated design tokens), Base UI and Motion. The spec, including the design and interaction principles, is in [`docs/specs/daybook.md`](docs/specs/daybook.md).
