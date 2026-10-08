import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
} from "@/db/schema/academic";
import { buildMadrassaCategories } from "@/lib/madrassa-grade-catalog";

export const ACADEMIC_INSTITUTIONS = [
  {
    id: "al_qasim_academy",
    name: "Al-Qasim Academy",
    nameUrdu: "القاسم اکیڈمی",
    system: "school",
    section: "baneen",
    isFormal: true,
  },
  {
    id: "jamia_qasmia_baneen",
    name: "Jamia Qasmia Lil-Baneen",
    nameUrdu: "جامعہ قاسمیہ للبنین",
    system: "madrassa",
    section: "baneen",
    isFormal: true,
  },
  {
    id: "jamia_zainab_banat",
    name: "Jamia Zainab Lil-Banat",
    nameUrdu: "جامعہ زینب للبنات",
    system: "madrassa",
    section: "banat",
    isFormal: true,
  },
] as const;

export const ACADEMIC_PROGRAMS = [
  {
    id: "al_qasim_school",
    institutionId: "al_qasim_academy",
    name: "Formal School",
    nameUrdu: "شعبہ سکول",
    system: "school",
    kind: "school",
    rollPrefix: "SCH",
    isFormal: true,
  },
  {
    id: "qasmia_hifz",
    institutionId: "jamia_qasmia_baneen",
    name: "Hifz",
    nameUrdu: "حفظ",
    system: "madrassa",
    kind: "hifz",
    rollPrefix: "HF",
    isFormal: true,
  },
  {
    id: "qasmia_nazira",
    institutionId: "jamia_qasmia_baneen",
    name: "Nazira & Qaida",
    nameUrdu: "ناظرہ و قاعدہ",
    system: "madrassa",
    kind: "nazira",
    rollPrefix: "NZ",
    isFormal: true,
  },
  {
    id: "qasmia_dars_nizami",
    institutionId: "jamia_qasmia_baneen",
    name: "Dars-e-Nizami",
    nameUrdu: "درس نظامی",
    system: "madrassa",
    kind: "dars_nizami",
    rollPrefix: "DN",
    isFormal: true,
  },
  {
    id: "zainab_dars_nizami",
    institutionId: "jamia_zainab_banat",
    name: "Dars-e-Nizami",
    nameUrdu: "درس نظامی",
    system: "madrassa",
    kind: "dars_nizami",
    rollPrefix: "ZDN",
    isFormal: true,
  },
  {
    id: "zainab_nazira",
    institutionId: "jamia_zainab_banat",
    name: "Nazira & Qaida",
    nameUrdu: "ناظرہ و قاعدہ",
    system: "madrassa",
    kind: "nazira",
    rollPrefix: "ZNZ",
    isFormal: true,
  },
  {
    id: "zainab_school_support",
    institutionId: "jamia_zainab_banat",
    name: "School Support",
    nameUrdu: "شعبہ سکول معاونت",
    system: "school_support",
    kind: "school_support",
    rollPrefix: "ZSS",
    isFormal: false,
  },
] as const;

let seedPromise: Promise<void> | null = null;

export function ensureAcademicSeeded(force = false) {
  if (force && seedPromise) {
    seedPromise = null;
  }
  seedPromise ??= seedAcademicCatalog();
  return seedPromise;
}

export async function seedAcademicCatalog() {
  for (const institution of ACADEMIC_INSTITUTIONS) {
    await db
      .insert(institutions)
      .values(institution)
      .onConflictDoUpdate({
        target: institutions.id,
        set: {
          name: institution.name,
          nameUrdu: institution.nameUrdu,
          system: institution.system,
          section: institution.section,
          isFormal: institution.isFormal,
          active: true,
          updatedAt: new Date(),
        },
      });
  }

  for (const program of ACADEMIC_PROGRAMS) {
    await db
      .insert(programs)
      .values(program)
      .onConflictDoUpdate({
        target: programs.id,
        set: {
          institutionId: program.institutionId,
          name: program.name,
          nameUrdu: program.nameUrdu,
          system: program.system,
          kind: program.kind,
          rollPrefix: program.rollPrefix,
          isFormal: program.isFormal,
          active: true,
          updatedAt: new Date(),
        },
      });
  }

  const CANONICAL_CATEGORIES = [
    {
      id: "dars_nizami",
      name: "Dars-e-Nizami",
      nameUrdu: "درس نظامی",
      description: "Institution-provided Dars-e-Nizami grade sequence.",
      descriptionUrdu: "ادارے کی فراہم کردہ درس نظامی درجات کی ترتیب",
      displayOrder: 1,
      active: true,
      section: "both",
      formVariantKeys: ["madrassa-boys-general", "madrassa-girls-general"],
    },
    {
      id: "hifz",
      name: "Hifz",
      nameUrdu: "حفظ",
      description: "Memorization grades provided by Jamia Qasmia Lil-Baneen.",
      descriptionUrdu: "جامعہ قاسمیہ للبنین کے فراہم کردہ حفظ کے درجات",
      displayOrder: 2,
      active: true,
      section: "male",
      formVariantKeys: ["madrassa-boys-hifz"],
    },
    {
      id: "qaida_nazira",
      name: "Nazira",
      nameUrdu: "ناظرہ",
      description: "Nazira grades provided separately for boys and girls madrassas.",
      descriptionUrdu: "بنین اور بنات مدارس کے لیے فراہم کردہ ناظرہ درجات",
      displayOrder: 3,
      active: true,
      section: "both",
      formVariantKeys: ["madrassa-boys-nazira", "madrassa-girls-nazira"],
    },
  ];

  for (const category of CANONICAL_CATEGORIES) {
    await db
      .insert(madrassaCategories)
      .values(category)
      .onConflictDoUpdate({
        target: madrassaCategories.id,
        set: {
          name: category.name,
          nameUrdu: category.nameUrdu,
          description: category.description,
          descriptionUrdu: category.descriptionUrdu,
          displayOrder: category.displayOrder,
          active: category.active,
          section: category.section,
          formVariantKeys: category.formVariantKeys,
          updatedAt: new Date(),
        },
      });
  }

  const catalogCategories = buildMadrassaCategories();

  for (const cat of catalogCategories) {
    for (const sub of cat.subcategories) {
      await db
        .insert(madrassaSubcategories)
        .values({
          id: sub.id,
          categoryId: cat.id,
          name: sub.name,
          nameUrdu: sub.nameUrdu,
          rollPrefix: sub.rollPrefix,
          darja: sub.darja ?? null,
          govtEquivalent: sub.govtEquivalent ?? null,
          durationYears: sub.durationYears,
          fee: null,
          displayOrder: sub.displayOrder ?? 0,
          active: true,
          section: sub.section ?? "male",
        })
        .onConflictDoUpdate({
          target: madrassaSubcategories.id,
          set: {
            categoryId: cat.id,
            name: sub.name,
            nameUrdu: sub.nameUrdu,
            rollPrefix: sub.rollPrefix,
            darja: sub.darja ?? null,
            govtEquivalent: sub.govtEquivalent ?? null,
            durationYears: sub.durationYears,
            section: sub.section ?? "male",
            updatedAt: new Date(),
          },
        });
    }
  }
}


