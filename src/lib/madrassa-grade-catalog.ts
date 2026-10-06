import type { Darja, MadrassaCategory, MadrassaTrack, Section } from "@/types";

export type MadrassaGradeKind =
  | "hifz"
  | "nazira"
  | "preparatory"
  | "dars_nizami"
  | "tajweed"
  | "takhassus"
  | "short_course";

export type MadrassaGradeItem = {
  id: string;
  section: Section;
  kind: MadrassaGradeKind;
  categoryId: MadrassaTrack;
  categoryName: string;
  categoryNameUrdu: string;
  name: string;
  nameUrdu: string;
  rollPrefix: string;
  count: number;
  darja?: Darja;
  govtEquivalent?: string;
  durationYears?: number;
  displayOrder: number;
  reviewRequired?: boolean;
};

type CategoryMeta = {
  id: MadrassaTrack;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
};

const categories: CategoryMeta[] = [
  {
    id: "dars_nizami",
    name: "Dars-e-Nizami",
    nameUrdu: "درس نظامی",
    description: "Institution-provided Dars-e-Nizami grade sequence.",
    descriptionUrdu: "ادارے کی فراہم کردہ درس نظامی درجات کی ترتیب",
  },
  {
    id: "hifz",
    name: "Hifz",
    nameUrdu: "حفظ",
    description: "Memorization grades provided by Jamia Qasmia Lil-Baneen.",
    descriptionUrdu: "جامعہ قاسمیہ للبنین کے فراہم کردہ حفظ کے درجات",
  },
  {
    id: "qaida_nazira",
    name: "Nazira",
    nameUrdu: "ناظرہ",
    description: "Nazira grades provided separately for boys and girls madrassas.",
    descriptionUrdu: "بنین اور بنات مدارس کے لیے فراہم کردہ ناظرہ درجات",
  },
];

function grade(
  item: Omit<MadrassaGradeItem, "count" | "categoryName" | "categoryNameUrdu">,
): MadrassaGradeItem {
  const category = categories.find((entry) => entry.id === item.categoryId);
  if (!category) throw new Error(`Unknown madrassa category ${item.categoryId}`);

  return {
    ...item,
    categoryName: category.name,
    categoryNameUrdu: category.nameUrdu,
    count: 0,
  };
}

