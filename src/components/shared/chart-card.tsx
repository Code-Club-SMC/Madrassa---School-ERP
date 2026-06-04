import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  titleUrdu: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Card wrapper for charts with bilingual header (English + Urdu RTL). */
export function ChartCard({ title, titleUrdu, description, actions, children, className, bodyClassName }: Props) {
  return (
    <Card className={cn("p-6 flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 dir="rtl" lang="ur" className="font-urdu text-lg font-bold text-foreground leading-tight">
            {titleUrdu}
          </h3>
          <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
            {title}
          </p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className={cn("flex-1 min-h-[260px]", bodyClassName)}>{children}</div>
    </Card>
  );
}

type KpiProps = {
  label: string;
  labelUrdu: string;
  value: string | number;
  delta?: { value: number; positive?: boolean };
  accent?: "default" | "success" | "danger" | "warning";
};

export function KpiCard({ label, labelUrdu, value, delta, accent = "default" }: KpiProps) {
  const accentClass =
    accent === "success"
      ? "text-chart-1"
      : accent === "danger"
        ? "text-destructive"
        : accent === "warning"
          ? "text-chart-3"
          : "text-foreground";
  return (
    <Card className="p-5">
      <p dir="rtl" lang="ur" className="font-urdu text-base text-foreground leading-tight">
        {labelUrdu}
      </p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mt-0.5">{label}</p>
      <div className="flex items-baseline gap-2 mt-3">
        <p className={cn("font-heading text-3xl font-bold tracking-tight", accentClass)}>{value}</p>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              delta.positive ? "text-chart-1" : "text-destructive",
            )}
          >
            {delta.positive ? "▲" : "▼"} {Math.abs(delta.value)}%
          </span>
        )}
      </div>
    </Card>
  );
}