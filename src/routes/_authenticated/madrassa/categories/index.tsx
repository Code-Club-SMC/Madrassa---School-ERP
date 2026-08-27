import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { BookLoader } from "@/components/shared/book-loader";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import { useSystem } from "@/components/system-context";
import { ADMISSION_VARIANTS } from "@/lib/admission-variants";

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

const emptyForm = {
  name: "",
  nameUrdu: "",
  description: "",
  descriptionUrdu: "",
  active: true,
  formVariantKeys: [] as string[],
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
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MadrassaCategory | null>(null);
  const [f, setF] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MadrassaCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      setCategories((payload.categories ?? []) as MadrassaCategory[]);
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

  const openAddDialog = useCallback(() => {
    setEditing(null);
    setF({ ...emptyForm });
    setOpen(true);
  }, []);

  const openEditDialog = useCallback((category: MadrassaCategory) => {
    setEditing(category);
    setF({
      name: category.name,
      nameUrdu: category.nameUrdu,
      description: category.description,
      descriptionUrdu: category.descriptionUrdu,
      active: category.active,
      formVariantKeys: category.formVariantKeys ?? [],
    });
    setOpen(true);
  }, []);

  const saveCategory = useCallback(async () => {
    if (!f.name.trim() && !f.nameUrdu.trim()) {
      toast.error(t("Name required", "نام درکار ہے"));
      return;
    }

    setPending(true);
    try {
      const body = {
        name: f.name.trim() || f.nameUrdu.trim(),
        nameUrdu: f.nameUrdu.trim() || f.name.trim(),
        description: f.description.trim() || undefined,
        descriptionUrdu: f.descriptionUrdu.trim() || undefined,
        section: gender,
        active: f.active,
        formVariantKeys: f.formVariantKeys,
      };

      if (editing) {
        const response = await fetch(`/api/academic/madrassa/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (response.status === 401 || response.status === 403) {
          navigate({ to: "/login", search: { redirect: undefined } });
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not update category");
        toast.success(t("Category updated", "زمرہ اپڈیٹ ہو گیا"));
      } else {
        const response = await fetch("/api/academic/madrassa/categories", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (response.status === 401 || response.status === 403) {
          navigate({ to: "/login", search: { redirect: undefined } });
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not add category");
        toast.success(t("Category added", "زمرہ شامل ہو گیا"));
      }

      await loadCategories();
      setF(emptyForm);
      setOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save category");
    } finally {
      setPending(false);
    }
  }, [f, editing, navigate, loadCategories, t, gender]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/academic/madrassa/categories/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete category");
      toast.success(t("Category deleted", "زمرہ حذف ہو گیا"));
      setDeleteTarget(null);
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete category");
    } finally {
      setDeleting(false);
    }
  };

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
        description={t("Manage categories for the madrassa section. Add classes to categories from the Classes tab.", "مدرسہ کے زمروں کا انتظام کریں۔ زمرہ جات میں کلاسز Classes tab سے شامل کر سکتے ہیں۔")}
        actions={
          <Button size="sm" className="gap-1.5" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            {t("Add Category", "زمرہ شامل کریں")}
          </Button>
        }
      />

      {loading && <Card className="p-5 text-sm text-muted-foreground">{t("Loading categories...", "زمرے لوڈ ہو رہے ہیں...")}</Card>}
      {!loading && visibleCategories.length === 0 && (
        <Card className="p-5 text-sm text-muted-foreground">
          {t("No categories found. Add your first category to get started.", "کوئی زمرہ نہیں ملا۔ شروع کرنے کے لیے پہلا زمرہ شامل کریں۔")}
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
              <div className="flex items-center gap-1 ms-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEditDialog(c)}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setDeleteTarget(c)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {c.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.descriptionUrdu || c.description}</p>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">
                  {c.active ? t("Active", "فعال") : t("Inactive", "غیر فعال")}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {(c.subcategories?.length ?? 0)} {t("classes", "کلاسز")}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <ResponsiveDialog
        title={editing ? t("Edit Category", "زمرہ ترمیم کریں") : t("New Category", "نیا زمرہ")}
        description={t("Category", "زمرہ")}
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setEditing(null);
            setF(emptyForm);
          }
        }}
        icon={BookOpen}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <div className={cn("grid gap-3", isUrdu ? "grid-cols-2" : "grid-cols-1")}>
            <BilingualLabel urdu="زمرہ کا نام" english="Name (Urdu)" required lang={lang}>
              <Input
                dir="rtl"
                lang="ur"
                inputMode="text"
                className="font-urdu text-sm h-9"
                value={f.nameUrdu}
                onChange={(e) => setF({ ...f, nameUrdu: e.target.value })}
                placeholder={t("Category", "زمرہ")}
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی" english={isUrdu ? "English Name" : "Category Name"} lang={lang}>
              <Input
                lang="en"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                placeholder={t("Category", "زمرہ")}
              />
            </BilingualLabel>
          </div>
          <BilingualLabel urdu="تفصیل" english="Description" lang={lang}>
            <Input
              dir="rtl"
              lang="ur"
              inputMode="text"
              className="font-urdu text-sm h-9"
              value={f.descriptionUrdu}
              onChange={(e) => setF({ ...f, descriptionUrdu: e.target.value })}
              placeholder={t("Description", "تفصیل")}
            />
          </BilingualLabel>
          <BilingualLabel urdu="انگریزی تفصیل" english="English Description" lang={lang}>
            <Input
              lang="en"
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              placeholder={t("Description", "تفصیل")}
            />
          </BilingualLabel>
          <div className="grid gap-2">
            <Label className="text-sm">{t("Admission Forms", "داخلہ فارمز")}</Label>
            <p className="text-xs text-muted-foreground">{t("Select forms available for this category", "اس زمرے کے لیے دستیاب فارمز منتخب کریں")}</p>
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="grid gap-2">
                {ADMISSION_VARIANTS.filter((v) => v.category === gender && v.section === "madrassa").map((variant) => (
                  <label key={variant.key} className="flex items-start gap-2 rounded-md border p-2 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={f.formVariantKeys.includes(variant.key)}
                      onCheckedChange={(checked) => {
                        setF((prev) => ({
                          ...prev,
                          formVariantKeys: checked
                            ? [...prev.formVariantKeys, variant.key]
                            : prev.formVariantKeys.filter((key) => key !== variant.key),
                        }));
                      }}
                    />
                    <div className="grid gap-0.5">
                      <span className="text-sm font-medium leading-tight font-urdu">{variant.titleUrdu}</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">{variant.titleEnglish}</span>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="grid gap-1">
              <Label className="text-sm">{t("Active", "فعال")}</Label>
              <p className="text-xs text-muted-foreground">{t("Category is active and visible", "زمرہ فعال اور نمودار ہے")}</p>
            </div>
            <Switch checked={f.active} onCheckedChange={(value) => setF({ ...f, active: value })} />
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); setF(emptyForm); }}>
            {t("Cancel", "منسوخ کریں")}
          </Button>
          <Button onClick={saveCategory} disabled={pending}>
            {pending ? t("Saving...", "محفوظ ہو رہا ہے...") : t("Save", "محفوظ کریں")}
          </Button>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete category?", "زمرہ حذف کریں؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone. All classes under this category will also be removed.", "یہ کارروائی واپس نہیں کی جا سکتی۔ اس زمرے کی تمام کلاسز بھی حذف ہو جائیں گی۔")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Cancel", "منسوخ کریں")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? t("Deleting...", "حذف ہو رہا ہے...") : t("Delete", "حذف کریں")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
