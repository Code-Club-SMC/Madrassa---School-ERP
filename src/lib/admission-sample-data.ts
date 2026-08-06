import type { AdmissionVariant } from "@/lib/admission-variants";
import { madrassaGradesForSection, type MadrassaGradeKind } from "@/lib/madrassa-grade-catalog";

type PersonSample = {
  name: string;
  father: string;
  dob: string;
  dobWords: string;
  guardian: string;
  guardianFather: string;
  phone: string;
  officePhone: string;
  email: string;
  cnic: string;
  village: string;
  postOffice: string;
  tehsil: string;
  district: string;
  fullAddress: string;
};

const maleSample: PersonSample = {
  name: "محمد عبداللہ",
  father: "محمد یوسف",
  dob: "2013-05-18",
  dobWords: "اٹھارہ مئی دو ہزار تیرہ",
  guardian: "محمد یوسف",
  guardianFather: "عبدالرحمن",
  phone: "0312-4567890",
  officePhone: "0925-412345",
  email: "yousaf.parent@example.com",
  cnic: "17301-2345678-1",
  village: "محلہ حاجی اللہ یار خان",
  postOffice: "ٹل شہر",
  tehsil: "ٹل",
  district: "ہنگو",
  fullAddress: "محلہ حاجی اللہ یار خان، ٹل، ضلع ہنگو",
};

const femaleSample: PersonSample = {
  name: "عائشہ فاطمہ",
  father: "محمد عمران",
  dob: "2014-09-12",
  dobWords: "بارہ ستمبر دو ہزار چودہ",
  guardian: "محمد عمران",
  guardianFather: "عبدالستار",
  phone: "0313-5678901",
  officePhone: "0925-423456",
  email: "imran.parent@example.com",
  cnic: "17301-3456789-2",
  village: "محلہ اسلام آباد",
  postOffice: "ٹل شہر",
  tehsil: "ٹل",
  district: "ہنگو",
  fullAddress: "محلہ اسلام آباد، ٹل، ضلع ہنگو",
};

export function buildAdmissionSampleData(variant: AdmissionVariant): Record<string, string> {
  const isGirls = variant.key === "school-girls" || variant.key.startsWith("madrassa-girls");
  const person = isGirls ? femaleSample : maleSample;

  if (variant.layout === "school") return schoolSample(person, isGirls);
  if (variant.layout === "madrassa-short") return madrassaShortSample(variant, person);
  return madrassaLongSample(variant, person);
}

function schoolSample(person: PersonSample, isGirls: boolean) {
  return pruneEmpty({
    adm_date: todayDateOnly(),
    name: person.name,
    father: person.father,
    dob_digits: person.dob,
    dob_words: person.dobWords,
    address: person.fullAddress,
    occupation: "تاجر",
    religion: "اسلام",
    prev_school: "گورنمنٹ پرائمری سکول ٹل",
    cert_no: "TC-2487",
    class: isGirls ? "چہارم" : "پنجم",
    guardian_name: person.guardian,
    guardian_email: person.email,
    also_madrassa: isGirls ? "نہیں" : "جی",
    madrassa_section: isGirls ? "" : "ناظرہ",
  });
}

function madrassaShortSample(variant: AdmissionVariant, person: PersonSample) {
  const grade = firstGradeForVariant(variant);

  return pruneEmpty({
    adm_date: todayDateOnly(),
    bmutabiq: todayHijriLabel(),
    name: person.name,
    father: person.father,
    dob: person.dob,
    shoba: grade?.id ?? "",
    curr_address: person.fullAddress,
    perm_address: person.fullAddress,
    prev_madrassa: "مدرسہ تعلیم القرآن، ٹل",
    guardian_name: person.guardian,
    guardian_rel: "والد",
    guardian_phone: person.phone,
    guardian_email: person.email,
  });
}

function madrassaLongSample(variant: AdmissionVariant, person: PersonSample) {
  const grade = firstGradeForVariant(variant);

  return pruneEmpty({
    adm_date: todayDateOnly(),
    bmutabiq: todayHijriLabel(),
    req_darja: grade?.id ?? "",
    entry_marks: "82",
    acad_year: currentHijriAcademicYearLabel(),
    name: person.name,
    father: person.father,
    dob_age: person.dob,
    curr_village: person.village,
    curr_po: person.postOffice,
    curr_tehsil: person.tehsil,
    curr_district: person.district,
    curr_phone: person.phone,
    perm_village: person.village,
    perm_po: person.postOffice,
    perm_tehsil: person.tehsil,
    perm_district: person.district,
    perm_phone: person.phone,
    dn_last: "ناظرہ مکمل",
    dn_marks: "410/500",
    dn_grade: "ممتاز",
    dn_school: "مدرسہ تعلیم القرآن، ٹل، ضلع ہنگو",
    wf_last: "ابتدائی",
    wf_marks: "390/500",
    wf_grade: "جید جدا",
    wf_school: "وفاق المدارس سے ملحق مدرسہ تعلیم القرآن، ٹل",
    prev_madaris: "مدرسہ تعلیم القرآن، ٹل؛ جامع مسجد مدرسہ، ہنگو",
    modern_edu: "پرائمری",
    extra_qual: "ناظرہ قرآن مکمل",
    prev_roll: "248",
    prev_darja: "ناظرہ",
    prev_marks: "410/500",
    prev_grade: "ممتاز",
    candidate_darja: grade?.id ?? "",
    cnic: person.cnic,
    guardian_name: person.guardian,
    guardian_father: person.guardianFather,
    guardian_address: person.fullAddress,
    guardian_phone_home: person.phone,
    guardian_phone_office: person.officePhone,
    guardian_email: person.email,
    guardian_relation: "والد",
    support_amount: "3000",
    support_freq: "ماہانہ",
    support_mode: "قسط وار",
    muhtamim_remarks: "داخلہ کے لیے موزوں ہے۔",
    proposed_darja: grade?.nameUrdu ?? "",
  });
}

function firstGradeForVariant(variant: AdmissionVariant) {
  const section = variant.category === "madrassa-girls" ? "banat" : "baneen";
  const kinds: MadrassaGradeKind[] =
    variant.key === "madrassa-boys-hifz"
      ? ["hifz"]
      : variant.key === "madrassa-boys-nazira" || variant.key === "madrassa-girls-nazira"
        ? ["nazira"]
        : ["preparatory", "dars_nizami", "tajweed", "takhassus", "short_course"];

  return madrassaGradesForSection(section, kinds)[0];
}

function todayDateOnly() {
  const date = new Date();
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayHijriLabel() {
  return new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date())
    .replace(" ہجری", "ھ");
}

function currentHijriAcademicYearLabel() {
  const year = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { year: "numeric" })
    .formatToParts(new Date())
    .find((part) => part.type === "year")?.value;
  return year ? `${year}ھ` : "";
}

function pruneEmpty(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()));
}
