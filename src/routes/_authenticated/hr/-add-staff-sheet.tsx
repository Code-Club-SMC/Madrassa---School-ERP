import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHR } from "@/stores/hr-store";
import { toast } from "sonner";
import type { StaffMember, StaffType, EmploymentType, StaffModule } from "@/lib/mock/hr";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

const TYPES: StaffType[] = ["teacher", "administrator", "support", "accountant", "librarian", "helper"];
const EMP: EmploymentType[] = ["permanent", "contractual", "part-time"];
const MODULES: StaffModule[] = ["school", "madrassa", "shared"];

export function AddStaffSheet({ open, onOpenChange }: Props) {
  const { addStaff, departments } = useHR();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "", cnic: "", dob: "", gender: "male" as StaffMember["gender"],
    phone: "", emergencyContact: "", address: "",
    staffType: "teacher" as StaffType, department: departments[0]?.name ?? "",
    designation: "", employmentType: "permanent" as EmploymentType,
    joinDate: new Date().toISOString().slice(0, 10), module: "shared" as StaffModule,
    basicSalary: 60000, hra: 24000, transport: 5000, medical: 3000,
    eobi: 250, tax: 3000, bankName: "Meezan Bank", account: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  function submit() {
    if (!form.fullName || !form.cnic || !form.designation) {
      toast.error("Fill all required fields");
      return;
    }
    addStaff({
      fullName: form.fullName, cnic: form.cnic, dob: form.dob, gender: form.gender,
      phone: form.phone, emergencyContact: form.emergencyContact, address: form.address,
      staffType: form.staffType, department: form.department, designation: form.designation,
      employmentType: form.employmentType, joinDate: form.joinDate, status: "active", module: form.module,
      payroll: {
        basicSalary: form.basicSalary, hra: form.hra, transportAllowance: form.transport, medicalAllowance: form.medical,
        otherAllowances: [], eobi: form.eobi, incomeTax: form.tax, otherDeductions: [],
        bankName: form.bankName, accountNumber: form.account,
      },
    });
    toast.success("Staff added successfully");
    onOpenChange(false);
    setStep(1);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Staff</SheetTitle>
          <SheetDescription>Step {step} of 3</SheetDescription>
        </SheetHeader>
        <div className="mb-4 mt-4 flex gap-1">
          {[1, 2, 3].map((n) => <div key={n} className={`h-1.5 flex-1 rounded ${n <= step ? "bg-primary" : "bg-muted"}`} />)}
        </div>
        <div className="space-y-3 mt-4">
          {step === 1 && (
            <>
              <Field label="Full Name *"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
              <Field label="CNIC *"><Input value={form.cnic} onChange={(e) => set("cnic", e.target.value)} placeholder="00000-0000000-0" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
                <Field label="Gender"><Select value={form.gender} onValueChange={(v) => set("gender", v as StaffMember["gender"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></Field>
              </div>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Emergency Contact"><Input value={form.emergencyContact} onChange={(e) => set("emergencyContact", e.target.value)} /></Field>
              <Field label="Address"><Textarea value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Staff Type"><Select value={form.staffType} onValueChange={(v) => set("staffType", v as StaffType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Module"><Select value={form.module} onValueChange={(v) => set("module", v as StaffModule)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MODULES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></Field>
              </div>
              <Field label="Department"><Select value={form.department} onValueChange={(v) => set("department", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Designation *"><Input value={form.designation} onChange={(e) => set("designation", e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employment Type"><Select value={form.employmentType} onValueChange={(v) => set("employmentType", v as EmploymentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EMP.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Join Date"><Input type="date" value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} /></Field>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Basic Salary"><Input type="number" value={form.basicSalary} onChange={(e) => set("basicSalary", +e.target.value)} /></Field>
                <Field label="HRA"><Input type="number" value={form.hra} onChange={(e) => set("hra", +e.target.value)} /></Field>
                <Field label="Transport"><Input type="number" value={form.transport} onChange={(e) => set("transport", +e.target.value)} /></Field>
                <Field label="Medical"><Input type="number" value={form.medical} onChange={(e) => set("medical", +e.target.value)} /></Field>
                <Field label="EOBI"><Input type="number" value={form.eobi} onChange={(e) => set("eobi", +e.target.value)} /></Field>
                <Field label="Income Tax"><Input type="number" value={form.tax} onChange={(e) => set("tax", +e.target.value)} /></Field>
              </div>
              <Field label="Bank Name"><Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} /></Field>
              <Field label="Account Number"><Input value={form.account} onChange={(e) => set("account", e.target.value)} /></Field>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</Button>
          {step < 3 ? <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</Button> : <Button onClick={submit}>Save Staff</Button>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}