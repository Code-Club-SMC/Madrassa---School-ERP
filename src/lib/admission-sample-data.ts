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

const maleFirstNames = [
  "احمد", "محمد", "علی", "عمر", "عثمان", "حمزہ", "بلال", "ابو بکر", "عبداللہ", "فہد",
  "عمران", "سعد", "زین", "حبیب", "یوسف", "شہزاد", "فرحان", "عاصم", "بشیر", "طاہر",
  "خالد", "سلیمان", "قسط", "راشد", "نعیم", "قیصر", "سالم", "حاتم", "فیصل", "منیر",
  "جبار", "عبدالرحمن", "عبداللہ", "طیب", "شکور", "رحمٰن", "نور", "بدر", "سعاد", "منصو",
  "رفیع", "حاتم", "کاشف", "شاہد", "جاوید", "اقبال", "غلام", "نواز", "شریف", "خان",
  "ر Malik", "بابر", "تنویر", "جنگ", "فتح", "نصر", "عزیز", "کریم", "بختیار", "غازی",
];

const maleFatherNames = [
  "محمد رضا", "حسن علی", "احمد خان", "ملک اقبال", "طارق محمود", "عابدین شاہ", "صدique احمد", "نواز شریف",
  "خلیل الرحمٰن", "رحمٰن غلام", "محمد عمر", "خان محمد", "فاروق احمد", "بلال ثاقب", "ثاقب احمد", "شاہ محمود",
  "غلام حسین", "علی محمود", "احمد حسین", "شریف علی", "اقبال محمود", "محمود علی", "عمر فاروق", "حسین علی",
  "راشد احمد", "نعیم اللہ", "قیصر خان", "سلیمان ملک", "خالد محمود", "طاہر علی", "عاصم رضا", "فرحان شاه",
  "یوسف علی", "حبیب اللہ", "زین العابدین", "عبدالرحمن ملک", "قسط احمد", "منیر احمد", "فیصل محمود", "حاتم خان",
  "نور حسن", "شکور علی", "بدر الدین", "رحمٰن غلام", "سعاد احمد", "منصور ملک", "رفیع الدین", "حاتم علی",
  "کاشف امام", "شاہد rose", "جاوید اقبال", "اقبال حسین", "غلام علی", "نواز ملک", "شریف احمد", "خان رضا",
];

const femaleFirstNames = [
  "فاطمہ زہرا", "عائشہ بکر", "مریم اقبال", "خدیجہ فاطمہ", "زینب اقبال", "حواء محمد", "سارہ خان", "عمرہ فاطمہ",
  "رقیمہ بلال", "نرگس بانو", "فہمیدہ نبی", "شفیقہ بانو", "نجما بی بی", "عالمہ بی بی", "حفیفہ", "سمیہ",
  "فرح", "نرگس", "زبیدہ", "کبری", "سکینہ", "رابیہ", "فوزیہ", "نذیرہ", "حفیظہ", "نسرین", "سمر",
  "ملیحہ", "نزیرہ", "صفیہ", "طیبہ", "مریم", "فاطمہ", "زینب", "عائشہ", "خدیجہ", "حواء", "سارہ",
  "رقیمہ", "نرگس", "فہمیدہ", "شفیقہ", "نجما", "عالمہ", "حفیفہ", "سمیہ", "فرح", "زبیدہ",
  "کبری", "سکینہ", "رابیہ", "فوزیہ", "نذیرہ", "حفیظہ", "نسرین", "سمر", "ملیحہ", "نزیرہ",
];

const femaleFatherNames = [
  "حسین علی", "بکر احمد", "اقبال حسین", "فاروق احمد", "اقبال محمود", "محمد عمر", "خان محمد", "فاطمہ بی بی",
  "بلال ثاقب", "بانو بی بی", "نبی احمد", "شفیق احمد", "نجم الدین", "عالم بخش", "حفیف اللہ", "سمیع اللہ",
  "فرحان علی", "نرگس احمد", "زبیدہ بی بی", "کبری بی بی", "سکینہ بی بی", "رابیہ بی بی", "فوزیہ بی بی", "نذیرہ بی بی",
  "حفیظہ بی بی", "نسرین بی بی", "سمر بی بی", "ملیحہ بی بی", "نزیرہ بی بی", "صفیہ بی بی", "طیبہ بی بی", "مریم بی بی",
  "فاطمہ بی بی", "زینب بی بی", "عائشہ بی بی", "خدیجہ بی بی", "حواء بی بی", "سارہ بی بی", "رقیمہ بی بی", "نرگس بی بی",
  "فہمیدہ بی بی", "شفیقہ بی بی", "نجما بی بی", "عالمہ بی بی", "حفیفہ بی بی", "سمیہ بی بی", "فرح بی بی", "زبیدہ بی بی",
  "کبری بی بی", "سکینہ بی بی", "رابیہ بی بی", "فوزیہ بی بی", "نذیرہ بی بی", "حفیظہ بی بی", "نسرین بی بی", "سمر بی بی",
];

