import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-context";

type Props = {
  icon: LucideIcon;
  value: string;
  label: string;
  labelUrdu: string;
  subline?: string;
  trend?: { direction: "up" | "down"; value: string };
  sparkline?: Array<{ x: number; y: number }>;
  tone?: "default" | "destructive";
};

export function KpiCard({ icon: Icon, value, label, labelUrdu, subline, trend, sparkline, tone = "default" }: Props) {
  const { lang } = useLanguage();
  return (
    <Card className="p-4 sm:p-5 border-border/70 hover:shadow-xs transition-shadow min-w-0 overflow-hidden flex flex-col justify-between">
      <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
        <div className="rounded-xl bg-primary/10 p-2 sm:p-2.5 shrink-0">
          <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-heading text-lg sm:text-xl lg:text-2xl font-bold tracking-tight tabular-nums truncate",
              tone === "destructive" && "text-destructive",
            )}
            title={value}
          >
            {value}
          </p>
          {lang === "ur" ? (
            <p dir="rtl" lang="ur" className="font-urdu text-sm sm:text-base text-foreground leading-snug mt-0.5 truncate" title={labelUrdu}>
              {labelUrdu}
            </p>
          ) : (
            <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground truncate" title={label}>
              {label}
            </p>
          )}
          {subline && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate" title={subline}>
              {subline}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                "text-[11px] mt-1 inline-flex items-center gap-1 truncate",
                trend.direction === "up" ? "text-chart-3" : "text-destructive",
              )}
            >
              {trend.direction === "up" ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
      </div>
      {sparkline && (
        <div className="h-10 -mx-2 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                fill={`url(#spark-${label.replace(/\s/g, "")})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}