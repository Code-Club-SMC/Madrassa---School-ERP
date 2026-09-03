import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { schoolClasses as schoolClassSeed } from "@/mock/classes";

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

  for (const [index, schoolClass] of schoolClassSeed.entries()) {
    await db
      .insert(schoolClasses)
      .values({
        id: schoolClass.id,
        name: schoolClass.name,
        nameUrdu: schoolClass.nameUrdu,
        level: schoolClass.level,
        govtEquivalent: schoolClass.govtEquivalent,
        gender: schoolClass.gender,
        displayOrder: index + 1,
      })
      .onConflictDoUpdate({
        target: schoolClasses.id,
        set: {
          name: schoolClass.name,
          nameUrdu: schoolClass.nameUrdu,
          level: schoolClass.level,
          govtEquivalent: schoolClass.govtEquivalent,
          gender: schoolClass.gender,
          displayOrder: index + 1,
          active: true,
          updatedAt: new Date(),
        },
      });

    for (const section of schoolClass.sections) {
      await db
        .insert(schoolClassSections)
        .values({
          id: section.id,
          classId: schoolClass.id,
          name: section.name,
          group: section.group,
        })
        .onConflictDoUpdate({
          target: schoolClassSections.id,
          set: {
            classId: schoolClass.id,
            name: section.name,
            group: section.group,
            active: true,
          },
        });
    }
  }

  const STATIC_CATEGORIES = [
    {
      id: "nazara_male",
      name: "Nazara",
      nameUrdu: "ناظرہ",
      description: "Nazara / Qaida category",
      descriptionUrdu: "ناظرہ / قاعدہ زمرہ",
      displayOrder: 1,
      active: true,
      section: "male",
      formVariantKeys: ["madrassa-boys-nazira"],
    },
    {
      id: "hifiz_male",
      name: "Hifiz",
      nameUrdu: "حفاظ",
      description: "Hifiz / Memorization category",
      descriptionUrdu: "حفظ زمرہ",
      displayOrder: 2,
      active: true,
      section: "male",
      formVariantKeys: ["madrassa-boys-hifz"],
    },
    {
      id: "alam_male",
      name: "Alam",
      nameUrdu: "علم",
      description: "Alam / Dars-e-Nizami category",
      descriptionUrdu: "علم / درس نظامی زمرہ",
      displayOrder: 3,
      active: true,
      section: "male",
      formVariantKeys: ["madrassa-boys-general"],
    },
    {
      id: "nazara_female",
      name: "Nazara",
      nameUrdu: "ناظرہ",
      description: "Nazara / Qaida category",
      descriptionUrdu: "ناظرہ / قاعدہ زمرہ",
      displayOrder: 1,
      active: true,
      section: "female",
      formVariantKeys: ["madrassa-girls-nazira"],
    },
    {
      id: "alam_female",
      name: "Alam",
      nameUrdu: "علم",
      description: "Alam / Dars-e-Nizami category",
      descriptionUrdu: "علم / درس نظامی زمرہ",
      displayOrder: 2,
      active: true,
      section: "female",
      formVariantKeys: ["madrassa-girls-general"],
    },
  ];

  for (const category of STATIC_CATEGORIES) {
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
}
