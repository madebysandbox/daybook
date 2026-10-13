"use client";

import { Button } from "@ds/button/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl leading-tight font-light tracking-tight">Daybook couldn't load your tasks.</h1>
      <p className="text-muted-foreground">Check your connection, then try again. Nothing you saved has been lost.</p>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
