import { useState, useRef } from "react";
import { useLanguage } from "@/components/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, Pencil, CheckCircle2, ArrowLeft, ArrowRight, Loader2, Search, Plus, X, Wand2 } from "lucide-react";
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

const TEXT = {
  ur: {
    successTitle: "داخلہ کامیاب",
    publicTitle: "درخواست جمع ہو گئی",
    rollLabel: "رول نمبر",
    refLabel: "رفرنس نمبر",
    newAdmission: "نیا داخلہ",
    willContact: "جلد ہی ادارہ آپ سے رابطہ کرے گا",
    personalTitle: "ذاتی معلومات",
    systemTitle: "نظام منتخب کریں",
    detailsTitle: "تفصیلات",
    guardianTitle: "ولی کی معلومات",
    reviewTitle: "جائزہ",
    studentNameUrdu: "طالب علم کا نام",
    studentNameEng: "انگریزی نام",
    dob: "تاریخ پیدائش",
    gender: "جنس",
    male: "بنین",
    female: "بنات",
    address: "پتہ",
    photo: "تصویر اپ لوڈ کریں",
    photoHint: "PNG یا JPG · زیادہ سے زیادہ 2 م بائٹ",
    systemMadrassa: "مدرسہ",
    systemSchool: "اسکول",
    systemBoth: "دونوں",
    systemMadrassaDesc: "دینی تعلیم",
    systemSchoolDesc: "عصری تعلیم",
    systemBothDesc: "دینی اور عصری تعلیم",
    category: "قسم",
    subcategory: "ذیلی قسم",
    selectCategory: "انتخاب کریں",
    selectFirstCategory: "پہلے قسم منتخب کریں",
    schoolClass: "جماعت",
    section: "سیکشن",
    guardianName: "ولی کا نام",
    guardianPhone: "فون نمبر",
    guardianCnic: "شناختی کارڈ نمبر",
    siblingSearch: "بھائی / بہن تلاش کریں",
    siblingSearchHint: "نام یا رول نمبر تلاش کریں...",
    noResults: "کوئی نتیجہ نہیں ملا",
    declaration: "میں اقرار کرتا ہوں کہ تمام معلومات درست ہیں اور ادارے کے ضوابط قبول ہیں۔",
    prev: "پچھلا",
    next: "اگلا",
    submit: "داخلہ مکمل کریں",
    personal: "ذاتی",
    system: "نظام",
    enrollment: "درج فہرست",
    guardian: "ولی",
    nameUrdu: "نام",
    nameEng: "انگریزی نام",
    dobLabel: "تاریخ پیدائش",
    genderLabel: "جنس",
    maleLabel: "Male / بنین",
    femaleLabel: "Female / بنات",
    addressLabel: "پتہ",
    siblingsLabel: "بہن بھائی",
  },
  en: {
    successTitle: "Admission Successful",
    publicTitle: "Application Submitted",
    rollLabel: "Roll Number",
    refLabel: "Reference No.",
    newAdmission: "New Admission",
    willContact: "The institution will contact you soon",
    personalTitle: "Personal Information",
    systemTitle: "System Selection",
    detailsTitle: "Details",
    guardianTitle: "Guardian Information",
    reviewTitle: "Review",
    studentNameUrdu: "Student Name (Urdu)",
    studentNameEng: "Name (English)",
    dob: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    address: "Address",
    photo: "Upload Photo",
    photoHint: "PNG or JPG · max 2 MB",
    systemMadrassa: "Madrassa",
    systemSchool: "School",
    systemBoth: "Both",
    systemMadrassaDesc: "Religious education",
    systemSchoolDesc: "Modern education",
    systemBothDesc: "Religious & modern education",
    category: "Category",
    subcategory: "Subcategory",
    selectCategory: "Select",
    selectFirstCategory: "Select category first",
    schoolClass: "Class",
    section: "Section",
    guardianName: "Guardian Name",
    guardianPhone: "Phone",
    guardianCnic: "CNIC",
    siblingSearch: "Search siblings",
    siblingSearchHint: "Search by name or roll no...",
    noResults: "No results found",
    declaration: "I declare that all information is correct and I accept the institution's terms.",
    prev: "Previous",
    next: "Next",
    submit: "Complete Admission",
    personal: "Personal",
    system: "System",
    enrollment: "Enrollment",
    guardian: "Guardian",
    nameUrdu: "Name (Urdu)",
    nameEng: "Name (English)",
    dobLabel: "Date of Birth",
    genderLabel: "Gender",
    maleLabel: "Male",
    femaleLabel: "Female",
    addressLabel: "Address",
    siblingsLabel: "Siblings",
  },
};

