import React from "react";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";

export type AppLoaderSize = "xs" | "sm" | "md" | "lg" | "screen";

export interface AppLoaderProps {
  /** Primary label in English (defaults to "Loading...") */
  text?: string;
  /** Primary label in Urdu (defaults to "براہ کرم انتظار فرمائیں...") */
  textUrdu?: string;
  /** Subtitle/helper text */
  subtitle?: string;
  subtitleUrdu?: string;
  /** Visual scale */
  size?: AppLoaderSize;
  /** Container custom class */
  className?: string;
  /** Center icon motif */
  icon?: "book" | "cap" | "sparkles";
}

export function AppLoader({
  text,
  textUrdu,
  subtitle,
  subtitleUrdu,
  size = "md",
  className,
  icon = "book",
}: AppLoaderProps) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const defaultText = isUrdu ? "لوڈ ہو رہا ہے..." : "Loading...";
  const defaultUrdu = "براہ کرم انتظار فرمائیں...";
  const displayLabel = isUrdu ? (textUrdu || text || defaultUrdu) : (text || defaultText);
  const displaySub = isUrdu ? (subtitleUrdu || subtitle) : subtitle;

  const IconComponent =
    icon === "cap" ? GraduationCap : icon === "sparkles" ? Sparkles : BookOpen;

  if (size === "xs") {
    return (
      <div className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <span className="relative flex h-3.5 w-3.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary" />
        </span>
        <span className={cn(isUrdu && "font-urdu")}>{displayLabel}</span>
      </div>
    );
  }

  const containerSizes: Record<AppLoaderSize, string> = {
    xs: "py-2",
    sm: "py-6 min-h-[120px]",
    md: "py-12 min-h-[220px]",
    lg: "py-16 min-h-[340px]",
    screen: "min-h-[75vh] w-full",
  };

  const badgeSizes: Record<AppLoaderSize, { box: string; icon: string }> = {
    xs: { box: "h-6 w-6", icon: "h-3 w-3" },
    sm: { box: "h-10 w-10", icon: "h-5 w-5" },
    md: { box: "h-14 w-14", icon: "h-7 w-7" },
    lg: { box: "h-18 w-18", icon: "h-9 w-9" },
    screen: { box: "h-16 w-16", icon: "h-8 w-8" },
  };

  const currentBadge = badgeSizes[size] || badgeSizes.md;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 transition-all duration-300",
        containerSizes[size],
        className,
      )}
    >
      {/* Central Animated Branded Badge */}
      <div className="relative mb-3.5">
        {/* Soft background pulse glow */}
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-primary/25 via-emerald-500/20 to-primary/10 blur-md animate-pulse opacity-70" />

        {/* Rotating Conic Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-emerald-500 to-primary/30 opacity-75 animate-spin [animation-duration:3s]" />
          
          <div
            className={cn(
              "relative rounded-xl bg-card border border-border/80 flex items-center justify-center text-primary shadow-sm",
              currentBadge.box,
            )}
          >
            <IconComponent className={cn("text-primary animate-pulse", currentBadge.icon)} />
          </div>
        </div>
      </div>

      {/* Main Text */}
      <p
        className={cn(
          "font-medium text-foreground tracking-tight text-sm",
          size === "lg" || size === "screen" ? "text-base font-semibold" : "",
          isUrdu && "font-urdu text-base",
        )}
      >
        {displayLabel}
      </p>

      {/* Optional Subtitle */}
      {displaySub && (
        <p className={cn("text-xs text-muted-foreground mt-1 max-w-sm", isUrdu && "font-urdu")}>
          {displaySub}
        </p>
      )}

      {/* Pulsing Loading Dots */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce" />
      </div>
    </div>
  );
}

// Backward-compatible alias for existing BookLoader usages
export { AppLoader as BookLoader };
