import { eq } from "drizzle-orm";
import { db } from "@/db";
import { programs, schoolClasses, madrassaSubcategories } from "@/db/schema/academic";
import type { AdmissionVariantKey } from "@/lib/admission-variants";
import { findMadrassaGrade, getMadrassaGradeById } from "@/lib/madrassa-grade-catalog";
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
  requiresMadrassaSubcategory?: boolean;
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
    requiresSchoolClass: true,
    supportClassOnly: true,
  },
  "school-girls-shoba": {
    institutionId: "jamia_zainab_banat",
    programId: "zainab_school_support",
    requiresSchoolClass: true,
    supportClassOnly: true,
  },
  "madrassa-boys-nazira": {
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_nazira",
    requiresMadrassaSubcategory: true,
  },
  "madrassa-boys-hifz": {
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_hifz",
    requiresMadrassaSubcategory: true,
  },
  "madrassa-boys-general": {
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_dars_nizami",
    requiresMadrassaSubcategory: true,
  },
  "madrassa-girls-general": {
    institutionId: "jamia_zainab_banat",
    programId: "zainab_dars_nizami",
    requiresMadrassaSubcategory: true,
  },
  "madrassa-girls-nazira": {
    institutionId: "jamia_zainab_banat",
    programId: "zainab_nazira",
    requiresMadrassaSubcategory: true,
  },
};

export type AdmissionTarget = {
  institutionId: string;
  programId: string;
  schoolClassId: string | null;
  madrassaSubcategoryId: string | null;
  darja: string | null;
  rollPrefix?: string;
  fee?: number | null;
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
      (await resolveSchoolClassId(form.class || form.admitted_class)) ??
      target.defaultSchoolClassId ??
      null)
    : null;

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
    throw new AdmissionError("A school class is required for school admissions · اسکول میں داخلے کے لیے جماعت منتخب کرنا لازمی ہے", 400);
  }

  if (target.requiresMadrassaSubcategory && !madrassaSubcategoryId) {
    throw new AdmissionError("A madrassa class/darja is required for madrassa admissions · مدرسہ میں داخلے کے لیے درجہ منتخب کرنا لازمی ہے", 400);
  }

  let schoolClassFee: number | null = null;
  if (schoolClassId) {
    const [existingClass] = await db
      .select({ id: schoolClasses.id, fee: schoolClasses.fee })
      .from(schoolClasses)
      .where(eq(schoolClasses.id, schoolClassId))
      .limit(1);
    if (!existingClass) {
      throw new AdmissionError("منتخب کردہ اسکول کلاس موجود نہیں · Selected school class does not exist", 400);
    }
    schoolClassFee = existingClass.fee ?? null;
  }

  if (madrassaSubcategoryId) {
    const expectedSection = madrassaSectionForVariant(variantKey);

    const [existingSubcategory] = await db
      .select({
        id: madrassaSubcategories.id,
        darja: madrassaSubcategories.darja,
        rollPrefix: madrassaSubcategories.rollPrefix,
        fee: madrassaSubcategories.fee,
        section: madrassaSubcategories.section,
      })
      .from(madrassaSubcategories)
      .where(eq(madrassaSubcategories.id, madrassaSubcategoryId))
      .limit(1);
    if (!existingSubcategory) {
      throw new AdmissionError("منتخب کردہ مدرسہ درجہ موجود نہیں · Selected madrassa class does not exist", 400);
    }

    if (expectedSection) {
      const dbSec = (existingSubcategory.section || "").toLowerCase();
      const valid =
        expectedSection === "baneen"
          ? ["baneen", "male", "both", "all"].includes(dbSec)
          : ["banat", "female", "both", "all"].includes(dbSec);
      if (!valid) {
        throw new AdmissionError("منتخب کردہ درجہ اس مدرسہ سے متعلق نہیں · Selected madrassa grade does not belong to this madrassa", 400);
      }
    }
    return {
      institutionId: target.institutionId,
      programId: target.programId,
      schoolClassId,
      madrassaSubcategoryId,
      darja: override.darja ?? existingSubcategory.darja ?? null,
      rollPrefix: existingSubcategory.rollPrefix ?? "MAD",
      fee: existingSubcategory.fee ?? schoolClassFee,
    };
  }

  const [program] = await db
    .select({ id: programs.id, rollPrefix: programs.rollPrefix })
    .from(programs)
    .where(eq(programs.id, target.programId))
    .limit(1);
  if (!program) throw new AdmissionError("Admission program is not configured", 500);

  return {
    institutionId: target.institutionId,
    programId: target.programId,
    schoolClassId,
    madrassaSubcategoryId: null,
    darja: override.darja ?? null,
    rollPrefix: override.rollPrefix ?? program.rollPrefix ?? "SCH",
    fee: schoolClassFee,
  };
}

