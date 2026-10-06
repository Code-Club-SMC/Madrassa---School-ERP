import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/language-context";

type Props = {
  urdu: string;
  english: string;
  htmlFor?: string;
  required?: boolean;
  lang?: "ur" | "en";
  children?: ReactNode;
};

export function BilingualLabel({ urdu, english, htmlFor, required, lang, children }: Props) {
  const { lang: ctxLang } = useLanguage();
  const activeLang = lang ?? ctxLang;
  const isUrdu = activeLang === "ur";
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} dir={isUrdu ? "rtl" : "ltr"} lang={isUrdu ? "ur" : "en"} className={`${isUrdu ? "font-urdu" : "font-heading"} text-base text-foreground leading-tight`}>
        {isUrdu ? urdu : english}
        {required && <span className="text-destructive ms-1">*</span>}
      </Label>
      {children}
    </div>
  );
}