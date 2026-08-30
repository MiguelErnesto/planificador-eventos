const DEFAULT_MS = 350;

type TapState = { id: string; t: number };

/**
 * On coarse/narrow UIs, require two taps on the same id within `windowMs`.
 * On desktop (`requireDouble === false`), always selects immediately.
 * Returns whether a select should fire now.
 */
export function registerTap(
  state: { current: TapState | null },
  id: string,
  requireDouble: boolean,
  windowMs = DEFAULT_MS,
): boolean {
  if (!requireDouble) {
    state.current = null;
    return true;
  }
  const now = Date.now();
  if (state.current?.id === id && now - state.current.t < windowMs) {
    state.current = null;
    return true;
  }
  state.current = { id, t: now };
  return false;
}
