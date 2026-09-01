import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo } from "react";
import { BookOpen, School } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PdfFormRenderer } from "@/components/admission/pdf-form-renderer";
import { ADMISSION_CATEGORIES, ADMISSION_VARIANTS, getVariant } from "@/lib/admission-variants";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/components/language-context";
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

  const resolveVariantForCategory = (category: { id: string; name: string; nameUrdu: string; section: string; formVariantKeys?: string[] }) => {
    const sectionKey = category.section === "baneen" || category.section === "male" ? "male" : "female";
    const assigned = category.formVariantKeys ?? [];
    const pool = ADMISSION_VARIANTS.filter((v) => v.category === sectionKey && v.section === "madrassa");
    const matches = assigned.length > 0 ? pool.filter((v) => assigned.includes(v.key)) : pool;
    if (matches.length > 0) return matches[0];
    const normalized = (category.nameUrdu || category.name || category.id).toLowerCase();
    if (normalized.includes("nazara") || normalized.includes("ناظرہ") || normalized.includes("nazira") || normalized.includes("qaida") || normalized.includes("قاعدہ")) {
      return pool.find((v) => v.key.includes("nazira")) ?? null;
    }
    if (normalized.includes("hifiz") || normalized.includes("حفاظ") || normalized.includes("hifz")) {
      return pool.find((v) => v.key.includes("hifz")) ?? null;
    }
    if (normalized.includes("alam") || normalized.includes("علم") || normalized.includes("nizami") || normalized.includes("نظامی")) {
      return pool.find((v) => v.key.includes("general")) ?? null;
    }
    return null;
  };

  const variant = getVariant(variantKey);
  const category = variant ? ADMISSION_CATEGORIES.find((c) => c.key === variant.category) : null;

  if (variant) {
    return (
      <>
        <PageHeader
          title={lang === "ur" ? "نیا داخلہ" : "New Admission"}
          titleUrdu="نیا داخلہ"
          description={lang === "ur" ? (category?.descriptionUrdu ?? variant.titleUrdu) : (category?.descriptionEnglish ?? variant.titleEnglish)}
        />
        <PdfFormRenderer variant={variant} categoryId={categoryId ?? undefined} />
      </>
    );
  }

  if (categoriesLoading) {
    return <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."} className="h-96" />;
  }

  const openCategoryForm = (category: { id: string; name: string; nameUrdu: string; section: string; formVariantKeys?: string[] }) => {
    const resolved = resolveVariantForCategory(category);
    if (resolved) {
      navigate({ to: "/admission/new", search: { variant: resolved.key, categoryId: category.id } });
    }
  };

  const renderMadrassaCard = (category: { id: string; name: string; nameUrdu: string; description: string; descriptionUrdu: string; section: string; formVariantKeys?: string[] }) => {
    const resolved = resolveVariantForCategory(category);
    if (!resolved) return null;
    const displayTitle = lang === "ur" ? (category.nameUrdu || category.name) : (category.name || category.nameUrdu);
    const displaySubtitle = lang === "ur" ? (category.descriptionUrdu || category.description) : (category.description || category.descriptionUrdu);
    return (
      <Card
        className="p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full group"
        onClick={() => openCategoryForm(category)}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base mb-1 truncate">{displayTitle}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{displaySubtitle}</p>
          </div>
        </div>
      </Card>
    );
  };

  const renderSchoolCard = (variantKey: string) => {
    const variant = getVariant(variantKey);
    if (!variant) return null;
    const displayTitle = lang === "ur" ? variant.institutionUrdu : variant.institutionEnglish;
    const displaySubtitle = lang === "ur" ? (variant.subtitleUrdu || variant.titleUrdu) : (variant.subtitleEnglish || variant.titleEnglish);
    return (
      <Card
        className="p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full group"
        onClick={() => navigate({ to: "/admission/new", search: { variant: variant.key } })}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <School className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base mb-1 truncate">{displayTitle}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{displaySubtitle}</p>
          </div>
        </div>
      </Card>
    );
  };

  const maleMadrassaCards = qasimiaCategories.map((c) => ({ ...c, group: "madrassa" }));
  const femaleMadrassaCards = zainabCategories.map((c) => ({ ...c, group: "madrassa" }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={lang === "ur" ? "زمرہ منتخب کریں" : "Select Category"}
        titleUrdu="زمرہ منتخب کریں"
        description={lang === "ur" ? "داخلہ کے لیے زمرہ منتخب کریں" : "Select a category for admission"}
      />

      {maleMadrassaCards.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
            <div>
              <h3 className="text-lg font-semibold">
                {lang === "ur" ? "جامعہ قاسمیہ للبنین" : "Jamia Qasimia lilBanin"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === "ur" ? "مذہبی تعلیم" : "Religious Education"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maleMadrassaCards.map((c) => (
              <div key={c.id}>{renderMadrassaCard(c)}</div>
            ))}
            {renderSchoolCard("school-boys-main")}
          </div>
        </section>
      )}

      {femaleMadrassaCards.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
            <div>
              <h3 className="text-lg font-semibold">
                {lang === "ur" ? "جامعہ زینب للبنات" : "Jamyah Zainab lilbanat"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === "ur" ? "مذہبی تعلیم" : "Religious Education"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {femaleMadrassaCards.map((c) => (
              <div key={c.id}>{renderMadrassaCard(c)}</div>
            ))}
            {renderSchoolCard("school-girls-main")}
          </div>
        </section>
      )}
    </div>
  );
}
