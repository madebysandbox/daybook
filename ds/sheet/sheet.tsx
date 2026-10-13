"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/* One sheet for everything: from the bottom on a phone, from the right on a
   laptop (mxa-motion slide). Closing is always one tap or Escape. */
export function Sheet({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  children,
  footer,
  initialFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop
          data-slot="sheet-backdrop"
          className="motion-slide-backdrop fixed inset-0 z-40 bg-canvas-foreground/30 dark:bg-black/60"
        />
        <Dialog.Popup
          data-slot="sheet"
          initialFocus={initialFocus}
          className={[
            "motion-slide fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col border-t border-border bg-surface text-surface-foreground shadow-lg",
            "pb-[env(safe-area-inset-bottom)] outline-none",
            "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[28rem] lg:border-t-0 lg:border-l lg:pb-0",
            "lg:[--motion-from-x:100%] lg:[--motion-from-y:0]",
          ].join(" ")}
        >
          <div
            data-slot="sheet-header"
            className="flex items-center justify-between gap-4 border-b border-border px-4 py-2"
          >
            <Dialog.Title
              data-slot="sheet-title"
              className={hideTitle ? "sr-only" : "text-xs font-medium uppercase tracking-wide text-muted-foreground"}
            >
              {title}
            </Dialog.Title>
            <Dialog.Close
              data-slot="sheet-close"
              aria-label="Close"
              className="motion-press -mr-2 ml-auto flex size-(--size-2xl) items-center justify-center text-muted-foreground hover:text-canvas-foreground"
            >
              <X className="size-(--size-sm)" aria-hidden />
            </Dialog.Close>
          </div>
          <div data-slot="sheet-body" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {children}
          </div>
          {footer ? (
            <div data-slot="sheet-footer" className="border-t border-border px-4 py-3">
              {footer}
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
