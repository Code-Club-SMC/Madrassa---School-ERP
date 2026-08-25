import { eq } from "drizzle-orm";
import { db } from "@/db";
import { programs, schoolClasses, madrassaSubcategories } from "@/db/schema/academic";
import type { AdmissionVariantKey } from "@/lib/admission-variants";
import { findMadrassaGrade, getMadrassaGradeById } from "@/lib/madrassa-grade-catalog";
import { schoolClasses as schoolClassSeed } from "@/mock/classes";
import { ensureAcademicSeeded } from "@/lib/server/academic/seed";
import { AdmissionError } from "./errors";
import type { Section } from "@/types";

export const admissionVariantKeys = [
  "school-boys-main",
  "school-girls-main",
  "school-girls-shoba",
  "madrassa-boys-nazira",
  "madrassa-boys-hifz",
  "madrassa-boys-general",
  "madrassa-girls-general",
  "madrassa-girls-nazira",
] as const satisfies readonly AdmissionVariantKey[];

type VariantTarget = {
  institutionId: string;
  programId: string;
  defaultSchoolClassId?: string;
  defaultMadrassaSubcategoryId?: string;
  requiresSchoolClass?: boolean;
  supportClassOnly?: boolean;
};

export const variantTargets: Record<AdmissionVariantKey, VariantTarget> = {
  "school-boys-main": {
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    requiresSchoolClass: true,
  },
  "school-girls-main": {
    institutionId: "jamia_zainab_banat",
    programId: "zainab_school_support",
    defaultSchoolClassId: "c1",
    supportClassOnly: true,
  },
  "school-girls-shoba": {
    institutionId: "jamia_zainab_banat",
    programId: "zainab_school_support",
    defaultSchoolClassId: "c1",
    supportClassOnly: true,
  },
  "madrassa-boys-nazira": {
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_nazira",
    defaultMadrassaSubcategoryId: "bn-nazira-1",
  },
  "madrassa-boys-hifz": {
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_hifz",
    defaultMadrassaSubcategoryId: "bn-hifz-1",
  },
  "madrassa-boys-general": {
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_dars_nizami",
    defaultMadrassaSubcategoryId: "bn-idadiya-awwal",
  },
  "madrassa-girls-general": {
    institutionId: "jamia_zainab_banat",
    programId: "zainab_dars_nizami",
    defaultMadrassaSubcategoryId: "bt-tarjuma",
  },
  "madrassa-girls-nazira": {
    institutionId: "jamia_zainab_banat",
    programId: "zainab_nazira",
    defaultMadrassaSubcategoryId: "bt-nazira-1",
  },
};

export type AdmissionTarget = {
  institutionId: string;
  programId: string;
  schoolClassId: string | null;
  schoolSectionId: string | null;
  madrassaSubcategoryId: string | null;
  darja: string | null;
};

export async function resolveAdmissionTarget(
  variantKey: AdmissionVariantKey,
  form: Record<string, string>,
  override: Partial<AdmissionTarget> = {},
): Promise<AdmissionTarget> {
  await ensureAcademicSeeded();

  const target = variantTargets[variantKey];
  if (!target) throw new AdmissionError("Unsupported admission form", 400);
  const allowsSchoolClass = variantAllowsSchoolClass(target);
  const expectedMadrassaSection = madrassaSectionForVariant(variantKey);

  const schoolClassId = allowsSchoolClass
    ? (override.schoolClassId ??
      resolveSchoolClassId(form.class || form.admitted_class) ??
      target.defaultSchoolClassId ??
      null)
    : null;
  const schoolSectionId = allowsSchoolClass ? (override.schoolSectionId ?? null) : null;

  const madrassaSubcategoryId = expectedMadrassaSection
    ? (override.madrassaSubcategoryId ??
      (await resolveMadrassaSubcategoryId(
        form.shoba || form.req_darja || form.darja,
        expectedMadrassaSection,
      )) ??
      target.defaultMadrassaSubcategoryId ??
      null)
    : null;

  if (target.requiresSchoolClass && !schoolClassId) {
    throw new AdmissionError("A school class is required for Al-Qasim Academy admissions", 400);
  }

  if (
    target.supportClassOnly &&
    schoolClassId &&
    !["nursery", "kg", "c1", "c2", "c3", "c4", "c5"].includes(schoolClassId)
  ) {
    throw new AdmissionError("Jamia Zainab school support only allows classes up to Class 5", 400);
  }

  if (schoolClassId) {
    const [existingClass] = await db
      .select({ id: schoolClasses.id })
      .from(schoolClasses)
      .where(eq(schoolClasses.id, schoolClassId))
      .limit(1);
    if (!existingClass) throw new AdmissionError("Selected school class does not exist", 400);
  }

  if (madrassaSubcategoryId) {
    const expectedSection = madrassaSectionForVariant(variantKey);
    const staticGrade = getMadrassaGradeById(madrassaSubcategoryId);
    if (expectedSection && staticGrade && staticGrade.section !== expectedSection) {
      throw new AdmissionError("Selected madrassa grade does not belong to this madrassa", 400);
    }

    const [existingSubcategory] = await db
      .select({ id: madrassaSubcategories.id, darja: madrassaSubcategories.darja })
      .from(madrassaSubcategories)
      .where(eq(madrassaSubcategories.id, madrassaSubcategoryId))
      .limit(1);
    if (!existingSubcategory)
      throw new AdmissionError("Selected madrassa category does not exist", 400);
    return {
      institutionId: target.institutionId,
      programId: target.programId,
      schoolClassId,
      schoolSectionId,
      madrassaSubcategoryId,
      darja: override.darja ?? existingSubcategory.darja ?? null,
    };
  }

  const [program] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.id, target.programId))
    .limit(1);
  if (!program) throw new AdmissionError("Admission program is not configured", 500);

  return {
    institutionId: target.institutionId,
    programId: target.programId,
    schoolClassId,
    schoolSectionId,
    madrassaSubcategoryId: null,
    darja: override.darja ?? null,
  };
}

