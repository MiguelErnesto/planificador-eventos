"use client";

import { useEffect, useState } from "react";

/** `null` until mounted (same on server and first client paint — avoids hydration mismatch). */
export function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Gantt sticky label column: 110 (<md) / 160 (md) / 240 (lg+). */
export function useGanttLabelWidth(): number {
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  if (isLg) return 240;
  if (isMd) return 160;
  return 110;
}
