"use client";

import { chip } from "@ds/chip/chip";
import { CalendarDays } from "lucide-react";

/* A chip that opens the device's own date picker: the native one is the
   best on every phone, and it's one less thing to learn. */
export function DateChip({
  value,
  onChange,
  label,
  text,
  pressed,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
  text: string;
  pressed: boolean;
}) {
  return (
    <span data-slot="date-chip" className={chip({ on: pressed, className: "relative" })}>
      <CalendarDays className="size-(--size-xs)" aria-hidden />
      <span aria-hidden>{text}</span>
      <input
        type="date"
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            /* Some browsers only allow it from a direct tap; the input still works. */
          }
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </span>
  );
}
