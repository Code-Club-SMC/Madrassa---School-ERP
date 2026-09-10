import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Outlet, useMatches } from "@tanstack/react-router";
import { Plus, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
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
  name: "",
  nameUrdu: "",
};

type ClassForm = typeof emptyClassForm;

type SchoolConfirmAction =
  | { kind: "class"; item: Klass; nextActive: boolean };

function ClassesPage() {
  const navigate = useNavigate();
  const matches = useMatches();
  const isDetailPage = matches.some((m) => m.routeId === "/_authenticated/school/classes/$classId");
  const [classes, setClasses] = useState<Klass[]>([]);
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string; nameUrdu: string }>>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [cf, setCf] = useState(emptyClassForm);
  const [confirmAction, setConfirmAction] = useState<SchoolConfirmAction | null>(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, institutionsRes] = await Promise.all([
        fetch(`/api/academic/school/classes?institutionId=${encodeURIComponent(institutionId)}`, { credentials: "include" }),
        fetch("/api/academic/institutions", { credentials: "include" }),
      ]);

      const classesPayload = await classesRes.json().catch(() => ({}));
      if (!classesRes.ok) throw new Error(classesPayload.error || "Could not load classes");

      const institutionsPayload = await institutionsRes.json().catch(() => ({}));
      if (institutionsRes.ok) {
        setInstitutions(institutionsPayload.institutions ?? []);
        if (!institutionId && (institutionsPayload.institutions ?? []).length > 0) {
          setInstitutionId(institutionsPayload.institutions[0].id);
        }
      }

      setClasses((classesPayload.classes ?? []) as Klass[]);
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
          name: cf.name.trim() || cf.nameUrdu.trim(),
          nameUrdu: cf.nameUrdu.trim() || cf.name.trim(),
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
          <div className="flex items-center gap-2">
            <Select value={institutionId} onValueChange={setInstitutionId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select institution" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.nameUrdu || inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1.5" onClick={() => setClassOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </div>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start p-3 font-medium">Class · جماعت</th>
                <th className="text-end p-3 font-medium">Subjects</th>
                <th className="text-end p-3 font-medium">Students</th>
                <th className="text-end p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    Loading classes...
                  </td>
                </tr>
              )}
              {!loading && classes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No classes configured.
                  </td>
                </tr>
              )}
              {classes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer"
                  onClick={() => navigate({ to: "/school/classes/$classId", params: { classId: c.id } })}
                >
                  <td className="p-3">
                    <div>
                      <p className="font-urdu text-sm font-medium">{c.nameUrdu}</p>
                      <p className="text-xs text-muted-foreground">{c.name}</p>
                    </div>
                  </td>
                  <td className="p-3 text-end font-mono">{c.subjectCount}</td>
                  <td className="p-3 text-end font-mono">{c.enrollmentCount}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
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
                        {c.active ? "Deactivate" : "Reactivate"}
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
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setClassOpen(false)}>
            Cancel
          </Button>
          <Button onClick={addClass} disabled={pending}>
            {pending ? "Adding..." : "Add"}
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
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyActiveChange} disabled={pending}>
              {pending ? "Saving..." : confirmAction?.nextActive ? "Reactivate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Outlet />
    </div>
  );
}
