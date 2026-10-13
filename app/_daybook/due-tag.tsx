import { tv } from "tailwind-variants";

import { dueTag } from "@/lib/placement";
import type { Task } from "@/lib/types";

/* Neutral beyond two days, amber within two, red on the day or after
   (spec §2). Status colours use their subdued pairs, which read on every
   background in both modes. */
const tag = tv({
  base: "inline-flex h-5 shrink-0 items-center px-1.5 text-xs font-medium whitespace-nowrap tabular-nums",
  variants: {
    state: {
      later: "px-0 text-muted-foreground",
      soon: "bg-warning-subdued text-warning-subdued-foreground",
      today: "bg-destructive-subdued text-destructive-subdued-foreground",
      overdue: "bg-destructive-subdued text-destructive-subdued-foreground",
    },
  },
});

export function DueTag({ task, today }: { task: Pick<Task, "dueDate" | "done">; today: string }) {
  const due = dueTag(task, today);
  if (!due) return null;
  return (
    <span data-slot="due-tag" className={tag({ state: due.state })}>
      {due.label}
    </span>
  );
}
