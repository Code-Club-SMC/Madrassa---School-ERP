"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/language-context";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  renderLabel?: (lang: "ur" | "en") => ReactNode;
};

export function DraggableLanguageToggle({ className, renderLabel }: Props) {
  const { lang, setLang } = useLanguage();
  const [hasCustomPos, setHasCustomPos] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("msmis-lang-toggle-pos");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { x: number; y: number };
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPosition({ x: parsed.x, y: parsed.y });
          setHasCustomPos(true);
        }
      } catch {}
    }
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // If clicking a button or anything inside a button, do not capture or drag
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);
    setHasCustomPos(true);

    const rect = containerRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : position.x;
    const currentY = rect ? rect.top : position.y;

    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: currentX,
      originY: currentY,
    };
    containerRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    const newX = Math.max(8, Math.min(window.innerWidth - 140, dragStart.current.originX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 50, dragStart.current.originY + dy));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStart.current = null;
    try {
      localStorage.setItem("msmis-lang-toggle-pos", JSON.stringify(position));
    } catch {}
    try {
      containerRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "fixed z-40 select-none w-fit h-fit max-w-fit max-h-fit pointer-events-auto",
        !hasCustomPos ? (className ?? "bottom-4 end-4") : "",
        isDragging ? "cursor-grabbing scale-105" : "cursor-grab",
      )}
      style={
        hasCustomPos
          ? { left: `${position.x}px`, top: `${position.y}px`, bottom: "auto", right: "auto", insetInlineEnd: "auto" }
          : undefined
      }
    >
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-background/95 dark:bg-card/95 backdrop-blur-md border border-border/80 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLang("en");
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer",
            lang === "en"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          <span>English</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLang("ur");
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-150 font-urdu cursor-pointer",
            lang === "ur"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="text-[13px] leading-none">اردو</span>
        </button>
      </div>
    </div>
  );
}
