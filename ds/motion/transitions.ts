import type { Transition } from "motion/react";

/* From scale.css: if a value here and the token differ, this file is the
   one that is wrong. Seconds, because Motion takes seconds. */
export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
} as const;

/* The token beziers, as Motion's four-number form. */
export const EASE = {
  out: [0.2, 0, 0, 1],
  in: [0.4, 0, 1, 1],
  inOut: [0.4, 0, 0.2, 1],
} as const;

/* The two springs, as damping RATIO and stiffness, the same two numbers the
   CSS easings were generated from. Motion wants a damping coefficient, which
   for unit mass is 2·ζ·√k, so the conversion lives here and nowhere else. */
const spring = (ratio: number, stiffness: number): Transition => ({
  type: "spring",
  stiffness,
  damping: 2 * ratio * Math.sqrt(stiffness),
  mass: 1,
});

export const SPRING = {
  snap: spring(0.9, 700),
  settle: spring(0.8, 380),
} as const;

/* One token, 40ms; the group cap is enforced by the eighth-item rule in
   rise-group and mirrored here by the caller passing at most eight. */
export const STAGGER = 0.04;

/* The presets Motion owns. */
export const PRESET = {
  rise: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.base, ease: EASE.out },
  },
  settle: SPRING.settle,
  swapIn: { duration: DURATION.base, ease: EASE.out },
  swapOut: { duration: DURATION.fast, ease: EASE.in },
  tick: { duration: DURATION.base, ease: EASE.out },
} as const;
