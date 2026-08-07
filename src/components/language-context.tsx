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
  const [lang, setLangState] = useState<Language>(initialLang ?? "ur");

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ur" ? "rtl" : "ltr";
    try {
      localStorage.setItem("msmis-lang", lang);
    } catch {}
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LanguageCtx.Provider value={value}>{children}</LanguageCtx.Provider>;
}

export const useLanguage = () => useContext(LanguageCtx);
