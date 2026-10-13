"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type { ReactNode } from "react";
import { tv } from "tailwind-variants";

/* One of several, Blurt-style: outlined options that fill with ink when
   chosen. Used for All · Work · Home, Timeline · Calendar and in the sheet. */
const segmented = tv({
  slots: {
    root: "flex min-w-0",
    item: [
      "motion-hover -ml-px flex h-(--size-lg) min-w-0 flex-1 items-center justify-center gap-1.5 border border-border px-3 first:ml-0",
      "text-xs font-medium uppercase tracking-wide text-muted-foreground",
      "hover:z-10 hover:border-canvas-foreground hover:text-canvas-foreground",
      "data-pressed:z-10 data-pressed:border-canvas-foreground data-pressed:bg-canvas-foreground data-pressed:text-canvas",
      "focus-visible:z-20",
    ],
  },
  variants: {
    size: { sm: {}, md: { item: "h-(--size-xl) text-sm normal-case tracking-normal" } },
  },
});

export type SegmentOption<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "sm",
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const s = segmented({ size });
  return (
    <ToggleGroup
      data-slot="segmented"
      aria-label={label}
      value={[value]}
      onValueChange={(v) => {
        if (v[0]) onChange(v[0] as T);
      }}
      className={s.root({ className })}
    >
      {options.map((o) => (
        <Toggle key={o.value} value={o.value} aria-label={o.ariaLabel} data-slot="segmented-item" className={s.item()}>
          {o.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
