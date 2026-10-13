import { tv } from "tailwind-variants";

/* Work and Home are the only two colours in the app (spec §3a). The dot uses
   each area's text tone, which is guaranteed against every background. */
const dot = tv({
  base: "inline-block size-2 shrink-0 rounded-full",
  variants: {
    area: { work: "bg-work-subdued-foreground", home: "bg-home-subdued-foreground" },
  },
});

export function AreaDot({ area, className }: { area: "work" | "home"; className?: string }) {
  return (
    <span data-slot="area-dot" className={dot({ area, className })}>
      <span className="sr-only">{area === "work" ? "Work" : "Home"}</span>
    </span>
  );
}
