import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "ur" | "en";
type Ctx = { lang: Language; setLang: (l: Language) => void };

const LanguageCtx = createContext<Ctx>({ lang: "ur", setLang: () => {} });

type Props = {
  children: ReactNode;
  initialLang?: Language;
};

export function LanguageProvider({ children, initialLang }: Props) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("msmis-lang");
      if (stored === "en" || stored === "ur") return stored;
    }
    return initialLang ?? "ur";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem("msmis-lang", l);
    } catch {}
    try {
      document.cookie = `msmis-lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LanguageCtx.Provider value={value}>{children}</LanguageCtx.Provider>;
}

export const useLanguage = () => useContext(LanguageCtx);
