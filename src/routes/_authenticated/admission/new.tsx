import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PdfFormRenderer } from "@/components/admission/pdf-form-renderer";
import {
  ADMISSION_CATEGORIES,
  ADMISSION_VARIANTS,
  getVariant,
} from "@/lib/admission-variants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookLoader } from "@/components/shared/book-loader";
import { useSystem } from "@/components/system-context";

const searchSchema = z.object({ variant: z.string().optional() });

export const Route = createFileRoute("/_authenticated/admission/new")({
  validateSearch: searchSchema,
  component: NewAdmissionRoute,
});

function NewAdmissionRoute() {
  const { variant: variantKey } = Route.useSearch();
  const { lang } = useLanguage();
  const { gender } = useSystem();
  const navigate = useNavigate();

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admission-categories-list-all"],
    queryFn: async () => {
      const response = await fetch(`/api/academic/madrassa/categories`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized");
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load categories");
      return (payload.categories ?? []) as { id: string; name: string; nameUrdu: string; description: string; descriptionUrdu: string; section: string; formVariantKeys?: string[] }[];
    },
    enabled: !variantKey,
  });

  const qasimiaCategories = useMemo(() => (categoriesData ?? []).filter((c) => {
    const dbSection = c.section === "baneen" || c.section === "male" ? "male" : c.section === "banat" || c.section === "female" ? "female" : c.section;
    return dbSection === "male";
  }), [categoriesData]);

  const zainabCategories = useMemo(() => (categoriesData ?? []).filter((c) => {
    const dbSection = c.section === "baneen" || c.section === "male" ? "male" : c.section === "banat" || c.section === "female" ? "female" : c.section;
    return dbSection === "female";
  }), [categoriesData]);

  const variantsForCategory = (category: { section: string; formVariantKeys?: string[] }) => {
    const sectionKey = category.section === "baneen" || category.section === "male" ? "male" : "female";
    const assigned = category.formVariantKeys ?? [];
    const pool = ADMISSION_VARIANTS.filter((v) => v.category === sectionKey && v.section === "madrassa");
    if (assigned.length > 0) {
      return pool.filter((v) => assigned.includes(v.key));
    }
    return pool;
  };

  const variant = getVariant(variantKey);
  const category = variant ? ADMISSION_CATEGORIES.find((c) => c.key === variant.category) : null;

  if (variant) {
    return (
      <>
        <PageHeader
          title="New Admission"
          titleUrdu="نیا داخلہ"
          description={lang === "ur" ? (category?.descriptionUrdu ?? variant.titleUrdu) : variant.titleEnglish}
        />
        <PdfFormRenderer variant={variant} />
      </>
    );
  }

  if (categoriesLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  const renderCategorySection = (title: string, categories: { id: string; name: string; nameUrdu: string; description: string; descriptionUrdu: string; section: string; formVariantKeys?: string[] }[]) => {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3 font-urdu">{title}</h3>
        {categories.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">
            {lang === "ur" ? "کوئی زمرہ نہیں ملا" : "No categories found"}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => {
              const forms = variantsForCategory(c);
              return (
                <Card key={c.id} className="p-5 hover:border-primary/40 transition-colors h-full">
                  <div className="mb-3">
                    <p className="font-urdu text-xl font-semibold">{c.nameUrdu || c.name}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.name || c.nameUrdu}</p>
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.descriptionUrdu || c.description}</p>
                  )}
                  <div className="space-y-2">
                    {forms.map((v) => (
                      <Button
                        key={v.key}
                        variant="outline"
                        className="w-full justify-between gap-3 py-3 text-end h-auto"
                        onClick={() => navigate({ to: "/admission/new", search: { variant: v.key } })}
                      >
                        <ChevronLeft className="h-4 w-4 shrink-0 rtl:rotate-180" />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm leading-loose ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                            {lang === "ur" ? v.titleUrdu : v.titleEnglish}
                          </span>
                          {(lang === "ur" ? v.subtitleUrdu : v.subtitleEnglish) && (
                            <span className={`block text-xs text-muted-foreground leading-loose ${lang === "ur" ? "font-urdu" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                              {lang === "ur" ? v.subtitleUrdu : v.subtitleEnglish}
                            </span>
                          )}
                        </span>
                      </Button>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title={lang === "ur" ? "زمرہ منتخب کریں" : "Select Category"}
        titleUrdu="زمرہ منتخب کریں"
        description={lang === "ur" ? "داخلہ کے لیے زمرہ اور فارم منتخب کریں" : "Select a category and admission form"}
      />
      <div className="space-y-6">
        {renderCategorySection("جامعہ قاسمیہ للبنین", qasimiaCategories)}
        {renderCategorySection("جامعہ زینب للبنات", zainabCategories)}
      </div>
    </>
  );
}
