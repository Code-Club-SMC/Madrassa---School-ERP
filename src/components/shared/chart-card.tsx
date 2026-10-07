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

import { useLanguage } from "@/components/language-context";

/** Card wrapper for charts with single-language header based on active language. */
export function ChartCard({ title, titleUrdu, description, actions, children, className, bodyClassName }: Props) {
  const { lang } = useLanguage();
  return (
    <Card className={cn("p-6 flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {lang === "ur" ? (
            <h3 dir="rtl" lang="ur" className="font-urdu text-lg font-bold text-foreground leading-tight">
              {titleUrdu}
            </h3>
          ) : (
            <h3 className="font-heading text-lg font-bold text-foreground leading-tight">
              {title}
            </h3>
          )}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className={cn("w-full h-72", bodyClassName)}>{children}</div>
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
  const { lang } = useLanguage();
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
      {lang === "ur" ? (
        <p dir="rtl" lang="ur" className="font-urdu text-base text-foreground leading-tight">
          {labelUrdu}
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
      )}
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