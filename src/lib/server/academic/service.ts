import { randomUUID } from "node:crypto";
import { and, asc, count, eq, max, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { studentEnrollments } from "@/db/schema/students";
import { admissionApplications } from "@/db/schema/admission";
import { examMarks, examResults, examSessions, examSubjects } from "@/db/schema/exams";
import { feeCharges } from "@/db/schema/finance";
import { promotionRules } from "@/db/schema/academic-years";
import { studentAttendance } from "@/db/schema/attendance";
import { teacherAssignments, teacherTimetablePeriods } from "@/db/schema/teachers";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import { ensureAcademicSeeded } from "./seed";

export const schoolClassInputSchema = z.object({
  name: z.string().trim().min(1),
  nameUrdu: z.string().trim().min(1),
  level: z.enum(["pre_primary", "primary", "middle", "secondary", "higher_secondary"]),
  govtEquivalent: z.string().trim().nullable().optional(),
  active: z.boolean().optional(),
});

export const schoolClassUpdateSchema = schoolClassInputSchema.partial().refine(hasAnyKey, {
  message: "At least one field is required",
});

export const schoolSectionInputSchema = z.object({
  name: z.string().trim().min(1),
  group: z.enum(["science", "arts", "commerce"]).nullable().optional(),
  active: z.boolean().optional(),
});

export const schoolSectionUpdateSchema = schoolSectionInputSchema.partial().refine(hasAnyKey, {
  message: "At least one field is required",
});

export const madrassaCategoryInputSchema = z.object({
  name: z.string().trim().min(1),
  nameUrdu: z.string().trim().min(1),
  description: z.string().trim().optional(),
  descriptionUrdu: z.string().trim().optional(),
  section: z.enum(["male", "female"]).default("male"),
  active: z.boolean().optional(),
});

export const madrassaCategoryUpdateSchema = madrassaCategoryInputSchema.partial().refine(hasAnyKey, {
  message: "At least one field is required",
});

export const madrassaSubcategoryInputSchema = z.object({
  name: z.string().trim().min(1),
  nameUrdu: z.string().trim().min(1),
  rollPrefix: z.string().trim().min(1).optional(),
  darja: z.string().trim().nullable().optional(),
  govtEquivalent: z.string().trim().nullable().optional(),
  durationYears: z.coerce.number().int().positive().nullable().optional(),
  fee: z.coerce.number().int().nonnegative().nullable().optional(),
  active: z.boolean().optional(),
  section: z.enum(["male", "female"]).optional(),
});

export const madrassaSubcategoryUpdateSchema = madrassaSubcategoryInputSchema.partial().refine(hasAnyKey, {
  message: "At least one field is required",
});

export async function listAcademicInstitutions(request: Request) {
  await requireAnyAcademicView(request);
  await ensureAcademicSeeded();

  return db.select().from(institutions).orderBy(asc(institutions.name));
}

export async function listAcademicPrograms(request: Request) {
  await requireAnyAcademicView(request);
  await ensureAcademicSeeded();

  return db
    .select({
      id: programs.id,
      institutionId: programs.institutionId,
      name: programs.name,
      nameUrdu: programs.nameUrdu,
      system: programs.system,
      kind: programs.kind,
      rollPrefix: programs.rollPrefix,
      isFormal: programs.isFormal,
      active: programs.active,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
    })
    .from(programs)
    .innerJoin(institutions, eq(institutions.id, programs.institutionId))
    .orderBy(asc(institutions.name), asc(programs.name));
}

export async function listSchoolClasses(request: Request) {
  await requirePermission(request, "school_classes", "view");
  await ensureAcademicSeeded();

  const url = new URL(request.url);
  const gender = url.searchParams.get("gender") as "male" | "female" | null;

  const [classes, sections, classCounts, sectionCounts] = await Promise.all([
    db.select().from(schoolClasses).orderBy(asc(schoolClasses.displayOrder), asc(schoolClasses.name)),
    db.select().from(schoolClassSections).orderBy(asc(schoolClassSections.name)),
    db
      .select({ classId: studentEnrollments.schoolClassId, count: count() })
      .from(studentEnrollments)
      .where(and(eq(studentEnrollments.status, "active")))
      .groupBy(studentEnrollments.schoolClassId),
    db
      .select({ sectionId: studentEnrollments.schoolSectionId, count: count() })
      .from(studentEnrollments)
      .where(and(eq(studentEnrollments.status, "active")))
      .groupBy(studentEnrollments.schoolSectionId),
  ]);

  const filtered = gender ? classes.filter((c) => c.gender === gender) : classes;

  const classCountMap = new Map(classCounts.map((row) => [row.classId, Number(row.count)]));
  const sectionCountMap = new Map(sectionCounts.map((row) => [row.sectionId, Number(row.count)]));

  return filtered.map((schoolClass) => ({
    ...schoolClass,
    enrollmentCount: classCountMap.get(schoolClass.id) ?? 0,
    sections: sections
      .filter((section) => section.classId === schoolClass.id)
      .map((section) => ({
        ...section,
        enrollmentCount: sectionCountMap.get(section.id) ?? 0,
      })),
  }));
}

export async function createSchoolClass(request: Request, input: z.infer<typeof schoolClassInputSchema>) {
  await requirePermission(request, "school_classes", "create");
  await ensureAcademicSeeded();

  const id = uniqueId("class", input.name);
  const displayOrder = await nextSchoolClassOrder();
  const [created] = await db
    .insert(schoolClasses)
    .values({
      id,
      name: input.name,
      nameUrdu: input.nameUrdu,
      level: input.level,
      govtEquivalent: input.govtEquivalent ?? null,
      displayOrder,
      active: input.active ?? true,
    })
    .returning();

  return created;
}

export async function updateSchoolClass(
  request: Request,
  id: string,
  input: z.infer<typeof schoolClassUpdateSchema>,
) {
  await requirePermission(request, "school_classes", "edit");

  if (input.active === false) {
    await assertNoActiveSchoolClassEnrollments(id);
  }

  const [updated] = await db
    .update(schoolClasses)
    .set({
      ...input,
      govtEquivalent: input.govtEquivalent ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(schoolClasses.id, id))
    .returning();

  if (!updated) throw new HttpError("School class not found", 404);
  return updated;
}

export async function createSchoolSection(
  request: Request,
  classId: string,
  input: z.infer<typeof schoolSectionInputSchema>,
) {
  await requirePermission(request, "school_classes", "create");

  const [schoolClass] = await db.select({ id: schoolClasses.id }).from(schoolClasses).where(eq(schoolClasses.id, classId)).limit(1);
  if (!schoolClass) throw new HttpError("School class not found", 404);

  const [created] = await db
    .insert(schoolClassSections)
    .values({
      id: uniqueId(classId, input.name),
      classId,
      name: input.name,
      group: input.group ?? null,
      active: input.active ?? true,
    })
    .returning();

  return created;
}

export async function updateSchoolSection(
  request: Request,
  classId: string,
  sectionId: string,
  input: z.infer<typeof schoolSectionUpdateSchema>,
) {
  await requirePermission(request, "school_classes", "edit");

  if (input.active === false) {
    await assertNoActiveSchoolSectionEnrollments(sectionId);
  }

  const [updated] = await db
    .update(schoolClassSections)
    .set(input)
    .where(and(eq(schoolClassSections.id, sectionId), eq(schoolClassSections.classId, classId)))
    .returning();

  if (!updated) throw new HttpError("School section not found", 404);
  return updated;
}

export async function listMadrassaCategories(request: Request, academicYearId?: string, section?: string) {
  await requirePermission(request, "madrassa_categories", "view");
  await ensureAcademicSeeded();

  const [categories, subcategories, countsBySubcategory] = await Promise.all([
    db.select().from(madrassaCategories).orderBy(asc(madrassaCategories.displayOrder), asc(madrassaCategories.name)),
    db.select().from(madrassaSubcategories).orderBy(asc(madrassaSubcategories.displayOrder), asc(madrassaSubcategories.name)),
    db
      .select({
        subcategoryId: studentEnrollments.madrassaSubcategoryId,
        institutionId: studentEnrollments.institutionId,
        count: count(),
      })
      .from(studentEnrollments)
      .where(
        and(
          eq(studentEnrollments.status, "active"),
          academicYearId ? eq(studentEnrollments.academicYearId, academicYearId) : undefined,
        ),
      )
      .groupBy(studentEnrollments.madrassaSubcategoryId, studentEnrollments.institutionId),
  ]);

  const countMap = new Map<string, number>();
  for (const row of countsBySubcategory) {
    countMap.set(`${row.subcategoryId ?? ""}:${row.institutionId}`, Number(row.count));
  }

  return categories
    .filter((category) => {
      if (!section) return true;
      if (category.section === section) return true;
      return subcategories.some((subcategory) => subcategory.categoryId === category.id && subcategory.section === section);
    })
    .map((category) => {
      const children = subcategories
        .filter((subcategory) => subcategory.categoryId === category.id && (!section || subcategory.section === section))
        .map((subcategory) => {
          const qasmiaCount = countMap.get(`${subcategory.id}:jamia_qasmia_baneen`) ?? 0;
          const zainabCount = countMap.get(`${subcategory.id}:jamia_zainab_banat`) ?? 0;
          return {
            ...subcategory,
            qasmiaCount,
            zainabCount,
            enrollmentCount: qasmiaCount + zainabCount,
          };
        });

      return {
        ...category,
        subcategories: children,
        enrollmentCount: children.reduce((sum, child) => sum + child.enrollmentCount, 0),
        qasmiaCount: children.reduce((sum, child) => sum + child.qasmiaCount, 0),
        zainabCount: children.reduce((sum, child) => sum + child.zainabCount, 0),
      };
    });
}

export async function listMadrassaSubcategories(request: Request) {
  await requirePermission(request, "madrassa_categories", "view");
  await ensureAcademicSeeded();

  return db.select().from(madrassaSubcategories).orderBy(asc(madrassaSubcategories.displayOrder), asc(madrassaSubcategories.name));
}

export async function createMadrassaCategory(request: Request, input: z.infer<typeof madrassaCategoryInputSchema>) {
  await requirePermission(request, "madrassa_categories", "create");
  await ensureAcademicSeeded();

  const [created] = await db
    .insert(madrassaCategories)
    .values({
      id: uniqueId("category", input.name),
      name: input.name,
      nameUrdu: input.nameUrdu,
      description: input.description ?? input.name,
      descriptionUrdu: input.descriptionUrdu ?? input.nameUrdu,
      displayOrder: await nextMadrassaCategoryOrder(),
      section: input.section ?? "male",
      active: input.active ?? true,
    })
    .returning();

  return created;
}

export async function updateMadrassaCategory(
  request: Request,
  id: string,
  input: z.infer<typeof madrassaCategoryUpdateSchema>,
) {
  await requirePermission(request, "madrassa_categories", "edit");

  if (input.active === false) {
    await assertNoActiveMadrassaCategoryEnrollments(id);
  }

  const [updated] = await db
    .update(madrassaCategories)
    .set({
      ...input,
      section: input.section ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(madrassaCategories.id, id))
    .returning();

  if (!updated) throw new HttpError("Madrassa category not found", 404);
  return updated;
}

export async function createMadrassaSubcategory(
  request: Request,
  categoryId: string,
  input: z.infer<typeof madrassaSubcategoryInputSchema>,
) {
  await requirePermission(request, "madrassa_categories", "create");

  const [category] = await db.select({ id: madrassaCategories.id, section: madrassaCategories.section }).from(madrassaCategories).where(eq(madrassaCategories.id, categoryId)).limit(1);
  if (!category) throw new HttpError("Madrassa category not found", 404);

  const [created] = await db
    .insert(madrassaSubcategories)
    .values({
      id: uniqueId(categoryId, input.name),
      categoryId,
      name: input.name,
      nameUrdu: input.nameUrdu,
      rollPrefix: input.rollPrefix ?? input.name.slice(0, 3).toUpperCase(),
      darja: input.darja ?? null,
      govtEquivalent: input.govtEquivalent ?? null,
      durationYears: input.durationYears ?? null,
      fee: input.fee ?? null,
      displayOrder: await nextMadrassaSubcategoryOrder(categoryId),
      active: input.active ?? true,
      section: input.section ?? category.section,
    })
    .returning();

  return created;
}

export async function updateMadrassaSubcategory(
  request: Request,
  categoryId: string,
  subcategoryId: string,
  input: z.infer<typeof madrassaSubcategoryUpdateSchema>,
) {
  await requirePermission(request, "madrassa_categories", "edit");

  if (input.active === false) {
    await assertNoActiveMadrassaSubcategoryEnrollments(subcategoryId);
  }

  const updateData: Record<string, unknown> = {
    ...input,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(madrassaSubcategories)
    .set(updateData)
    .where(and(eq(madrassaSubcategories.id, subcategoryId), eq(madrassaSubcategories.categoryId, categoryId)))
    .returning();

  if (!updated) throw new HttpError("Madrassa subcategory not found", 404);
  return updated;
}

export async function deleteMadrassaSubcategory(
  request: Request,
  categoryId: string,
  subcategoryId: string,
) {
  await requirePermission(request, "madrassa_categories", "delete");

  await assertMadrassaSubcategoryDeletable(subcategoryId);

  const [deleted] = await db
    .delete(madrassaSubcategories)
    .where(and(eq(madrassaSubcategories.id, subcategoryId), eq(madrassaSubcategories.categoryId, categoryId)))
    .returning();

  if (!deleted) throw new HttpError("Madrassa subcategory not found", 404);
  return deleted;
}

async function assertMadrassaSubcategoryDeletable(subcategoryId: string) {
  const checks: Promise<{ label: string; count: number }>[] = [
    db.select({ count: count() }).from(studentEnrollments).where(eq(studentEnrollments.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "student enrollments", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(examSubjects).where(eq(examSubjects.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "exam subjects", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(examSessions).where(eq(examSessions.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "exam sessions", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(examMarks).where(eq(examMarks.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "exam marks", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(examResults).where(eq(examResults.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "exam results", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(admissionApplications).where(eq(admissionApplications.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "admission applications", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(studentAttendance).where(eq(studentAttendance.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "attendance records", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(teacherAssignments).where(eq(teacherAssignments.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "teacher assignments", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(teacherTimetablePeriods).where(eq(teacherTimetablePeriods.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "teacher timetable periods", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(feeCharges).where(eq(feeCharges.madrassaSubcategoryId, subcategoryId)).then(([row]) => ({ label: "fee charges", count: Number(row?.count ?? 0) })),
    db.select({ count: count() }).from(promotionRules).where(or(eq(promotionRules.sourceMadrassaSubcategoryId, subcategoryId), eq(promotionRules.targetMadrassaSubcategoryId, subcategoryId))).then(([row]) => ({ label: "promotion rules", count: Number(row?.count ?? 0) })),
  ];

  const results = await Promise.all(checks);
  const blockers = results.filter((item) => item.count > 0);

  if (blockers.length > 0) {
    const details = blockers.map((item) => `${item.count} ${item.label}`).join(", ");
    throw new HttpError(`Cannot delete class because it has related records: ${details}`, 409);
  }
}

async function requireAnyAcademicView(request: Request) {
  try {
    return await requirePermission(request, "school_classes", "view");
  } catch {
    return requirePermission(request, "madrassa_categories", "view");
  }
}

async function nextSchoolClassOrder() {
  const [row] = await db.select({ value: max(schoolClasses.displayOrder) }).from(schoolClasses);
  return (row?.value ?? 0) + 1;
}

async function nextMadrassaCategoryOrder() {
  const [row] = await db.select({ value: max(madrassaCategories.displayOrder) }).from(madrassaCategories);
  return (row?.value ?? 0) + 1;
}

async function nextMadrassaSubcategoryOrder(categoryId: string) {
  const [row] = await db
    .select({ value: max(madrassaSubcategories.displayOrder) })
    .from(madrassaSubcategories)
    .where(eq(madrassaSubcategories.categoryId, categoryId));
  return (row?.value ?? 0) + 1;
}

async function assertNoActiveSchoolClassEnrollments(classId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(studentEnrollments)
    .where(and(eq(studentEnrollments.schoolClassId, classId), eq(studentEnrollments.status, "active")));
  if (Number(row?.count ?? 0) > 0) throw new HttpError("Cannot deactivate a class with active enrollments", 409);
}

async function assertNoActiveSchoolSectionEnrollments(sectionId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(studentEnrollments)
    .where(and(eq(studentEnrollments.schoolSectionId, sectionId), eq(studentEnrollments.status, "active")));
  if (Number(row?.count ?? 0) > 0) throw new HttpError("Cannot deactivate a section with active enrollments", 409);
}

async function assertNoActiveMadrassaCategoryEnrollments(categoryId: string) {
  const subcategoryRows = await db
    .select({ id: madrassaSubcategories.id })
    .from(madrassaSubcategories)
    .where(eq(madrassaSubcategories.categoryId, categoryId));
  for (const row of subcategoryRows) await assertNoActiveMadrassaSubcategoryEnrollments(row.id);
}

async function assertNoActiveMadrassaSubcategoryEnrollments(subcategoryId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(studentEnrollments)
    .where(and(eq(studentEnrollments.madrassaSubcategoryId, subcategoryId), eq(studentEnrollments.status, "active")));
  if (Number(row?.count ?? 0) > 0) throw new HttpError("Cannot deactivate a madrassa category with active enrollments", 409);
}

function uniqueId(prefix: string, value: string) {
  return `${prefix}-${slug(value)}-${randomUUID().slice(0, 8)}`;
}

function slug(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized || "record";
}

function hasAnyKey(value: Record<string, unknown>) {
  return Object.values(value).some((item) => item !== undefined);
}
