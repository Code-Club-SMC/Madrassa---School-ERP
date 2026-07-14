import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ImagePlus, CheckCircle2, ArrowLeft, Loader2, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { institution } from "@/mock";
import type { AdmissionVariant } from "@/lib/admission-variants";
import { printAdmissionForm } from "@/lib/admission-print";
import { toast } from "sonner";

type State = Record<string, string>;

export function PdfFormRenderer({ variant, isPublic = false }: { variant: AdmissionVariant; isPublic?: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<State>({});
  const [declaration, setDeclaration] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refNo, setRefNo] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const val = (k: string) => form[k] ?? "";

  const handlePrint = () => printAdmissionForm(variant, form, institution.nameUrdu);

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const prefix = variant.category === "school" ? "SCH" : variant.category === "madrassa-girls" ? "MGB" : "MBB";
      setRefNo(`${prefix}-${Math.floor(Math.random() * 9000 + 1000)}`);
      setSubmitting(false);
      toast.success("داخلہ محفوظ ہو گیا · Admission saved");
    }, 700);
  };

  if (refNo) {
    return (
      <Card className="max-w-xl mx-auto text-center">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-600" />
          <h2 className="font-urdu text-2xl font-bold leading-loose" dir="rtl" lang="ur">
            داخلہ کامیابی سے مکمل ہوا
          </h2>
          <p className="text-sm text-muted-foreground">Admission Confirmed</p>
          <div className="rounded-xl bg-muted p-6 mt-2 min-w-[16rem]">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Roll Number</p>
            <p className="font-heading font-bold text-3xl text-primary mt-1">{refNo}</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 me-2" />
              <span className="font-urdu">فارم پرنٹ کریں</span>
            </Button>
            {!isPublic && (
              <Button onClick={() => navigate({ to: "/admission" })}>
                <span className="font-urdu">واپس داخلہ مرکز</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form header — mirrors PDF letterhead */}
      <Card className="text-center">
        <CardContent className="py-8 space-y-2">
          <p className="font-urdu text-base text-muted-foreground leading-loose" dir="rtl" lang="ur">
            {institution.nameUrdu}
          </p>
          <h1 className="font-urdu text-3xl font-bold leading-loose" dir="rtl" lang="ur">
            {variant.titleUrdu}
          </h1>
          {variant.subtitleUrdu && (
            <p className="font-urdu text-lg text-muted-foreground leading-loose" dir="rtl" lang="ur">
              {variant.subtitleUrdu}
            </p>
          )}
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{variant.titleEnglish}</p>
          {variant.addressUrdu && (
            <p className="font-urdu text-sm text-muted-foreground leading-loose mt-2" dir="rtl" lang="ur">
              {variant.addressUrdu}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meta row — form/admission numbers (present in all variants) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-urdu text-end leading-loose" dir="rtl" lang="ur">
            دفتری معلومات
            <span className="text-muted-foreground font-sans text-xs ms-2">Office Info</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BilingualLabel urdu="فارم نمبر" english="Form No.">
            <Input value={val("form_no")} onChange={(e) => set("form_no", e.target.value)} />
          </BilingualLabel>
          <BilingualLabel urdu="داخلہ نمبر" english="Admission No.">
            <Input value={val("adm_no")} onChange={(e) => set("adm_no", e.target.value)} />
          </BilingualLabel>
          <BilingualLabel urdu="تاریخ داخلہ" english="Admission Date">
            <Input type="date" value={val("adm_date")} onChange={(e) => set("adm_date", e.target.value)} />
          </BilingualLabel>
          {variant.layout !== "school" && (
            <>
              <BilingualLabel urdu="پرانہ داخلہ نمبر" english="Previous Adm. No.">
                <Input value={val("prev_adm_no")} onChange={(e) => set("prev_adm_no", e.target.value)} />
              </BilingualLabel>
              <BilingualLabel urdu="بمطابق" english="Corresponding Date">
                <Input value={val("bmutabiq")} onChange={(e) => set("bmutabiq", e.target.value)} />
              </BilingualLabel>
              <BilingualLabel urdu="رجسٹریشن نمبر" english="Registration No.">
                <Input value={val("reg_no")} onChange={(e) => set("reg_no", e.target.value)} />
              </BilingualLabel>
            </>
          )}
          {variant.layout === "madrassa-long" && (
            <>
              <BilingualLabel urdu="مطلوبہ درجہ" english="Requested Class/Darja" required>
                <Input className="font-urdu" value={val("req_darja")} onChange={(e) => set("req_darja", e.target.value)} />
              </BilingualLabel>
              <BilingualLabel urdu="امتحان داخلہ میں حاصل کردہ نمبرات" english="Entry-Test Marks">
                <Input value={val("entry_marks")} onChange={(e) => set("entry_marks", e.target.value)} />
              </BilingualLabel>
              <BilingualLabel urdu="برائے تعلیمی سال" english="For Academic Year">
                <Input value={val("acad_year")} onChange={(e) => set("acad_year", e.target.value)} />
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
              <span className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">
                تصویر اپ لوڈ کریں
              </span>
              <span className="text-xs text-muted-foreground">Passport-size photo · PNG/JPG (max 2 MB)</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            {photo && <p className="text-xs text-muted-foreground mt-2 text-center">Selected: {photo}</p>}
          </CardContent>
        </Card>
      )}

      {/* Body per layout */}
      {variant.layout === "school" && <SchoolFields form={form} set={set} />}
      {variant.layout === "madrassa-short" && <MadrassaShortFields form={form} set={set} isGirls={variant.category === "madrassa-girls"} />}
      {variant.layout === "madrassa-long" && <MadrassaLongFields form={form} set={set} isGirls={variant.category === "madrassa-girls"} />}

      {/* Declaration + submit */}
      <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 cursor-pointer">
        <Checkbox checked={declaration} onCheckedChange={(v) => setDeclaration(v === true)} />
        <span className="font-urdu text-sm leading-loose text-end flex-1" dir="rtl" lang="ur">
          میں اقرار کرتا/کرتی ہوں کہ مندرجہ بالا تمام معلومات درست ہیں اور ادارے کے تمام قواعد و ضوابط قبول ہیں۔
        </span>
      </label>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={() => navigate({ to: "/admission" })}>
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          <span className="font-urdu">منسوخ</span>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" />
            <span className="font-urdu">پرنٹ</span>
          </Button>
          <Button size="lg" onClick={submit} disabled={!declaration || submitting}>
            {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            <span className="font-urdu">{isPublic ? "درخواست جمع کروائیں" : "داخلہ محفوظ کریں"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ urdu, english, children }: { urdu: string; english: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-urdu text-end text-lg leading-loose" dir="rtl" lang="ur">
          {urdu}
          <span className="font-sans text-xs text-muted-foreground ms-2 uppercase tracking-widest">{english}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</CardContent>
    </Card>
  );
}

type FieldProps = { form: State; set: (k: string, v: string) => void };

/* ============================================================
 * School layout — Al-Qasim / Zainab (Shoba School)
 * ============================================================ */
function SchoolFields({ form, set }: FieldProps) {
  const val = (k: string) => form[k] ?? "";
  return (
    <>
      <Section urdu="طالب علم کی معلومات" english="Student Info">
        <BilingualLabel urdu="نام" english="Name" required>
          <Input className="font-urdu" value={val("name")} onChange={(e) => set("name", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="ولدیت" english="Father Name" required>
          <Input className="font-urdu" value={val("father")} onChange={(e) => set("father", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تاریخ پیدائش (ہندسوں میں)" english="DOB (Digits)" required>
          <Input type="date" value={val("dob_digits")} onChange={(e) => set("dob_digits", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تاریخ پیدائش (لفظوں میں)" english="DOB (In Words)">
          <Input className="font-urdu" value={val("dob_words")} onChange={(e) => set("dob_words", e.target.value)} />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu="پتہ" english="Address" required>
            <Textarea className="font-urdu" value={val("address")} onChange={(e) => set("address", e.target.value)} />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="پیشہ" english="Occupation">
          <Input className="font-urdu" value={val("occupation")} onChange={(e) => set("occupation", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="مذہب" english="Religion">
          <Input className="font-urdu" value={val("religion")} onChange={(e) => set("religion", e.target.value)} />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu="سابقہ سکول کا نام و پتہ" english="Previous School Name & Address">
            <Textarea className="font-urdu" value={val("prev_school")} onChange={(e) => set("prev_school", e.target.value)} />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="سرٹیفیکیٹ اور فائل نمبر" english="Certificate / File No.">
          <Input value={val("cert_no")} onChange={(e) => set("cert_no", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="کلاس جس میں داخل ہوا" english="Admitted Class" required>
          <Input className="font-urdu" value={val("class")} onChange={(e) => set("class", e.target.value)} />
        </BilingualLabel>
      </Section>

      <Section urdu="سرپرست" english="Guardian">
        <BilingualLabel urdu="سرپرست کا نام" english="Guardian Name" required>
          <Input className="font-urdu" value={val("guardian_name")} onChange={(e) => set("guardian_name", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="کیا مدرسہ میں داخل ہونا چاہتے ہیں؟" english="Also Enroll in Madrassa?">
          <Input className="font-urdu" placeholder="جی / نہیں" value={val("also_madrassa")} onChange={(e) => set("also_madrassa", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="کس شعبہ میں" english="Which Section (if yes)">
          <Input className="font-urdu" value={val("madrassa_section")} onChange={(e) => set("madrassa_section", e.target.value)} />
        </BilingualLabel>
      </Section>

    </>
  );
}

/* ============================================================
 * Madrassa Short — Nazira / Qaida / Hifz
 * ============================================================ */
function MadrassaShortFields({ form, set, isGirls }: FieldProps & { isGirls: boolean }) {
  const val = (k: string) => form[k] ?? "";
  return (
    <>
      <Card>
        <CardContent className="py-6 space-y-3">
          <p className="font-urdu text-sm leading-loose text-end" dir="rtl" lang="ur">
            بخدمت جناب مہتمم صاحب دامت برکاتہم! السلام علیکم ورحمۃ اللہ وبرکاتہ!
          </p>
          <p className="font-urdu text-sm leading-loose text-end text-muted-foreground" dir="rtl" lang="ur">
            میں جامعہ میں داخل ہونا چاہتا/چاہتی ہوں اور اقرار کرتا/کرتی ہوں کہ میں جامعہ کے جملہ قوانین و ضوابط کا پابند رہوں گا/گی۔ بلند اخلاق پر عمل پیرا رہوں گا/گی۔ اساتذہ کرام اور ارکان شوریٰ کا احترام کروں گا/گی۔ جامعہ کے مسلک پر پابند رہوں گا/گی۔ علمی مشاغل میں مصروف رہوں گا/گی۔ اندرونی و بیرونی مدرسہ تجارتی کاروبار نہیں کروں گا/گی۔ عالمانہ وضع قطع نشست و برخاست برقرار رکھوں گا/گی۔ ۱۰ رمضان سے پہلے مدرسہ نہیں چھوڑوں گا/گی۔ استدعا ہے کہ داخلہ کی اجازت فرمائی جائے۔
          </p>
        </CardContent>
      </Card>

      <Section urdu={isGirls ? "طالبہ کے کوائف" : "طالب علم کے کوائف"} english="Student Details">
        <BilingualLabel urdu={isGirls ? "نام طالبہ" : "نام طالب علم"} english="Student Name" required>
          <Input className="font-urdu" value={val("name")} onChange={(e) => set("name", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="ولدیت" english="Father Name" required>
          <Input className="font-urdu" value={val("father")} onChange={(e) => set("father", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تاریخ پیدائش" english="Date of Birth" required>
          <Input type="date" value={val("dob")} onChange={(e) => set("dob", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="شعبہ" english="Section / Shoba" required>
          <Input className="font-urdu" value={val("shoba")} onChange={(e) => set("shoba", e.target.value)} />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu="موجودہ پتہ" english="Current Address" required>
            <Textarea className="font-urdu" value={val("curr_address")} onChange={(e) => set("curr_address", e.target.value)} />
          </BilingualLabel>
        </div>
        <div className="md:col-span-2">
          <BilingualLabel urdu="مستقل پتہ" english="Permanent Address">
            <Textarea className="font-urdu" value={val("perm_address")} onChange={(e) => set("perm_address", e.target.value)} />
          </BilingualLabel>
        </div>
        <div className="md:col-span-2">
          <BilingualLabel urdu="سابقہ مدرسے کا نام و پتہ" english="Previous Madrassa Name & Address">
            <Textarea className="font-urdu" value={val("prev_madrassa")} onChange={(e) => set("prev_madrassa", e.target.value)} />
          </BilingualLabel>
        </div>
      </Section>

      <Section urdu="سرپرست" english="Guardian">
        <BilingualLabel urdu="سرپرست کا نام" english="Guardian Name" required>
          <Input className="font-urdu" value={val("guardian_name")} onChange={(e) => set("guardian_name", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="سرپرست کا رشتہ" english="Relation" required>
          <Input className="font-urdu" value={val("guardian_rel")} onChange={(e) => set("guardian_rel", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="رابطہ نمبر" english="Contact No." required>
          <Input value={val("guardian_phone")} onChange={(e) => set("guardian_phone", e.target.value)} />
        </BilingualLabel>
      </Section>
    </>
  );
}

/* ============================================================
 * Madrassa Long — Jamia Qasimia / Zainab (Dars-e-Nizami)
 * Includes kawaif nama + Ahd-nama (pledge) fields
 * ============================================================ */
function MadrassaLongFields({ form, set, isGirls }: FieldProps & { isGirls: boolean }) {
  const val = (k: string) => form[k] ?? "";
  return (
    <>
      <Card>
        <CardContent className="py-6 space-y-2">
          <p className="font-urdu text-sm leading-loose text-end" dir="rtl" lang="ur">
            بخدمت جناب مہتمم صاحب دامت برکاتہم العالیہ، السلام علیکم ورحمۃ اللہ وبرکاتہ!
          </p>
          <p className="font-urdu text-sm leading-loose text-end text-muted-foreground" dir="rtl" lang="ur">
            گزارش ہے کہ میں آپ کے زیر سایہ جامعہ کے مطلوبہ درجہ میں داخلہ لینے کا خواہشمند/خواہشمندہ ہوں۔ فارم ہذا کے صفحہ نمبر پر لکھا ہوا عہد نامہ میں نے بغور پڑھ لیا ہے۔ میں صدق دل سے وعدہ کرتا/کرتی ہوں کہ اس پر کار بند اور عمل پیرا رہوں گا/گی۔
          </p>
        </CardContent>
      </Card>

      <Section urdu="کوائف نامہ" english="Personal Particulars">
        <BilingualLabel urdu="نام" english="Name" required>
          <Input className="font-urdu" value={val("name")} onChange={(e) => set("name", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="ولدیت" english="Father Name" required>
          <Input className="font-urdu" value={val("father")} onChange={(e) => set("father", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تاریخ پیدائش یا عمر" english="DOB / Age" required>
          <Input value={val("dob_age")} onChange={(e) => set("dob_age", e.target.value)} />
        </BilingualLabel>
        <div className="hidden md:block" />

        {/* Current address */}
        <div className="md:col-span-2 rounded-xl border border-border p-4 space-y-3">
          <p className="font-urdu text-sm font-semibold text-end" dir="rtl" lang="ur">موجودہ پتہ · Current Address</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BilingualLabel urdu="گاؤں / محلہ" english="Village / Locality">
              <Input className="font-urdu" value={val("curr_village")} onChange={(e) => set("curr_village", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="ڈاکخانہ / علاقہ" english="Post Office / Area">
              <Input className="font-urdu" value={val("curr_po")} onChange={(e) => set("curr_po", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="تحصیل" english="Tehsil">
              <Input className="font-urdu" value={val("curr_tehsil")} onChange={(e) => set("curr_tehsil", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="ضلع" english="District">
              <Input className="font-urdu" value={val("curr_district")} onChange={(e) => set("curr_district", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="فون نمبر" english="Phone No.">
              <Input value={val("curr_phone")} onChange={(e) => set("curr_phone", e.target.value)} />
            </BilingualLabel>
          </div>
        </div>

        {/* Permanent address */}
        <div className="md:col-span-2 rounded-xl border border-border p-4 space-y-3">
          <p className="font-urdu text-sm font-semibold text-end" dir="rtl" lang="ur">مستقل پتہ · Permanent Address</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BilingualLabel urdu="گاؤں / محلہ" english="Village / Locality">
              <Input className="font-urdu" value={val("perm_village")} onChange={(e) => set("perm_village", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="ڈاکخانہ / علاقہ" english="Post Office / Area">
              <Input className="font-urdu" value={val("perm_po")} onChange={(e) => set("perm_po", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="تحصیل" english="Tehsil">
              <Input className="font-urdu" value={val("perm_tehsil")} onChange={(e) => set("perm_tehsil", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="ضلع" english="District">
              <Input className="font-urdu" value={val("perm_district")} onChange={(e) => set("perm_district", e.target.value)} />
            </BilingualLabel>
            <BilingualLabel urdu="فون نمبر" english="Phone No.">
              <Input value={val("perm_phone")} onChange={(e) => set("perm_phone", e.target.value)} />
            </BilingualLabel>
          </div>
        </div>
      </Section>

      <Section urdu={isGirls ? "جدید طالبات کے لیے" : "جدید طلباء کے لیے"} english="For New Students">
        <div className="md:col-span-2">
          <p className="font-urdu text-xs text-muted-foreground text-end leading-loose" dir="rtl" lang="ur">
            ہدایات: اسناد کی مصدقہ نقول فارم داخلہ کے ساتھ منسلک کریں اور انٹرویو کے دن اصل اسناد ساتھ لے کر آئیں۔
          </p>
        </div>
        <BilingualLabel urdu="درس نظامی کا آخری پاس کردہ درجہ" english="Last Dars-e-Nizami Class">
          <Input className="font-urdu" value={val("dn_last")} onChange={(e) => set("dn_last", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="حاصل کردہ نمبرات" english="Marks Obtained">
          <Input value={val("dn_marks")} onChange={(e) => set("dn_marks", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تقدیر" english="Grade">
          <Input className="font-urdu" value={val("dn_grade")} onChange={(e) => set("dn_grade", e.target.value)} />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu="نام مدرسہ / جامعہ مع مکمل پتہ" english="Madrassa / Jamia Name & Address">
            <Textarea className="font-urdu" value={val("dn_school")} onChange={(e) => set("dn_school", e.target.value)} />
          </BilingualLabel>
        </div>

        <BilingualLabel urdu="وفاق کا آخری پاس کردہ درجہ" english="Last Wafaq Class">
          <Input className="font-urdu" value={val("wf_last")} onChange={(e) => set("wf_last", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="حاصل کردہ نمبرات" english="Marks Obtained">
          <Input value={val("wf_marks")} onChange={(e) => set("wf_marks", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تقدیر" english="Grade">
          <Input className="font-urdu" value={val("wf_grade")} onChange={(e) => set("wf_grade", e.target.value)} />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu="نام مدرسہ / جامعہ مع مکمل پتہ" english="Wafaq Madrassa Name & Address">
            <Textarea className="font-urdu" value={val("wf_school")} onChange={(e) => set("wf_school", e.target.value)} />
          </BilingualLabel>
        </div>

        <div className="md:col-span-2">
          <BilingualLabel urdu="کن کن مدارس میں تعلیم حاصل کی — نام مع پتہ" english="All Previous Madaris">
            <Textarea className="font-urdu" value={val("prev_madaris")} onChange={(e) => set("prev_madaris", e.target.value)} />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="عصری علوم" english="Modern Education">
          <Input className="font-urdu" value={val("modern_edu")} onChange={(e) => set("modern_edu", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="اضافی قابلیت" english="Additional Qualifications">
          <Input className="font-urdu" value={val("extra_qual")} onChange={(e) => set("extra_qual", e.target.value)} />
        </BilingualLabel>
      </Section>

      <Section urdu={isGirls ? "قدیم طالبات کے لیے" : "قدیم طلباء کے لیے"} english="For Existing Students">
        <BilingualLabel urdu="گذشتہ سال کا رول نمبر" english="Previous Year Roll No.">
          <Input value={val("prev_roll")} onChange={(e) => set("prev_roll", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="درجہ" english="Class / Darja">
          <Input className="font-urdu" value={val("prev_darja")} onChange={(e) => set("prev_darja", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="حاصل کردہ نمبرات" english="Marks Obtained">
          <Input value={val("prev_marks")} onChange={(e) => set("prev_marks", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="تقدیر" english="Grade">
          <Input className="font-urdu" value={val("prev_grade")} onChange={(e) => set("prev_grade", e.target.value)} />
        </BilingualLabel>
      </Section>

      <Section urdu={isGirls ? "عہد نامہ (طالبہ)" : "عہد نامہ (طالب علم)"} english="Pledge (Ahd-Nama)">
        <div className="md:col-span-2">
          <p className="font-urdu text-xs text-muted-foreground text-end leading-loose" dir="rtl" lang="ur">
            میں صدق دل سے عہد کرتا/کرتی ہوں کہ تمام احکام شرعیہ اور جامعہ کے قواعد کا پابند رہوں گا/گی، ہر فریضے کی ادائیگی، حسن اخلاق، سیاسی و غیر سیاسی تنظیموں سے عدم تعلق، جامعہ کی اجازت کے بغیر سالانہ امتحان سے پہلے کہیں نہیں جانے، لڑائی جھگڑے سے اجتناب، اسباق و تکرار کی پابندی، اور جامعہ کے مالی و انتظامی ضوابط کی پیروی کروں گا/گی۔ دو ماہانہ جائزوں کے بعد اگر اساتذہ کی رائے میں اس درجے کی استعداد نہ ہوئی تو نچلے درجے میں منتقلی قبول کروں گا/گی۔
          </p>
        </div>
        <BilingualLabel urdu="امیدوار درجہ" english="Candidate Darja">
          <Input className="font-urdu" value={val("candidate_darja")} onChange={(e) => set("candidate_darja", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu={isGirls ? "دستخط طالبہ" : "دستخط طالب علم"} english="Student Signature">
          <Input value={val("sig_student")} onChange={(e) => set("sig_student", e.target.value)} />
        </BilingualLabel>
      </Section>

      <Section urdu="برائے سرپرست" english="For Guardian">
        <div className="md:col-span-2">
          <p className="font-urdu text-xs text-muted-foreground text-end leading-loose" dir="rtl" lang="ur">
            انتباہ: فارم کا یہ حصہ طالب علم کے انٹرویو کے موقع پر پُر کیا جائے گا۔
          </p>
        </div>
        <div className="md:col-span-2">
          <BilingualLabel urdu="شناختی کارڈ نمبر (13 ہندسے)" english="CNIC (13 digits)">
            <Input placeholder="XXXXX-XXXXXXX-X" value={val("cnic")} onChange={(e) => set("cnic", e.target.value)} />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="سرپرست کا نام" english="Guardian Name" required>
          <Input className="font-urdu" value={val("guardian_name")} onChange={(e) => set("guardian_name", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="ولدیت" english="Guardian Father Name">
          <Input className="font-urdu" value={val("guardian_father")} onChange={(e) => set("guardian_father", e.target.value)} />
        </BilingualLabel>
        <div className="md:col-span-2">
          <BilingualLabel urdu="موجودہ پتہ" english="Current Address">
            <Textarea className="font-urdu" value={val("guardian_address")} onChange={(e) => set("guardian_address", e.target.value)} />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="فون (رہائش)" english="Phone (Home)">
          <Input value={val("guardian_phone_home")} onChange={(e) => set("guardian_phone_home", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="فون (دکان / دفتر)" english="Phone (Shop / Office)">
          <Input value={val("guardian_phone_office")} onChange={(e) => set("guardian_phone_office", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="رشتہ" english="Relation to Student">
          <Input className="font-urdu" value={val("guardian_relation")} onChange={(e) => set("guardian_relation", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="زر تعاون (مبلغ)" english="Support Contribution (Amount)">
          <Input value={val("support_amount")} onChange={(e) => set("support_amount", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="ماہانہ / سالانہ" english="Monthly / Annual">
          <Input className="font-urdu" value={val("support_freq")} onChange={(e) => set("support_freq", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="یک مشت / قسط وار" english="Lump-sum / Installments">
          <Input className="font-urdu" value={val("support_mode")} onChange={(e) => set("support_mode", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="دستخط سرپرست" english="Guardian Signature">
          <Input value={val("sig_guardian")} onChange={(e) => set("sig_guardian", e.target.value)} />
        </BilingualLabel>
      </Section>

      <Section urdu="دفتری کاروائی" english="Office Action">
        <div className="md:col-span-2">
          <BilingualLabel urdu="مہتمم کی رائے" english="Muhtamim's Remarks">
            <Textarea className="font-urdu" value={val("muhtamim_remarks")} onChange={(e) => set("muhtamim_remarks", e.target.value)} />
          </BilingualLabel>
        </div>
        <BilingualLabel urdu="مجوزہ درجہ" english="Proposed Darja">
          <Input className="font-urdu" value={val("proposed_darja")} onChange={(e) => set("proposed_darja", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="دستخط ناظم تعلیمات" english="Nazim-e-Taleemat Signature">
          <Input value={val("sig_nazim_taleemat")} onChange={(e) => set("sig_nazim_taleemat", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="دستخط مہتمم" english="Muhtamim Signature">
          <Input value={val("sig_muhtamim")} onChange={(e) => set("sig_muhtamim", e.target.value)} />
        </BilingualLabel>
        <BilingualLabel urdu="مہر مدرسہ" english="Institution Stamp">
          <Input value={val("stamp")} onChange={(e) => set("stamp", e.target.value)} />
        </BilingualLabel>
      </Section>
    </>
  );
}