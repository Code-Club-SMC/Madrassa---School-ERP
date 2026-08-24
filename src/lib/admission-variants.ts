export type AdmissionCategoryKey = "male" | "female";
export type AdmissionSectionKey = "madrassa" | "school";

export type AdmissionVariantKey =
  | "madrassa-boys-nazira"
  | "madrassa-boys-hifz"
  | "madrassa-boys-general"
  | "madrassa-girls-general"
  | "madrassa-girls-nazira"
  | "school-boys-main"
  | "school-girls-main"
  | "school-girls-shoba";

export type AdmissionVariant = {
  key: AdmissionVariantKey;
  category: AdmissionCategoryKey;
  section: AdmissionSectionKey;
  titleUrdu: string;
  subtitleUrdu?: string;
  titleEnglish: string;
  subtitleEnglish?: string;
  pdfPath: string;
  templateImagePath: string;
  layout: "school" | "madrassa-short" | "madrassa-long";
  allowPhoto: boolean;
  addressUrdu?: string;
  institutionUrdu: string;
  institutionEnglish: string;
};

export const ADMISSION_CATEGORIES: {
  key: AdmissionCategoryKey;
  labelUrdu: string;
  labelEnglish: string;
  descriptionUrdu: string;
  descriptionEnglish: string;
  icon: string;
}[] = [
  { key: "male", labelUrdu: "جامعہ قاسمیہ", labelEnglish: "Jamia Qasimia", descriptionUrdu: "جامعہ قاسمیہ للبنین ٹل پاکستان", descriptionEnglish: "Jamia Qasimia lilBanin Thall, Pakistan", icon: "🕌" },
  { key: "female", labelUrdu: "زینب للبنات", labelEnglish: "Jamyah Zainab", descriptionUrdu: "جامعہ زینب للبنات ٹل پاکستان", descriptionEnglish: "Jamyah Zainab lilbanat Thall, Pakistan", icon: "🌙" },
];

