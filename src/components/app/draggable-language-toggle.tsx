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
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("msmis-lang-toggle-pos");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { x: number; y: number };
        setPosition({ x: parsed.x ?? 16, y: parsed.y ?? 16 });
      } catch {}
    }
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      const target = event.target as HTMLElement;
      if (target.tagName === "BUTTON" && !isDragging) return;
    }
    event.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    buttonRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || !dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 40, dragStart.current.originX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 40, dragStart.current.originY + dy)),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    setIsDragging(false);
    dragStart.current = null;
    try {
      localStorage.setItem("msmis-lang-toggle-pos", JSON.stringify(position));
    } catch {}
    buttonRef.current?.releasePointerCapture(event.pointerId);
  };

  const handleClick = () => {
    if (isDragging) return;
    setLang(lang === "ur" ? "en" : "ur");
  };

  return (
    <div
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "fixed z-50 select-none touch-none",
        isDragging ? "cursor-grabbing scale-105" : "cursor-grab",
        className,
      )}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-md border border-border/70 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
        <button
          type="button"
          onClick={() => {
            if (!isDragging) setLang("en");
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150",
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
          onClick={() => {
            if (!isDragging) setLang("ur");
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-150 font-urdu",
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
