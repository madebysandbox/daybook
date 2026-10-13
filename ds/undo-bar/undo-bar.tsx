"use client";

/* Undo, not "Are you sure?" (spec §3a). One bar at the foot of the screen,
   announced politely, replaced by the next action. */
export function UndoBar({
  message,
  onUndo,
  actionLabel = "Undo",
}: {
  message: string | null;
  onUndo: () => void;
  actionLabel?: string;
}) {
  return (
    <div
      data-slot="undo-bar"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      {message ? (
        <div
          key={message}
          data-slot="undo-bar-panel"
          className="motion-rise pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 border border-canvas-foreground bg-canvas-foreground py-1 pr-1 pl-4 text-sm text-canvas shadow-md"
        >
          <span data-slot="undo-bar-message" className="min-w-0 truncate">
            {message}
          </span>
          <button
            type="button"
            data-slot="undo-bar-action"
            onClick={onUndo}
            className="motion-press h-(--size-xl) shrink-0 px-3 font-medium underline underline-offset-4"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
