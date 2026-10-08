import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Outlet, useMatches } from "@tanstack/react-router";
import { Loader2, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { useLanguage } from "@/components/language-context";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/school/classes")({
  component: ClassesPage,
});

type Klass = {
  id: string;
  name: string;
  nameUrdu: string;
  active: boolean;
  enrollmentCount: number;
  subjectCount: number;
};

const emptyClassForm = {
  code: "",
  name: "",
  nameUrdu: "",
  fee: "" as string | number,
};

type ClassForm = typeof emptyClassForm;

type SchoolConfirmAction =
  | { kind: "class"; item: Klass; nextActive: boolean };

function ClassesPage() {
  const navigate = useNavigate();
  const matches = useMatches();
  const isDetailPage = matches.some((m) => m.routeId === "/_authenticated/school/classes/$classId");
  const { gender } = useSystem();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const institutionId = gender === "male" ? "al_qasim_academy" : "jamia_zainab_banat";
  const [classes, setClasses] = useState<Klass[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [cf, setCf] = useState(emptyClassForm);
  const [confirmAction, setConfirmAction] = useState<SchoolConfirmAction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Klass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/academic/school/classes?institutionId=${encodeURIComponent(institutionId)}`, { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load classes");
      setClasses((payload.classes ?? []) as Klass[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load classes");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const totals = useMemo(
    () => ({
      classes: classes.length,
    }),
    [classes],
  );

  const addClass = async () => {
    if (!cf.name.trim() && !cf.nameUrdu.trim()) {
      toast.error("Name required · نام درکار ہے");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/academic/school/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          institutionId: institutionId || undefined,
          code: cf.code.trim() || undefined,
          name: cf.name.trim() || cf.nameUrdu.trim(),
          nameUrdu: cf.nameUrdu.trim() || cf.name.trim(),
          fee: cf.fee !== "" ? Number(cf.fee) : undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add class");
      await loadClasses();
      toast.success("Class added");
      setCf(emptyClassForm);
      setClassOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add class");
    } finally {
      setPending(false);
    }
  };

  const applyActiveChange = async () => {
    if (!confirmAction) return;

    setPending(true);
    try {
      const response = await fetch(`/api/academic/school/classes/${confirmAction.item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: confirmAction.nextActive }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update status");
      await loadClasses();
      toast.success(confirmAction.nextActive ? "Reactivated" : "Deactivated");
      setConfirmAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    } finally {
      setPending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/academic/school/classes/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete class");
      await loadClasses();
      toast.success("Class deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete class");
    } finally {
      setDeleting(false);
    }
  };

  const confirmTitle = confirmAction?.nextActive
    ? "Reactivate class?"
    : "Deactivate class?";
  const confirmDescription = confirmAction?.nextActive
    ? "This class will become available again for new admissions and enrollment moves."
    : "This class will stop being used for new admissions or enrollment moves. Existing student history will remain unchanged.";

  return isDetailPage ? (
    <Outlet />
  ) : (
    <div>
      <PageHeader
        title="Class Manager"
        titleUrdu="جماعتیں"
        description="Manage school classes. Student counts come from active enrollments; subject counts come from exam subjects."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setClassOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 mb-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Classes · جماعتیں</p>
          <p className="font-heading text-2xl font-bold mt-1">{totals.classes}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start p-3.5 font-medium w-[36%]">{isUrdu ? "جماعت" : "Class · جماعت"}</th>
                <th className="text-center p-3.5 font-medium w-[20%]">{isUrdu ? "مضامین" : "Subjects · مضامین"}</th>
                <th className="text-center p-3.5 font-medium w-[20%]">{isUrdu ? "طلبہ" : "Students · طلبہ"}</th>
                <th className="text-center p-3.5 font-medium w-[24%]">{isUrdu ? "اقدامات" : "Actions · اقدامات"}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    {isUrdu ? "کلاسز لوڈ ہو رہی ہیں..." : "Loading classes..."}
                  </td>
                </tr>
              )}
              {!loading && classes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    {isUrdu ? "کوئی کلاس نہیں مل سکی۔" : "No classes configured."}
                  </td>
                </tr>
              )}
              {classes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate({ to: "/school/classes/$classId", params: { classId: c.id } })}
                >
                  <td className="p-3.5 text-start align-middle">
                    <div className="flex flex-col justify-center">
                      <p className="font-urdu text-sm font-medium leading-tight">{c.nameUrdu}</p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">{c.name}</p>
                    </div>
                  </td>
                  <td className="p-3.5 text-center align-middle font-medium text-sm">
                    <div className="flex items-center justify-center">
                      <span className="font-mono font-medium">{c.subjectCount}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-center align-middle font-medium text-sm">
                    <div className="flex items-center justify-center">
                      <span className="font-mono font-medium">{c.enrollmentCount}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(c)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={c.active ? "destructive" : "outline"}
                        className="gap-1.5"
                        onClick={() =>
                          setConfirmAction({
                            kind: "class",
                            item: c,
                            nextActive: !c.active,
                          })
                        }
                      >
                        {c.active ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                        {c.active ? (isUrdu ? "غیر فعال کریں" : "Deactivate") : (isUrdu ? "فعال کریں" : "Reactivate")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ResponsiveDialog
        title="نئی جماعت"
        description="Add Class"
        open={classOpen}
        onOpenChange={setClassOpen}
        icon={Plus}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="جماعت کا نام" english="Name (Urdu)" required>
              <Input
                dir="rtl"
                className="font-urdu text-base"
                value={cf.nameUrdu}
                onChange={(e) => setCf({ ...cf, nameUrdu: e.target.value })}
                placeholder="گیارہویں جماعت"
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی نام" english="English Name">
              <Input
                value={cf.name}
                onChange={(e) => setCf({ ...cf, name: e.target.value })}
                placeholder="Grade 11"
              />
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="جماعت کا کوڈ" english="Class Code">
              <Input
                value={cf.code}
                onChange={(e) => setCf({ ...cf, code: e.target.value })}
                placeholder="C1"
              />
            </BilingualLabel>
            <BilingualLabel urdu="فیس" english="Fee">
              <Input
                type="number"
                min={0}
                value={cf.fee}
                onChange={(e) => setCf({ ...cf, fee: e.target.value })}
                placeholder="0"
              />
            </BilingualLabel>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setClassOpen(false)}>
            {isUrdu ? "منسوخ کریں" : "Cancel"}
          </Button>
          <Button onClick={addClass} disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{pending ? (isUrdu ? "شامل ہو رہا ہے..." : "Adding...") : (isUrdu ? "شامل کریں" : "Add")}</span>
          </Button>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{isUrdu ? "منسوخ کریں" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={applyActiveChange} disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{pending ? (isUrdu ? "محفوظ ہو رہا ہے..." : "Saving...") : confirmAction?.nextActive ? (isUrdu ? "فعال کریں" : "Reactivate") : (isUrdu ? "غیر فعال کریں" : "Deactivate")}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isUrdu ? "کلاس حذف کریں؟" : "Delete class?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isUrdu ? "یہ کلاس مستقل طور پر حذف ہو جائے گی۔ اس عمل کو واپس نہیں لایا جا سکتا۔" : "This will permanently delete this class. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{isUrdu ? "منسوخ کریں" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{deleting ? (isUrdu ? "حذف ہو رہا ہے..." : "Deleting...") : (isUrdu ? "حذف کریں" : "Delete")}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Outlet />
    </div>
  );
}