export async function getRollPrefix(target: AdmissionTarget) {
  if (target.rollPrefix) return target.rollPrefix;
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

export function matchSchoolClass(
  needle: string | undefined,
  rows: Array<{ id: string; name: string; nameUrdu: string; govtEquivalent?: string | null }>,
) {
  const normNeedle = normalize(needle);
  if (!normNeedle) return null;

  const exact = rows.find((item) =>
    normalizedCandidates(item.id, item.name, item.nameUrdu, item.govtEquivalent ?? undefined).some(
      (candidate) => candidate === normNeedle,
    ),
  );
  if (exact) return exact.id;

  const loose = rows.find((item) =>
    normalizedCandidates(item.name, item.nameUrdu, item.govtEquivalent ?? undefined).some(
      (candidate) => candidate.includes(normNeedle) || normNeedle.includes(candidate),
    ),
  );
  return loose?.id ?? null;
}

export async function resolveSchoolClassId(value: string | undefined) {
  if (!value) return null;

  return db
    .select({ id: schoolClasses.id, name: schoolClasses.name, nameUrdu: schoolClasses.nameUrdu, govtEquivalent: schoolClasses.govtEquivalent })
    .from(schoolClasses)
    .then((rows) => matchSchoolClass(value, rows))
    .catch(() => null);
}

function variantAllowsSchoolClass(target: VariantTarget) {
  return Boolean(
    target.requiresSchoolClass || target.supportClassOnly || target.defaultSchoolClassId,
  );
}

async function resolveMadrassaSubcategoryId(value: string | undefined, section: Section | null) {
  if (!value) return null;

  const expectedDbSections =
    section === "baneen"
      ? ["baneen", "male", "both", "all"]
      : section === "banat"
        ? ["banat", "female", "both", "all"]
        : [section, "both", "all"].filter(Boolean) as string[];

  // 1. Exact ID match from database
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
      if (!expectedDbSections.includes((subcategory.section || "").toLowerCase())) return null;
    }
    return subcategory.id;
  }

  // 2. Query all subcategories from the database to match by name, nameUrdu, rollPrefix, or darja
  const needle = normalize(value);
  if (!needle) return null;

  const rows = await db
    .select({
      id: madrassaSubcategories.id,
      name: madrassaSubcategories.name,
      nameUrdu: madrassaSubcategories.nameUrdu,
      rollPrefix: madrassaSubcategories.rollPrefix,
      darja: madrassaSubcategories.darja,
      section: madrassaSubcategories.section,
    })
    .from(madrassaSubcategories);

  const filtered = section
    ? rows.filter((r) => expectedDbSections.includes((r.section || "").toLowerCase()))
    : rows;

  const exact = filtered.find((item) =>
    normalizedCandidates(item.id, item.name, item.nameUrdu, item.rollPrefix ?? undefined, item.darja ?? undefined).some(
      (candidate) => candidate === needle,
    ),
  );
  if (exact) return exact.id;

  const loose = filtered.find((item) =>
    normalizedCandidates(item.name, item.nameUrdu, item.rollPrefix ?? undefined, item.darja ?? undefined).some(
      (candidate) => candidate.includes(needle) || needle.includes(candidate),
    ),
  );
  return loose?.id ?? null;
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
