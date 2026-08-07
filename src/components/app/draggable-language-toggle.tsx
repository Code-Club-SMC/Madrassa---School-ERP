"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/language-context";
import { Button } from "@/components/ui/button";
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
    <Button
      ref={buttonRef}
      variant="secondary"
      size="icon"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      aria-label={`Switch language. Current: ${lang === "ur" ? "Urdu" : "English"}`}
      className={cn(
        "fixed z-50 shadow-lg select-none touch-none",
        "h-10 w-10 rounded-full",
        isDragging ? "cursor-grabbing scale-105" : "cursor-grab",
        className,
      )}
      style={{ left: position.x, top: position.y }}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">{lang === "ur" ? "English" : "اردو"}</span>
      <span className="absolute -top-1 -end-1 inline-flex h-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
        {lang === "ur" ? "EN" : "UR"}
      </span>
    </Button>
  );
}
