import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type GenderSection = "male" | "female";
export type ActiveModule = "madrassa" | "school";

type Ctx = {
  gender: GenderSection;
  setGender: (g: GenderSection) => void;
  module: ActiveModule;
  setModule: (m: ActiveModule) => void;
};

const SystemCtx = createContext<Ctx>({ gender: "male", setGender: () => {}, module: "madrassa", setModule: () => {} });

export function SystemProvider({ children }: { children: ReactNode }) {
  const [gender, setGenderState] = useState<GenderSection>("male");
  const [module, setModuleState] = useState<ActiveModule>("madrassa");

  useEffect(() => {
    const storedGender = typeof window !== "undefined" ? localStorage.getItem("msmis-gender") : null;
    if (storedGender === "male" || storedGender === "female") setGenderState(storedGender);
    const storedModule = typeof window !== "undefined" ? localStorage.getItem("msmis-module") : null;
    if (storedModule === "madrassa" || storedModule === "school") setModuleState(storedModule);
  }, []);

  const setGender = useCallback((g: GenderSection) => {
    setGenderState(g);
    try {
      localStorage.setItem("msmis-gender", g);
    } catch {}
  }, []);

  const setModule = useCallback((m: ActiveModule) => {
    setModuleState(m);
    try {
      localStorage.setItem("msmis-module", m);
    } catch {}
  }, []);

  const value = useMemo(() => ({ gender, setGender, module, setModule }), [gender, setGender, module, setModule]);

  return <SystemCtx.Provider value={value}>{children}</SystemCtx.Provider>;
}

export const useSystem = () => useContext(SystemCtx);
