import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, Pencil, CheckCircle2, ArrowLeft, ArrowRight, Loader2, Search, Plus, X } from "lucide-react";
import { AdmissionStepper } from "./admission-stepper";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { cn } from "@/lib/utils";
import { madrassaCategories, schoolClasses, students, type System } from "@/mock";
import { toast } from "sonner";

type FormState = {
  nameUrdu: string;
  nameEng: string;
  dob: string;
  gender: "male" | "female" | "";
  address: string;
  photo: string | null;
  system: System | "";
  categoryId: string;
  subcategoryId: string;
  classId: string;
  section: string;
  guardianName: string;
  guardianCnic: string;
  guardianPhone: string;
  siblings: { id: string; nameUrdu: string; rollNo: string }[];
  declaration: boolean;
};

const init: FormState = {
  nameUrdu: "", nameEng: "", dob: "", gender: "", address: "", photo: null,
  system: "", categoryId: "", subcategoryId: "", classId: "", section: "",
  guardianName: "", guardianCnic: "", guardianPhone: "", siblings: [], declaration: false,
};

type Props = { isPublic?: boolean; onComplete?: (refNo: string) => void };

export function AdmissionWizard({ isPublic = false, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(init);
  const [submitting, setSubmitting] = useState(false);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 1) return form.nameUrdu && form.dob && form.gender && form.address;
    if (step === 2) return form.system !== "";
    if (step === 3) {
      if (form.system === "madrassa") return form.categoryId && form.subcategoryId;
      if (form.system === "school") return form.classId;
      if (form.system === "both") return form.categoryId && form.subcategoryId && form.classId;
    }
    if (step === 4) return form.guardianName && form.guardianCnic.length >= 13 && form.guardianPhone.length >= 11;
    if (step === 5) return form.declaration;
    return true;
  };

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const ref = isPublic ? `APP-${Math.floor(Math.random() * 9000 + 1000)}` : `QAD-${Math.floor(Math.random() * 900 + 100)}`;
      setDoneRef(ref);
      setSubmitting(false);
      toast.success(`Admission confirmed — ${ref} assigned`, { description: "داخلہ مکمل ہوا" });
      onComplete?.(ref);
    }, 900);
  };

  if (doneRef) {
    return (
      <Card className="text-center max-w-xl mx-auto">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <CheckCircle2 className="h-16 w-16 text-chart-3" />
          <h2 className="font-heading text-2xl font-bold">{isPublic ? "Application Submitted" : "Admission Successful"}</h2>
          <p className="font-urdu text-base text-muted-foreground">{isPublic ? "آپ کی درخواست موصول ہوگئی" : "داخلہ مکمل ہوا"}</p>
          <div className="rounded-xl bg-muted p-6 mt-2 min-w-[16rem]">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{isPublic ? "Reference No." : "Roll Number"}</p>
            <p className="font-heading font-bold text-3xl text-primary mt-1">{doneRef}</p>
          </div>
          {isPublic ? (
            <p className="text-sm text-muted-foreground font-urdu max-w-sm">جلد ہی ادارہ آپ سے رابطہ کرے گا</p>
          ) : (
            <Button onClick={() => { setDoneRef(null); setForm(init); setStep(1); }} className="mt-2">
              <span className="font-urdu">نیا داخلہ</span>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <AdmissionStepper current={step} />
      <div className="mt-6 space-y-6">
        {step === 1 && <StepPersonal form={form} update={update} />}
        {step === 2 && <StepSystem form={form} update={update} />}
        {step === 3 && <StepDetails form={form} update={update} />}
        {step === 4 && <StepGuardian form={form} update={update} isPublic={isPublic} />}
        {step === 5 && <StepReview form={form} goTo={setStep} />}
      </div>

      {step === 5 && (
        <label className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-muted/50 cursor-pointer">
          <Checkbox checked={form.declaration} onCheckedChange={(v) => update("declaration", v === true)} />
          <span className="font-urdu text-sm leading-loose">میں اقرار کرتا ہوں کہ تمام معلومات درست ہیں اور ادارے کے ضوابط قبول ہیں۔</span>
        </label>
      )}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          <ArrowRight className="h-4 w-4 me-2" />
          <span className="font-urdu">پچھلا</span>
        </Button>
        {step < 5 ? (
          <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            <span className="font-urdu">اگلا</span>
            <ArrowLeft className="h-4 w-4 ms-2" />
          </Button>
        ) : (
          <Button disabled={!canNext() || submitting} onClick={submit} size="lg">
            {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            <span className="font-urdu">داخلہ مکمل کریں</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function StepPersonal({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle className="font-heading">Personal Information <span className="font-urdu text-base text-muted-foreground ms-2">ذاتی معلومات</span></CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BilingualLabel urdu="طالب علم کا نام" english="Student Name (Urdu)" required>
          <Input className="font-urdu" placeholder="محمد عبداللہ" value={form.nameUrdu} onChange={(e) => update("nameUrdu", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="انگریزی نام" english="Name (English, optional)">
          <Input placeholder="Muhammad Abdullah" value={form.nameEng} onChange={(e) => update("nameEng", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تاریخ پیدائش" english="Date of Birth" required>
          <Input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} />
        </BilingualLabel>
        <div className="flex flex-col gap-1">
          <span className="font-urdu text-base">جنس</span>
          <span className="text-[11px] text-muted-foreground -mt-1">Gender</span>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(["male", "female"] as const).map((g) => (
              <button key={g} type="button" onClick={() => update("gender", g)}
                className={cn("border rounded-xl p-4 text-center transition-all", form.gender === g ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                <span className="font-urdu text-lg block">{g === "male" ? "بنین" : "بنات"}</span>
                <span className="text-xs text-muted-foreground">{g === "male" ? "Male" : "Female"}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <BilingualLabel urdu="پتہ" english="Address" required>
            <Textarea className="font-urdu" placeholder="مکمل پتہ درج کریں" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </BilingualLabel>
        </div>
        <div className="md:col-span-2">
          <label className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="font-urdu text-sm">تصویر اپ لوڈ کریں</span>
            <span className="text-xs text-muted-foreground">PNG or JPG · max 2 MB</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => update("photo", e.target.files?.[0]?.name ?? null)} />
          </label>
          {form.photo && <p className="text-xs text-muted-foreground mt-2 text-center">Selected: {form.photo}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StepSystem({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const opts: { value: System; icon: string; ur: string; en: string; desc: string }[] = [
    { value: "madrassa", icon: "🕌", ur: "مدرسہ", en: "Madrassa", desc: "دینی تعلیم" },
    { value: "school", icon: "🏫", ur: "اسکول", en: "School", desc: "عصری تعلیم" },
    { value: "both", icon: "🏛️", ur: "دونوں", en: "Both", desc: "دینی اور عصری تعلیم" },
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="font-heading">System Selection <span className="font-urdu text-base text-muted-foreground ms-2">نظام منتخب کریں</span></CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {opts.map((o) => (
            <button key={o.value} type="button" onClick={() => update("system", o.value)}
              className={cn("border-2 rounded-2xl p-6 text-center transition-all", form.system === o.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40")}>
              <div className="text-4xl mb-3">{o.icon}</div>
              <p className="font-urdu text-lg font-semibold">{o.ur}</p>
              <p className="text-sm text-muted-foreground">{o.en}</p>
              <p className="font-urdu text-xs text-muted-foreground mt-2">{o.desc}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StepDetails({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const cat = madrassaCategories.find((c) => c.id === form.categoryId);
  const renderMadrassa = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BilingualLabel urdu="قسم" english="Category" required>
        <Select value={form.categoryId} onValueChange={(v) => { update("categoryId", v); update("subcategoryId", ""); }}>
          <SelectTrigger><SelectValue placeholder="انتخاب کریں" /></SelectTrigger>
          <SelectContent>
            {madrassaCategories.map((c) => <SelectItem key={c.id} value={c.id}><span className="font-urdu">{c.nameUrdu}</span> · {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </BilingualLabel>
      <BilingualLabel urdu="ذیلی قسم" english="Subcategory" required>
        <Select value={form.subcategoryId} onValueChange={(v) => update("subcategoryId", v)} disabled={!form.categoryId}>
          <SelectTrigger><SelectValue placeholder={form.categoryId ? "انتخاب کریں" : "پہلے قسم منتخب کریں"} /></SelectTrigger>
          <SelectContent>
            {cat?.subcategories.map((s) => <SelectItem key={s.id} value={s.id}><span className="font-urdu">{s.nameUrdu}</span></SelectItem>)}
          </SelectContent>
        </Select>
      </BilingualLabel>
    </div>
  );
  const renderSchool = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BilingualLabel urdu="جماعت" english="Class" required>
        <Select value={form.classId} onValueChange={(v) => update("classId", v)}>
          <SelectTrigger><SelectValue placeholder="انتخاب کریں" /></SelectTrigger>
          <SelectContent>
            {schoolClasses.map((c) => <SelectItem key={c.id} value={c.id}><span className="font-urdu">{c.nameUrdu}</span> · {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </BilingualLabel>
      <BilingualLabel urdu="سیکشن" english="Section (Optional)">
        <Select value={form.section} onValueChange={(v) => update("section", v)}>
          <SelectTrigger><SelectValue placeholder="A / B / C" /></SelectTrigger>
          <SelectContent>
            {["A", "B", "C"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </BilingualLabel>
    </div>
  );
  return (
    <Card>
      <CardHeader><CardTitle className="font-heading">Category / Class <span className="font-urdu text-base text-muted-foreground ms-2">تفصیلات</span></CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {(form.system === "madrassa" || form.system === "both") && renderMadrassa}
        {form.system === "both" && <div className="h-px bg-border" />}
        {(form.system === "school" || form.system === "both") && renderSchool}
      </CardContent>
    </Card>
  );
}

function StepGuardian({ form, update, isPublic }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void; isPublic: boolean }) {
  const [q, setQ] = useState("");
  const results = q.length > 1 ? students.filter((s) => s.nameUrdu.includes(q) || s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4) : [];
  return (
    <Card>
      <CardHeader><CardTitle className="font-heading">Guardian Information <span className="font-urdu text-base text-muted-foreground ms-2">ولی کی معلومات</span></CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BilingualLabel urdu="ولی کا نام" english="Guardian Name" required>
            <Input className="font-urdu" value={form.guardianName} onChange={(e) => update("guardianName", e.target.value)} />
          </BilingualLabel>
          <BilingualLabel urdu="فون نمبر" english="Phone (03XX-XXXXXXX)" required>
            <Input placeholder="0312-3456789" value={form.guardianPhone} onChange={(e) => update("guardianPhone", e.target.value)} />
          </BilingualLabel>
          <BilingualLabel urdu="شناختی کارڈ نمبر" english="CNIC (XXXXX-XXXXXXX-X)" required>
            <Input placeholder="42201-1234567-1" value={form.guardianCnic} onChange={(e) => update("guardianCnic", e.target.value)} />
          </BilingualLabel>
        </div>
        {!isPublic && (
          <div className="pt-2">
            <div className="h-px bg-border my-4" />
            <p className="font-urdu text-sm mb-2">بھائی / بہن تلاش کریں <span className="text-xs text-muted-foreground font-sans ms-2">Sibling search</span></p>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="ps-9" placeholder="Search by name or roll no..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {q.length > 1 && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 font-urdu">کوئی نتیجہ نہیں ملا</p>
            )}
            {results.length > 0 && (
              <div className="mt-3 rounded-xl border border-border overflow-hidden divide-y divide-border">
                {results.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">{s.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-urdu text-sm truncate">{s.nameUrdu}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{s.rollNo}</p>
                    </div>
                    <Button size="sm" variant="outline" disabled={form.siblings.some((x) => x.id === s.id)}
                      onClick={() => update("siblings", [...form.siblings, { id: s.id, nameUrdu: s.nameUrdu, rollNo: s.rollNo }])}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {form.siblings.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.siblings.map((s) => (
                  <span key={s.id} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs flex items-center gap-1.5">
                    <span className="font-urdu">{s.nameUrdu}</span>
                    <button type="button" onClick={() => update("siblings", form.siblings.filter((x) => x.id !== s.id))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepReview({ form, goTo }: { form: FormState; goTo: (n: number) => void }) {
  return <StepReviewInner form={form} goTo={goTo} />;
}

function StepReviewInner({ form, goTo }: { form: FormState; goTo: (n: number) => void }) {
  const row = (label: string, urdu: string, value: string) => (
    <div className="flex justify-between items-start py-2 border-b border-border/50 last:border-0 gap-3">
      <div className="min-w-0">
        <p className="font-urdu text-sm text-muted-foreground">{urdu}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium text-end">{value || "—"}</p>
    </div>
  );
  const cat = madrassaCategories.find((c) => c.id === form.categoryId);
  const sub = cat?.subcategories.find((s) => s.id === form.subcategoryId);
  const cls = schoolClasses.find((c) => c.id === form.classId);
  return (
    <div className="space-y-4">
      <SectionCard title="Personal" urdu="ذاتی" onEdit={() => goTo(1)}>
        {row("Name (Urdu)", "نام", form.nameUrdu)}
        {row("Name (English)", "انگریزی نام", form.nameEng)}
        {row("DOB", "تاریخ پیدائش", form.dob)}
        {row("Gender", "جنس", form.gender === "male" ? "Male / بنین" : form.gender === "female" ? "Female / بنات" : "")}
        {row("Address", "پتہ", form.address)}
      </SectionCard>
      <SectionCard title="System" urdu="نظام" onEdit={() => goTo(2)}>
        {row("System", "نظام", form.system)}
      </SectionCard>
      <SectionCard title="Enrollment" urdu="درج فہرست" onEdit={() => goTo(3)}>
        {cat && row("Category", "قسم", `${cat.nameUrdu} · ${cat.name}`)}
        {sub && row("Subcategory", "ذیلی", `${sub.nameUrdu} · ${sub.name}`)}
        {cls && row("Class", "جماعت", `${cls.nameUrdu} · ${cls.name}`)}
        {form.section && row("Section", "سیکشن", form.section)}
      </SectionCard>
      <SectionCard title="Guardian" urdu="ولی" onEdit={() => goTo(4)}>
        {row("Name", "ولی کا نام", form.guardianName)}
        {row("CNIC", "شناختی کارڈ", form.guardianCnic)}
        {row("Phone", "فون", form.guardianPhone)}
        {form.siblings.length > 0 && row("Siblings", "بہن بھائی", form.siblings.map((s) => s.nameUrdu).join("، "))}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, urdu, onEdit, children }: { title: string; urdu: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="font-heading text-base">{title} <span className="font-urdu text-sm text-muted-foreground ms-2">{urdu}</span></CardTitle>
        <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5 me-1" />Edit</Button>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}