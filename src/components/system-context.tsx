import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ActiveSystem = "madrassa" | "school";
type Ctx = { system: ActiveSystem; setSystem: (s: ActiveSystem) => void };

const SystemCtx = createContext<Ctx>({ system: "madrassa", setSystem: () => {} });

export function SystemProvider({ children }: { children: ReactNode }) {
  const [system, setSystemState] = useState<ActiveSystem>("madrassa");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("msmis-system") : null;
    if (stored === "madrassa" || stored === "school") setSystemState(stored);
  }, []);

  const setSystem = useCallback((s: ActiveSystem) => {
    setSystemState(s);
    try {
      localStorage.setItem("msmis-system", s);
    } catch {}
  }, []);

  const value = useMemo(() => ({ system, setSystem }), [system, setSystem]);

  return <SystemCtx.Provider value={value}>{children}</SystemCtx.Provider>;
}

export const useSystem = () => useContext(SystemCtx);
