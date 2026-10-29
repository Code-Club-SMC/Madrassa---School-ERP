import { db } from "@/db";
import { count } from "drizzle-orm";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
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

export const DEFAULT_SCHOOL_CLASSES = [
  { id: "class_nursery", institutionId: "al_qasim_academy", code: "NUR", name: "Nursery", nameUrdu: "نرسری", level: "pre-primary", govtEquivalent: "Early Childhood", displayOrder: 1, fee: 2500, active: true, gender: "male" as const },
  { id: "class_kg", institutionId: "al_qasim_academy", code: "KG", name: "KG", nameUrdu: "کی جی", level: "pre-primary", govtEquivalent: "Kindergarten", displayOrder: 2, fee: 2500, active: true, gender: "male" as const },
  { id: "class_1", institutionId: "al_qasim_academy", code: "1", name: "Class 1", nameUrdu: "جماعت اول", level: "primary", govtEquivalent: "Primary", displayOrder: 3, fee: 3000, active: true, gender: "male" as const },
  { id: "class_2", institutionId: "al_qasim_academy", code: "2", name: "Class 2", nameUrdu: "جماعت دوم", level: "primary", govtEquivalent: "Primary", displayOrder: 4, fee: 3000, active: true, gender: "male" as const },
  { id: "class_3", institutionId: "al_qasim_academy", code: "3", name: "Class 3", nameUrdu: "جماعت سوم", level: "primary", govtEquivalent: "Primary", displayOrder: 5, fee: 3000, active: true, gender: "male" as const },
  { id: "class_4", institutionId: "al_qasim_academy", code: "4", name: "Class 4", nameUrdu: "جماعت چہارم", level: "primary", govtEquivalent: "Primary", displayOrder: 6, fee: 3500, active: true, gender: "male" as const },
  { id: "class_5", institutionId: "al_qasim_academy", code: "5", name: "Class 5", nameUrdu: "جماعت پنجم", level: "primary", govtEquivalent: "Primary", displayOrder: 7, fee: 3500, active: true, gender: "male" as const },
  { id: "class_6", institutionId: "al_qasim_academy", code: "6", name: "Class 6", nameUrdu: "جماعت ششم", level: "middle", govtEquivalent: "Middle", displayOrder: 8, fee: 4000, active: true, gender: "male" as const },
  { id: "class_7", institutionId: "al_qasim_academy", code: "7", name: "Class 7", nameUrdu: "جماعت ہفتم", level: "middle", govtEquivalent: "Middle", displayOrder: 9, fee: 4000, active: true, gender: "male" as const },
  { id: "class_8", institutionId: "al_qasim_academy", code: "8", name: "Class 8", nameUrdu: "جماعت ہشتم", level: "middle", govtEquivalent: "Middle", displayOrder: 10, fee: 4000, active: true, gender: "male" as const },
  { id: "class_9", institutionId: "al_qasim_academy", code: "9", name: "Class 9", nameUrdu: "جماعت نہم", level: "secondary", govtEquivalent: "Matric 9th", displayOrder: 11, fee: 4500, active: true, gender: "male" as const },
  { id: "class_10", institutionId: "al_qasim_academy", code: "10", name: "Class 10", nameUrdu: "جماعت دہم", level: "secondary", govtEquivalent: "Matric 10th", displayOrder: 12, fee: 4500, active: true, gender: "male" as const },
];

let seeded = false;

export async function ensureAcademicSeeded(force = false) {
  if (seeded && !force) {
    return;
  }
  try {
    const [existing] = await db.select({ count: count() }).from(madrassaCategories);
    const [existingClasses] = await db.select({ count: count() }).from(schoolClasses);
    if (Number(existing?.count ?? 0) === 0 || Number(existingClasses?.count ?? 0) === 0 || force) {
      await seedAcademicCatalog();
    }
    seeded = true;
  } catch (err) {
    console.error("[ensureAcademicSeeded] Failed to verify or seed catalog:", err);
  }
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

  for (const cls of DEFAULT_SCHOOL_CLASSES) {
    await db
      .insert(schoolClasses)
      .values(cls)
      .onConflictDoUpdate({
        target: schoolClasses.id,
        set: {
          name: cls.name,
          nameUrdu: cls.nameUrdu,
          institutionId: cls.institutionId,
          code: cls.code,
          level: cls.level,
          govtEquivalent: cls.govtEquivalent,
          displayOrder: cls.displayOrder,
          fee: cls.fee,
          active: cls.active,
          gender: cls.gender,
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
      name: "Dars-e-Nizami / Alim",
      nameUrdu: "درس نظامی / عالم",
      description: "Dars-e-Nizami (Alim Course) grade sequence.",
      descriptionUrdu: "درس نظامی / عالم کورس کے درجات",
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
      descriptionUrdu: "جامعہ قاسمیہ للبنین کے حفظ کے درجات",
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
      descriptionUrdu: "بنین اور بنات مدارس کے لیے ناظرہ درجات",
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

  const existingSubcategoriesCount = await db
    .select({ count: count() })
    .from(madrassaSubcategories);
  const hasSubcategories = Number(existingSubcategoriesCount[0]?.count ?? 0) > 0;

  if (!hasSubcategories) {
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
          .onConflictDoNothing();
      }
    }
  }
}


