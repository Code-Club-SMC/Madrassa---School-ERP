import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BookLoader } from "@/components/shared/book-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { cn } from "@/lib/utils";
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
  subcategories?: Array<{
    id: string;
    name: string;
    nameUrdu: string;
    rollPrefix: string;
    section: string;
  }>;
};

function CategoriesPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { gender } = useSystem();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const t = useMemo(() => (en: string, ur: string) => (isUrdu ? ur : en), [isUrdu]);

  const [categories, setCategories] = useState<MadrassaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formUrdu, setFormUrdu] = useState("");
  const [formEnglish, setFormEnglish] = useState("");
  const [formRollPrefix, setFormRollPrefix] = useState("");
  const [formDarja, setFormDarja] = useState("");
  const [formFee, setFormFee] = useState("");

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
      setCategories(serverCategories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, [navigate, gender]);

  const resetForm = useCallback(() => {
    setFormUrdu("");
    setFormEnglish("");
    setFormRollPrefix("");
    setFormDarja("");
    setFormFee("");
  }, []);

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

  const selectedCategory = visibleCategories.find((c) => c.id === selectedCategoryId) ?? null;
  const selectedSubcategories = selectedCategory?.subcategories ?? [];

  const openClass = (classId: string) => {
    navigate({ to: "/madrassa/classes/$classId", params: { classId } });
  };

  const confirmDeleteClass = (subcategoryId: string) => {
    setDeletingId(subcategoryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!deletingId || !selectedCategoryId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/academic/madrassa/categories/${selectedCategoryId}/subcategories/${deletingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete class");
      toast.success(t("Class deleted", "کلاس حذف ہو گئی"));
      setDeleteDialogOpen(false);
      setDeletingId(null);
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete class");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddClass = async () => {
    if (!selectedCategoryId || !selectedCategory) return;
    const name = formEnglish.trim() || formUrdu.trim();
    const nameUrdu = formUrdu.trim() || formEnglish.trim();
    if (!name || !nameUrdu) {
      toast.error(t("Name required", "نام درکار ہے"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/academic/madrassa/categories/${selectedCategoryId}/subcategories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          nameUrdu,
          rollPrefix: formRollPrefix.trim() || undefined,
          darja: formDarja.trim() || null,
          fee: formFee ? Number(formFee) : null,
          section: selectedCategory.section === "banat" || selectedCategory.section === "female" ? "female" : "male",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add class");
      toast.success(t("Class added", "کلاس شامل کر دی گئی"));
      resetForm();
      setAddOpen(false);
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add class");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("Madrassa Categories", "مدرسہ کے زمرے")}
        titleUrdu="مدرسہ کے زمرے"
        description={t("Manage madrassa categories and their classes.", "مدرسہ کے زمرے اور ان کی کلاسز کا انتظام کریں۔")}
      />

      {loading && <Card className="p-5 text-sm text-muted-foreground">{t("Loading categories...", "زمرے لوڈ ہو رہے ہیں...")}</Card>}
      {!loading && visibleCategories.length === 0 && (
        <Card className="p-5 text-sm text-muted-foreground">
          {t("No categories found.", "کوئی زمرہ نہیں ملا۔")}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleCategories.map((c) => (
          <Card
            key={c.id}
            className={`p-5 hover:border-primary/40 transition-colors h-full cursor-pointer ${selectedCategoryId === c.id ? "border-primary" : ""}`}
            onClick={() => setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)}
          >
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

      {selectedCategory && (
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{selectedCategory.nameUrdu || selectedCategory.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedCategory.descriptionUrdu || selectedCategory.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{selectedSubcategories.length} classes</Badge>
              <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Class
              </Button>
            </div>
          </div>
          {selectedSubcategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("No classes found.", "کوئی کلاس نہیں ملا۔")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {selectedSubcategories.map((sub) => (
                <Card key={sub.id} className="p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => openClass(sub.id)}
                    >
                      <p className="text-sm font-medium">{sub.nameUrdu || sub.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{sub.name || sub.nameUrdu}</p>
                      {sub.rollPrefix && <p className="text-[10px] text-muted-foreground mt-1">Roll: {sub.rollPrefix}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteClass(sub.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete class?", "کلاس حذف کریں؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone.", "یہ کارروائی واپس نہیں کی جا سکتی۔")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Cancel", "منسوخ کریں")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? t("Deleting...", "حذف ہو رہا ہے...") : t("Delete", "حذف کریں")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResponsiveDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetForm();
        }}
        title={t("Add Class", "نیا کلاس شامل کریں")}
        description={t("Add a new class to this category.", "اس زمرے میں نیا کلاس شامل کریں۔")}
        icon={BookOpen}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <BilingualLabel urdu="کلاس کا نام" english="Class Name (Urdu)" required lang={lang}>
            <Input
              dir="rtl"
              lang="ur"
              value={formUrdu}
              onChange={(e) => setFormUrdu(e.target.value)}
              placeholder="شعبہ حفظ - سال اول"
              className="font-urdu"
            />
          </BilingualLabel>
          <BilingualLabel urdu="انگریزی نام" english="English Name" lang={lang}>
            <Input
              value={formEnglish}
              onChange={(e) => setFormEnglish(e.target.value)}
              placeholder="Hifz Year 1"
            />
          </BilingualLabel>
          <BilingualLabel urdu="رول پریفکس" english="Roll Prefix" lang={lang}>
            <Input
              value={formRollPrefix}
              onChange={(e) => setFormRollPrefix(e.target.value)}
              placeholder="QH1"
            />
          </BilingualLabel>
          <BilingualLabel urdu="درجہ" english="Darja / Class Code" lang={lang}>
            <Input
              value={formDarja}
              onChange={(e) => setFormDarja(e.target.value)}
              placeholder="Dars-e-Nizami"
            />
          </BilingualLabel>
          <BilingualLabel urdu="فیس" english="Fee (optional)" lang={lang}>
            <Input
              type="number"
              min={0}
              value={formFee}
              onChange={(e) => setFormFee(e.target.value)}
              placeholder="0"
            />
          </BilingualLabel>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
            {t("Cancel", "منسوخ کریں")}
          </Button>
          <Button onClick={handleAddClass} disabled={submitting}>
            {submitting ? t("Adding...", "شامل ہو رہا ہے...") : t("Add Class", "کلاس شامل کریں")}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
