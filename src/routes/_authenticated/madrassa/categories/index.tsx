import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BookLoader } from "@/components/shared/book-loader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/madrassa/categories/")({
  component: CategoriesPage,
});

type MadrassaCategory = {
  id: string;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
  displayOrder: number;
  active: boolean;
  section: string;
  formVariantKeys: string[];
  subcategories?: { id: string }[];
};

const STATIC_CATEGORIES: MadrassaCategory[] = [
  {
    id: "nazara_male",
    name: "Nazara",
    nameUrdu: "ناظرہ",
    description: "Nazara / Qaida category",
    descriptionUrdu: "ناظرہ / قاعدہ زمرہ",
    displayOrder: 1,
    active: true,
    section: "male",
    formVariantKeys: [],
  },
  {
    id: "hifiz_male",
    name: "Hifiz",
    nameUrdu: "حفاظ",
    description: "Hifiz / Memorization category",
    descriptionUrdu: "حفظ زمرہ",
    displayOrder: 2,
    active: true,
    section: "male",
    formVariantKeys: [],
  },
  {
    id: "alam_male",
    name: "Alam",
    nameUrdu: "علم",
    description: "Alam / Dars-e-Nizami category",
    descriptionUrdu: "علم / درس نظامی زمرہ",
    displayOrder: 3,
    active: true,
    section: "male",
    formVariantKeys: [],
  },
  {
    id: "nazara_female",
    name: "Nazara",
    nameUrdu: "ناظرہ",
    description: "Nazara / Qaida category",
    descriptionUrdu: "ناظرہ / قاعدہ زمرہ",
    displayOrder: 1,
    active: true,
    section: "female",
    formVariantKeys: [],
  },
  {
    id: "alam_female",
    name: "Alam",
    nameUrdu: "علم",
    description: "Alam / Dars-e-Nizami category",
    descriptionUrdu: "علم / درس نظامی زمرہ",
    displayOrder: 2,
    active: true,
    section: "female",
    formVariantKeys: [],
  },
];

function CategoriesPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { gender } = useSystem();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const t = useMemo(() => (en: string, ur: string) => (isUrdu ? ur : en), [isUrdu]);

  const [categories, setCategories] = useState<MadrassaCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("section", gender);
      const response = await fetch(`/api/academic/madrassa/categories?${params.toString()}`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load categories");
      const serverCategories = (payload.categories ?? []) as MadrassaCategory[];
      
      const merged = STATIC_CATEGORIES.map((staticCat) => {
        const serverCat = serverCategories.find((c) => c.id === staticCat.id);
        return serverCat ? { ...staticCat, subcategories: serverCat.subcategories } : staticCat;
      });
      
      setCategories(merged);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, [navigate, gender]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: undefined } });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!user) {
    return null;
  }

  const visibleCategories = categories.filter((c) => {
    const dbSection = c.section === "baneen" || c.section === "male" ? "male" : c.section === "banat" || c.section === "female" ? "female" : c.section;
    return dbSection === gender;
  });

  return (
    <div>
      <PageHeader
        title={t("Madrassa Categories", "مدرسہ کے زمرے")}
        titleUrdu="مدرسہ کے زمرے"
        description={t("Fixed categories for madrassa: Nazara, Hifiz, and Alam.", "مدرسہ کے مستحکب زمرے: ناظرہ، حفاظ، اور علم۔")}
      />

      {loading && <Card className="p-5 text-sm text-muted-foreground">{t("Loading categories...", "زمرے لوڈ ہو رہے ہیں...")}</Card>}
      {!loading && visibleCategories.length === 0 && (
        <Card className="p-5 text-sm text-muted-foreground">
          {t("No categories found.", "کوئی زمرہ نہیں ملا۔")}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleCategories.map((c) => (
          <Card key={c.id} className="p-5 hover:border-primary/40 transition-colors h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-urdu text-xl font-semibold truncate">{c.nameUrdu || c.name}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5 truncate">{c.name || c.nameUrdu}</p>
              </div>
              <div className="ms-2">
                <Badge variant="default" className="text-[10px]">
                  {t("Active", "فعال")}
                </Badge>
              </div>
            </div>
            {c.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.descriptionUrdu || c.description}</p>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {(c.subcategories?.length ?? 0)} {t("classes", "کلاسز")}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
