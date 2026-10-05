import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DirectionProvider } from "@radix-ui/react-direction";

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

  const dir = lang === "ur" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    root.setAttribute("data-lang", lang);
    root.setAttribute("data-direction", dir);
    if (document.body) {
      document.body.lang = lang;
      document.body.dir = dir;
    }
  }, [lang, dir]);

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

  return (
    <LanguageCtx.Provider value={value}>
      <DirectionProvider dir={dir}>
        {children}
      </DirectionProvider>
    </LanguageCtx.Provider>
  );
}

export const useLanguage = () => useContext(LanguageCtx);
