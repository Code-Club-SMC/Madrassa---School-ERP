import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ActiveSystem = "madrassa" | "school";
type Ctx = { system: ActiveSystem; setSystem: (s: ActiveSystem) => void };

const SystemCtx = createContext<Ctx>({ system: "madrassa", setSystem: () => {} });

export function SystemProvider({ children }: { children: ReactNode }) {
  const [system, setSystemState] = useState<ActiveSystem>("madrassa");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("msmis-system") : null;
    if (stored === "madrassa" || stored === "school") setSystemState(stored);
  }, []);

  const setSystem = (s: ActiveSystem) => {
    setSystemState(s);
    try {
      localStorage.setItem("msmis-system", s);
    } catch {}
  };

  return <SystemCtx.Provider value={{ system, setSystem }}>{children}</SystemCtx.Provider>;
}

export const useSystem = () => useContext(SystemCtx);