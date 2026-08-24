import { useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLanguage } from "@/components/language-context";
import {
  ImagePlus,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Printer,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import type { AdmissionVariant } from "@/lib/admission-variants";
import { printAdmissionForm } from "@/lib/admission-print";
import {
  buildAdmissionPrintPayload,
  type AdmissionPrintResponse,
} from "@/lib/admission-print-payload";
import { buildAdmissionSampleData } from "@/lib/admission-sample-data";
import { madrassaGradesForSection, type MadrassaGradeKind } from "@/lib/madrassa-grade-catalog";
import {
  DatePickerInput,
  formatHijriDate,
  parseDateOnly,
} from "@/components/custom/date-picker-input";
import { CredentialsOverlay } from "@/features/users/credentials-display";
import type { AdmissionAcceptanceWarning, ParentCreds } from "@/components/students/student-types";
import { toast } from "sonner";

const TEXT = {
  ur: {
    successTitle: "داخلہ کامیابی سے مکمل ہوا",
    publicTitle: "درخواست جمع ہو گئی",
    rollLabel: "رول نمبر",
    refLabel: "رفرنس نمبر",
    printForm: "فارم پرنٹ کریں",
    backToHub: "واپس داخلہ مرکز",
    officeInfo: "دفتری معلومات",
    officeInfoEn: "Office Info",
    admissionDate: "تاریخ داخلہ",
    correspondingDate: "بمطابق",
    requestedClass: "مطلوبہ درجہ",
    entryTestMarks: "امتحان داخلہ میں حاصل کردہ نمبرات",
    academicYear: "برائے تعلیمی سال",
    photoUpload: "تصویر اپ لوڈ کریں",
    photoHint: "پاسپورٹ-size تصویر · PNG/JPG (زیادہ سے زیادہ 2 MB)",
    selected: "منتخب",
    studentInfo: "طالب علم کی معلومات",
    fatherName: "ولدیت",
    dobDigits: "تاریخ پیدائش (ہندسوں میں)",
    dobWords: "تاریخ پیدائش (لفظوں میں)",
    address: "پتہ",
    occupation: "پیشہ",
    religion: "مذہب",
    previousSchool: "سابقہ سکول کا نام و پتہ",
    certificateNo: "سرٹیفیکیٹ اور فائل نمبر",
    admittedClass: "کلاس جس میں داخل ہوا",
    studentName: "نام",
    studentNameUr: "طالب علم کا نام (اردو)",
    studentNameEn: "نام (انگریزی)",
    fatherNameUr: "ولد کا نام",
    dob: "تاریخ پیدائش",
    gender: "جنس",
    male: "بنین",
    female: "بنات",
    currentAddress: "موجودہ پتہ",
    permanentAddress: "دائمی پتہ",
    guardianInfo: "ولی / سرپرست کی معلومات",
    guardianName: "ولی کا نام",
    guardianRelation: "ولی سے تعلق",
    guardianPhone: "فون نمبر",
    guardianCnic: "شناختی کارڈ نمبر",
    siblingSearch: "بھائی / بہن تلاش کریں",
    searchByName: "نام یا رول نمبر تلاش کریں...",
    noResults: "کوئی نتیجہ نہیں ملا",
    addSibling: "بھائی / بہن شامل کریں",
    declaration: "میں اقرار کرتا/کرتی ہوں کہ مندرجہ بالا تمام معلومات درست ہیں اور ادارے کے تمام قواعد و ضوابط قبول ہیں۔",
    cancel: "منسوخ",
    print: "پرنٹ",
    submitPublic: "درخواست جمع کروائیں",
    submitInternal: "داخلہ محفوظ کریں",
    fillSample: "نمونہ ڈیٹا بھریں",
    originalPdf: "اصل پی ڈی ایف",
    personal: "ذاتی",
    system: "نظام",
    enrollment: "درج فہرست",
    guardian: "ولی",
    edit: "ترمیم",
  },
  en: {
    successTitle: "Admission Successful",
    publicTitle: "Application Submitted",
    rollLabel: "Roll Number",
    refLabel: "Reference No.",
    printForm: "Print Form",
    backToHub: "Back to Admission Hub",
    officeInfo: "Office Information",
    officeInfoEn: "Office Info",
    admissionDate: "Admission Date",
    correspondingDate: "Corresponding Date",
    requestedClass: "Requested Class/Darja",
    entryTestMarks: "Entry Test Marks",
    academicYear: "For Academic Year",
    photoUpload: "Upload Photo",
    photoHint: "Passport-size photo · PNG/JPG (max 2 MB)",
    selected: "Selected",
    studentInfo: "Student Information",
    fatherName: "Father Name",
    dobDigits: "Date of Birth (Digits)",
    dobWords: "Date of Birth (In Words)",
    address: "Address",
    occupation: "Occupation",
    religion: "Religion",
    previousSchool: "Previous School Name & Address",
    certificateNo: "Certificate / File No.",
    admittedClass: "Admitted Class",
    studentName: "Student Name",
    studentNameUr: "Student Name (Urdu)",
    studentNameEn: "Student Name (English)",
    fatherNameUr: "Father's Name",
    dob: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    currentAddress: "Current Address",
    permanentAddress: "Permanent Address",
    guardianInfo: "Guardian Information",
    guardianName: "Guardian Name",
    guardianRelation: "Relation to Guardian",
    guardianPhone: "Phone Number",
    guardianCnic: "CNIC Number",
    siblingSearch: "Search Siblings",
    searchByName: "Search by name or roll no...",
    noResults: "No results found",
    addSibling: "Add Sibling",
    declaration: "I declare that all information above is correct and I accept all the rules and regulations of the institution.",
    cancel: "Cancel",
    print: "Print",
    submitPublic: "Submit Application",
    submitInternal: "Save Admission",
    fillSample: "Fill Sample Data",
    originalPdf: "Original PDF",
    personal: "Personal",
    system: "System",
    enrollment: "Enrollment",
    guardian: "Guardian",
    edit: "Edit",
  },
};

type State = Record<string, string>;
type PhotoState = { name: string; dataUrl: string };
type GradeOption = ReturnType<typeof gradeOptionsForVariant>[number];
type AdmissionSaveResponse = AdmissionPrintResponse & {
  error?: string;
  parentCredentials?: ParentCreds | null;
  warnings?: AdmissionAcceptanceWarning[];
};

const requiredFieldsByLayout = {
  school: ["name", "father", "dob_digits", "address", "class", "guardian_name"],
  "madrassa-short": [
    "name",
    "father",
    "dob",
    "shoba",
    "curr_address",
    "guardian_name",
    "guardian_rel",
    "guardian_phone",
  ],
  "madrassa-long": ["req_darja", "name", "father", "dob_age", "guardian_name"],
} satisfies Record<AdmissionVariant["layout"], string[]>;

export function PdfFormRenderer({
  variant,
  isPublic = false,
}: {
  variant: AdmissionVariant;
  isPublic?: boolean;
}) {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const navigate = useNavigate();
  const [form, setForm] = useState<State>({});
  const [declaration, setDeclaration] = useState(false);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refNo, setRefNo] = useState<string | null>(null);
  const [savedPrintForm, setSavedPrintForm] = useState<State | null>(null);
  const [creds, setCreds] = useState<ParentCreds | null>(null);
  const isRtl = lang === "ur";

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const val = (k: string) => form[k] ?? "";
  const requestedGradeOptions = gradeOptionsForVariant(variant);

  const setAdmissionDate = (value: string, date: Date) => {
    setForm((current) => ({
      ...current,
      adm_date: value,
      ...(variant.layout === "school" ? {} : { bmutabiq: formatHijriDate(date) }),
    }));
  };

  const handlePrint = () => {
    const institutionUrdu = variant.institutionUrdu;
    const opened = printAdmissionForm(
      variant,
      savedPrintForm ?? buildAdmissionPrintPayload(form),
      institutionUrdu,
      {
        photoDataUrl: photo?.dataUrl,
      },
    );
    if (!opened) {
      toast.error("Print window was blocked. Please allow popups for this site.");
    }
  };

  const fillSampleData = () => {
    const sample = buildAdmissionSampleData(variant);
    const emptyEntries = Object.entries(sample).filter(([key]) => !form[key]?.trim());

    if (emptyEntries.length === 0) {
      toast.info("تمام خانے پہلے سے بھرے ہوئے ہیں");
      return;
    }

    setForm((current) => {
      const next = { ...current };
      for (const [key, value] of emptyEntries) {
        if (!next[key]?.trim()) next[key] = value;
      }
      return next;
    });
    setSavedPrintForm(null);
    toast.success("خالی خانوں میں نمونہ ڈیٹا بھر دیا گیا");
  };

  const missingRequired = () =>
    requiredFieldsByLayout[variant.layout].filter((key) => !form[key]?.trim());

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhoto(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a PNG or JPG image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto({ name: file.name, dataUrl: reader.result });
      }
    };
    reader.onerror = () => toast.error("Could not read the selected photo.");
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    const missing = missingRequired();
    if (missing.length > 0) {
      toast.error("Please complete all required fields before saving.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        isPublic ? "/api/admission/applications" : "/api/admission/students",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            variantKey: variant.key,
            form,
            declaration,
            photoDataUrl: photo?.dataUrl,
          }),
        },
      );
      const payload: AdmissionSaveResponse = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not save admission");
      }

      setSavedPrintForm(buildAdmissionPrintPayload(form, payload));
      if (payload.parentCredentials) setCreds(payload.parentCredentials);
      setRefNo(
        payload.student?.rollNo ?? payload.application?.refNo ?? payload.application?.id ?? null,
      );
      setSubmitting(false);
      toast.success(
        isPublic
          ? "درخواست جمع ہو گئی · Application submitted"
          : "داخلہ محفوظ ہو گیا · Admission saved",
      );
      const parentWarning = payload.warnings?.find(
        (warning) => warning.code === "parent_account_failed",
      );
      if (parentWarning) {
        toast.warning(parentWarning.message, {
          description: [parentWarning.metadata?.username, parentWarning.metadata?.reason]
            .filter(Boolean)
            .join(" · "),
        });
      }
    } catch (error) {
      setSubmitting(false);
      toast.error(error instanceof Error ? error.message : "Could not save admission");
    }
  };

  if (refNo) {
    return (
      <>
        <Card className="max-w-xl mx-auto text-center">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            <h2 className={`text-2xl font-bold leading-loose ${isRtl ? "font-urdu" : "font-heading"}`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
              {isPublic ? t.publicTitle : t.successTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isPublic ? "Application Submitted" : "Admission Confirmed"}
            </p>
            <div className="rounded-xl bg-muted p-6 mt-2 min-w-[16rem]">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {isPublic ? t.refLabel : t.rollLabel}
              </p>
              <p className="font-heading font-bold text-3xl text-primary mt-1">{refNo}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 me-2" />
                <span className={`${isRtl ? "font-urdu" : ""}`}>{t.printForm}</span>
              </Button>
              {!isPublic && (
                <Button onClick={() => navigate({ to: "/admission" })}>
                  <span className={`${isRtl ? "font-urdu" : ""}`}>{t.backToHub}</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <CredentialsOverlay creds={creds} onClose={() => setCreds(null)} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form header — mirrors PDF letterhead */}
      <Card className="text-center">
        <CardContent className="py-8 space-y-2">
          <p
            className={`text-base text-muted-foreground leading-loose ${isRtl ? "font-urdu" : ""}`}
            dir={isRtl ? "rtl" : "ltr"}
            lang={lang}
          >
            {isRtl ? variant.institutionUrdu : variant.institutionEnglish}
          </p>
          <h1 className={`text-3xl font-bold leading-loose ${isRtl ? "font-urdu" : "font-heading"}`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
            {isRtl ? variant.titleUrdu : variant.titleEnglish}
          </h1>
          {(isRtl ? variant.subtitleUrdu : variant.subtitleEnglish) && (
            <p
              className={`text-lg text-muted-foreground leading-loose ${isRtl ? "font-urdu" : ""}`}
              dir={isRtl ? "rtl" : "ltr"}
              lang={lang}
            >
              {isRtl ? variant.subtitleUrdu : variant.subtitleEnglish}
            </p>
          )}
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {isRtl ? variant.titleUrdu : variant.titleEnglish}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={fillSampleData}>
              <Wand2 className="h-4 w-4 me-2" />
              <span className={`${isRtl ? "font-urdu" : ""}`}>{t.fillSample}</span>
            </Button>
            <a
              href={variant.pdfPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-primary shadow-sm underline-offset-4 hover:bg-accent hover:text-accent-foreground"
            >
              {t.originalPdf}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          {variant.addressUrdu && isRtl && (
            <p
              className="font-urdu text-sm text-muted-foreground leading-loose mt-2"
              dir="rtl"
              lang="ur"
            >
              {variant.addressUrdu}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meta row — form/admission numbers (present in all variants) */}
      <Card>
        <CardHeader>
          <CardTitle className={`${isRtl ? "text-end font-urdu" : "text-start font-heading"} text-lg leading-loose`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
            {t.officeInfo}
            {isRtl && <span className="text-xs text-muted-foreground ms-2 font-sans uppercase tracking-widest">{t.officeInfoEn}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BilingualLabel urdu={t.admissionDate} english={t.admissionDate} htmlFor="adm_date" lang={lang}>
            <DatePickerInput
              id="adm_date"
              value={val("adm_date")}
              calendarType="gregorian"
              placeholder={isRtl ? "تاریخ داخلہ منتخب کریں" : "Select admission date"}
              onChange={setAdmissionDate}
            />
          </BilingualLabel>
          {variant.layout !== "school" && (
            <BilingualLabel urdu="بمطابق" english="Corresponding Date" htmlFor="bmutabiq" lang={lang}>
                <DatePickerInput
                  id="bmutabiq"
                  value={val("adm_date")}
                  calendarType="hijri"
                  displayValue={val("bmutabiq") || undefined}
                  selectedDate={parseDateOnly(val("adm_date"))}
                  placeholder="ہجری تاریخ منتخب کریں"
                  onChange={(value, date) => {
                    set("adm_date", value);
                    set("bmutabiq", formatHijriDate(date));
                  }}
                />
              </BilingualLabel>
          )}
          {variant.layout === "madrassa-long" && (
            <>
              <BilingualLabel
                urdu="مطلوبہ درجہ"
                english="Requested Class/Darja"
                htmlFor="req_darja"
                required
              >
                <MadrassaGradeSelect
                  id="req_darja"
                  value={val("req_darja")}
                  options={requestedGradeOptions}
                  placeholder={lang === "ur" ? "درجہ منتخب کریں" : "Select class"}
                  onValueChange={(value) => {
                    set("req_darja", value);
                    set("candidate_darja", value);
                  }}
                  lang={lang}
                />
              </BilingualLabel>
              <BilingualLabel
                urdu="امتحان داخلہ میں حاصل کردہ نمبرات"
                english="Entry-Test Marks"
                htmlFor="entry_marks"
                lang={lang}
              >
                <Input
                  id="entry_marks"
                  name="entry_marks"
                  inputMode="numeric"
                  value={val("entry_marks")}
                  onChange={(e) => set("entry_marks", e.target.value)}
                />
              </BilingualLabel>
              <BilingualLabel
                urdu="برائے تعلیمی سال"
                english="For Academic Year"
                htmlFor="acad_year"
                lang={lang}
              >
                <Input
                  id="acad_year"
                  name="acad_year"
                  value={val("acad_year")}
                  onChange={(e) => set("acad_year", e.target.value)}
                />
              </BilingualLabel>
            </>
          )}
        </CardContent>
      </Card>

      {/* Photo block — only for variants that allow */}
      {variant.allowPhoto && (
        <Card>
          <CardContent className="py-6">
            <label className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className={`text-sm leading-loose ${isRtl ? "font-urdu" : ""}`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
                {t.photoUpload}
              </span>
              <span className="text-xs text-muted-foreground">{t.photoHint}</span>
              <input
                name="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
            {photo && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <img
                  src={photo.dataUrl}
                  alt=""
                  className="h-16 w-12 rounded border border-border object-cover"
                />
                <p className="text-xs text-muted-foreground">{t.selected}: {photo.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Body per layout */}
      {variant.layout === "school" && <SchoolFields form={form} set={set} lang={lang} t={t} />}
      {variant.layout === "madrassa-short" && (
        <MadrassaShortFields
          form={form}
          set={set}
          variant={variant}
          isGirls={variant.category === "female"}
          lang={lang}
          t={t}
        />
      )}
      {variant.layout === "madrassa-long" && (
        <MadrassaLongFields
          form={form}
          set={set}
          variant={variant}
          isGirls={variant.category === "female"}
          lang={lang}
          t={t}
        />
      )}

      {/* Declaration + submit */}
      <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 cursor-pointer">
        <Checkbox checked={declaration} onCheckedChange={(v) => setDeclaration(v === true)} />
        <span className={`text-sm leading-loose text-end flex-1 ${isRtl ? "font-urdu" : ""}`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
          {t.declaration}
        </span>
      </label>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() =>
            isPublic ? navigate({ to: "/apply", search: {} }) : navigate({ to: "/admission" })
          }
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
          <span className={`${isRtl ? "font-urdu" : ""}`}>{t.cancel}</span>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" />
            <span className={`${isRtl ? "font-urdu" : ""}`}>{t.print}</span>
          </Button>
          <Button size="lg" onClick={submit} disabled={!declaration || submitting}>
            {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            <span className={`${isRtl ? "font-urdu" : ""}`}>
              {isPublic ? t.submitPublic : t.submitInternal}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  urdu,
  english,
  children,
  lang,
}: {
  urdu: string;
  english: string;
  children: React.ReactNode;
  lang: "ur" | "en";
}) {
  const isRtl = lang === "ur";
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${isRtl ? "text-end font-urdu" : "text-start font-heading"} text-lg leading-loose`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
          {isRtl ? urdu : english}
          {isRtl && <span className="text-xs text-muted-foreground ms-2 font-sans uppercase tracking-widest">{english}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</CardContent>
    </Card>
  );
}

type FieldProps = { form: State; set: (k: string, v: string) => void; lang: "ur" | "en"; t: typeof TEXT["ur"] };

function gradeOptionsForVariant(variant: AdmissionVariant) {
  const section = variant.category === "female" ? "banat" : "baneen";
  const kinds: MadrassaGradeKind[] =
    variant.key === "madrassa-boys-hifz"
      ? ["hifz"]
      : variant.key === "madrassa-boys-nazira" || variant.key === "madrassa-girls-nazira"
        ? ["nazira"]
        : ["preparatory", "dars_nizami", "tajweed", "takhassus", "short_course"];

  return madrassaGradesForSection(section, kinds);
}

function MadrassaGradeSelect({
  id,
  value,
  options,
  placeholder,
  onValueChange,
  lang = "ur",
}: {
  id: string;
  value: string;
  options: GradeOption[];
  placeholder: string;
  onValueChange: (value: string) => void;
  lang?: "ur" | "en";
}) {
  const isRtl = lang === "ur";
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={isRtl ? "font-urdu" : ""} dir={isRtl ? "rtl" : "ltr"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span className={isRtl ? "font-urdu" : ""}>{option.nameUrdu}</span>
            <span className="text-xs text-muted-foreground ms-2">{option.rollPrefix}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ============================================================
 * School layout — Al-Qasim / Zainab (Shoba School)
 * ============================================================ */
function SchoolFields({ form, set, lang, t }: FieldProps) {
  const val = (k: string) => form[k] ?? "";
  const isRtl = lang === "ur";
  return (
    <>
      <Section urdu={t.studentInfo} english={t.studentInfo} lang={lang}>
        <BilingualLabel urdu={t.studentNameUr} english={t.studentNameEn} htmlFor="name" required lang={lang}>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            className={isRtl ? "font-urdu" : ""}
            value={val("name")}
            onChange={(e) => set("name", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu={t.fatherNameUr} english={t.fatherName} htmlFor="father" required lang={lang}>
          <Input
            id="father"
            name="father"
            required
            className={isRtl ? "font-urdu" : ""}
            value={val("father")}
            onChange={(e) => set("father", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel
          urdu={t.dobDigits}
          english={t.dobDigits}
          htmlFor="dob_digits"
          required
          lang={lang}
        >
          <DatePickerInput
            id="dob_digits"
            value={val("dob_digits")}
            calendarType="gregorian"
            placeholder={isRtl ? "تاریخ پیدائش منتخب کریں" : "Select date of birth"}
            onChange={(value) => set("dob_digits", value)}
          />
        </BilingualLabel>
        <BilingualLabel
          urdu={t.dobWords}
          english={t.dobWords}
          htmlFor="dob_words"
          lang={lang}
        >
          <Input
            id="dob_words"
            name="dob_words"
            className={isRtl ? "font-urdu" : ""}
            value={val("dob_words")}
            onChange={(e) => set("dob_words", e.target.value)}
          />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu={t.address} english={t.address} htmlFor="address" required lang={lang}>
            <Textarea
              id="address"
              name="address"
              required
              autoComplete="street-address"
              className={isRtl ? "font-urdu" : ""}
              value={val("address")}
              onChange={(e) => set("address", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu={t.occupation} english={t.occupation} htmlFor="occupation" lang={lang}>
          <Input
            id="occupation"
            name="occupation"
            className={isRtl ? "font-urdu" : ""}
            value={val("occupation")}
            onChange={(e) => set("occupation", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu={t.religion} english={t.religion} htmlFor="religion" lang={lang}>
          <Input
            id="religion"
            name="religion"
            className={isRtl ? "font-urdu" : ""}
            value={val("religion")}
            onChange={(e) => set("religion", e.target.value)}
          />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel
            urdu={t.previousSchool}
            english={t.previousSchool}
            htmlFor="prev_school"
            lang={lang}
          >
            <Textarea
              id="prev_school"
              name="prev_school"
              className={isRtl ? "font-urdu" : ""}
              value={val("prev_school")}
              onChange={(e) => set("prev_school", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <BilingualLabel
          urdu={t.certificateNo}
          english={t.certificateNo}
          htmlFor="cert_no"
          lang={lang}
        >
          <Input
            id="cert_no"
            name="cert_no"
            value={val("cert_no")}
            onChange={(e) => set("cert_no", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel
          urdu={t.admittedClass}
          english={t.admittedClass}
          htmlFor="class"
          required
          lang={lang}
        >
          <Input
            id="class"
            name="class"
            required
            className={isRtl ? "font-urdu" : ""}
            value={val("class")}
            onChange={(e) => set("class", e.target.value)}
          />
        </BilingualLabel>
      </Section>

      <Section urdu="سرپرست" english="Guardian" lang={lang}>
        <BilingualLabel
          urdu="سرپرست کا نام"
          english="Guardian Name"
          htmlFor="guardian_name"
          required
          lang={lang}
        >
          <Input
            id="guardian_name"
            name="guardian_name"
            required
            autoComplete="name"
            className={isRtl ? "font-urdu" : ""}
            value={val("guardian_name")}
            onChange={(e) => set("guardian_name", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="سرپرست ای میل" english="Guardian Email" htmlFor="guardian_email" lang={lang}>
          <Input
            id="guardian_email"
            name="guardian_email"
            type="email"
            autoComplete="email"
            value={val("guardian_email")}
            onChange={(e) => set("guardian_email", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel
          urdu="کیا مدرسہ میں داخل ہونا چاہتے ہیں؟"
          english="Also Enroll in Madrassa?"
          htmlFor="also_madrassa"
        >
          <Input
            id="also_madrassa"
            name="also_madrassa"
            className="font-urdu"
            placeholder="جی / نہیں"
            value={val("also_madrassa")}
            onChange={(e) => set("also_madrassa", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel
          urdu="کس شعبہ میں"
          english="Which Section (if yes)"
          htmlFor="madrassa_section"
        >
          <Input
            id="madrassa_section"
            name="madrassa_section"
            className="font-urdu"
            value={val("madrassa_section")}
            onChange={(e) => set("madrassa_section", e.target.value)}
          />
        </BilingualLabel>
      </Section>
    </>
  );
}

/* ============================================================
 * Madrassa Short — Nazira / Qaida / Hifz
 * ============================================================ */
function MadrassaShortFields({
  form,
  set,
  variant,
  isGirls,
  lang,
  t,
}: FieldProps & { variant: AdmissionVariant; isGirls: boolean }) {
  const val = (k: string) => form[k] ?? "";
  const isRtl = lang === "ur";
  const gradeOptions = gradeOptionsForVariant(variant);
  return (
    <>
      <Card>
        <CardContent className="py-6 space-y-3">
          {isRtl ? (
            <>
              <p className="font-urdu text-sm leading-loose text-end" dir="rtl" lang="ur">
                بخدمت جناب مہتمم صاحب دامت برکاتہم! السلام علیکم ورحمۃ اللہ وبرکاتہ!
              </p>
              <p
                className="font-urdu text-sm leading-loose text-end text-muted-foreground"
                dir="rtl"
                lang="ur"
              >
                میں جامعہ میں داخل ہونا چاہتا/چاہتی ہوں اور اقرار کرتا/کرتی ہوں کہ میں جامعہ کے جملہ
                قوانین و ضوابط کا پابند رہوں گا/گی۔ بلند اخلاق پر عمل پیرا رہوں گا/گی۔ اساتذہ کرام اور
                ارکان شوریٰ کا احترام کروں گا/گی۔ جامعہ کے مسلک پر پابند رہوں گا/گی۔ علمی مشاغل میں
                مصروف رہوں گا/گی۔ اندرونی و بیرونی مدرسہ تجارتی کاروبار نہیں کروں گا/گی۔ عالمانہ وضع قطع
                نشست و برخاست برقرار رکھوں گا/گی۔ ۱۰ رمضان سے پہلے مدرسہ نہیں چھوڑوں گا/گی۔ استدعا ہے کہ
                داخلہ کی اجازت فرمائی جائے۔
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-sm leading-loose text-start">
                Respectful greetings to the Honorable Principal! Peace and blessings be upon you.
              </p>
              <p className="font-heading text-sm leading-loose text-start text-muted-foreground">
                I wish to enroll in this institution and pledge that I will abide by all its rules and regulations.
                I will uphold high moral character, respect teachers and the advisory committee, remain committed to
                the institution's creed, stay occupied in academic pursuits, refrain from commercial activities inside
                or outside the institution, maintain a dignified demeanor, and not leave the institution before
                the 10th of Ramadan. I request that admission be granted.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Section urdu={isGirls ? "طالبہ کے کوائف" : "طالب علم کے کوائف"} english="Student Details" lang={lang}>
        <BilingualLabel
          urdu={isGirls ? "نام طالبہ" : "نام طالب علم"}
          english="Student Name"
          htmlFor="name"
          required
          lang={lang}
        >
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            className="font-urdu"
            value={val("name")}
            onChange={(e) => set("name", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="ولدیت" english="Father Name" htmlFor="father" required lang={lang}>
          <Input
            id="father"
            name="father"
            required
            className="font-urdu"
            value={val("father")}
            onChange={(e) => set("father", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="تاریخ پیدائش" english="Date of Birth" htmlFor="dob" required lang={lang}>
          <DatePickerInput
            id="dob"
            value={val("dob")}
            calendarType="gregorian"
            placeholder="تاریخ پیدائش منتخب کریں"
            onChange={(value) => set("dob", value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="شعبہ" english="Section / Shoba" htmlFor="shoba" required lang={lang}>
          <MadrassaGradeSelect
            id="shoba"
            value={val("shoba")}
            options={gradeOptions}
            placeholder={lang === "ur" ? "شعبہ منتخب کریں" : "Select section"}
            onValueChange={(value) => set("shoba", value)}
            lang={lang}
          />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel
            urdu="موجودہ پتہ"
            english="Current Address"
            htmlFor="curr_address"
            required
            lang={lang}
          >
            <Textarea
              id="curr_address"
              name="curr_address"
              required
              autoComplete="street-address"
              className="font-urdu"
              value={val("curr_address")}
              onChange={(e) => set("curr_address", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <div className="md:col-span-2">
          <BilingualLabel urdu="مستقل پتہ" english="Permanent Address" htmlFor="perm_address" lang={lang}>
            <Textarea
              id="perm_address"
              name="perm_address"
              autoComplete="street-address"
              className="font-urdu"
              value={val("perm_address")}
              onChange={(e) => set("perm_address", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <div className="md:col-span-2">
          <BilingualLabel
            urdu="سابقہ مدرسے کا نام و پتہ"
            english="Previous Madrassa Name & Address"
            htmlFor="prev_madrassa"
            lang={lang}
          >
            <Textarea
              id="prev_madrassa"
              name="prev_madrassa"
              className="font-urdu"
              value={val("prev_madrassa")}
              onChange={(e) => set("prev_madrassa", e.target.value)}
            />
          </BilingualLabel>
        </div>
      </Section>

      <Section urdu="سرپرست" english="Guardian" lang={lang}>
        <BilingualLabel
          urdu="سرپرست کا نام"
          english="Guardian Name"
          htmlFor="guardian_name"
          required
          lang={lang}
        >
          <Input
            id="guardian_name"
            name="guardian_name"
            required
            autoComplete="name"
            className="font-urdu"
            value={val("guardian_name")}
            onChange={(e) => set("guardian_name", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="سرپرست کا رشتہ" english="Relation" htmlFor="guardian_rel" required lang={lang}>
          <Input
            id="guardian_rel"
            name="guardian_rel"
            required
            className="font-urdu"
            value={val("guardian_rel")}
            onChange={(e) => set("guardian_rel", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="رابطہ نمبر" english="Contact No." htmlFor="guardian_phone" required lang={lang}>
          <Input
            id="guardian_phone"
            name="guardian_phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={val("guardian_phone")}
            onChange={(e) => set("guardian_phone", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="سرپرست ای میل" english="Guardian Email" htmlFor="guardian_email">
          <Input
            id="guardian_email"
            name="guardian_email"
            type="email"
            autoComplete="email"
            value={val("guardian_email")}
            onChange={(e) => set("guardian_email", e.target.value)}
          />
        </BilingualLabel>
      </Section>
    </>
  );
}

/* ============================================================
 * Madrassa Long — Jamia Qasimia / Zainab (Dars-e-Nizami)
 * Includes kawaif nama + Ahd-nama (pledge) fields
 * ============================================================ */
function MadrassaLongFields({
  form,
  set,
  variant,
  isGirls,
  lang,
  t,
}: FieldProps & { variant: AdmissionVariant; isGirls: boolean }) {
  const val = (k: string) => form[k] ?? "";
  const isRtl = lang === "ur";
  const gradeOptions = gradeOptionsForVariant(variant);
  return (
    <>
      <Card>
        <CardContent className="py-6 space-y-2">
          {isRtl ? (
            <>
              <p className="font-urdu text-sm leading-loose text-end" dir="rtl" lang="ur">
                بخدمت جناب مہتمم صاحب دامت برکاتہم العالیہ، السلام علیکم ورحمۃ اللہ وبرکاتہ!
              </p>
              <p
                className="font-urdu text-sm leading-loose text-end text-muted-foreground"
                dir="rtl"
                lang="ur"
              >
                گزارش ہے کہ میں آپ کے زیر سایہ جامعہ کے مطلوبہ درجہ میں داخلہ لینے کا خواہشمند/خواہشمندہ
                ہوں۔ فارم ہذا کے صفحہ نمبر پر لکھا ہوا عہد نامہ میں نے بغور پڑھ لیا ہے۔ میں صدق دل سے
                وعدہ کرتا/کرتی ہوں کہ اس پر کار بند اور عمل پیرا رہوں گا/گی۔
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-sm leading-loose text-start">
                With utmost respect to the Honorable Principal! Peace and blessings be upon you.
              </p>
              <p className="font-heading text-sm leading-loose text-start text-muted-foreground">
                I wish to enroll in my desired class under your guidance. I have carefully read the pledge
                written on the form. I sincerely promise to act upon it with full commitment.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Section urdu="کوائف نامہ" english="Personal Particulars" lang={lang}>
        <BilingualLabel urdu="نام" english="Name" htmlFor="name" required lang={lang}>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            className="font-urdu"
            value={val("name")}
            onChange={(e) => set("name", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="ولدیت" english="Father Name" htmlFor="father" required lang={lang}>
          <Input
            id="father"
            name="father"
            required
            className="font-urdu"
            value={val("father")}
            onChange={(e) => set("father", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="تاریخ پیدائش یا عمر" english="DOB / Age" htmlFor="dob_age" required lang={lang}>
          <DatePickerInput
            id="dob_age"
            value={val("dob_age")}
            calendarType="gregorian"
            placeholder="تاریخ پیدائش منتخب کریں"
            onChange={(value) => set("dob_age", value)}
          />
        </BilingualLabel>
        <div className="hidden md:block" />

        {/* Current address */}
        <div className="md:col-span-2 rounded-xl border border-border p-4 space-y-3">
          <p className={`text-sm font-semibold ${isRtl ? "text-end font-urdu" : "text-start font-heading"}`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
            {isRtl ? "موجودہ پتہ" : "Current Address"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BilingualLabel urdu="گاؤں / محلہ" english="Village / Locality" lang={lang}>
              <Input
                className="font-urdu"
                value={val("curr_village")}
                onChange={(e) => set("curr_village", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="ڈاکخانہ / علاقہ" english="Post Office / Area" lang={lang}>
              <Input
                className="font-urdu"
                value={val("curr_po")}
                onChange={(e) => set("curr_po", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="تحصیل" english="Tehsil" lang={lang}>
              <Input
                className="font-urdu"
                value={val("curr_tehsil")}
                onChange={(e) => set("curr_tehsil", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="ضلع" english="District" lang={lang}>
              <Input
                className="font-urdu"
                value={val("curr_district")}
                onChange={(e) => set("curr_district", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="فون نمبر" english="Phone No." htmlFor="curr_phone" lang={lang}>
              <Input
                id="curr_phone"
                name="curr_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={val("curr_phone")}
                onChange={(e) => set("curr_phone", e.target.value)}
              />
            </BilingualLabel>
          </div>
        </div>

        {/* Permanent address */}
        <div className="md:col-span-2 rounded-xl border border-border p-4 space-y-3">
          <p className={`text-sm font-semibold ${isRtl ? "text-end font-urdu" : "text-start font-heading"}`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
            {isRtl ? "مستقل پتہ" : "Permanent Address"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BilingualLabel urdu="گاؤں / محلہ" english="Village / Locality" lang={lang}>
              <Input
                className="font-urdu"
                value={val("perm_village")}
                onChange={(e) => set("perm_village", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="ڈاکخانہ / علاقہ" english="Post Office / Area" lang={lang}>
              <Input
                className="font-urdu"
                value={val("perm_po")}
                onChange={(e) => set("perm_po", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="تحصیل" english="Tehsil" lang={lang}>
              <Input
                className="font-urdu"
                value={val("perm_tehsil")}
                onChange={(e) => set("perm_tehsil", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="ضلع" english="District" lang={lang}>
              <Input
                className="font-urdu"
                value={val("perm_district")}
                onChange={(e) => set("perm_district", e.target.value)}
              />
            </BilingualLabel>
            <BilingualLabel urdu="فون نمبر" english="Phone No." htmlFor="perm_phone" lang={lang}>
              <Input
                id="perm_phone"
                name="perm_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={val("perm_phone")}
                onChange={(e) => set("perm_phone", e.target.value)}
              />
            </BilingualLabel>
          </div>
        </div>
      </Section>

      <Section
        urdu={isGirls ? "جدید طالبات کے لیے" : "جدید طلباء کے لیے"}
        english="For New Students"
        lang={lang}
      >
        <div className="md:col-span-2">
          {isRtl ? (
            <p
              className="font-urdu text-xs text-muted-foreground text-end leading-loose"
              dir="rtl"
              lang="ur"
            >
              ہدایات: اسناد کی مصدقہ نقول فارم داخلہ کے ساتھ منسلق کریں اور انٹرویو کے دن اصل اسناد
              ساتھ لے کر آئیں۔
            </p>
          ) : (
            <p className="font-heading text-xs text-muted-foreground text-start leading-loose">
              Instructions: Attach attested copies of documents with the admission form and bring the
              original documents on the interview day.
            </p>
          )}
        </div>
        <BilingualLabel urdu="درس نظامی کا آخری پاس کردہ درجہ" english="Last Dars-e-Nizami Class" lang={lang}>
          <Input
            className="font-urdu"
            value={val("dn_last")}
            onChange={(e) => set("dn_last", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="حاصل کردہ نمبرات" english="Marks Obtained" lang={lang}>
          <Input value={val("dn_marks")} onChange={(e) => set("dn_marks", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تقدیر" english="Grade" lang={lang}>
          <Input
            className="font-urdu"
            value={val("dn_grade")}
            onChange={(e) => set("dn_grade", e.target.value)}
          />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel
            urdu="نام مدرسہ / جامعہ مع مکمل پتہ"
            english="Madrassa / Jamia Name & Address"
            lang={lang}
          >
            <Textarea
              className="font-urdu"
              value={val("dn_school")}
              onChange={(e) => set("dn_school", e.target.value)}
            />
          </BilingualLabel>
        </div>

        <BilingualLabel urdu="وفاق کا آخری پاس کردہ درجہ" english="Last Wafaq Class" lang={lang}>
          <Input
            className="font-urdu"
            value={val("wf_last")}
            onChange={(e) => set("wf_last", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="حاصل کردہ نمبرات" english="Marks Obtained" lang={lang}>
          <Input value={val("wf_marks")} onChange={(e) => set("wf_marks", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تقدیر" english="Grade" lang={lang}>
          <Input
            className="font-urdu"
            value={val("wf_grade")}
            onChange={(e) => set("wf_grade", e.target.value)}
          />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel
            urdu="نام مدرسہ / جامعہ مع مکمل پتہ"
            english="Wafaq Madrassa Name & Address"
          >
            <Textarea
              className="font-urdu"
              value={val("wf_school")}
              onChange={(e) => set("wf_school", e.target.value)}
            />
          </BilingualLabel>
        </div>

        <div className="md:col-span-2">
          <BilingualLabel
            urdu="کن کن مدارس میں تعلیم حاصل کی — نام مع پتہ"
            english="All Previous Madaris"
            lang={lang}
          >
            <Textarea
              className="font-urdu"
              value={val("prev_madaris")}
              onChange={(e) => set("prev_madaris", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="عصری علوم" english="Modern Education" lang={lang}>
          <Input
            className="font-urdu"
            value={val("modern_edu")}
            onChange={(e) => set("modern_edu", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="اضافی قابلیت" english="Additional Qualifications" lang={lang}>
          <Input
            className="font-urdu"
            value={val("extra_qual")}
            onChange={(e) => set("extra_qual", e.target.value)}
          />
        </BilingualLabel>
      </Section>

      <Section
        urdu={isGirls ? "قدیم طالبات کے لیے" : "قدیم طلباء کے لیے"}
        english="For Existing Students"
        lang={lang}
      >
        <BilingualLabel urdu="گذشتہ سال کا رول نمبر" english="Previous Year Roll No." lang={lang}>
          <Input value={val("prev_roll")} onChange={(e) => set("prev_roll", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="درجہ" english="Class / Darja" lang={lang}>
          <Input
            className="font-urdu"
            value={val("prev_darja")}
            onChange={(e) => set("prev_darja", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="حاصل کردہ نمبرات" english="Marks Obtained" lang={lang}>
          <Input value={val("prev_marks")} onChange={(e) => set("prev_marks", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تقدیر" english="Grade" lang={lang}>
          <Input
            className="font-urdu"
            value={val("prev_grade")}
            onChange={(e) => set("prev_grade", e.target.value)}
          />
        </BilingualLabel>
      </Section>

      <Section
        urdu={isGirls ? "عہد نامہ (طالبہ)" : "عہد نامہ (طالب علم)"}
        english="Pledge (Ahd-Nama)"
        lang={lang}
      >
        <div className="md:col-span-2">
          {isRtl ? (
            <p
              className="font-urdu text-xs text-muted-foreground text-end leading-loose"
              dir="rtl"
              lang="ur"
            >
              میں صدق دل سے عہد کرتا/کرتی ہوں کہ تمام احکام شرعیہ اور جامعہ کے قواعد کا پابند رہوں
              گا/گی، ہر فریضے کی ادائیگی، حسن اخلاق، سیاسی و غیر سیاسی تنظیموں سے عدم تعلق، جامعہ کی
              اجازت کے بغیر سالانہ امتحان سے پہلے کہیں نہیں جانے، لڑائی جھگڑے سے اجتناب، اسباق و تکرار
              کی پابندی، اور جامعہ کے مالی و انتظامی ضوابط کی پیروی کروں گا/گی۔ دو ماہانہ جائزوں کے
              بعد اگر اساتذہ کی رائے میں اس درجے کی استعداد نہ ہوئی تو نچلے درجے میں منتقلی قبول کروں
              گا/گی۔
            </p>
          ) : (
            <p className="font-heading text-xs text-muted-foreground text-start leading-loose">
              I solemnly pledge that I will abide by all Islamic injunctions and the institution&apos;s rules,
              fulfill every duty, maintain good character, refrain from political and non-political organizations,
              not leave before the annual exam without permission, avoid disputes, adhere to lessons and revision,
              and follow the institution&apos;s financial and administrative regulations. If, after two monthly assessments,
              the teachers do not consider me capable of this level, I will accept transfer to a lower level.
            </p>
          )}
        </div>
        <BilingualLabel urdu="امیدوار درجہ" english="Candidate Darja" lang={lang}>
          <MadrassaGradeSelect
            id="candidate_darja"
            value={val("candidate_darja")}
            options={gradeOptions}
            placeholder={lang === "ur" ? "درجہ منتخب کریں" : "Select class"}
            onValueChange={(value) => {
              set("candidate_darja", value);
              set("req_darja", value);
            }}
            lang={lang}
          />
        </BilingualLabel>
      </Section>

      <Section urdu="برائے سرپرست" english="For Guardian" lang={lang}>
        <div className="md:col-span-2">
          {isRtl ? (
            <p
              className="font-urdu text-xs text-muted-foreground text-end leading-loose"
              dir="rtl"
              lang="ur"
            >
              انتباہ: فارم کا یہ حصہ طالب علم کے انٹرویو کے موقع پر پُر کیا جائے گا۔
            </p>
          ) : (
            <p className="font-heading text-xs text-muted-foreground text-start leading-loose">
              Note: This section of the form will be filled during the student&apos;s interview.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <BilingualLabel
            urdu="شناختی کارڈ نمبر (13 ہندسے)"
            english="CNIC (13 digits)"
            htmlFor="cnic"
            lang={lang}
          >
            <Input
              id="cnic"
              name="cnic"
              inputMode="numeric"
              placeholder="XXXXX-XXXXXXX-X"
              value={val("cnic")}
              onChange={(e) => set("cnic", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <BilingualLabel
          urdu="سرپرست کا نام"
          english="Guardian Name"
          htmlFor="guardian_name"
          required
          lang={lang}
        >
          <Input
            id="guardian_name"
            name="guardian_name"
            required
            autoComplete="name"
            className="font-urdu"
            value={val("guardian_name")}
            onChange={(e) => set("guardian_name", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="ولدیت" english="Guardian Father Name" lang={lang}>
          <Input
            className="font-urdu"
            value={val("guardian_father")}
            onChange={(e) => set("guardian_father", e.target.value)}
          />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu="موجودہ پتہ" english="Current Address">
            <Textarea
              className="font-urdu"
              value={val("guardian_address")}
              onChange={(e) => set("guardian_address", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="فون (رہائش)" english="Phone (Home)" htmlFor="guardian_phone_home">
          <Input
            id="guardian_phone_home"
            name="guardian_phone_home"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={val("guardian_phone_home")}
            onChange={(e) => set("guardian_phone_home", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel
          urdu="فون (دکان / دفتر)"
          english="Phone (Shop / Office)"
          htmlFor="guardian_phone_office"
        >
          <Input
            id="guardian_phone_office"
            name="guardian_phone_office"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={val("guardian_phone_office")}
            onChange={(e) => set("guardian_phone_office", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="سرپرست ای میل" english="Guardian Email" htmlFor="guardian_email">
          <Input
            id="guardian_email"
            name="guardian_email"
            type="email"
            autoComplete="email"
            value={val("guardian_email")}
            onChange={(e) => set("guardian_email", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="رشتہ" english="Relation to Student">
          <Input
            className="font-urdu"
            value={val("guardian_relation")}
            onChange={(e) => set("guardian_relation", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="زر تعاون (مبلغ)" english="Support Contribution (Amount)">
          <Input
            value={val("support_amount")}
            onChange={(e) => set("support_amount", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="ماہانہ / سالانہ" english="Monthly / Annual">
          <Input
            className="font-urdu"
            value={val("support_freq")}
            onChange={(e) => set("support_freq", e.target.value)}
          />
        </BilingualLabel>
        <BilingualLabel urdu="یک مشت / قسط وار" english="Lump-sum / Installments">
          <Input
            className="font-urdu"
            value={val("support_mode")}
            onChange={(e) => set("support_mode", e.target.value)}
          />
        </BilingualLabel>
      </Section>

      <Section urdu="دفتری کاروائی" english="Office Action" lang={lang}>
        <div className="md:col-span-2">
          <BilingualLabel urdu="مہتمم کی رائے" english="Muhtamim's Remarks">
            <Textarea
              className="font-urdu"
              value={val("muhtamim_remarks")}
              onChange={(e) => set("muhtamim_remarks", e.target.value)}
            />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="مجوزہ درجہ" english="Proposed Darja">
          <Input
            className="font-urdu"
            value={val("proposed_darja")}
            onChange={(e) => set("proposed_darja", e.target.value)}
          />
        </BilingualLabel>
      </Section>
    </>
  );
}
