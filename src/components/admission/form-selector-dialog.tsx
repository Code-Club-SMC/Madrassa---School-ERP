import { useEffect, useMemo, useState } from "react";
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
  type AdmissionVariant,
} from "@/lib/admission-variants";
import { useLanguage } from "@/components/language-context";
import { toast } from "sonner";

const TEXT = {
  ur: {
    selectDepartment: "شعبہ منتخب کریں",
    selectForm: "فارم منتخب کریں",
    chooseForm: "درست فارم منتخب کریں",
    madrassa: "مدرسہ",
    school: "اسکول",
    back: "واپس",
    loadingCategories: "زمرے لوڈ ہو رہے ہیں...",
    noCategories: "کوئی زمرہ نہیں ملا",
  },
  en: {
    selectDepartment: "Choose the section",
    selectForm: "Select Form",
    chooseForm: "Choose the correct form",
    madrassa: "Madrassa",
    school: "School",
    back: "Back",
    loadingCategories: "Loading categories...",
    noCategories: "No categories found",
  },
};

type CategoryOption = {
  id: string;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
  active: boolean;
  section: string;
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
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setSelectedSection(null);
      setCategories([]);
    }
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

  useEffect(() => {
    if (!selectedSection || selectedSection.section !== "madrassa") {
      setCategories([]);
      return;
    }

    let cancelled = false;
    setCategoriesLoading(true);
    fetch(`/api/academic/madrassa/categories?section=${selectedSection.category}`, { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          navigate({ to: "/login", search: { redirect: undefined } });
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load categories");
        if (!cancelled) {
          setCategories((payload.categories ?? []) as CategoryOption[]);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not load categories");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSection, navigate]);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className={`text-2xl leading-loose ${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
            {selectedSection ? t.selectForm : t.selectDepartment}
          </DialogTitle>
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
                        <p className={`text-lg font-semibold leading-loose ${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                          {section.key === "madrassa"
                            ? lang === "ur"
                              ? t.madrassa
                              : t.madrassa
                            : lang === "ur"
                              ? t.school
                              : t.school}
                        </p>
                        <p className={`text-xs text-muted-foreground mt-1 leading-loose ${lang === "ur" ? "text-end font-urdu" : "text-start"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                          {categoryLabel(group.key)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedSection.section === "madrassa" ? (
          <div className="space-y-2 mt-2">
            {categoriesLoading && (
              <p className={`text-sm text-muted-foreground text-center py-4 ${lang === "ur" ? "font-urdu" : ""}`}>{t.loadingCategories}</p>
            )}
            {!categoriesLoading && categories.length === 0 && (
              <p className={`text-sm text-muted-foreground text-center py-4 ${lang === "ur" ? "font-urdu" : ""}`}>{t.noCategories}</p>
            )}
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate({ to: "/admission/new", search: { categoryId: c.id } as never });
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-all",
                  lang === "ur" ? "text-end" : "text-start",
                  "hover:border-primary/60 hover:bg-primary/5",
                )}
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                <div className="min-w-0 flex-1">
                  <p className={`text-base font-semibold leading-loose ${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                    {lang === "ur" ? c.nameUrdu : c.name}
                  </p>
                  {c.description && (
                    <p className={`text-sm text-muted-foreground leading-loose ${lang === "ur" ? "text-end font-urdu" : "text-start"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                      {lang === "ur" ? c.descriptionUrdu : c.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedSection(null); setCategories([]); }} className="gap-1">
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                {lang === "ur" && <span className="font-urdu">{t.back}</span>}
                {lang === "en" && t.back}
              </Button>
            </div>
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
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-all",
                  lang === "ur" ? "text-end" : "text-start",
                  "hover:border-primary/60 hover:bg-primary/5",
                )}
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                <div className="min-w-0 flex-1">
                  <p className={`text-base font-semibold leading-loose ${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                    {lang === "ur" ? v.titleUrdu : v.titleEnglish}
                  </p>
                  {(lang === "ur" ? v.subtitleUrdu : v.subtitleEnglish) && (
                    <p className={`text-sm text-muted-foreground leading-loose ${lang === "ur" ? "text-end font-urdu" : "text-start"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
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
