export type AdmissionCategoryKey = "school" | "madrassa-boys" | "madrassa-girls";

export type AdmissionVariantKey =
  | "school-boys"
  | "school-girls"
  | "madrassa-boys-nazira"
  | "madrassa-boys-hifz"
  | "madrassa-boys-general"
  | "madrassa-girls-general"
  | "madrassa-girls-nazira";

export type AdmissionVariant = {
  key: AdmissionVariantKey;
  category: AdmissionCategoryKey;
  titleUrdu: string;
  subtitleUrdu?: string;
  titleEnglish: string;
  pdfPath: string;
  templateImagePath: string;
  /** Long detailed madrassa form (kawaif nama + pledge) vs short form */
  layout: "school" | "madrassa-short" | "madrassa-long";
  allowPhoto: boolean;
  /** Institution address line (Urdu) shown in the form header. */
  addressUrdu?: string;
};

export const ADMISSION_CATEGORIES: {
  key: AdmissionCategoryKey;
  labelUrdu: string;
  labelEnglish: string;
  descriptionUrdu: string;
  icon: string;
}[] = [
  { key: "school", labelUrdu: "شعبہ سکول", labelEnglish: "School Section", descriptionUrdu: "القاسم اکیڈمی و جامعہ زینب للبنات (شعبہ سکول)", icon: "🏫" },
  { key: "madrassa-boys", labelUrdu: "مدرسہ (بنین)", labelEnglish: "Madrassa — Boys", descriptionUrdu: "جامعہ قاسمیہ للبنین ٹل پاکستان", icon: "🕌" },
  { key: "madrassa-girls", labelUrdu: "مدرسہ (بنات)", labelEnglish: "Madrassa — Girls", descriptionUrdu: "جامعہ زینب للبنات ٹل پاکستان", icon: "🌙" },
];

export const ADMISSION_VARIANTS: AdmissionVariant[] = [
  {
    key: "school-boys",
    category: "school",
    titleUrdu: "القاسم اکیڈمی ٹل، ہنگو (شعبہ سکول)",
    titleEnglish: "Al-Qasim Academy Thall, HANGU (Shoba School)",
    pdfPath: "/Al-Qasim Academy Thall, Hangu (School Department).pdf",
    templateImagePath: "/admission-templates/school-boys.png",
    layout: "school",
    allowPhoto: true,
  },
  {
    key: "school-girls",
    category: "school",
    titleUrdu: "جامعہ زینب للبنات ٹل، ہنگو (شعبہ سکول)",
    titleEnglish: "Jamyah Zainab lilbanat Thall, HANGU (Shoba School)",
    pdfPath: "/jam-e-zanib-lilbanat-thall-hangu-shoba-school.pdf",
    templateImagePath: "/admission-templates/school-girls.png",
    layout: "school",
    allowPhoto: false,
  },
  {
    key: "madrassa-boys-nazira",
    category: "madrassa-boys",
    titleUrdu: "جامعہ قاسمیہ للبنین ٹل پاکستان",
    subtitleUrdu: "داخلہ فارم برائے ناظرہ و قاعدہ",
    titleEnglish: "Jamia Qasimia lilBanin Thall — Nazira & Qaida",
    pdfPath: "/Jamia Qasmia Lil-Baneen Thall Pakistan (For Nazira & Qaida).pdf",
    templateImagePath: "/admission-templates/madrassa-boys-nazira.png",
    layout: "madrassa-short",
    allowPhoto: true,
    addressUrdu: "محلہ حاجی اللہ یار خان سرہ غنڈے ٹل ضلع ہنگو پاکستان",
  },
  {
    key: "madrassa-boys-hifz",
    category: "madrassa-boys",
    titleUrdu: "جامعہ قاسمیہ للبنین ٹل پاکستان",
    subtitleUrdu: "داخلہ فارم برائے حفظ",
    titleEnglish: "Jamia Qasimia lilBanin Thall — Hifz",
    pdfPath: "/Jamia Qasmia Lil-Baneen Thall Pakistan (For Hifz).pdf",
    templateImagePath: "/admission-templates/madrassa-boys-hifz.png",
    layout: "madrassa-short",
    allowPhoto: true,
    addressUrdu: "محلہ حاجی اللہ یار خان سرہ غنڈے ٹل ضلع ہنگو پاکستان",
  },
  {
    key: "madrassa-boys-general",
    category: "madrassa-boys",
    titleUrdu: "جامعہ قاسمیہ ٹل پاکستان",
    subtitleUrdu: "فارم داخلہ (درس نظامی)",
    titleEnglish: "Jamia Qasimia Thall — Dars-e-Nizami",
    pdfPath: "/Jamia Qasmia Thall Pakistan.pdf",
    templateImagePath: "/admission-templates/madrassa-boys-general.png",
    layout: "madrassa-long",
    allowPhoto: true,
  },
  {
    key: "madrassa-girls-general",
    category: "madrassa-girls",
    titleUrdu: "جامعہ زینب للبنات ٹل پاکستان",
    subtitleUrdu: "فارم داخلہ (درس نظامی)",
    titleEnglish: "Jamia Zainab lilBanat Thall — Dars-e-Nizami",
    pdfPath: "/Jamia Zainab Lil-Banat Thall Pakistan.pdf",
    templateImagePath: "/admission-templates/madrassa-girls-general.png",
    layout: "madrassa-long",
    allowPhoto: false,
  },
  {
    key: "madrassa-girls-nazira",
    category: "madrassa-girls",
    titleUrdu: "جامعہ زینب للبنات ٹل پاکستان",
    subtitleUrdu: "داخلہ فارم برائے ناظرہ و قاعدہ",
    titleEnglish: "Jamia Zainab lilBanat — Nazira & Qaida",
    pdfPath: "/Jamia Zainab Lil-Banat Thall Pakistan (For Nazira & Qaida).pdf",
    templateImagePath: "/admission-templates/madrassa-girls-nazira.png",
    layout: "madrassa-short",
    allowPhoto: false,
  },
];

export function getVariant(key: string | undefined | null): AdmissionVariant | undefined {
  return ADMISSION_VARIANTS.find((v) => v.key === key);
}