// Roll prefixes below are local system codes; the supplied paper only listed grade names.
export const MADRASSA_GRADE_CATALOG: MadrassaGradeItem[] = [
  grade({
    id: "bn-hifz-1",
    section: "baneen",
    kind: "hifz",
    categoryId: "hifz",
    name: "Hifz Year 1",
    nameUrdu: "شعبہ حفظ - سال اول",
    rollPrefix: "QH1",
    darja: "hifz_year_1",
    durationYears: 1,
    displayOrder: 10,
  }),
  grade({
    id: "bn-hifz-2",
    section: "baneen",
    kind: "hifz",
    categoryId: "hifz",
    name: "Hifz Year 2",
    nameUrdu: "شعبہ حفظ - سال دوم",
    rollPrefix: "QH2",
    darja: "hifz_year_2",
    durationYears: 1,
    displayOrder: 20,
  }),
  grade({
    id: "bn-hifz-3",
    section: "baneen",
    kind: "hifz",
    categoryId: "hifz",
    name: "Hifz Year 3",
    nameUrdu: "شعبہ حفظ - سال سوم",
    rollPrefix: "QH3",
    darja: "hifz_year_3",
    durationYears: 1,
    displayOrder: 30,
  }),

  grade({
    id: "bn-nazira-1",
    section: "baneen",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 1",
    nameUrdu: "شعبہ ناظرہ - سال اول",
    rollPrefix: "QN1",
    darja: "nazira_year_1",
    durationYears: 1,
    displayOrder: 40,
  }),
  grade({
    id: "bn-nazira-2",
    section: "baneen",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 2",
    nameUrdu: "شعبہ ناظرہ - سال دوم",
    rollPrefix: "QN2",
    darja: "nazira_year_2",
    durationYears: 1,
    displayOrder: 50,
  }),
  grade({
    id: "bn-nazira-3",
    section: "baneen",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 3",
    nameUrdu: "شعبہ ناظرہ - سال سوم",
    rollPrefix: "QN3",
    darja: "nazira_year_3",
    durationYears: 1,
    displayOrder: 60,
  }),
  grade({
    id: "bn-nazira-4",
    section: "baneen",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 4",
    nameUrdu: "شعبہ ناظرہ - سال چہارم",
    rollPrefix: "QN4",
    darja: "nazira_year_4",
    durationYears: 1,
    displayOrder: 70,
  }),
  grade({
    id: "bn-nazira-5",
    section: "baneen",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 5",
    nameUrdu: "شعبہ ناظرہ - سال پنجم",
    rollPrefix: "QN5",
    darja: "nazira_year_5",
    durationYears: 1,
    displayOrder: 80,
  }),


  grade({
    id: "bn-dars-ula",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Ula - Aama Year 1",
    nameUrdu: "درجہ اولی (عامہ سال اول)",
    rollPrefix: "QD1",
    darja: "dars_ula",
    durationYears: 1,
    displayOrder: 130,
  }),
  grade({
    id: "bn-dars-sania",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Sania - Aama Year 2",
    nameUrdu: "درجہ ثانیہ (عامہ سال دوم)",
    rollPrefix: "QD2",
    darja: "dars_sania",
    durationYears: 1,
    displayOrder: 140,
  }),
  grade({
    id: "bn-dars-salisa",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Salisa - Khasa Year 1",
    nameUrdu: "درجہ ثالثہ (خاصہ سال اول)",
    rollPrefix: "QD3",
    darja: "dars_salisa",
    durationYears: 1,
    displayOrder: 150,
  }),
  grade({
    id: "bn-dars-rabia",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Rabia - Khasa Year 2",
    nameUrdu: "درجہ رابعہ (خاصہ سال دوم)",
    rollPrefix: "QD4",
    darja: "dars_rabia",
    durationYears: 1,
    displayOrder: 160,
  }),
  grade({
    id: "bn-dars-khamisa",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Khamisa - Aaliya Year 1",
    nameUrdu: "درجہ خامسہ (عالیہ سال اول)",
    rollPrefix: "QD5",
    darja: "dars_khamisa",
    durationYears: 1,
    displayOrder: 170,
  }),
  grade({
    id: "bn-dars-sadisa",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Sadisa - Aaliya Year 2",
    nameUrdu: "درجہ سادسہ (عالیہ سال دوم)",
    rollPrefix: "QD6",
    darja: "dars_sadisa",
    durationYears: 1,
    displayOrder: 180,
  }),
  grade({
    id: "bn-mauquf-alaih",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Mauquf Alaih - Alimiyyah Year 1",
    nameUrdu: "درجہ موقوف علیہ (عالمیہ سال اول)",
    rollPrefix: "QD7",
    darja: "mauquf_alaih",
    durationYears: 1,
    displayOrder: 190,
  }),
  grade({
    id: "bn-daurah-hadith",
    section: "baneen",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Daurah Hadith - Alimiyyah Year 2",
    nameUrdu: "درجہ دورہ حدیث (عالمیہ سال دوم)",
    rollPrefix: "QD8",
    darja: "daurah_hadith",
    durationYears: 1,
    displayOrder: 200,
  }),

  grade({
    id: "bt-nazira-1",
    section: "banat",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 1",
    nameUrdu: "شعبہ ناظرہ - سال اول",
    rollPrefix: "ZN1",
    darja: "nazira_year_1",
    durationYears: 1,
    displayOrder: 300,
  }),
  grade({
    id: "bt-nazira-2",
    section: "banat",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 2",
    nameUrdu: "شعبہ ناظرہ - سال دوم",
    rollPrefix: "ZN2",
    darja: "nazira_year_2",
    durationYears: 1,
    displayOrder: 310,
  }),
  grade({
    id: "bt-nazira-3",
    section: "banat",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 3",
    nameUrdu: "شعبہ ناظرہ - سال سوم",
    rollPrefix: "ZN3",
    darja: "nazira_year_3",
    durationYears: 1,
    displayOrder: 320,
  }),
  grade({
    id: "bt-nazira-4",
    section: "banat",
    kind: "nazira",
    categoryId: "qaida_nazira",
    name: "Nazira Year 4",
    nameUrdu: "شعبہ ناظرہ - سال چہارم",
    rollPrefix: "ZN4",
    darja: "nazira_year_4",
    durationYears: 1,
    displayOrder: 330,
  }),

  grade({
    id: "bt-dars-ula",
    section: "banat",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Ula - Khasa Year 1",
    nameUrdu: "درجہ اولی (خاصہ سال اول)",
    rollPrefix: "ZD1",
    darja: "dars_ula",
    durationYears: 1,
    displayOrder: 370,
  }),
  grade({
    id: "bt-dars-sania",
    section: "banat",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Sania - Khasa Year 2",
    nameUrdu: "درجہ ثانیہ (خاصہ سال دوم)",
    rollPrefix: "ZD2",
    darja: "dars_sania",
    durationYears: 1,
    displayOrder: 380,
  }),
  grade({
    id: "bt-dars-salisa",
    section: "banat",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Salisa - Aaliya Year 1",
    nameUrdu: "درجہ ثالثہ (عالیہ سال اول)",
    rollPrefix: "ZD3",
    darja: "dars_salisa",
    durationYears: 1,
    displayOrder: 390,
  }),
  grade({
    id: "bt-dars-rabia",
    section: "banat",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Rabia - Aaliya Year 2",
    nameUrdu: "درجہ رابعہ (عالیہ سال دوم)",
    rollPrefix: "ZD4",
    darja: "dars_rabia",
    durationYears: 1,
    displayOrder: 400,
  }),
  grade({
    id: "bt-dars-khamisa",
    section: "banat",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Darja Khamisa - Alimiyyah Year 1",
    nameUrdu: "درجہ خامسہ (عالمیہ سال اول)",
    rollPrefix: "ZD5",
    darja: "dars_khamisa",
    durationYears: 1,
    displayOrder: 410,
  }),
  grade({
    id: "bt-daurah-hadith",
    section: "banat",
    kind: "dars_nizami",
    categoryId: "dars_nizami",
    name: "Daurah Hadith - Alimiyyah Year 2",
    nameUrdu: "درجہ دورہ حدیث (عالمیہ سال دوم)",
    rollPrefix: "ZD6",
    darja: "daurah_hadith",
    durationYears: 1,
    displayOrder: 420,
  }),
];

