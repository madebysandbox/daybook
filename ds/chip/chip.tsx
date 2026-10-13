import type { ComponentPropsWithRef } from "react";
import { tv } from "tailwind-variants";

/* A quick choice that can be on or off on its own (Today, Tomorrow, Weekly). */
export const chip = tv({
  base: [
    "motion-press motion-hover inline-flex h-(--size-lg) shrink-0 items-center gap-1.5 border border-border px-3 text-sm",
    "text-canvas-foreground hover:border-canvas-foreground",
    "aria-pressed:border-canvas-foreground aria-pressed:bg-canvas-foreground aria-pressed:text-canvas",
  ],
  variants: {
    /* For a chip that isn't a button itself (the date chip wraps an input). */
    on: { true: "border-canvas-foreground bg-canvas-foreground text-canvas" },
  },
});

export function Chip({
  pressed,
  className,
  type = "button",
  ...props
}: ComponentPropsWithRef<"button"> & { pressed?: boolean }) {
  return <button data-slot="chip" type={type} aria-pressed={pressed} className={chip({ className })} {...props} />;
}
