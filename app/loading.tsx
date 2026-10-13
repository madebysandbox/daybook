/* Skeleton while tasks load: the header and a few empty rows, so nothing jumps. */
export default function Loading() {
  return (
    <div role="status" className="mx-auto max-w-6xl animate-pulse" aria-label="Loading your tasks">
      <div className="h-28 border-b border-border" />
      {Array.from({ length: 6 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <div key={i} className="flex h-(--size-2xl) items-center gap-3 border-b border-border px-4">
          <span className="size-(--size-sm) rounded-full border border-border" />
          <span className="h-3 w-1/2 bg-muted" />
        </div>
      ))}
    </div>
  );
}
