/**
 * Pack A button styles: solid primary, strong accent outline, soft danger.
 * Compose with a size token, e.g. `${btn.primary} ${btn.md}`.
 */
export const btn = {
  primary:
    "rounded-lg bg-accent font-medium text-white hover:bg-accent-dark disabled:opacity-50",
  secondary:
    "rounded-lg border-2 border-accent bg-white font-medium text-accent-dark hover:bg-accent/10 disabled:opacity-50",
  danger:
    "rounded-lg border border-red-200 bg-red-50 font-medium text-red-700 hover:bg-red-100 disabled:opacity-50",
  md: "px-3 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
} as const;
