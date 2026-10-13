"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { tv } from "tailwind-variants";

/* The tick circle: the one round control. It's the visible twin of the
   swipe-right gesture, so it's always there. The hit area reaches 44px
   through padding; the circle itself stays small. */
const tick = tv({
  slots: {
    root: "motion-press group -m-2.5 flex size-(--size-2xl) shrink-0 items-center justify-center rounded-full",
    circle: [
      "motion-hover flex size-(--size-sm) items-center justify-center rounded-full border-[1.5px]",
      "group-data-checked:text-canvas",
    ],
    icon: "size-3.5 stroke-3",
  },
  variants: {
    area: {
      work: { circle: "border-work-subdued-foreground group-data-checked:bg-work-subdued-foreground" },
      home: { circle: "border-home-subdued-foreground group-data-checked:bg-home-subdued-foreground" },
    },
  },
});

export function Tick({
  checked,
  onChange,
  area,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  area: "work" | "home";
  label: string;
}) {
  const s = tick({ area });
  return (
    <Checkbox.Root
      data-slot="tick"
      checked={checked}
      onCheckedChange={(c) => onChange(c)}
      aria-label={label}
      className={s.root()}
    >
      <span data-slot="tick-circle" className={s.circle()}>
        <Checkbox.Indicator>
          <Check data-slot="tick-icon" className={s.icon()} aria-hidden />
        </Checkbox.Indicator>
      </span>
    </Checkbox.Root>
  );
}
