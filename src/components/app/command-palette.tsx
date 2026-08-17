import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Moon, Sun, ArrowLeftRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { navItems } from "@/lib/nav-config";
import { useSystem } from "@/components/system-context";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { module, setModule } = useSystem();
  const { toggle } = useTheme();
  const { lang, setLang } = useLanguage();
  const { user } = useAuth();
  const role = (user?.role ?? "parent") as UserRole;

  // ⌘K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (url: string) => {
    onOpenChange(false);
    navigate({ to: url });
  };

  const visible = navItems.filter((i) => !i.roles || i.roles.includes(role));
  const groups = ["global", "madrassa", "school", "shared", "admin"] as const;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={lang === "ur" ? "صفحات، اعمال تلاش کریں" : "Search pages, actions…"}
      />
      <CommandList>
        <CommandEmpty>{lang === "ur" ? "کوئی نتیجہ نہیں" : "No results"}</CommandEmpty>

        <CommandGroup heading={lang === "ur" ? "اعمال" : "Actions"}>
          <CommandItem
            onSelect={() => {
              setModule(module === "madrassa" ? "school" : "madrassa");
              onOpenChange(false);
            }}
          >
            <ArrowLeftRight className="me-2 h-4 w-4" />
            {lang === "ur"
              ? module === "madrassa"
                ? "اسکول میں جائیں"
                : "مدرسہ میں جائیں"
              : `Switch to ${module === "madrassa" ? "School" : "Madrassa"}`}
            <span className="font-urdu ms-2 text-muted-foreground">
              {module === "madrassa" ? "اسکول" : "مدرسہ"}
            </span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              toggle();
              onOpenChange(false);
            }}
          >
            <Sun className="me-2 h-4 w-4 dark:hidden" />
            <Moon className="me-2 h-4 w-4 hidden dark:inline" />
            {lang === "ur" ? "تھیم تبدیل کریں" : "Toggle theme"}
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setLang(lang === "ur" ? "en" : "ur");
              onOpenChange(false);
            }}
          >
            <span className="me-2 text-xs font-bold">{lang === "ur" ? "EN" : "اردو"}</span>
            {lang === "ur" ? "انگریزی میں دیکھیں" : "اردو میں دیکھیں"}
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {groups.map((g) => {
          const items = visible.filter((i) => i.group === g);
          if (items.length === 0) return null;
          const heading =
            g === "admin"
              ? lang === "ur"
                ? "انتظامیہ"
                : "Admin"
              : g === "shared"
                ? lang === "ur"
                  ? "مشترکہ"
                  : "Shared"
                : g === "madrassa"
                  ? lang === "ur"
                    ? "مدرسہ"
                    : "Madrassa"
                  : g === "school"
                    ? lang === "ur"
                      ? "اسکول"
                      : "School"
                    : lang === "ur"
                      ? "عمومی"
                      : "Global";
          return (
            <CommandGroup key={g} heading={heading}>
              {items.map((i) => (
                <CommandItem
                  key={i.url}
                  onSelect={() => go(i.url)}
                  value={`${i.en} ${i.ur} ${i.url}`}
                >
                  <i.icon className="me-2 h-4 w-4" />
                  <span>{lang === "ur" ? i.ur : i.en}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