export const ADMISSION_VARIANTS: AdmissionVariant[] = [
  {
    key: "madrassa-boys-nazira",
    category: "male",
    section: "madrassa",
    titleUrdu: "داخلہ فارم برائے ناظرہ و قاعدہ",
    subtitleUrdu: "جامعہ قاسمیہ للبنین",
    subtitleEnglish: "Jamia Qasimia lilBanin",
    titleEnglish: "Nazira & Qaida",
    pdfPath: "/Jamia Qasmia Lil-Baneen Thall Pakistan (For Nazira & Qaida).pdf",
    templateImagePath: "/admission-templates/madrassa-boys-nazira.png",
    layout: "madrassa-short",
    allowPhoto: true,
    addressUrdu: "محلہ حاجی اللہ یار خان سرہ غنڈے ٹل ضلع ہنگو پاکستان",
    institutionUrdu: "جامعہ قاسمیہ للبنین",
    institutionEnglish: "Jamia Qasimia lilBanin",
  },
  {
    key: "madrassa-boys-hifz",
    category: "male",
    section: "madrassa",
    titleUrdu: "داخلہ فارم برائے حفظ",
    subtitleUrdu: "جامعہ قاسمیہ للبنین",
    subtitleEnglish: "Jamia Qasimia lilBanin",
    titleEnglish: "Hifz",
    pdfPath: "/Jamia Qasmia Lil-Baneen Thall Pakistan (For Hifz).pdf",
    templateImagePath: "/admission-templates/madrassa-boys-hifz.png",
    layout: "madrassa-short",
    allowPhoto: true,
    addressUrdu: "محلہ حاجی اللہ یار خان سرہ غنڈے ٹل ضلع ہنگو پاکستان",
    institutionUrdu: "جامعہ قاسمیہ للبنین",
    institutionEnglish: "Jamia Qasimia lilBanin",
  },
  {
    key: "madrassa-boys-general",
    category: "male",
    section: "madrassa",
    titleUrdu: "فارم داخلہ (درس نظامی)",
    subtitleUrdu: "جامعہ قاسمیہ",
    subtitleEnglish: "Jamia Qasimia",
    titleEnglish: "Dars-e-Nizami",
    pdfPath: "/Jamia Qasmia Thall Pakistan.pdf",
    templateImagePath: "/admission-templates/madrassa-boys-general.png",
    layout: "madrassa-long",
    allowPhoto: true,
    institutionUrdu: "جامعہ قاسمیہ للبنین",
    institutionEnglish: "Jamia Qasimia lilBanin",
  },
  {
    key: "school-boys-main",
    category: "male",
    section: "school",
    titleUrdu: "القاسم اکیڈمی ٹل، ہنگو",
    titleEnglish: "Al-Qasim Academy Thall, Hangu",
    pdfPath: "/Al-Qasim Academy Thall Hangu (School Department).pdf",
    templateImagePath: "/admission-templates/school-boys.png",
    layout: "school",
    allowPhoto: true,
    institutionUrdu: "القاسم اکیڈمی ٹل",
    institutionEnglish: "Al-Qasim Academy Thall",
  },
  {
    key: "madrassa-girls-general",
    category: "female",
    section: "madrassa",
    titleUrdu: "فارم داخلہ (درس نظامی)",
    subtitleUrdu: "جامعہ زینب للبنات",
    subtitleEnglish: "Jamyah Zainab lilbanat",
    titleEnglish: "Dars-e-Nizami",
    pdfPath: "/Jamia Zainab Lil-Banat Thall Pakistan.pdf",
    templateImagePath: "/admission-templates/madrassa-girls-general.png",
    layout: "madrassa-long",
    allowPhoto: false,
    institutionUrdu: "جامعہ زینب للبنات",
    institutionEnglish: "Jamyah Zainab lilbanat",
  },
  {
    key: "madrassa-girls-nazira",
    category: "female",
    section: "madrassa",
    titleUrdu: "داخلہ فارم برائے ناظرہ و قاعدہ",
    subtitleUrdu: "جامعہ زینب للبنات",
    subtitleEnglish: "Jamyah Zainab lilbanat",
    titleEnglish: "Nazira & Qaida",
    pdfPath: "/Jamia Zainab Lil-Banat Thall Pakistan (For Nazira & Qaida).pdf",
    templateImagePath: "/admission-templates/madrassa-girls-nazira.png",
    layout: "madrassa-short",
    allowPhoto: false,
    institutionUrdu: "جامعہ زینب للبنات",
    institutionEnglish: "Jamyah Zainab lilbanat",
  },
  {
    key: "school-girls-main",
    category: "female",
    section: "school",
    titleUrdu: "جامعہ زینب للبنات ٹل، ہنگو",
    titleEnglish: "Jamyah Zainab lilbanat Thall, Hangu",
    pdfPath: "/Jamyah Zainab lilbanat Thall Hangu (School Department).pdf",
    templateImagePath: "/admission-templates/school-girls.png",
    layout: "school",
    allowPhoto: false,
    institutionUrdu: "جامعہ زینب للبنات",
    institutionEnglish: "Jamyah Zainab lilbanat",
  },
  {
    key: "school-girls-shoba",
    category: "female",
    section: "school",
    titleUrdu: "جامعہ زینب للبنات ٹل، ہنگو (شعبہ سکول)",
    titleEnglish: "Jamyah Zainab lilbanat Thall, HANGU (Shoba School)",
    pdfPath: "/jam-e-zanib-lilbanat-thall-hangu-shoba-school.pdf",
    templateImagePath: "/admission-templates/school-girls.png",
    layout: "school",
    allowPhoto: false,
    institutionUrdu: "جامعہ زینب للبنات",
    institutionEnglish: "Jamyah Zainab lilbanat",
  },
];

export function getVariant(key: string | undefined | null): AdmissionVariant | undefined {
  return ADMISSION_VARIANTS.find((v) => v.key === key);
}
