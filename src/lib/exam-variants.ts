export type ExamCategoryKey = "al-qasim" | "jamia-zainab";
export type ExamSectionKey =
  | "al_qasim_academy"
  | "al_qasim_hifz_nazira"
  | "al_qasim_alam_dars_nizami"
  | "jamia_zainab_nazira"
  | "jamia_zainab_alam"
  | "jamia_zainab_academy";

export type ExamVariantKey =
  | "school-boys-main"
  | "madrassa-boys-nazira"
  | "madrassa-boys-hifz"
  | "madrassa-boys-general"
  | "madrassa-girls-general"
  | "madrassa-girls-nazira"
  | "school-girls-main"
  | "school-girls-shoba";

export type ExamSection = {
  key: ExamSectionKey;
  category: ExamCategoryKey;
  titleUrdu: string;
  titleEnglish: string;
  institutionId: string;
  programIds: string[];
  system: "school" | "madrassa";
  allowPhoto: boolean;
};

export const EXAM_CATEGORIES: {
  key: ExamCategoryKey;
  labelUrdu: string;
  labelEnglish: string;
  descriptionUrdu: string;
  descriptionEnglish: string;
  icon: string;
}[] = [
  {
    key: "al-qasim",
    labelUrdu: "القاسم اکیڈمی / جامعہ قاسمیہ",
    labelEnglish: "Al-Qasim Academy / Jamia Qasimia",
    descriptionUrdu: "القاسم اکیڈمی اور جامعہ قاسمیہ للبنین",
    descriptionEnglish: "Al-Qasim Academy and Jamia Qasimia lilBanin",
    icon: "🕌",
  },
  {
    key: "jamia-zainab",
    labelUrdu: "جامعہ زینب للبنات",
    labelEnglish: "Jamia Zainab lilbanat",
    descriptionUrdu: "جامعہ زینب للبنات ٹل، ہنگو",
    descriptionEnglish: "Jamia Zainab lilbanat Thall, Hangu",
    icon: "🌙",
  },
];

export const EXAM_SECTIONS: ExamSection[] = [
  {
    key: "al_qasim_academy",
    category: "al-qasim",
    titleUrdu: "القاسم اکیڈمی ٹل",
    titleEnglish: "Al-Qasim Academy",
    institutionId: "al_qasim_academy",
    programIds: ["al_qasim_school"],
    system: "school",
    allowPhoto: true,
  },
  {
    key: "al_qasim_hifz_nazira",
    category: "al-qasim",
    titleUrdu: "جامعہ قاسمیہ للبنین (ناظرہ / حفظ)",
    titleEnglish: "Al-Qasim Hifz / Nazira",
    institutionId: "jamia_qasmia_baneen",
    programIds: ["qasmia_nazira", "qasmia_hifz"],
    system: "madrassa",
    allowPhoto: true,
  },
  {
    key: "al_qasim_alam_dars_nizami",
    category: "al-qasim",
    titleUrdu: "جامعہ قاسمیہ للبنین (درس نظامی)",
    titleEnglish: "Al-Qasim Alam / Dars-e-Nizami",
    institutionId: "jamia_qasmia_baneen",
    programIds: ["qasmia_dars_nizami"],
    system: "madrassa",
    allowPhoto: true,
  },
  {
    key: "jamia_zainab_nazira",
    category: "jamia-zainab",
    titleUrdu: "جامعہ زینب للبنات (ناظرہ)",
    titleEnglish: "Jamia Zainab Nazira",
    institutionId: "jamia_zainab_banat",
    programIds: ["zainab_nazira"],
    system: "madrassa",
    allowPhoto: false,
  },
  {
    key: "jamia_zainab_alam",
    category: "jamia-zainab",
    titleUrdu: "جامعہ زینب للبنات (درس نظامی)",
    titleEnglish: "Jamia Zainab Alam / Dars-e-Nizami",
    institutionId: "jamia_zainab_banat",
    programIds: ["zainab_dars_nizami"],
    system: "madrassa",
    allowPhoto: false,
  },
  {
    key: "jamia_zainab_academy",
    category: "jamia-zainab",
    titleUrdu: "جامعہ زینب للبنات (اکیڈمی)",
    titleEnglish: "Jamia Zainab Academy",
    institutionId: "jamia_zainab_banat",
    programIds: ["zainab_school_support"],
    system: "school",
    allowPhoto: false,
  },
];

export const EXAM_VARIANT_SECTIONS: Record<ExamVariantKey, ExamSectionKey> = {
  "school-boys-main": "al_qasim_academy",
  "madrassa-boys-nazira": "al_qasim_hifz_nazira",
  "madrassa-boys-hifz": "al_qasim_hifz_nazira",
  "madrassa-boys-general": "al_qasim_alam_dars_nizami",
  "madrassa-girls-general": "jamia_zainab_alam",
  "madrassa-girls-nazira": "jamia_zainab_nazira",
  "school-girls-main": "jamia_zainab_academy",
  "school-girls-shoba": "jamia_zainab_academy",
};

export function getExamSection(key: string | undefined | null): ExamSection | undefined {
  return EXAM_SECTIONS.find((s) => s.key === key);
}

export function getExamSectionForVariant(variantKey: ExamVariantKey): ExamSection {
  const sectionKey = EXAM_VARIANT_SECTIONS[variantKey];
  return EXAM_SECTIONS.find((s) => s.key === sectionKey)!;
}