export function AdmissionWizard({ isPublic = false, onComplete }: Props) {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(init);
  const [submitting, setSubmitting] = useState(false);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const usedSampleIndices = useRef<{ male: Set<number>; female: Set<number> }>({ male: new Set(), female: new Set() });

  const resolveGenderFromContext = (): "male" | "female" => {
    const category = madrassaCategories.find((c) => c.id === form.categoryId);
    const section = (category as any)?.section?.toLowerCase();
    if (section === "female" || section === "banat") return "female";
    if (section === "male" || section === "baneen") return "male";
    if (form.gender === "female") return "female";
    return "male";
  };

  const samplePools = {
    male: [
      { nameUrdu: "احمد رضا", nameEng: "Ahmed Raza", dob: "2015-03-10", guardianName: "محمد رضا", guardianCnic: "35202-1000002-3", guardianPhone: "0313-4567890", address: "لاہور، پاکستان" },
      { nameUrdu: "علی حسن", nameEng: "Ali Hassan", dob: "2014-07-22", guardianName: "حسن علی", guardianCnic: "35202-1000003-5", guardianPhone: "0314-5678901", address: "لاہور، پاکستان" },
      { nameUrdu: "بلال احمد", nameEng: "Bilal Ahmed", dob: "2016-01-15", guardianName: "احمد خان", guardianCnic: "35202-1000004-7", guardianPhone: "0315-6789012", address: "لاہور، پاکستان" },
      { nameUrdu: "حمزہ ملک", nameEng: "Hamza Malik", dob: "2015-11-08", guardianName: "ملک اقبال", guardianCnic: "35202-1000005-9", guardianPhone: "0316-7890123", address: "لاہور، پاکستان" },
      { nameUrdu: "عثمان طارق", nameEng: "Usman Tariq", dob: "2014-05-19", guardianName: "طارق محمود", guardianCnic: "35202-1000006-1", guardianPhone: "0317-8901234", address: "لاہور، پاکستان" },
      { nameUrdu: " zain العابدین", nameEng: "Zain ul Abideen", dob: "2016-09-30", guardianName: "عابدین شاہ", guardianCnic: "35202-1000007-3", guardianPhone: "0318-9012345", address: "لاہور، پاکستان" },
      { nameUrdu: "عبداللہ صدique", nameEng: "Abdullah Siddiqui", dob: "2013-12-05", guardianName: "صدique احمد", guardianCnic: "35202-2000001-1", guardianPhone: "0319-0123456", address: "لاہور، پاکستان" },
      { nameUrdu: "فہد نواز", nameEng: "Fahad Nawaz", dob: "2012-08-14", guardianName: "نواز شریف", guardianCnic: "35202-2000002-3", guardianPhone: "0320-1234567", address: "لاہور، پاکستان" },
      { nameUrdu: "عمران خلیل", nameEng: "Imran Khalil", dob: "2013-04-21", guardianName: "خلیل الرحمٰن", guardianCnic: "35202-2000003-5", guardianPhone: "0321-2345678", address: "لاہور، پاکستان" },
      { nameUrdu: "سعد الرحمٰن", nameEng: "Saad Ur Rehman", dob: "2012-06-17", guardianName: "رحمٰن غلام", guardianCnic: "35202-2000004-7", guardianPhone: "0322-3456789", address: "لاہور، پاکستان" },
    ],
    female: [
      { nameUrdu: "فاطمہ زہرا", nameEng: "Fatima Zahra", dob: "2014-02-14", guardianName: "حسین علی", guardianCnic: "35202-3000001-1", guardianPhone: "0322-3456789", address: "لاہور، پاکستان" },
      { nameUrdu: "عائشہ بکر", nameEng: "Aisha Bakar", dob: "2015-06-20", guardianName: "بکر احمد", guardianCnic: "35202-3000002-3", guardianPhone: "0323-4567890", address: "لاہور، پاکستان" },
      { nameUrdu: "مریم اقبال", nameEng: "Maryam Iqbal", dob: "2013-09-05", guardianName: "اقبال حسین", guardianCnic: "35202-3000003-5", guardianPhone: "0324-5678901", address: "لاہور، پاکستان" },
      { nameUrdu: "خدیجہ فاطمہ", nameEng: "Khadija Fatima", dob: "2016-12-01", guardianName: "فاروق احمد", guardianCnic: "35202-3000004-7", guardianPhone: "0325-6789012", address: "لاہور، پاکستان" },
      { nameUrdu: "زینب اقبال", nameEng: "Zainab Iqbal", dob: "2014-08-15", guardianName: "اقبال محمود", guardianCnic: "35202-3000005-9", guardianPhone: "0326-7890123", address: "لاہور، پاکستان" },
      { nameUrdu: "حواء محمد", nameEng: "Hawwa Muhammad", dob: "2015-04-10", guardianName: "محمد عمر", guardianCnic: "35202-3000006-1", guardianPhone: "0327-8901234", address: "لاہور، پاکستان" },
      { nameUrdu: "سارہ خان", nameEng: "Sarah Khan", dob: "2013-11-25", guardianName: "خان محمد", guardianCnic: "35202-4000001-3", guardianPhone: "0328-9012345", address: "لاہور، پاکستان" },
      { nameUrdu: "عمرہ فاطمہ", nameEng: "Ummul Fatima", dob: "2016-07-08", guardianName: "فاطمہ بی بی", guardianCnic: "35202-4000002-5", guardianPhone: "0329-0123456", address: "لاہور، پاکستان" },
      { nameUrdu: "رقیمہ بلال", nameEng: "Raqeema Bilal", dob: "2014-01-30", guardianName: "بلال ثاقب", guardianCnic: "35202-4000003-7", guardianPhone: "0330-1234567", address: "لاہور، پاکستان" },
      { nameUrdu: "نرگس بانو", nameEng: "Nargis Bano", dob: "2015-10-12", guardianName: "بانو بی بی", guardianCnic: "35202-4000004-9", guardianPhone: "0331-2345678", address: "لاہور، پاکستان" },
    ],
  };

  const fillSimpleData = () => {
    const currentGender = resolveGenderFromContext();
    const pool = samplePools[currentGender];
    const used = usedSampleIndices.current[currentGender];

    let index: number;
    if (used.size >= pool.length) {
      used.clear();
      index = Math.floor(Math.random() * pool.length);
    } else {
      const available = pool.map((_, i) => i).filter((i) => !used.has(i));
      index = available[Math.floor(Math.random() * available.length)];
    }
    used.add(index);

    const pick = pool[index];
    const qasmiaMale = madrassaCategories.find(c => c.nameUrdu.includes("قاسمی") || c.name.includes("Qasim"));
    const zainabFemale = madrassaCategories.find(c => c.nameUrdu.includes("زینب") || c.name.includes("Zainab"));
    const category = currentGender === "male" ? qasmiaMale : zainabFemale;

    setForm({
      ...form,
      nameUrdu: pick.nameUrdu,
      nameEng: pick.nameEng,
      dob: pick.dob,
      gender: currentGender,
      address: pick.address,
      photo: null,
      system: "madrassa",
      categoryId: category?.id ?? "",
      subcategoryId: category?.subcategories?.[0]?.id ?? "",
      classId: "",
      section: "",
      guardianName: pick.guardianName,
      guardianCnic: pick.guardianCnic,
      guardianPhone: pick.guardianPhone,
      siblings: [],
      declaration: true,
    });
    setStep(1);
    toast.success(lang === "ur" ? "سادہ ڈیٹا شامل ہو گیا" : "Simple data filled");
  };

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
      toast.success(`${t.successTitle} — ${ref} assigned`);
      onComplete?.(ref);
    }, 900);
  };

  if (doneRef) {
    return (
      <Card className="text-center max-w-xl mx-auto">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <CheckCircle2 className="h-16 w-16 text-chart-3" />
          <h2 className="font-heading text-2xl font-bold">{isPublic ? t.publicTitle : t.successTitle}</h2>
          <p className={`text-base text-muted-foreground ${lang === "ur" ? "font-urdu" : ""}`}>{isPublic ? t.willContact : ""}</p>
          <div className="rounded-xl bg-muted p-6 mt-2 min-w-[16rem]">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{isPublic ? t.refLabel : t.rollLabel}</p>
            <p className="font-heading font-bold text-3xl text-primary mt-1">{doneRef}</p>
          </div>
          {isPublic ? (
            <p className={`text-sm text-muted-foreground max-w-sm ${lang === "ur" ? "font-urdu" : ""}`}>{t.willContact}</p>
          ) : (
            <Button onClick={() => { setDoneRef(null); setForm(init); setStep(1); }} className="mt-2">
              {lang === "ur" && <span className="font-urdu">{t.newAdmission}</span>}
              {lang === "en" && t.newAdmission}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <AdmissionStepper current={step} lang={lang} />
      {!isPublic && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={fillSimpleData} className="gap-2">
            <Wand2 className="h-4 w-4" />
            {lang === "ur" ? "سادہ ڈیٹا بھریں" : "Fill with simple data"}
          </Button>
        </div>
      )}
      <div className="mt-6 space-y-6">
        {step === 1 && <StepPersonal form={form} update={update} lang={lang} />}
        {step === 2 && <StepSystem form={form} update={update} lang={lang} />}
        {step === 3 && <StepDetails form={form} update={update} lang={lang} />}
        {step === 4 && <StepGuardian form={form} update={update} isPublic={isPublic} lang={lang} />}
        {step === 5 && <StepReview form={form} goTo={setStep} lang={lang} />}
      </div>

      {step === 5 && (
        <label className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-muted/50 cursor-pointer">
          <Checkbox checked={form.declaration} onCheckedChange={(v) => update("declaration", v === true)} />
          <span className={`text-sm leading-loose ${lang === "ur" ? "font-urdu" : ""}`}>{t.declaration}</span>
        </label>
      )}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          <ArrowRight className="h-4 w-4 me-2" />
          {lang === "ur" && <span className="font-urdu">{t.prev}</span>}
          {lang === "en" && t.prev}
        </Button>
        {step < 5 ? (
          <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            {lang === "ur" && <span className="font-urdu">{t.next}</span>}
            {lang === "en" && t.next}
            <ArrowLeft className="h-4 w-4 ms-2" />
          </Button>
        ) : (
          <Button disabled={!canNext() || submitting} onClick={submit} size="lg">
            {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {lang === "ur" && <span className="font-urdu">{t.submit}</span>}
            {lang === "en" && t.submit}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepPersonal({ form, update, lang }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void; lang: "ur" | "en" }) {
  const t = TEXT[lang];
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`}>
          {t.personalTitle}
          {lang === "ur" && <span className="text-base text-muted-foreground ms-2 font-urdu">{t.personal}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BilingualLabel urdu={t.studentNameUrdu} english={t.studentNameUrdu} required lang={lang}>
          <Input className={`${lang === "ur" ? "font-urdu" : ""}`} placeholder={lang === "ur" ? "نام درج کریں" : "Enter name"} value={form.nameUrdu} onChange={(e) => update("nameUrdu", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu={t.studentNameEng} english={t.studentNameEng} lang={lang}>
          <Input placeholder={lang === "ur" ? "Muhammad Abdullah" : "Muhammad Abdullah"} value={form.nameEng} onChange={(e) => update("nameEng", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu={t.dob} english={t.dob} required lang={lang}>
          <Input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} />
        </BilingualLabel>
        <div className="flex flex-col gap-1">
          <span className={`text-base ${lang === "ur" ? "font-urdu" : "font-heading"}`}>{t.gender}</span>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(["male", "female"] as const).map((g) => (
              <button key={g} type="button" onClick={() => update("gender", g)}
                className={cn("border rounded-xl p-4 text-center transition-all", form.gender === g ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                <span className={`text-lg block ${lang === "ur" ? "font-urdu" : ""}`}>{lang === "ur" ? (g === "male" ? "بنین" : "بنات") : (g === "male" ? "Male" : "Female")}</span>
                <span className="text-xs text-muted-foreground">{g === "male" ? "Male" : "Female"}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <BilingualLabel urdu={t.address} english={t.address} required lang={lang}>
            <Textarea className={`${lang === "ur" ? "font-urdu" : ""}`} placeholder={lang === "ur" ? "مکمل پتہ درج کریں" : "Enter full address"} value={form.address} onChange={(e) => update("address", e.target.value)} />
          </BilingualLabel>
        </div>
        <div className="md:col-span-2">
          <label className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className={`text-sm ${lang === "ur" ? "font-urdu" : ""}`}>{t.photo}</span>
            <span className="text-xs text-muted-foreground">{t.photoHint}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => update("photo", e.target.files?.[0]?.name ?? null)} />
          </label>
          {form.photo && <p className="text-xs text-muted-foreground mt-2 text-center">Selected: {form.photo}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StepSystem({ form, update, lang }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void; lang: "ur" | "en" }) {
  const t = TEXT[lang];
  const opts: { value: System; icon: string; ur: string; en: string; desc: string }[] = [
    { value: "madrassa", icon: "🕌", ur: t.systemMadrassa, en: t.systemMadrassa, desc: t.systemMadrassaDesc },
    { value: "school", icon: "🏫", ur: t.systemSchool, en: t.systemSchool, desc: t.systemSchoolDesc },
    { value: "both", icon: "🏛️", ur: t.systemBoth, en: t.systemBoth, desc: t.systemBothDesc },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`}>
          {t.systemTitle}
          {lang === "ur" && <span className="text-base text-muted-foreground ms-2 font-urdu">{t.system}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {opts.map((o) => (
            <button key={o.value} type="button" onClick={() => update("system", o.value)}
              className={cn("border-2 rounded-2xl p-6 text-center transition-all", form.system === o.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40")}>
              <div className="text-4xl mb-3">{o.icon}</div>
              <p className={`text-lg font-semibold ${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`}>{o.ur}</p>
              <p className={`text-sm text-muted-foreground ${lang === "ur" ? "text-end" : "text-start"}`}>{o.en}</p>
              <p className={`text-xs text-muted-foreground mt-2 ${lang === "ur" ? "text-end font-urdu" : "text-start"}`}>{o.desc}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StepDetails({ form, update, lang }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void; lang: "ur" | "en" }) {
  const t = TEXT[lang];
  const cat = madrassaCategories.find((c) => c.id === form.categoryId);
  const renderMadrassa = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BilingualLabel urdu={t.category} english={t.category} required lang={lang}>
        <Select value={form.categoryId} onValueChange={(v) => { update("categoryId", v); update("subcategoryId", ""); }}>
          <SelectTrigger><SelectValue placeholder={t.selectCategory} /></SelectTrigger>
          <SelectContent>
            {madrassaCategories.map((c) => <SelectItem key={c.id} value={c.id}><span className="font-urdu">{c.nameUrdu}</span> · {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </BilingualLabel>
      <BilingualLabel urdu={t.subcategory} english={t.subcategory} required lang={lang}>
        <Select value={form.subcategoryId} onValueChange={(v) => update("subcategoryId", v)} disabled={!form.categoryId}>
          <SelectTrigger><SelectValue placeholder={form.categoryId ? t.selectCategory : t.selectFirstCategory} /></SelectTrigger>
          <SelectContent>
            {cat?.subcategories.map((s) => <SelectItem key={s.id} value={s.id}><span className="font-urdu">{s.nameUrdu}</span></SelectItem>)}
          </SelectContent>
        </Select>
      </BilingualLabel>
    </div>
  );
  const renderSchool = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BilingualLabel urdu={t.schoolClass} english={t.schoolClass} required lang={lang}>
        <Select value={form.classId} onValueChange={(v) => update("classId", v)}>
          <SelectTrigger><SelectValue placeholder={t.selectCategory} /></SelectTrigger>
          <SelectContent>
            {schoolClasses.map((c) => <SelectItem key={c.id} value={c.id}><span className="font-urdu">{c.nameUrdu}</span> · {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </BilingualLabel>
      <BilingualLabel urdu={t.section} english={t.section} lang={lang}>
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
      <CardHeader>
        <CardTitle className={`${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`}>
          {t.detailsTitle}
          <span className={`text-base text-muted-foreground ms-2 ${lang === "ur" ? "font-urdu" : ""}`}>{lang === "ur" ? "تفصیلات" : ""}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(form.system === "madrassa" || form.system === "both") && renderMadrassa}
        {form.system === "both" && <div className="h-px bg-border" />}
        {(form.system === "school" || form.system === "both") && renderSchool}
      </CardContent>
    </Card>
  );
}

function StepGuardian({ form, update, isPublic, lang }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void; isPublic: boolean; lang: "ur" | "en" }) {
  const t = TEXT[lang];
  const [q, setQ] = useState("");
  const results = q.length > 1 ? students.filter((s) => s.nameUrdu.includes(q) || s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4) : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"}`}>
          {t.guardianTitle}
          <span className={`text-base text-muted-foreground ms-2 ${lang === "ur" ? "font-urdu" : ""}`}>{lang === "ur" ? "ولی کی معلومات" : ""}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BilingualLabel urdu={t.guardianName} english={t.guardianName} required lang={lang}>
            <Input className={`${lang === "ur" ? "font-urdu" : ""}`} value={form.guardianName} onChange={(e) => update("guardianName", e.target.value)} />
          </BilingualLabel>
          <BilingualLabel urdu={t.guardianPhone} english={t.guardianPhone} required lang={lang}>
            <Input placeholder="0312-3456789" value={form.guardianPhone} onChange={(e) => update("guardianPhone", e.target.value)} />
          </BilingualLabel>
          <BilingualLabel urdu={t.guardianCnic} english={t.guardianCnic} required lang={lang}>
            <Input placeholder="42201-1234567-1" value={form.guardianCnic} onChange={(e) => update("guardianCnic", e.target.value)} />
          </BilingualLabel>
        </div>
        {!isPublic && (
          <div className="pt-2">
            <div className="h-px bg-border my-4" />
            <p className={`text-sm mb-2 ${lang === "ur" ? "text-end font-urdu" : "text-start"}`}>
              {t.siblingSearch}
              {lang === "ur" && <span className="text-xs text-muted-foreground font-sans ms-2">Sibling search</span>}
            </p>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="ps-9" placeholder={t.siblingSearchHint} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {q.length > 1 && results.length === 0 && (
              <p className={`text-sm text-muted-foreground text-center py-4 ${lang === "ur" ? "font-urdu" : ""}`}>{t.noResults}</p>
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

function StepReview({ form, goTo, lang }: { form: FormState; goTo: (n: number) => void; lang: "ur" | "en" }) {
  return <StepReviewInner form={form} goTo={goTo} lang={lang} />;
}

function StepReviewInner({ form, goTo, lang }: { form: FormState; goTo: (n: number) => void; lang: "ur" | "en" }) {
  const t = TEXT[lang];
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
      <SectionCard title={t.personal} urdu={t.personal} onEdit={() => goTo(1)} lang={lang}>
        {row(t.nameUrdu, t.nameUrdu, form.nameUrdu)}
        {row(t.nameEng, t.nameEng, form.nameEng)}
        {row(t.dobLabel, t.dobLabel, form.dob)}
        {row(t.genderLabel, t.genderLabel, form.gender === "male" ? (lang === "ur" ? "Male / بنین" : "Male") : form.gender === "female" ? (lang === "ur" ? "Female / بنات" : "Female") : "")}
        {row(t.addressLabel, t.addressLabel, form.address)}
      </SectionCard>
      <SectionCard title={t.system} urdu={t.system} onEdit={() => goTo(2)} lang={lang}>
        {row(t.system, t.system, form.system)}
      </SectionCard>
      <SectionCard title={lang === "ur" ? "درج فہرست" : "Enrollment"} urdu={lang === "ur" ? "درج فہرست" : "Enrollment"} onEdit={() => goTo(3)} lang={lang}>
        {cat && row(t.category, t.category, `${cat.nameUrdu} · ${cat.name}`)}
        {sub && row(t.subcategory, t.subcategory, `${sub.nameUrdu} · ${sub.name}`)}
        {cls && row(t.schoolClass, t.schoolClass, `${cls.nameUrdu} · ${cls.name}`)}
        {form.section && row(t.section, t.section, form.section)}
      </SectionCard>
      <SectionCard title={t.guardian} urdu={t.guardian} onEdit={() => goTo(4)} lang={lang}>
        {row(t.guardianName, t.guardianName, form.guardianName)}
        {row(t.guardianCnic, t.guardianCnic, form.guardianCnic)}
        {row(t.guardianPhone, t.guardianPhone, form.guardianPhone)}
        {form.siblings.length > 0 && row(t.siblingsLabel, t.siblingsLabel, form.siblings.map((s) => s.nameUrdu).join("، "))}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, urdu, onEdit, children, lang }: { title: string; urdu: string; onEdit: () => void; children: React.ReactNode; lang: "ur" | "en" }) {
  const t = TEXT[lang];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={`${lang === "ur" ? "text-end font-urdu" : "text-start font-heading"} text-base`}>
          {title}
          {lang === "ur" && <span className="text-sm text-muted-foreground ms-2 font-urdu">{urdu}</span>}
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5 me-1" /> {lang === "ur" ? "ترمیم" : "Edit"}</Button>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}