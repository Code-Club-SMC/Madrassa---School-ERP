import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMISSION_CATEGORIES,
  ADMISSION_VARIANTS,
  type AdmissionCategoryKey,
} from "@/lib/admission-variants";
import { useLanguage } from "@/components/language-context";

const TEXT = {
  ur: {
    selectDepartment: "شعبہ منتخب کریں",
    selectForm: "فارم منتخب کریں",
    chooseDepartment: "شعبہ منتخب کریں",
    chooseForm: "فارم منتخب کریں",
    back: "واپس",
  },
  en: {
    selectDepartment: "Choose the department",
    selectForm: "Choose the specific admission form",
    chooseDepartment: "Choose the department for this admission",
    chooseForm: "Choose the specific admission form",
    back: "Back",
  },
};

export function AdmissionFormSelectorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const navigate = useNavigate();
  const [category, setCategory] = useState<AdmissionCategoryKey | null>(null);

  const reset = () => setCategory(null);
  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  };

  const variants = category ? ADMISSION_VARIANTS.filter((v) => v.category === category) : [];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className={`text-2xl leading-loose text-end ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
            {category ? t.selectForm : t.selectDepartment}
          </DialogTitle>
          <DialogDescription className="text-end">
            {category ? t.chooseForm : t.chooseDepartment}
          </DialogDescription>
        </DialogHeader>

        {!category ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {ADMISSION_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={cn(
                  "group rounded-2xl border-2 border-border p-5 text-center transition-all",
                  "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                )}
              >
                <div className="text-4xl mb-3">{c.icon}</div>
                <p className={`text-lg font-semibold leading-loose ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                  {lang === "ur" ? c.labelUrdu : c.labelEnglish}
                </p>
                <p className={`text-xs text-muted-foreground mt-2 leading-loose ${lang === "ur" ? "font-urdu" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                  {lang === "ur" ? c.descriptionUrdu : c.descriptionEnglish}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {variants.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate({ to: "/admission/new", search: { variant: v.key } as never });
                }}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-end hover:border-primary/60 hover:bg-primary/5 transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                <div className="min-w-0 flex-1">
                  <p className={`text-base font-semibold leading-loose ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                    {lang === "ur" ? v.titleUrdu : v.titleEnglish}
                  </p>
                  {(lang === "ur" ? v.subtitleUrdu : v.subtitleEnglish) && (
                    <p className={`text-sm text-muted-foreground leading-loose ${lang === "ur" ? "font-urdu" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                      {lang === "ur" ? v.subtitleUrdu : v.subtitleEnglish}
                    </p>
                  )}
                </div>
              </button>
            ))}
            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {lang === "ur" && <span className="font-urdu">{t.back}</span>}
                {lang === "en" && t.back}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}