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
import { useSession } from "@/hooks/use-session";
import type { UserRole } from "@/types";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { system, setSystem } = useSystem();
  const { toggle } = useTheme();
  const { user } = useSession();
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
      <CommandInput placeholder="Search pages, actions… — تلاش کریں" />
      <CommandList>
        <CommandEmpty>No results — کوئی نتیجہ نہیں</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { setSystem(system === "madrassa" ? "school" : "madrassa"); onOpenChange(false); }}>
            <ArrowLeftRight className="me-2 h-4 w-4" />
            Switch to {system === "madrassa" ? "School" : "Madrassa"}
            <span className="font-urdu ms-2 text-muted-foreground">{system === "madrassa" ? "اسکول" : "مدرسہ"}</span>
          </CommandItem>
          <CommandItem onSelect={() => { toggle(); onOpenChange(false); }}>
            <Sun className="me-2 h-4 w-4 dark:hidden" />
            <Moon className="me-2 h-4 w-4 hidden dark:inline" />
            Toggle theme
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {groups.map((g) => {
          const items = visible.filter((i) => i.group === g);
          if (items.length === 0) return null;
          return (
            <CommandGroup key={g} heading={g === "admin" ? "Admin" : g === "shared" ? "Shared" : g === "madrassa" ? "Madrassa — مدرسہ" : g === "school" ? "School — اسکول" : "Global"}>
              {items.map((i) => (
                <CommandItem key={i.url} onSelect={() => go(i.url)} value={`${i.en} ${i.ur} ${i.url}`}>
                  <i.icon className="me-2 h-4 w-4" />
                  <span>{i.en}</span>
                  <span className="font-urdu ms-auto text-muted-foreground">{i.ur}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
