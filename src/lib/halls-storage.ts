import { buildMockStudentsForHalls, type MockHall } from "@/lib/mock/seating";
import type { SeatingStudent } from "@/lib/seating";

export type Hall = MockHall & {
  nameUrdu?: string;
  aisleEveryRow: number;
  aisleEveryCol: number;
};

const DEFAULTS: Hall[] = [];

function storageKey(module: "school" | "madrassa") {
  return `msmis.halls.${module}`;
}

export function loadHalls(module: "school" | "madrassa"): Hall[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(module));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Hall[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveHalls(module: "school" | "madrassa", halls: Hall[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(module), JSON.stringify(halls));
  } catch {
    /* ignore */
  }
}

export function studentsForHalls(halls: Hall[]): Record<string, SeatingStudent[]> {
  return buildMockStudentsForHalls(halls);
}

export function makeHallId(name: string): string {
  return (
    "hall-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}