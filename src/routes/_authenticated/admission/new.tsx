import { createFileRoute, Link } from "@tanstack/react-router";
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

const searchSchema = z.object({ variant: z.string().optional(), categoryId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/admission/new")({
  validateSearch: searchSchema,
  component: NewAdmissionRoute,
});

function NewAdmissionRoute() {
  const { variant: variantKey, categoryId } = Route.useSearch();
  const { lang } = useLanguage();

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["admission-category", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const response = await fetch(`/api/academic/madrassa/categories/${categoryId}`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized");
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load category");
      return payload.category as { id: string; name: string; nameUrdu: string; section: string } | null;
    },
    enabled: !!categoryId && !variantKey,
  });

  const resolvedVariantKey = useMemo(() => {
    if (variantKey) return variantKey;
    if (!categoryData) return null;

    const section = categoryData.section === "baneen" || categoryData.section === "male" ? "male" : "female";
    const name = categoryData.name.toLowerCase();
    const nameUrdu = categoryData.nameUrdu.toLowerCase();

    if (name.includes("nazira") || name.includes("qaida") || nameUrdu.includes("ناظرہ") || nameUrdu.includes("قاعدہ")) {
      return section === "male" ? "madrassa-boys-nazira" : "madrassa-girls-nazira";
    }
    if (name.includes("hifz") || nameUrdu.includes("حفظ")) {
      return "madrassa-boys-hifz";
    }
    return section === "male" ? "madrassa-boys-general" : "madrassa-girls-general";
  }, [variantKey, categoryData]);

  const variant = getVariant(resolvedVariantKey);
  const category = variant ? ADMISSION_CATEGORIES.find((c) => c.key === variant.category) : null;

  if (variant) {
    return (
      <>
        <PageHeader
          title="New Admission"
          titleUrdu="نیا داخلہ"
          description={lang === "ur" ? (category?.descriptionUrdu ?? variant.titleUrdu) : variant.titleEnglish}
        />
        <PdfFormRenderer variant={variant} categoryId={categoryId ?? undefined} />
      </>
    );
  }

  if (categoryLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  return (
    <>
      <PageHeader
        title="Choose Admission Form"
        titleUrdu="داخلہ فارم منتخب کریں"
        description={lang === "ur" ? "داخلہ فارم اور شعبہ منتخب کریں" : "Select the department and exact official form before entering admission details."}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ADMISSION_CATEGORIES.map((category) => {
          const variants = ADMISSION_VARIANTS.filter((variant) => variant.category === category.key);
          return (
            <Card key={category.key} className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                  {category.icon}
                </div>
                <div className="min-w-0">
                  <h2 className={`text-lg font-semibold leading-loose ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                    {lang === "ur" ? category.labelUrdu : category.labelEnglish}
                  </h2>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{lang === "ur" ? category.descriptionUrdu : category.descriptionEnglish}</p>
                </div>
              </div>
              <div className="space-y-2">
                {variants.map((variant) => (
                  <Button key={variant.key} asChild variant="outline" className="h-auto w-full justify-between gap-3 py-3 text-end">
                    <Link to="/admission/new" search={{ variant: variant.key }}>
                      <ChevronLeft className="h-4 w-4 shrink-0 rtl:rotate-180" />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-loose ${lang === "ur" ? "font-urdu" : "font-heading"}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                          {lang === "ur" ? variant.titleUrdu : variant.titleEnglish}
                        </span>
                        {(lang === "ur" ? variant.subtitleUrdu : variant.subtitleEnglish) && (
                          <span className={`block text-xs text-muted-foreground leading-loose ${lang === "ur" ? "font-urdu" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
                            {lang === "ur" ? variant.subtitleUrdu : variant.subtitleEnglish}
                          </span>
                        )}
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
