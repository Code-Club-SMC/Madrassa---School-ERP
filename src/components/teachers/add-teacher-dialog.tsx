import { useState, type FormEvent, type ReactNode } from "react";
import { GraduationCap, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTeacher } from "./teacher-api";
import type { TeacherCredentials, TeacherPaymentMethod, TeacherSystemScope } from "./teacher-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (credentials: TeacherCredentials) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

export function AddTeacherDialog({ open, onOpenChange, onCreated }: Props) {
  const [systemScope, setSystemScope] = useState<TeacherSystemScope>("both");
  const [paymentMethod, setPaymentMethod] = useState<TeacherPaymentMethod>("cash");
  const [gender, setGender] = useState<"male" | "female" | "none">("none");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const form = new FormData(event.currentTarget);
      const salaryRupees = Number(form.get("baseMonthlySalary") || 0);
      const payload = {
        name: String(form.get("name") ?? "").trim(),
        nameUrdu: optional(form.get("nameUrdu")),
        email: String(form.get("email") ?? "").trim(),
        phone: optional(form.get("phone")),
        cnic: optional(form.get("cnic")),
        gender: gender === "none" ? undefined : gender,
        systemScope,
        designation: String(form.get("designation") ?? "").trim(),
        qualification: optional(form.get("qualification")),
        qualificationUrdu: optional(form.get("qualificationUrdu")),
        address: optional(form.get("address")),
        joinedAt: String(form.get("joinedAt") ?? ""),
        baseMonthlySalaryPaisa: Math.round((Number.isFinite(salaryRupees) ? salaryRupees : 0) * 100),
        bankName: optional(form.get("bankName")),
        bankAccount: optional(form.get("bankAccount")),
        paymentMethod,
        salaryEffectiveDate: optional(form.get("salaryEffectiveDate")),
        salaryNotes: optional(form.get("salaryNotes")),
        notes: optional(form.get("notes")),
      };

      const result = await createTeacher(payload);
      toast.success("Teacher created");
      onCreated(result.credentials);
      event.currentTarget.reset();
      setSystemScope("both");
      setPaymentMethod("cash");
      setGender("none");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create teacher");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Teacher"
      description="Create a Better Auth teacher account with a linked teacher profile."
      icon={UserPlus}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-1">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center gap-2 border-b pb-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Identity</h3>
          </div>

          <Field label="Full name" required>
            <Input name="name" placeholder="Ustad Muhammad Bilal" required disabled={submitting} />
          </Field>
          <Field label="Name in Urdu">
            <Input
              name="nameUrdu"
              placeholder="استاد محمد بلال"
              dir="rtl"
              lang="ur"
              className="font-urdu"
              disabled={submitting}
            />
          </Field>
          <Field label="Email" required>
            <Input
              name="email"
              type="email"
              placeholder="teacher@msmis.pk"
              required
              disabled={submitting}
            />
          </Field>
          <Field label="Phone">
            <Input name="phone" placeholder="0312-3456789" disabled={submitting} />
          </Field>
          <Field label="CNIC">
            <Input name="cnic" placeholder="17301-1234567-1" disabled={submitting} />
          </Field>
          <Field label="Gender">
            <Select value={gender} onValueChange={(value) => setGender(value as typeof gender)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 border-b pb-2">
            <h3 className="text-sm font-semibold">Teacher Profile</h3>
          </div>
          <Field label="System scope" required>
            <Select value={systemScope} onValueChange={(value) => setSystemScope(value as TeacherSystemScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both systems</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="madrassa">Madrassa</SelectItem>
                <SelectItem value="qasmia-both">All Qasim (Both)</SelectItem>
                <SelectItem value="qasmia-madrassa">Qasim Madrassa</SelectItem>
                <SelectItem value="qasmia-school">Qasim School</SelectItem>
                <SelectItem value="zainab-both">All Zainab (Both)</SelectItem>
                <SelectItem value="zainab-madrassa">Zainab Madrassa</SelectItem>
                <SelectItem value="zainab-school">Zainab School</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Designation" required>
            <Input name="designation" placeholder="Subject Teacher" required disabled={submitting} />
          </Field>
          <Field label="Qualification">
            <Input name="qualification" placeholder="MA Arabic, B.Ed" disabled={submitting} />
          </Field>
          <Field label="Qualification in Urdu">
            <Input
              name="qualificationUrdu"
              placeholder="ایم اے عربی"
              dir="rtl"
              lang="ur"
              className="font-urdu"
              disabled={submitting}
            />
          </Field>
          <Field label="Joining date" required>
            <Input name="joinedAt" type="date" required defaultValue={today()} disabled={submitting} />
          </Field>
          <Field label="Address">
            <Input name="address" placeholder="House, area, city" disabled={submitting} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" rows={3} placeholder="Profile notes" disabled={submitting} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 border-b pb-2">
            <h3 className="text-sm font-semibold">Salary Info</h3>
          </div>
          <Field label="Base monthly salary">
            <Input
              name="baseMonthlySalary"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder="45000"
              disabled={submitting}
            />
          </Field>
          <Field label="Payment method">
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as TeacherPaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Bank name">
            <Input name="bankName" placeholder="Bank Alfalah" disabled={submitting} />
          </Field>
          <Field label="Bank account / IBAN">
            <Input name="bankAccount" placeholder="PK00..." disabled={submitting} />
          </Field>
          <Field label="Salary effective date">
            <Input name="salaryEffectiveDate" type="date" disabled={submitting} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Salary notes">
              <Textarea name="salaryNotes" rows={3} placeholder="Salary notes" disabled={submitting} />
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" className="gap-2" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Teacher
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
