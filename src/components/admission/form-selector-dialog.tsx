import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
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
  type AdmissionSectionKey,
} from "@/lib/admission-variants";
import { useLanguage } from "@/components/language-context";

const TEXT = {
  ur: {
    selectDepartment: "شعبہ منتخب کریں",
    chooseDepartment: "شعبہ منتخب کریں",
    madrassa: "مدرسہ",
    school: "اسکول",
    back: "واپس",
  },
  en: {
    selectDepartment: "Choose the section",
    chooseDepartment: "Choose the section for this admission",
    madrassa: "Madrassa",
    school: "School",
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
  const [selectedSection, setSelectedSection] = useState<{ category: AdmissionCategoryKey; section: AdmissionSectionKey } | null>(null);

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setSelectedSection(null);
  };

  const institutionVariants = useMemo(() => {
    const grouped = new Map<AdmissionCategoryKey, AdmissionVariant[]>();
    for (const v of ADMISSION_VARIANTS) {
      const arr = grouped.get(v.category) ?? [];
      arr.push(v);
      grouped.set(v.category, arr);
    }
    return Array.from(grouped.entries()).map(([key, items]) => ({ key, items }));
  }, []);

  const sectionsFor = (items: AdmissionVariant[]) => {
    const grouped = new Map<AdmissionSectionKey, AdmissionVariant[]>();
    for (const v of items) {
      const arr = grouped.get(v.section) ?? [];
      arr.push(v);
      grouped.set(v.section, arr);
    }
    return Array.from(grouped.entries()).map(([key, items]) => ({ key, items }));
  };

  const selectedVariants = selectedSection
    ? ADMISSION_VARIANTS.filter((v) => v.category === selectedSection.category && v.section === selectedSection.section)
    : [];

  const categoryLabel = (key: AdmissionCategoryKey) => {
    const c = ADMISSION_CATEGORIES.find((c) => c.key === key);
    return c ? (lang === "ur" ? c.labelUrdu : c.labelEnglish) : key;
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className={`text-2xl leading-loose text-end ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
            {selectedSection ? t.selectForm : t.selectDepartment}
          </DialogTitle>
          <DialogDescription className="text-end">
            {selectedSection ? t.chooseForm : t.chooseDepartment}
          </DialogDescription>
        </DialogHeader>

        {!selectedSection ? (
          <div className="space-y-5 mt-2">
            {institutionVariants.map((group) => {
              const category = ADMISSION_CATEGORIES.find((c) => c.key === group.key);
              if (!category) return null;
              const sections = sectionsFor(group.items);

              return (
                <div key={group.key}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {lang === "ur" ? category.labelUrdu : category.labelEnglish}
                    </p>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sections.map((section) => (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => {
                          if (section.key === "school") {
                            const schoolVariants = ADMISSION_VARIANTS.filter((v) => v.category === group.key && v.section === "school");
                            if (schoolVariants.length > 0) {
                              onOpenChange(false);
                              navigate({ to: "/admission/new", search: { variant: schoolVariants[0].key } as never });
                              return;
                            }
                          }
                          setSelectedSection({ category: group.key, section: section.key });
                        }}
                        className={cn(
                          "w-full rounded-xl border-2 border-border p-5 text-center transition-all",
                          "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                        )}
                      >
                        <p className={`text-lg font-semibold leading-loose ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                          {section.key === "madrassa"
                            ? lang === "ur"
                              ? t.madrassa
                              : t.madrassa
                            : lang === "ur"
                              ? t.school
                              : t.school}
                        </p>
                        <p className={`text-xs text-muted-foreground mt-1 leading-loose ${lang === "ur" ? "font-urdu" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                          {categoryLabel(group.key)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {selectedVariants.map((v) => (
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
              <Button variant="ghost" size="sm" onClick={() => setSelectedSection(null)} className="gap-1">
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
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
