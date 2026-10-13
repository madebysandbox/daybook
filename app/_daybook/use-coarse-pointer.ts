"use client";

import { useSyncExternalStore } from "react";

/* Touch screens get swipes; mice get hover actions and keys. */
const query = "(pointer: coarse)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
