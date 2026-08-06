import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, Pencil, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type {
  ParentAccountRetryResponse,
  ParentCreds,
  StudentGuardianProfile,
  StudentProfilePayload,
} from "@/components/students/student-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  profile: StudentProfilePayload;
  onChanged: () => Promise<void> | void;
  onParentCredentials?: (creds: ParentCreds) => void;
};

type GuardianForm = {
  name: string;
  nameUrdu: string;
  relation: string;
  phone: string;
  cnic: string;
  email: string;
  address: string;
  isPrimary: boolean;
};

const emptyGuardianForm: GuardianForm = {
  name: "",
  nameUrdu: "",
  relation: "father",
  phone: "",
  cnic: "",
  email: "",
  address: "",
  isPrimary: false,
};

export function StudentGuardianManager({ profile, onChanged, onParentCredentials }: Props) {
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [form, setForm] = useState<GuardianForm>(emptyGuardianForm);
  const [submitting, setSubmitting] = useState(false);
  const [parentTarget, setParentTarget] = useState<StudentGuardianProfile | null>(null);
  const [creatingParent, setCreatingParent] = useState(false);

  const selectedGuardian = useMemo(
    () => profile.guardians.find((guardian) => guardian.guardianId === editing) ?? null,
    [editing, profile.guardians],
  );
  const isAdding = editing === "new";
  const dialogOpen = editing !== null;

  useEffect(() => {
    if (!dialogOpen) return;

    if (isAdding) {
      setForm({
        ...emptyGuardianForm,
        isPrimary: profile.guardians.length === 0,
      });
      return;
    }

    if (selectedGuardian) {
      setForm(formFromGuardian(selectedGuardian));
    }
  }, [dialogOpen, isAdding, profile.guardians.length, selectedGuardian]);

  function updateField<Key extends keyof GuardianForm>(key: Key, value: GuardianForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitGuardian() {
    const name = form.name.trim();
    const relation = form.relation.trim();

    if (!name) {
      toast.error("سرپرست کا نام ضروری ہے");
      return;
    }

    if (!relation) {
      toast.error("رشتہ ضروری ہے");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        isAdding
          ? `/api/students/${profile.student.id}/guardians`
          : `/api/students/${profile.student.id}/guardians/${selectedGuardian?.guardianId}`,
        {
          method: isAdding ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            nameUrdu: nullableString(form.nameUrdu),
            relation,
            phone: nullableString(form.phone),
            cnic: nullableString(form.cnic),
            email: nullableString(form.email),
            address: nullableString(form.address),
            isPrimary: form.isPrimary,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || (isAdding ? "سرپرست شامل نہیں ہو سکا" : "سرپرست کی معلومات محفوظ نہیں ہو سکیں"));

      toast.success(isAdding ? "سرپرست شامل ہو گیا" : "سرپرست کی معلومات محفوظ ہو گئیں");
      await onChanged();
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isAdding ? "سرپرست شامل نہیں ہو سکا" : "سرپرست کی معلومات محفوظ نہیں ہو سکیں");
    } finally {
      setSubmitting(false);
    }
  }

  async function createParentLogin() {
    if (!parentTarget) return;

    setCreatingParent(true);
    try {
      const response = await fetch(
        `/api/students/${profile.student.id}/guardians/${parentTarget.guardianId}/parent-account`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as Partial<ParentAccountRetryResponse> & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "والدین کا لاگ اِن نہیں بن سکا");

      if (payload.parentCredentials) {
        onParentCredentials?.(payload.parentCredentials);
        toast.success("والدین کا لاگ اِن بن گیا", {
          description: payload.parentCredentials.username,
        });
      }

      if (payload.warning) {
        toast.warning(payload.warning.message, { description: payload.warning.metadata?.reason });
      }

      await onChanged();
      setParentTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "والدین کا لاگ اِن نہیں بن سکا");
    } finally {
      setCreatingParent(false);
    }
  }

  return (
    <Card className="mt-3 overflow-hidden" dir="rtl" lang="ur">
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-urdu text-sm font-medium">سرپرست</p>
          <p className="font-urdu text-xs text-muted-foreground">طالب علم کے سرپرست، بنیادی رابطہ، اور والدین لاگ اِن سنبھالیں۔</p>
        </div>
        <Button size="sm" className="gap-1.5 self-start sm:self-auto" onClick={() => setEditing("new")}>
          <Plus className="h-3.5 w-3.5" />
          سرپرست شامل کریں
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>نام</TableHead>
            <TableHead>رشتہ</TableHead>
            <TableHead>فون</TableHead>
            <TableHead>شناختی کارڈ</TableHead>
            <TableHead>والدین لاگ اِن</TableHead>
            <TableHead className="text-end">عمل</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profile.guardians.map((guardian) => (
            <TableRow key={guardian.guardianId}>
              <TableCell>
                <div className="flex flex-col leading-tight">
                  <span>{guardian.name}</span>
                  {guardian.nameUrdu && <span className="font-urdu text-[11px] text-muted-foreground">{guardian.nameUrdu}</span>}
                </div>
              </TableCell>
              <TableCell>
                {guardian.relation}
                {guardian.isPrimary ? " · بنیادی رابطہ" : ""}
              </TableCell>
              <TableCell className="font-mono text-xs">{guardian.phone ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{guardian.cnic ?? "—"}</TableCell>
              <TableCell className="text-xs">
                {guardian.userId ? (
                  <div className="space-y-1">
                    <Badge>منسلک</Badge>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {guardian.parentUserUsername ?? "لاگ اِن موجود ہے"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Badge variant="destructive">لاگ اِن نہیں</Badge>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {guardian.email ?? "رابطہ ای میل موجود نہیں"}
                    </p>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-end">
                <div className="flex flex-wrap justify-end gap-2">
                  {!guardian.userId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setParentTarget(guardian)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      لاگ اِن
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(guardian.guardianId)}>
                    <Pencil className="h-3.5 w-3.5" />
                    ترمیم
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {profile.guardians.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                کوئی سرپرست منسلک نہیں۔
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ResponsiveDialog
        title={isAdding ? "سرپرست شامل کریں" : "سرپرست کی ترمیم"}
        description="سرپرست کا نام، رابطہ، پتہ، اور طالب علم سے رشتہ محفوظ کریں۔"
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        icon={UserRound}
        className="sm:max-w-[640px]"
      >
        <div className="max-h-[calc(100vh-9rem)] space-y-4 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" required>
              <Input className="font-urdu" dir="rtl" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="محمد یوسف" />
            </Field>
            <Field label="اردو نام">
              <Input
                className="font-urdu"
                dir="rtl"
                value={form.nameUrdu}
                onChange={(event) => updateField("nameUrdu", event.target.value)}
                placeholder="سرپرست کا نام"
              />
            </Field>
            <Field label="رشتہ" required>
              <Input className="font-urdu" dir="rtl" value={form.relation} onChange={(event) => updateField("relation", event.target.value)} placeholder="والد" />
            </Field>
            <Field label="فون">
              <Input dir="ltr" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="03xxxxxxxxx" />
            </Field>
            <Field label="شناختی کارڈ">
              <Input dir="ltr" value={form.cnic} onChange={(event) => updateField("cnic", event.target.value)} placeholder="xxxxx-xxxxxxx-x" />
            </Field>
            <Field label="ای میل">
              <Input dir="ltr" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="guardian@example.com" />
            </Field>
          </div>

          <Field label="پتہ">
            <Textarea className="font-urdu" dir="rtl" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="سرپرست کا پتہ" />
          </Field>

          <label className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
            <Checkbox checked={form.isPrimary} onCheckedChange={(checked) => updateField("isPrimary", checked === true)} />
            <span>
              <span className="font-urdu font-medium">بنیادی سرپرست</span>
              <span className="font-urdu block text-xs text-muted-foreground">اس سرپرست کو طالب علم کے بنیادی رابطے کے طور پر استعمال کریں۔</span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={submitting}>
              منسوخ
            </Button>
            <Button className="gap-1.5" onClick={submitGuardian} disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isAdding ? "شامل کریں" : "محفوظ کریں"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title="والدین کا لاگ اِن بنائیں"
        description="یہ لاگ اِن اسی سرپرست سے منسلک ہو گا۔"
        open={Boolean(parentTarget)}
        onOpenChange={(open) => {
          if (!open) setParentTarget(null);
        }}
        icon={KeyRound}
        className="sm:max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">والدین پورٹل کی رسائی</p>
            <p className="mt-1 text-xs leading-5">
              لاگ اِن آئی ڈی سرپرست کے نام سے خود بنے گی۔ پاس ورڈ صرف ایک بار دکھایا جائے گا۔
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setParentTarget(null)} disabled={creatingParent}>
              منسوخ
            </Button>
            <Button className="gap-1.5" onClick={createParentLogin} disabled={creatingParent}>
              {creatingParent && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              لاگ اِن بنائیں
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </Card>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function formFromGuardian(guardian: StudentGuardianProfile): GuardianForm {
  return {
    name: guardian.name,
    nameUrdu: guardian.nameUrdu ?? "",
    relation: guardian.relation,
    phone: guardian.phone ?? "",
    cnic: guardian.cnic ?? "",
    email: guardian.email ?? "",
    address: guardian.address ?? "",
    isPrimary: guardian.isPrimary,
  };
}

function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
