"use client";

import { Button } from "@ds/button/button";
import { Chip } from "@ds/chip/chip";
import { FieldLabel, input, SectionLabel } from "@ds/field/field";
import { Segmented } from "@ds/segmented/segmented";
import { Minus, Plus } from "lucide-react";

import { addMonths, dayOfMonth } from "@/lib/dates";
import {
  type Freq,
  fromRule,
  nthOf,
  ordinalNumber,
  type RepeatForm,
  toRule,
  type Wd,
  WEEKDAY_NAMES,
  wdOf,
} from "@/lib/repeat";

/* The Custom… screen (spec §2): every N days/weeks/months/years, chosen
   weekdays, "2nd Thursday", "last weekday", and how it ends. Tucked behind
   Custom… so the quick picks stay one tap. */

const UNITS: Record<Freq, [string, string]> = {
  daily: ["day", "days"],
  weekly: ["week", "weeks"],
  monthly: ["month", "months"],
  yearly: ["year", "years"],
};
const SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const ORD = { 1: "first", 2: "second", 3: "third", 4: "fourth", [-1]: "last" } as Record<number, string>;

export function RepeatEditor({
  rule,
  anchor,
  onChange,
}: {
  rule: string;
  anchor: string;
  onChange: (r: string) => void;
}) {
  const form = fromRule(rule, anchor);
  const set = (patch: Partial<RepeatForm>) => onChange(toRule({ ...form, ...patch }, anchor));
  const nth = nthOf(anchor);
  const wd = wdOf(anchor);

  return (
    <div data-slot="repeat-editor" className="flex flex-col gap-4 border border-border p-3">
      <div className="flex flex-col gap-2">
        <SectionLabel>Every</SectionLabel>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Fewer"
            disabled={form.interval <= 1}
            onClick={() => set({ interval: form.interval - 1 })}
          >
            <Minus className="size-(--size-xs)" aria-hidden />
          </Button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">
            {form.interval}
          </span>
          <Button variant="outline" size="icon" aria-label="More" onClick={() => set({ interval: form.interval + 1 })}>
            <Plus className="size-(--size-xs)" aria-hidden />
          </Button>
          <span className="text-sm text-muted-foreground">{UNITS[form.freq][form.interval > 1 ? 1 : 0]}</span>
        </div>
        <div>
          <Segmented<Freq>
            label="Repeat unit"
            value={form.freq}
            onChange={(freq) => set({ freq })}
            options={(Object.keys(UNITS) as Freq[]).map((f) => ({
              value: f,
              label: UNITS[f][form.interval > 1 ? 1 : 0],
            }))}
          />
        </div>
      </div>

      {form.freq === "weekly" ? (
        <div className="flex flex-col gap-2">
          <SectionLabel>On</SectionLabel>
          <fieldset className="flex gap-1">
            <legend className="sr-only">Days of the week</legend>
            {SHORT.map((s, i) => {
              const on = form.weekdays.includes(i as Wd);
              return (
                <Chip
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed weekday list
                  key={i}
                  pressed={on}
                  aria-label={WEEKDAY_NAMES[i]}
                  className="w-(--size-xl) justify-center px-0"
                  onClick={() => {
                    const next = on ? form.weekdays.filter((d) => d !== i) : [...form.weekdays, i as Wd];
                    if (next.length) set({ weekdays: next });
                  }}
                >
                  {s}
                </Chip>
              );
            })}
          </fieldset>
        </div>
      ) : null}

      {form.freq === "monthly" ? (
        <div className="flex flex-col gap-2">
          <SectionLabel>On</SectionLabel>
          <div className="flex flex-wrap gap-1">
            <Chip pressed={form.monthly.mode === "date"} onClick={() => set({ monthly: { mode: "date" } })}>
              The {ordinalNumber(dayOfMonth(anchor))}
            </Chip>
            <Chip
              pressed={form.monthly.mode === "nth"}
              onClick={() => set({ monthly: { mode: "nth", nth, weekday: wd } })}
            >
              The {ORD[form.monthly.mode === "nth" ? form.monthly.nth : nth]}{" "}
              {WEEKDAY_NAMES[form.monthly.mode === "nth" ? form.monthly.weekday : wd]}
            </Chip>
            <Chip
              pressed={form.monthly.mode === "lastWeekday"}
              onClick={() => set({ monthly: { mode: "lastWeekday" } })}
            >
              The last weekday
            </Chip>
          </div>
          {form.monthly.mode === "nth" ? (
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, -1].map((n) => (
                <Chip
                  key={n}
                  pressed={form.monthly.mode === "nth" && form.monthly.nth === n}
                  onClick={() =>
                    form.monthly.mode === "nth" && set({ monthly: { ...form.monthly, nth: n as 1 | 2 | 3 | 4 | -1 } })
                  }
                >
                  {ORD[n]}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <SectionLabel>Ends</SectionLabel>
        <div className="flex flex-wrap items-center gap-1">
          <Chip pressed={form.end.type === "never"} onClick={() => set({ end: { type: "never" } })}>
            Never
          </Chip>
          <Chip
            pressed={form.end.type === "until"}
            onClick={() => set({ end: { type: "until", until: addMonths(anchor, 3) } })}
          >
            On a date
          </Chip>
          <Chip pressed={form.end.type === "count"} onClick={() => set({ end: { type: "count", count: 5 } })}>
            After a number of times
          </Chip>
        </div>
        {form.end.type === "until" ? (
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="repeat-until">Last date</FieldLabel>
            <input
              id="repeat-until"
              type="date"
              min={anchor}
              value={form.end.until}
              onChange={(e) => e.target.value && set({ end: { type: "until", until: e.target.value } })}
              className={input({ className: "w-auto" })}
            />
          </div>
        ) : null}
        {form.end.type === "count" ? (
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="repeat-count">How many times, this one included</FieldLabel>
            <input
              id="repeat-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={form.end.count}
              onChange={(e) => set({ end: { type: "count", count: Math.max(1, Number(e.target.value) || 1) } })}
              className={input({ className: "w-24" })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
