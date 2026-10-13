import type { ComponentPropsWithRef, ReactNode } from "react";
import { tv } from "tailwind-variants";

/* Section labels are small, uppercase and tracked, as on Blurt. */
export const label = tv({ base: "text-xs font-medium uppercase tracking-wide text-muted-foreground" });

export const input = tv({
  base: [
    "w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base text-canvas-foreground",
    "placeholder:text-muted-foreground focus-visible:border-canvas-foreground",
  ],
  variants: {
    kind: { line: "h-(--size-xl)", area: "min-h-24 py-2 leading-normal", bare: "border-transparent px-0" },
  },
  defaultVariants: { kind: "line" },
});

export function FieldLabel({ children, ...props }: ComponentPropsWithRef<"label"> & { children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: callers pass htmlFor through props
    <label data-slot="field-label" className={label()} {...props}>
      {children}
    </label>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span data-slot="section-label" className={label({ className })}>
      {children}
    </span>
  );
}