export async function getRollPrefix(target: AdmissionTarget) {
  if (target.madrassaSubcategoryId) {
    const [subcategory] = await db
      .select({ rollPrefix: madrassaSubcategories.rollPrefix })
      .from(madrassaSubcategories)
      .where(eq(madrassaSubcategories.id, target.madrassaSubcategoryId))
      .limit(1);
    if (subcategory?.rollPrefix) return subcategory.rollPrefix;
  }

  const [program] = await db
    .select({ rollPrefix: programs.rollPrefix })
    .from(programs)
    .where(eq(programs.id, target.programId))
    .limit(1);

  return program?.rollPrefix ?? "ADM";
}

export function resolveSchoolClassId(value: string | undefined) {
  const needle = normalize(value);
  if (!needle) return null;

  const exact = schoolClassSeed.find((item) =>
    normalizedCandidates(item.id, item.name, item.nameUrdu, item.govtEquivalent).some(
      (candidate) => candidate === needle,
    ),
  );
  if (exact) return exact.id;

  const loose = schoolClassSeed.find((item) =>
    normalizedCandidates(item.name, item.nameUrdu, item.govtEquivalent).some(
      (candidate) => candidate.includes(needle) || needle.includes(candidate),
    ),
  );
  return loose?.id ?? null;
}

function variantAllowsSchoolClass(target: VariantTarget) {
  return Boolean(
    target.requiresSchoolClass || target.supportClassOnly || target.defaultSchoolClassId,
  );
}

async function resolveMadrassaSubcategoryId(value: string | undefined, section: Section | null) {
  if (!value) return null;

  // The admission form now stores the real subcategory id (from the classes table) in form.shoba.
  const [subcategory] = await db
    .select({
      id: madrassaSubcategories.id,
      section: madrassaSubcategories.section,
    })
    .from(madrassaSubcategories)
    .where(eq(madrassaSubcategories.id, value))
    .limit(1);

  if (subcategory) {
    if (section) {
      const expectedDbSections =
        section === "baneen" ? ["baneen", "male"] : section === "banat" ? ["banat", "female"] : [section];
      if (!expectedDbSections.includes(subcategory.section)) return null;
    }
    return subcategory.id;
  }

  // Fallback for legacy catalog values (name / rollPrefix / darja).
  return findMadrassaGrade(value, section)?.id ?? null;
}

function madrassaSectionForVariant(variantKey: AdmissionVariantKey): Section | null {
  if (variantKey.startsWith("madrassa-boys")) return "baneen";
  if (variantKey.startsWith("madrassa-girls")) return "banat";
  return null;
}

function normalize(value: string | undefined) {
  return (
    value
      ?.toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .trim() || null
  );
}

function normalizedCandidates(...values: Array<string | undefined>) {
  return values.map((value) => normalize(value)).filter((value): value is string => Boolean(value));
}
