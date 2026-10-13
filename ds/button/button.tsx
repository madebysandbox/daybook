import type { ComponentPropsWithRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

/* Square, 1px, ink-filled when it's the main action (Blurt's tabs, on web
   surfaces). Every button presses (mxa-motion press) and hovers. */
export const button = tv({
  base: [
    "motion-press motion-hover inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-medium",
    "select-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40",
  ],
  variants: {
    variant: {
      default: "border-canvas-foreground bg-canvas-foreground text-canvas hover:opacity-85",
      outline: "border-border bg-transparent text-canvas-foreground hover:border-canvas-foreground",
      ghost: "border-transparent bg-transparent text-canvas-foreground hover:bg-muted",
      text: "h-auto border-transparent bg-transparent px-0 text-canvas-foreground underline-offset-4 hover:underline",
    },
    intent: {
      default: "",
      destructive: "",
    },
    size: {
      sm: "h-(--size-lg) px-3 text-sm",
      md: "h-(--size-xl) px-4 text-sm",
      lg: "h-(--size-2xl) px-5 text-base",
      icon: "size-(--size-xl) p-0",
    },
  },
  compoundVariants: [
    { intent: "destructive", variant: ["outline", "ghost", "text"], class: "text-destructive-subdued-foreground" },
    {
      intent: "destructive",
      variant: "default",
      class: "border-destructive bg-destructive text-destructive-foreground",
    },
  ],
  defaultVariants: { variant: "default", intent: "default", size: "md" },
});

export type ButtonProps = ComponentPropsWithRef<"button"> & VariantProps<typeof button>;

export function Button({ variant, intent, size, className, type = "button", ...props }: ButtonProps) {
  return <button data-slot="button" type={type} className={button({ variant, intent, size, className })} {...props} />;
}
