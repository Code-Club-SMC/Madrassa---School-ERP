import type { CSSProperties } from "react";

// Chart color palette + shared tooltip styling for Recharts.
// IMPORTANT: tokens in src/styles.css are defined as oklch(...) directly,
// so DO NOT wrap them in hsl(). Use var(--chart-N) raw.

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const TOOLTIP_STYLE: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
};

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--foreground)",
  fontWeight: 600,
};

export const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
};