const villages = [
  "محلہ حاجی اللہ یار خان", "محلہ اسلام آباد", "محلہ مدینہ", "محلہ فاروق", "محلہ قاسم", "محلہ علی", "محلہ حسین",
  "محلہ ابراہیم", "محلہ یوسف", "محلہ موسی", "محلہ عیسی", "محلہ داؤد", "محلہ سلیمان", "محلہ محمد", "محلہ احمد",
  "محلہ خان", "محلہ ملک", "محلہ چوہدری", "محلہ سید", "محلہ شیخ", "محلہ پٹھان", "محلہ جٹ", "محلہ راجپوت",
];

const districts = ["ہنگو", "کوہاٹ", "کراچی", "پشاور", "لاہور", "فیصل آباد", "ملتان", "راولپنڈی", "گوجرانوالہ", "سargodha"];

function randomDate(minYear: number, maxYear: number): string {
  const start = new Date(minYear, 0, 1);
  const end = new Date(maxYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateToUrduWords(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const months = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
  const monthName = months[month - 1] || "";
  const urduDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const toUrdu = (n: number) => String(n).split("").map((d) => urduDigits[Number(d)]).join("");
  return `${toUrdu(day)} ${monthName} دو ہزار ${toUrdu(year - 2000)}`;
}

function randomCNIC(seed: number): string {
  const base = 35202 + (seed % 1000);
  const mid = 1000000 + (seed * 7) % 9000000;
  const end = 1 + (seed % 9);
  return `${base}-${mid}-${end}`;
}

function randomPhone(seed: number): string {
  const prefix = 300 + (seed % 50);
  const suffix = String(1000000 + (seed * 13) % 9000000);
  return `0${prefix}-${suffix.slice(0, 7)}`;
}

function randomName(seed: number, pool: string[]): string {
  const index = seed % pool.length;
  return pool[index];
}

export function generateSamplePool(gender: "male" | "female", count: number): PersonSample[] {
  const firstNames = gender === "male" ? maleFirstNames : femaleFirstNames;
  const fatherNames = gender === "male" ? maleFatherNames : femaleFatherNames;
  const samples: PersonSample[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomName(i, firstNames);
    const lastName = randomName(i + 1, firstNames);
    const fatherName = randomName(i + 2, fatherNames);
    const village = randomName(i + 3, villages);
    const district = randomName(i + 4, districts);
    const dob = randomDate(2012, 2017);
    const cnic = randomCNIC(i);
    const phone = randomPhone(i);
    const officePhone = `0925-${String(410000 + (i * 3) % 500000).slice(0, 6)}`;

    samples.push({
      name: `${firstName} ${lastName}`,
      father: fatherName,
      dob,
      dobWords: dateToUrduWords(dob),
      guardian: fatherName,
      guardianFather: randomName(i + 5, fatherNames),
      phone,
      officePhone,
      email: `parent${i + 1}@example.com`,
      cnic,
      village,
      postOffice: "ٹل شہر",
      tehsil: "ٹل",
      district,
      fullAddress: `${village}، ٹل، ضلع ${district}`,
    });
  }

  return samples;
}

const MALE_SAMPLE_COUNT = 50;
const FEMALE_SAMPLE_COUNT = 50;

const maleSamples = generateSamplePool("male", MALE_SAMPLE_COUNT);
const femaleSamples = generateSamplePool("female", FEMALE_SAMPLE_COUNT);

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
  const isGirls = variant.key.startsWith("school-girls") || variant.key.startsWith("madrassa-girls");
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
  });
}

function firstGradeForVariant(variant: AdmissionVariant) {
  const section = variant.category === "female" ? "banat" : "baneen";
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

export function getRandomSample(gender: "male" | "female"): PersonSample {
  const pool = gender === "male" ? maleSamples : femaleSamples;
  return pool[Math.floor(Math.random() * pool.length)];
}
