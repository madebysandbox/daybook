# Daybook (public)

The public version of Daybook: a to-do site with tasks, notes and links, a do date and a due date, a day-by-day list and a month calendar, and an iCloud calendar alongside. No account and no database: tasks live in the visitor's browser. Spec: `docs/specs/daybook.md`. Forked 13 Oct 2026 from the personal build in `experiments/daybook`.

- **Engagement:** prototype, internal, published openly. Repo: github.com/madebysandbox/daybook (public). Vercel project madebymany/daybook, git connected: pushes to main deploy to production.
- **The link:** https://daybook-three-wheat.vercel.app (public, checked 13 Oct 2026: page and calendar route answer without sign-in). The team alias daybook-madebymany.vercel.app serves the same deployment but timed out from the office network on 13 Oct, so it isn't the one handed out.
- **Look:** white / near-black (follows the device), greyscale, square corners, 1px rules. Colour only for Work (blue) and Home (pink), due states and the Today marker.
- **Type:** Helvetica Neue (Apple devices), Arial elsewhere. No webfont.
- **Device target:** phone first; two columns (month + list) from 1024px.
- **Audience:** anyone.

## Token command (mxa-tokens)

```
npx @designtools/tokens@0.8.0 --primary "#6b6b6b" --neutral "#737373" --color work=#2f6fe4 --color home=#d23f87 --canvas "#FFFFFF/#0B0B0B" --surface "#FFFFFF/#151515" --overlay "#FFFFFF/#151515" --format tailwind-v4 --out app/styles/tokens.css --usage app/styles/tokens.usage.json
```

Ink-filled controls use `bg-canvas-foreground text-canvas`; the primary is a mid grey kept for the focus ring. Work and Home dots and ticks use `*-subdued-foreground`, guaranteed against every background in both modes.

## Motion (mxa-motion)

```
node mxa-motion/scripts/spring.mjs --name snap   --damping 0.9 --stiffness 700
node mxa-motion/scripts/spring.mjs --name settle --damping 0.8 --stiffness 380
```

## Keys

None. Nothing is stored server-side.

## Decisions

- **Storage:** localStorage, one key (`daybook:v1`), through `lib/local-store.ts`, which checks every task on the way in. Writes after every change; a refused write shows a warning in the header. Other tabs pick up changes through the `storage` event. Cookies rejected: ~4KB and sent to the server on every request.
- **Moving between devices:** Settings → Export (JSON file) / Import (merges; the imported copy of a task wins).
- **Server:** one route, `app/api/calendar` (POST `{urls, from, to}`), allowed hosts in `lib/feed-policy.ts` (https `*.icloud.com`), 62-day range cap, 5MB and 10s caps, 15-minute in-memory cache, `Cache-Control: no-store`.
- **Client state:** `app/_daybook/use-tasks.ts`, with an undo stack of before/after pairs (10 deep).
- **Dates** are calendar days in the device's time zone; repeats are RRULEs with a separate `seriesStart`.
- **Per-device preferences** (filter, view, hide done) in localStorage, guarded.

## Rendering

- `/`: a static shell; tasks load from the browser after it mounts. Not indexed (robots noindex) until someone decides it should be.

## Screens

- `/`: welcome (no tasks yet), list (Unplanned, Today, next 14 days, later days with tasks) and month calendar; task sheet; Custom… repeat; Settings (export/import, iCloud links).