export function madrassaGradesForSection(section: Section, kinds?: readonly MadrassaGradeKind[]) {
  const kindSet = kinds ? new Set(kinds) : null;
  return MADRASSA_GRADE_CATALOG.filter(
    (gradeItem) => gradeItem.section === section && (!kindSet || kindSet.has(gradeItem.kind)),
  ).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getMadrassaGradeById(id: string | null | undefined) {
  if (!id) return undefined;
  return MADRASSA_GRADE_CATALOG.find((gradeItem) => gradeItem.id === id);
}

export function findMadrassaGrade(value: string | undefined, section?: Section | null) {
  const needle = normalize(value);
  if (!needle) return undefined;

  const candidates = section
    ? MADRASSA_GRADE_CATALOG.filter((gradeItem) => gradeItem.section === section)
    : MADRASSA_GRADE_CATALOG;

  return (
    candidates.find((gradeItem) =>
      [
        gradeItem.id,
        gradeItem.name,
        gradeItem.nameUrdu,
        gradeItem.darja,
        gradeItem.rollPrefix,
      ].some((candidate) => normalize(candidate) === needle),
    ) ??
    candidates.find((gradeItem) =>
      [gradeItem.name, gradeItem.nameUrdu, gradeItem.darja].some((candidate) => {
        const normalized = normalize(candidate);
        return normalized ? normalized.includes(needle) || needle.includes(normalized) : false;
      }),
    )
  );
}

export function buildMadrassaCategories(): MadrassaCategory[] {
  return categories
    .map((category) => ({
      ...category,
      subcategories: MADRASSA_GRADE_CATALOG.filter(
        (gradeItem) => gradeItem.categoryId === category.id,
      )
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((gradeItem) => ({
          id: gradeItem.id,
          name: gradeItem.name,
          nameUrdu: gradeItem.nameUrdu,
          rollPrefix: gradeItem.rollPrefix,
          count: gradeItem.count,
          section: gradeItem.section,
          darja: gradeItem.darja,
          govtEquivalent: gradeItem.govtEquivalent,
          durationYears: gradeItem.durationYears,
          reviewRequired: gradeItem.reviewRequired,
          displayOrder: gradeItem.displayOrder,
        })),
    }))
    .filter((category) => category.subcategories.length > 0);
}

function normalize(value: string | undefined | null) {
  return (
    value
      ?.toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .trim() || null
  );
}
