# Daybook (public) — spec

Status: 13 Oct 2026, the public version of a personal build. Engagement: **prototype**, for: **internal** (an experiment, published openly). Name is a working title.

## 1. Problem / intent

To-dos end up split across a reminders app, a notes app and a calendar, each with years of clutter. Daybook is one calm site where a task is the only thing: it can carry notes and links, and it has two dates that mean different things, **when you'll do it** and **when it's due**. You see your tasks as a day-by-day list and as a month calendar, with your iCloud calendar alongside so you can plan around your events.

This public version needs no account and no database: everything lives in the visitor's own browser. It came from a personal build that synced through a database behind a passphrase; that version proved the interaction design, and this one lets anyone use it.

## 2. Scope

**In**
- **Task:** title (required), notes (multi-line, links clickable), any number of links (URL + optional label), **do date** (optional), **due date** (optional), **Work / Home** (required, defaults to the current filter), done / not done, created date (automatic, shown on the task).
- **Repeats:** quick picks for daily, weekly (same weekday), monthly (same date) and yearly, plus a **Custom…** screen for full rules: every N days/weeks/months/years, chosen weekdays, "2nd Thursday", "last weekday of the month", and end conditions (never / on a date / after N times). Ticking a repeating task done creates the next one, moving the do and due dates forward together.
- **Timeline view (default):** an **Unplanned** tray at the top (open tasks with no do date), then **Today**, then each later day that has something on it, with the next 14 days always shown. Tasks sit on their **do date**. The due date is a tag ("due Fri"), shown amber within 2 days and red on or past the day. Open tasks with a do date in the past **show under Today** with a quiet "from Mon" note; their stored date doesn't change. Done tasks stay on their day, faded, and a "Hide done" toggle remembers its setting per device. iCloud events for each day appear in the timeline as plain, non-tickable lines.
- **Calendar view:** a month grid. Each day shows its tasks by do date, due dates as a small marker, and iCloud events behind them in a muted style. Tap a day to see its list (on a phone, underneath the grid, the way iOS does it). A week view is out for v1.
- **Work / Home switch** at the top: All · Work · Home, remembered per device. The two are shown in different colours.
- **Quick add:** one always-visible add button, which opens a sheet with the title focused. Do date shortcuts: Today, Tomorrow, This weekend, Pick…
- **iCloud calendar (read-only):** paste the private `.ics` subscribe link once, in Settings. Events show in both views and are never written back.
- **No account.** Tasks are kept in the browser's own storage on that device. **Export / Import** a file to move them between devices.
- Works in a phone or laptop browser, and can be added to the phone's home screen, where it opens full-screen like an app.

**Out**
- Writing to any calendar, or connecting Google or Outlook calendars.
- Alerts, notifications, badges, a morning summary.
- Lists, tags, priorities, flags, sub-tasks, attachments or images.
- Standalone notes that aren't tasks.
- Times of day on tasks (they're day-level). Events keep their times from iCloud.
- Typing dates in plain words ("call dentist fri"). A likely v2.
- Sharing, other users, accounts, and syncing between devices (export/import instead).
- Importing from Reminders or Notes. He starts fresh.
- Working fully offline. It needs a connection to save.

## 3. Approach

**Stack: mxa default (Next.js, Tailwind tokens, Base UI) on Vercel. No database.**

- **Storage:** one key in the browser's localStorage, read through `lib/local-store.ts`, which checks every task on the way in (storage and imported files can be hand-edited). Cookies were considered and rejected: they hold about 4KB and are sent to the server with every request, which is the opposite of what's wanted.
- **The server does one thing:** fetch iCloud calendar feeds, because iCloud blocks browsers from doing it directly. The links travel in a POST body (never a URL), only `https://*.icloud.com` is accepted, responses are capped at 5MB and 10 seconds, and nothing is stored beyond a 15-minute in-memory cache.
- **Data:** a list of tasks, each: `title`, `notes`, `links[] {url, label}`, `do_date` and `due_date` (`YYYY-MM-DD` or null), `area` (`work` | `home`), `done`, `done_at`, `rrule` (RFC 5545 string or null), `series_id`, `created_at`, `updated_at`.. Calendar links are kept beside them. Dates are calendar days in Europe/London, never timestamps, so a task can't drift a day between devices.
- **Repeats:** stored as a standard RRULE and expanded with the `rrule` library. The Custom… screen builds that rule and shows a plain-English playback ("Every 2nd Thursday, until 1 Mar"). Completing an occurrence creates the next one on the same series, keeping the gap between the do and due dates.
- **iCloud feed:** the calendar route fetches the `.ics` link, parses it with `ical.js`, expands repeating events for the visible range, caches the result for 15 minutes, and returns only title, start, end and all-day for each event. If the feed fails, the app shows a quiet "Calendar couldn't load", and tasks still work.
- **Pure logic in `lib/` with unit tests:** which day a task appears on (do date, roll-over to Today, Unplanned), how the due tag reads, next-occurrence maths, and RRULE ↔ form round-trips.
- **Look (agreed 13 Oct, see §3a):** a tool, not a page. Tokens from `mxa-tokens`, Lucide icons, motion from `mxa-motion`, respecting reduced motion. Phone layout first; on a laptop the calendar and the day list sit side by side.

### 3a. Design and interaction

Form follows function: it's an app someone uses many times a day, so it should be scannable, dense enough to be useful, and never decorative. The visual language comes from Blurt and London Travel, moved from their mono, off-white look onto plain web surfaces.

- **Surfaces:** pure white in light mode, near-black (`#0b0b0b`) in dark, following the device setting. No paper tints, textures, cards or shadows. Structure comes from 1px hairlines and spacing.
- **Colour:** greyscale everywhere except on elements that carry meaning. Work and Home each get one accent, used for the area dot, the tick and the selected filter. Amber and red are kept for due tags. Today gets a single accent marker. Contrast is WCAG AA or better in both modes.
- **Type:** Helvetica Neue (system on Apple devices), falling back to Arial elsewhere; no webfont. Light (300) only at large sizes: the month name and big headings. Regular for task text, medium for day headers. Small uppercase tracked labels for section names (UNPLANNED, TODAY), as on Blurt. Tabular numbers for dates.
- **Components:** square corners. Buttons and filters are outlined 1px and fill solid ink when selected (Blurt's tabs). The All · Work · Home switch and the Timeline · Calendar switch use that same control. Bottom sheets on the phone, side panel on the laptop. Large tap targets (44px minimum).
- **Density:** compact, like Reminders. One line per task, with due tag and area dot right-aligned, and notes and links shown only as a small icon in the row. Short day headers (TUE 14). Empty days collapse to a single thin line.
- **Gestures first, but never gestures only.** On the phone, swipe a row right to tick it done and left to move it to tomorrow. The colour and icon revealed behind the row show what the swipe will do, and it commits at a clear threshold with a light haptic where supported. The same actions are always visible too: a circle to tick, and in the open task, buttons for **Tomorrow / Next week / Pick date…**, **Delete** and **Duplicate**. On a laptop, hovering a row shows the same actions, and there are keyboard shortcuts (`x` done, `t` tomorrow, `n` new, `⌘/Ctrl+Z` undo).
- **Undo, not "Are you sure?"** No confirmation dialogs anywhere. Every change (tick, move, delete, edit) shows a bar at the bottom: "Moved to Wed · **Undo**", for 8 seconds. A new action replaces it. `⌘/Ctrl+Z` undoes the last 10 actions on a laptop.
- **Feedback (Norman):** every tap answers within 100ms. The interface updates straight away, then saves in the background. If a save fails, the row shows "Not saved · Retry" instead of losing the change silently.
- **Consistency (Nielsen):** one way to show a date, one control style, one sheet for every task. Wording uses plain terms ("Do", "Due", "Work", "Home"), not jargon.
- **Home screen:** a web app manifest and icons so "Add to Home Screen" opens it full-screen. No service worker (offline is out of scope).

## 4. Riskiest assumptions

| # | Assumption | If wrong | How it's retired |
|---|---|---|---|
| A1 | The iCloud `.ics` link can be fetched from Vercel's servers and parsed reliably, including repeating events and time zones. | No events, or events on the wrong day. | **Spike first (task 3):** fetch a real iCloud link on a preview deploy and check a week of events against the Calendar app. |
| A2 | The difference between do date and due date is worth the extra field, and he'll set do dates. | Everything piles up in Unplanned and the timeline is empty. | Two weeks' use. If most tasks only get a due date, place undated-do tasks on their due day instead. |
| A3 | Rolling unfinished tasks to Today feels helpful, not naggy. | Today fills with stale tasks. | Two weeks' use. Fix options: a "Not today" snooze, or a separate Overdue group. |
| A4 | Advanced repeats can sit behind Custom… without the quick picks feeling cluttered. | Repeating tasks get set up wrong, or the sheet feels heavy. | Put the Custom… screen in front of a user on the first build, with three real repeating chores. |
| A5 | Work / Home is enough organising. | He wants a third area or lists. | If he asks for a third bucket within a month, revise. |
| A6 | Device-only storage with export/import is enough for people to trust it with their tasks. | People lose tasks when browser data is cleared, or give up moving between devices. | Watch for it; a sync option would be the next build. |
| A7 | Day-level tasks are enough (no times). | He wants "at 3pm" on tasks. | Watch for it in use. |
| A8 | Swipe gestures in a web page feel as solid as in a native app on iPhone (no fights with page scroll or Safari's back-swipe). | Swipes misfire or feel laggy, and he stops trusting them. | Prototype the swipe row early (task 6) and try it on his phone from the home screen. The visible controls are the fallback. |

## 5. Tasks (dependency-ordered; owning skill in brackets)

1. **Record the project:** manifest (prototype / internal). [`mxa-stack`]
2. **Generate the shell and tokens** (calm neutral palette, Work and Home accents). [`mxa-new-project`, `mxa-tokens`]
3. **iCloud spike, retires A1:** server route that fetches, parses and caches the feed; tested locally against a fixture `.ics` with repeating and all-day events, then against a real iCloud link. [`mxa-tests`, `mxa-secrets`]
4. **Browser storage and export/import,** with tests on reading stored and imported data. [`mxa-tests`]
5. **Task logic:** `lib/` placement, due-tag and repeat maths, with tests. [`mxa-tests`]
6. **Screens:** timeline, calendar month, task sheet (notes, links, dates, area, repeat), Custom repeat screen, Settings (iCloud link), unlock. Empty, loading and error states for each. [`mxa-frontend-standards`]
7. **Motion:** tick-off, sheet open, task arriving. [`mxa-motion`]
8. **Home-screen install:** manifest, icons, full-screen launch on iPhone. [`mxa-frontend-standards`]
9. **Ship:** public repo and production deploy. [`mxa-commit`, `mxa-deploy`]
10. **Two weeks' use, then Revise:** retire A2 to A5 and A7. [`mxa-spec` Revise]

## 6. Success criteria

- Adding a task with a title and a do date of Tomorrow takes the add button, typing, one tap on Tomorrow and Save: no more than 4 taps.
- A task with no do date appears only in Unplanned. A task done on its do date stays on that day, faded. An open task whose do date has passed appears under Today, marked with its original day.
- A due date shows as a tag: neutral more than 2 days out, amber within 2 days, red on the day or later.
- Ticking off a repeating task creates exactly one next occurrence, on the date the rule gives; tests cover weekly, "2nd Thursday", "last weekday of the month" and "after N times" ending.
- iCloud events for the visible range appear in both views on the same days and at the same times as in Apple Calendar (checked against a week of real events), and can't be ticked or edited.
- With the feed broken or missing, tasks still load and a single quiet message says the calendar didn't load.
- Nothing but calendar fetches reaches the server; the calendar route refuses any link that isn't https on icloud.com.
- Tasks survive a page reload and a browser restart; export then import on another browser reproduces them exactly.
- Every tick, move, edit and delete can be undone from the bar that appears, and no action asks "Are you sure?".
- Everything a swipe does can also be done with a visible tap, and on a laptop with the keyboard.
- Both light and dark mode pass WCAG AA contrast. The only colours on screen are the Work/Home accents, the due-date states and the Today marker.
- At 375px wide nothing scrolls sideways; added to an iPhone home screen, it opens full-screen with its own icon.

## Changelog

- **13 Oct 2026:** Forked from the personal build into a public version. Removed the database, the passphrase and all personal content; tasks now live in the visitor's browser with export/import between devices. The calendar route is limited to iCloud links.
