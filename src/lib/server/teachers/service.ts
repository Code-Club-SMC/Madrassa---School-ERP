import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, exists, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user as authUser } from "@/db/schema/auth";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
} from "@/db/schema/academic";
import {
  examSessions,
  examSessionSubjects,
  examSubjects,
} from "@/db/schema/exams";
import {
  teacherAssignments,
  teacherProfiles,
  teacherTimetablePeriods,
} from "@/db/schema/teachers";
import { madrassaTimetablePeriods, madrassaTimetableSlots, schoolTimetablePeriods, schoolTimetableSlots } from "@/db/schema/timetable";
import { getActiveAcademicYear } from "@/lib/server/academic-years/service";
import { createUser, deleteUser } from "@/lib/server/auth/users";
import { generateSecurePassword } from "@/lib/generate-password";
import { ROLE_DEFAULTS } from "@/lib/permissions/role-defaults";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import {
  hasTimetableConflict,
  normalizeSalaryPaisa,
  validateTeacherPlacement,
  validateTimeRange,
} from "@/lib/server/teachers/domain";
import { assertTeacherTimetableConflictWithClassTimetables, normalizeTimeToHHMM } from "@/lib/server/academic/timetable-conflict";

const systemScopeSchema = z.enum(["school", "madrassa", "all", "qasmia-both", "qasmia-madrassa", "qasmia-school", "zainab-both", "zainab-madrassa", "zainab-school"]);
const paymentMethodSchema = z.enum(["cash", "bank"]);
const systemSchema = z.enum(["school", "madrassa"]);
const dateStringSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");
const timeStringSchema = z.string().trim().regex(/^\d{2}:\d{2}$/, "Time must use HH:mm format");

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);
const nullableText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable().optional(),
);
const nullableId = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().min(1).nullable().optional(),
);
const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  dateStringSchema.optional(),
);
const nullableDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  dateStringSchema.nullable().optional(),
);

export const createTeacherSchema = z.object({
  name: z.string().trim().min(1),
  nameUrdu: optionalText,
  email: z.email().transform((value) => value.toLowerCase()),
  phone: optionalText,
  cnic: optionalText,
  gender: z.enum(["male", "female"]).optional(),
  systemScope: systemScopeSchema.default("school"),
  designation: z.string().trim().min(1),
  qualification: optionalText,
  qualificationUrdu: optionalText,
  address: optionalText,
  joinedAt: dateStringSchema,
  baseMonthlySalaryPaisa: z.coerce.number().int().nonnegative().optional(),
  bankName: optionalText,
  bankAccount: optionalText,
  paymentMethod: paymentMethodSchema.default("cash"),
  salaryEffectiveDate: optionalDate,
  salaryNotes: optionalText,
  notes: optionalText,
  password: z.string().min(8).optional(),
});

export const teacherListQuerySchema = z.object({
  q: optionalText,
  systemScope: z.enum(["all", "school", "madrassa", "qasmia-both", "qasmia-madrassa", "qasmia-school", "zainab-both", "zainab-madrassa", "zainab-school"]).default("all"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  all: z.preprocess((value) => value === "true", z.boolean().default(false)),
});

export const updateTeacherProfileSchema = createTeacherSchema
  .omit({ email: true, password: true })
  .partial()
  .refine(hasAnyKey, { message: "At least one field is required" });

export const teacherActiveStateSchema = z.object({
  active: z.boolean(),
});

const teacherAssignmentBaseSchema = z.object({
  system: systemSchema,
  institutionId: z.string().trim().min(1),
  programId: z.string().trim().min(1),
  schoolClassId: nullableId,
  madrassaCategoryId: nullableId,
  madrassaSubcategoryId: nullableId,
  subjectId: nullableId,
  academicYear: z.string().trim().min(1),
  effectiveFrom: nullableDate,
  effectiveTo: nullableDate,
});

export const teacherAssignmentSchema = teacherAssignmentBaseSchema.superRefine(validateAssignmentDates);

export const updateTeacherAssignmentSchema = teacherAssignmentBaseSchema
  .partial()
  .superRefine(validateAssignmentDates)
  .refine(hasAnyKey, { message: "At least one field is required" });

const teacherTimetablePeriodBaseSchema = teacherAssignmentBaseSchema.extend({
  assignmentId: nullableId,
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  room: nullableText,
});

export const teacherTimetablePeriodSchema = teacherTimetablePeriodBaseSchema.superRefine(validateAssignmentDates);

export const updateTeacherTimetablePeriodSchema = teacherTimetablePeriodBaseSchema
  .partial()
  .superRefine(validateAssignmentDates)
  .refine(hasAnyKey, { message: "At least one field is required" });

type TeacherAssignmentInput = z.infer<typeof teacherAssignmentSchema>;
type TeacherAssignmentUpdate = z.infer<typeof updateTeacherAssignmentSchema>;
type TeacherTimetablePeriodInput = z.infer<typeof teacherTimetablePeriodSchema>;
type TeacherTimetablePeriodUpdate = z.infer<typeof updateTeacherTimetablePeriodSchema>;
type TeacherProfileUpdate = z.infer<typeof updateTeacherProfileSchema>;

export async function createTeacher(request: Request, input: z.infer<typeof createTeacherSchema>) {
  const actor = await requirePermission(request, "teachers", "create");
  const existing = await db.select({ id: authUser.id }).from(authUser).where(eq(authUser.email, input.email)).limit(1);
  if (existing[0]) throw new HttpError("A user already exists with this email", 409);

  const profileId = randomUUID();
  const password = input.password ?? generateSecurePassword(12);
  const createdUserId = await createUser({
    name: input.name,
    email: input.email,
    username: input.email,
    password,
    role: "teacher",
    data: {
      nameUrdu: input.nameUrdu,
      phone: input.phone,
      cnic: input.cnic,
      status: "active",
      systemAccess: input.systemScope === "all" ? "both" : ["school", "madrassa"].includes(input.systemScope) ? input.systemScope : "both",
      mustChangePassword: true,
      linkedTeacherId: profileId,
      permissions: ROLE_DEFAULTS.teacher,
      department: "Teaching",
      designation: input.designation,
    },
  });

  if (!createdUserId.id) throw new HttpError("User creation did not return an id", 500);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(teacherProfiles).values({
        id: profileId,
        userId: createdUserId.id,
        systemScope: input.systemScope,
        gender: input.gender,
        designation: input.designation,
        qualification: input.qualification,
        qualificationUrdu: input.qualificationUrdu,
        address: input.address,
        joinedAt: input.joinedAt,
        employmentStatus: "active",
        baseMonthlySalaryPaisa: normalizeSalaryPaisa(input.baseMonthlySalaryPaisa),
        bankName: input.bankName,
        bankAccount: input.bankAccount,
        paymentMethod: input.paymentMethod,
        salaryEffectiveDate: input.salaryEffectiveDate,
        salaryNotes: input.salaryNotes,
        notes: input.notes,
      });

      await tx
        .update(authUser)
        .set({ linkedTeacherId: profileId, updatedAt: new Date() })
        .where(eq(authUser.id, createdUserId.id));
    });
  } catch (error) {
    await cleanupAuthUser(createdUserId.id);
    throw error;
  }

  return {
    teacher: await loadTeacherDetail(profileId),
    credentials: {
      nameUrdu: input.nameUrdu ?? input.name,
      nameEnglish: input.name,
      email: input.email,
      role: "teacher" as const,
      password,
    },
    actorUserId: actor.id,
  };
}

const SCOPE_INSTITUTIONS: Record<string, { institutionIds: string[]; system?: "school" | "madrassa" }> = {
  "qasmia-both": { institutionIds: ["al_qasim_academy", "jamia_qasmia_baneen"] },
  "qasmia-madrassa": { institutionIds: ["jamia_qasmia_baneen"], system: "madrassa" },
  "qasmia-school": { institutionIds: ["al_qasim_academy"], system: "school" },
  "zainab-both": { institutionIds: ["jamia_zainab_banat"] },
  "zainab-madrassa": { institutionIds: ["jamia_zainab_banat"], system: "madrassa" },
  "zainab-school": { institutionIds: ["jamia_zainab_banat"], system: "school" },
};

function systemScopeClause(systemScope: z.infer<typeof teacherListQuerySchema>["systemScope"]): SQL | undefined {
  if (systemScope === "all") return undefined;

  const scope = SCOPE_INSTITUTIONS[systemScope];
  if (!scope) return eq(teacherProfiles.systemScope, systemScope);

  const assignmentMatch = and(
    eq(teacherAssignments.teacherProfileId, teacherProfiles.id),
    inArray(teacherAssignments.institutionId, scope.institutionIds),
    scope.system ? eq(teacherAssignments.system, scope.system) : undefined,
  );

  return exists(db.select({ one: sql`1` }).from(teacherAssignments).where(assignmentMatch));
}

export async function listTeachers(request: Request, query: z.infer<typeof teacherListQuerySchema>) {
  const actor = await requirePermission(request, "teachers", "view");
  console.log("[teachers] listTeachers called", { actorRole: actor.role, actorId: actor.id, query });
  const clauses = [
    eq(authUser.role, "teacher"),
    actor.role === "teacher" && !query.all ? eq(teacherProfiles.userId, actor.id) : undefined,
    query.status === "all" ? undefined : eq(teacherProfiles.employmentStatus, query.status),
    systemScopeClause(query.systemScope),
    query.q
      ? or(
          ilike(authUser.name, `%${query.q}%`),
          ilike(authUser.email, `%${query.q}%`),
          ilike(teacherProfiles.designation, `%${query.q}%`),
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: teacherProfiles.id,
      userId: teacherProfiles.userId,
      name: authUser.name,
      email: authUser.email,
      nameUrdu: authUser.nameUrdu,
      phone: authUser.phone,
      cnic: authUser.cnic,
      status: authUser.status,
      banned: authUser.banned,
      systemScope: teacherProfiles.systemScope,
      designation: teacherProfiles.designation,
      qualification: teacherProfiles.qualification,
      joinedAt: teacherProfiles.joinedAt,
      employmentStatus: teacherProfiles.employmentStatus,
      baseMonthlySalaryPaisa: teacherProfiles.baseMonthlySalaryPaisa,
    })
    .from(teacherProfiles)
    .innerJoin(authUser, eq(authUser.id, teacherProfiles.userId))
    .where(and(...clauses))
    .orderBy(asc(authUser.name));

  console.log("[teachers] listTeachers result", rows.length, rows.map((r) => ({ id: r.id, name: r.name, email: r.email })));
  return rows;
}

export async function listTeachersWithTimetables(request: Request) {
  await requirePermission(request, "teachers", "view");

  const teachers = await db
    .select({
      id: teacherProfiles.id,
      userId: teacherProfiles.userId,
      name: authUser.name,
      email: authUser.email,
      nameUrdu: authUser.nameUrdu,
      phone: authUser.phone,
      cnic: authUser.cnic,
      status: authUser.status,
      banned: authUser.banned,
      systemScope: teacherProfiles.systemScope,
      designation: teacherProfiles.designation,
      qualification: teacherProfiles.qualification,
      joinedAt: teacherProfiles.joinedAt,
      employmentStatus: teacherProfiles.employmentStatus,
      baseMonthlySalaryPaisa: teacherProfiles.baseMonthlySalaryPaisa,
    })
    .from(teacherProfiles)
    .innerJoin(authUser, eq(authUser.id, teacherProfiles.userId))
    .where(eq(teacherProfiles.employmentStatus, "active"))
    .orderBy(asc(authUser.name));

  const teacherIds = teachers.map((t) => t.id);
  if (teacherIds.length === 0) return [];

  const [activeSchoolYear, activeMadrassaYear] = await Promise.all([
    getActiveAcademicYear("school").catch(() => ({ name: "2026-2027" })),
    getActiveAcademicYear("madrassa").catch(() => ({ name: "2026-2027" })),
  ]);

  const [explicitAssignments, directSubjects, explicitTimetable, madrassaSlots, schoolSlots] = await Promise.all([
    db
      .select({
        id: teacherAssignments.id,
        teacherProfileId: teacherAssignments.teacherProfileId,
        system: teacherAssignments.system,
        institutionId: teacherAssignments.institutionId,
        programId: teacherAssignments.programId,
        schoolClassId: teacherAssignments.schoolClassId,
        madrassaCategoryId: teacherAssignments.madrassaCategoryId,
        madrassaSubcategoryId: teacherAssignments.madrassaSubcategoryId,
        subjectId: teacherAssignments.subjectId,
        academicYear: teacherAssignments.academicYear,
        effectiveFrom: teacherAssignments.effectiveFrom,
        effectiveTo: teacherAssignments.effectiveTo,
        active: teacherAssignments.active,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectCode: examSubjects.code,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      })
      .from(teacherAssignments)
      .leftJoin(examSubjects, eq(examSubjects.id, teacherAssignments.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, teacherAssignments.schoolClassId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherAssignments.madrassaCategoryId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherAssignments.madrassaSubcategoryId))
      .where(and(inArray(teacherAssignments.teacherProfileId, teacherIds), eq(teacherAssignments.active, true)))
      .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear)),

    db
      .select({
        id: examSubjects.id,
        teacherProfileId: examSubjects.teacherId,
        system: examSubjects.system,
        schoolClassId: examSubjects.schoolClassId,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        schoolInstitutionId: schoolClasses.institutionId,
        madrassaSubcategoryId: examSubjects.madrassaSubcategoryId,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
        madrassaCategoryId: madrassaCategories.id,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSection: madrassaSubcategories.section,
        subjectId: examSubjects.id,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectCode: examSubjects.code,
        active: examSubjects.active,
      })
      .from(examSubjects)
      .leftJoin(schoolClasses, eq(schoolClasses.id, examSubjects.schoolClassId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examSubjects.madrassaSubcategoryId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
      .where(and(inArray(examSubjects.teacherId, teacherIds), eq(examSubjects.active, true)))
      .orderBy(asc(examSubjects.system)),

    db
      .select({
        id: teacherTimetablePeriods.id,
        teacherProfileId: teacherTimetablePeriods.teacherProfileId,
        assignmentId: teacherTimetablePeriods.assignmentId,
        system: teacherTimetablePeriods.system,
        institutionId: teacherTimetablePeriods.institutionId,
        programId: teacherTimetablePeriods.programId,
        schoolClassId: teacherTimetablePeriods.schoolClassId,
        madrassaCategoryId: teacherTimetablePeriods.madrassaCategoryId,
        madrassaSubcategoryId: teacherTimetablePeriods.madrassaSubcategoryId,
        subjectId: teacherTimetablePeriods.subjectId,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
        weekday: teacherTimetablePeriods.weekday,
        startTime: teacherTimetablePeriods.startTime,
        endTime: teacherTimetablePeriods.endTime,
        room: teacherTimetablePeriods.room,
        academicYear: teacherTimetablePeriods.academicYear,
        active: teacherTimetablePeriods.active,
      })
      .from(teacherTimetablePeriods)
      .leftJoin(examSubjects, eq(examSubjects.id, teacherTimetablePeriods.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, teacherTimetablePeriods.schoolClassId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherTimetablePeriods.madrassaCategoryId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherTimetablePeriods.madrassaSubcategoryId))
      .where(and(inArray(teacherTimetablePeriods.teacherProfileId, teacherIds), eq(teacherTimetablePeriods.active, true)))
      .orderBy(asc(teacherTimetablePeriods.weekday), asc(teacherTimetablePeriods.startTime)),

    db
      .select({
        id: madrassaTimetablePeriods.id,
        madrassaSubcategoryId: madrassaTimetablePeriods.madrassaSubcategoryId,
        timeStart: madrassaTimetablePeriods.timeStart,
        timeEnd: madrassaTimetablePeriods.timeEnd,
        label: madrassaTimetablePeriods.label,
        labelUrdu: madrassaTimetablePeriods.labelUrdu,
        isBreak: madrassaTimetablePeriods.isBreak,
        dayOfWeek: madrassaTimetableSlots.dayOfWeek,
        subjectId: madrassaTimetableSlots.subjectId,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectTeacherId: examSubjects.teacherId,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
        madrassaCategoryId: madrassaCategories.id,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      })
      .from(madrassaTimetablePeriods)
      .innerJoin(madrassaTimetableSlots, eq(madrassaTimetableSlots.periodId, madrassaTimetablePeriods.id))
      .leftJoin(examSubjects, eq(examSubjects.id, madrassaTimetableSlots.subjectId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, madrassaTimetablePeriods.madrassaSubcategoryId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
      .where(eq(madrassaTimetablePeriods.isBreak, false))
      .orderBy(asc(madrassaTimetableSlots.dayOfWeek), asc(madrassaTimetablePeriods.timeStart)),

    db
      .select({
        id: schoolTimetablePeriods.id,
        schoolClassId: schoolTimetablePeriods.schoolClassId,
        timeStart: schoolTimetablePeriods.timeStart,
        timeEnd: schoolTimetablePeriods.timeEnd,
        label: schoolTimetablePeriods.label,
        labelUrdu: schoolTimetablePeriods.labelUrdu,
        isBreak: schoolTimetablePeriods.isBreak,
        dayOfWeek: schoolTimetableSlots.dayOfWeek,
        subjectId: schoolTimetableSlots.subjectId,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectTeacherId: examSubjects.teacherId,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        institutionId: schoolClasses.institutionId,
      })
      .from(schoolTimetablePeriods)
      .innerJoin(schoolTimetableSlots, eq(schoolTimetableSlots.periodId, schoolTimetablePeriods.id))
      .leftJoin(examSubjects, eq(examSubjects.id, schoolTimetableSlots.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, schoolTimetablePeriods.schoolClassId))
      .where(eq(schoolTimetablePeriods.isBreak, false))
      .orderBy(asc(schoolTimetableSlots.dayOfWeek), asc(schoolTimetablePeriods.timeStart)),
  ]);

  const assignmentsByTeacher = new Map<string, any[]>();
  const timetableByTeacher = new Map<string, any[]>();
  const adminDayToTeacherWeekday = (adminDay: number) => (adminDay === 0 ? 6 : adminDay - 1);

  for (const teacher of teachers) {
    const teacherId = teacher.id;
    const explicit = explicitAssignments.filter((a) => a.teacherProfileId === teacherId);
    const assignedSubIds = new Set(explicit.map((a) => a.subjectId).filter(Boolean));

    const direct = directSubjects
      .filter((s) => s.teacherProfileId === teacherId && !assignedSubIds.has(s.subjectId))
      .map((s) => {
        const isMadrassa = s.system === "madrassa";
        const isFemaleMadrassa = s.madrassaSection === "female";
        const instId = isMadrassa
          ? (isFemaleMadrassa ? "jamia_zainab_banat" : "jamia_qasmia_baneen")
          : (s.schoolInstitutionId ?? "al_qasim_academy");
        const progId = isMadrassa
          ? (isFemaleMadrassa ? "zainab_nazira" : "qasmia_nazira")
          : "al_qasim_school";
        return {
          id: `sub_${s.id}`,
          teacherProfileId: teacherId,
          system: s.system,
          institutionId: instId,
          programId: progId,
          schoolClassId: s.schoolClassId ?? null,
          madrassaCategoryId: s.madrassaCategoryId ?? null,
          madrassaSubcategoryId: s.madrassaSubcategoryId ?? null,
          subjectId: s.subjectId,
          academicYear: isMadrassa ? activeMadrassaYear.name : activeSchoolYear.name,
          effectiveFrom: null,
          effectiveTo: null,
          active: true,
          subjectName: s.subjectName,
          subjectNameUrdu: s.subjectNameUrdu,
          subjectCode: s.subjectCode,
          schoolClassName: s.schoolClassName,
          schoolClassNameUrdu: s.schoolClassNameUrdu,
          madrassaCategoryName: s.madrassaCategoryName,
          madrassaCategoryNameUrdu: s.madrassaCategoryNameUrdu,
          madrassaSubcategoryName: s.madrassaSubcategoryName,
          madrassaSubcategoryNameUrdu: s.madrassaSubcategoryNameUrdu,
        };
      });

    const allTeacherAssignments = [...explicit, ...direct];
    assignmentsByTeacher.set(teacherId, allTeacherAssignments);

    const teacherSubIds = new Set(allTeacherAssignments.map((a) => a.subjectId).filter(Boolean));

    const explicitPeriods = explicitTimetable.filter((p) => p.teacherProfileId === teacherId);

    const madrassaPeriods = madrassaSlots
      .filter((s) => s.subjectTeacherId === teacherId || (s.subjectId && teacherSubIds.has(s.subjectId)))
      .map((row) => ({
        id: `${row.id}_${row.dayOfWeek}`,
        teacherProfileId: teacherId,
        assignmentId: null,
        system: "madrassa" as const,
        institutionId: "",
        programId: "",
        schoolClassId: null,
        madrassaCategoryId: row.madrassaCategoryId ?? null,
        madrassaSubcategoryId: row.madrassaSubcategoryId,
        subjectId: row.subjectId,
        subjectName: row.subjectName ?? row.label ?? null,
        subjectNameUrdu: row.subjectNameUrdu ?? row.labelUrdu ?? null,
        schoolClassName: null,
        schoolClassNameUrdu: null,
        madrassaCategoryName: row.madrassaCategoryName ?? null,
        madrassaCategoryNameUrdu: row.madrassaCategoryNameUrdu ?? null,
        madrassaSubcategoryName: row.madrassaSubcategoryName ?? null,
        madrassaSubcategoryNameUrdu: row.madrassaSubcategoryNameUrdu ?? null,
        academicYear: activeMadrassaYear.name,
        weekday: adminDayToTeacherWeekday(row.dayOfWeek),
        startTime: normalizeTimeToHHMM(row.timeStart),
        endTime: normalizeTimeToHHMM(row.timeEnd),
        room: null,
        active: true,
      }));

    const schoolPeriods = schoolSlots
      .filter((s) => s.subjectTeacherId === teacherId || (s.subjectId && teacherSubIds.has(s.subjectId)))
      .map((row) => ({
        id: `${row.id}_${row.dayOfWeek}`,
        teacherProfileId: teacherId,
        assignmentId: null,
        system: "school" as const,
        institutionId: row.institutionId ?? "",
        programId: "",
        schoolClassId: row.schoolClassId,
        madrassaCategoryId: null,
        madrassaSubcategoryId: null,
        subjectId: row.subjectId,
        subjectName: row.subjectName ?? row.label ?? null,
        subjectNameUrdu: row.subjectNameUrdu ?? row.labelUrdu ?? null,
        schoolClassName: row.schoolClassName ?? null,
        schoolClassNameUrdu: row.schoolClassNameUrdu ?? null,
        madrassaCategoryName: null,
        madrassaCategoryNameUrdu: null,
        madrassaSubcategoryName: null,
        madrassaSubcategoryNameUrdu: null,
        academicYear: activeSchoolYear.name,
        weekday: adminDayToTeacherWeekday(row.dayOfWeek),
        startTime: normalizeTimeToHHMM(row.timeStart),
        endTime: normalizeTimeToHHMM(row.timeEnd),
        room: null,
        active: true,
      }));

    const seenTimeslots = new Set<string>();
    const mergedTimetable: any[] = [];
    for (const p of [...explicitPeriods, ...madrassaPeriods, ...schoolPeriods]) {
      const key = `${p.weekday}_${p.startTime}_${p.endTime}_${p.subjectId ?? p.id}`;
      if (!seenTimeslots.has(key)) {
        seenTimeslots.add(key);
        mergedTimetable.push(p);
      }
    }

    mergedTimetable.sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
    timetableByTeacher.set(teacherId, mergedTimetable);
  }

  return teachers.map((teacher) => ({
    ...teacher,
    assignments: assignmentsByTeacher.get(teacher.id) ?? [],
    timetable: timetableByTeacher.get(teacher.id) ?? [],
  }));
}

export async function getTeacher(request: Request, id: string) {
  const actor = await requirePermission(request, "teachers", "view");
  const detail = await loadTeacherDetail(id);
  assertTeacherMayReadDetail(actor, detail.profile.userId, detail.profile.id);
  return detail;
}

export async function updateTeacherProfile(request: Request, id: string, input: TeacherProfileUpdate) {
  await requirePermission(request, "teachers", "edit");
  const profile = await requireTeacherProfile(id);
  const { name, nameUrdu, phone, cnic, ...profileInput } = input;
  const hasProfilePatch = Object.values(profileInput).some((entry) => entry !== undefined);
  const hasUserPatch = [name, nameUrdu, phone, cnic, profileInput.systemScope, profileInput.designation].some(
    (entry) => entry !== undefined,
  );

  await db.transaction(async (tx) => {
    if (hasProfilePatch) {
      await tx
        .update(teacherProfiles)
        .set({
          systemScope: profileInput.systemScope,
          gender: profileInput.gender,
          designation: profileInput.designation,
          qualification: profileInput.qualification,
          qualificationUrdu: profileInput.qualificationUrdu,
          address: profileInput.address,
          joinedAt: profileInput.joinedAt,
          baseMonthlySalaryPaisa:
            profileInput.baseMonthlySalaryPaisa === undefined
              ? undefined
              : normalizeSalaryPaisa(profileInput.baseMonthlySalaryPaisa),
          bankName: profileInput.bankName,
          bankAccount: profileInput.bankAccount,
          paymentMethod: profileInput.paymentMethod,
          salaryEffectiveDate: profileInput.salaryEffectiveDate,
          salaryNotes: profileInput.salaryNotes,
          notes: profileInput.notes,
          updatedAt: new Date(),
        })
        .where(eq(teacherProfiles.id, profile.id));
    }

    if (hasUserPatch) {
      await tx
        .update(authUser)
        .set({
          name,
          nameUrdu,
          phone,
          cnic,
          systemAccess:
            profileInput.systemScope === undefined
              ? undefined
              : profileInput.systemScope === "all"
                ? "both"
                : ["school", "madrassa"].includes(profileInput.systemScope)
                  ? profileInput.systemScope
                  : "both",
          department: profileInput.designation === undefined ? undefined : "Teaching",
          designation: profileInput.designation,
          updatedAt: new Date(),
        })
        .where(eq(authUser.id, profile.userId));
    }
  });

  return loadTeacherDetail(id);
}

export async function setTeacherActiveState(
  request: Request,
  id: string,
  input: z.infer<typeof teacherActiveStateSchema>,
) {
  await requirePermission(request, "teachers", "edit");
  const profile = await requireTeacherProfile(id);
  const nextStatus = input.active ? "active" : "inactive";

  await db.transaction(async (tx) => {
    await tx
      .update(teacherProfiles)
      .set({ employmentStatus: nextStatus, updatedAt: new Date() })
      .where(eq(teacherProfiles.id, profile.id));
    await tx
      .update(authUser)
      .set({
        status: nextStatus,
        banned: !input.active,
        banReason: input.active ? null : "Teacher disabled",
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, profile.userId));

    if (!input.active) {
      await tx
        .update(teacherAssignments)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(teacherAssignments.teacherProfileId, profile.id));
      await tx
        .update(teacherTimetablePeriods)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(teacherTimetablePeriods.teacherProfileId, profile.id));
    }
  });

  return loadTeacherDetail(id);
}

export async function createTeacherAssignment(request: Request, teacherId: string, input: TeacherAssignmentInput) {
  await requirePermission(request, "teachers", "edit");
  await requireActiveTeacherProfile(teacherId);
  validateTeacherPlacement({ ...input, schoolSectionId: (input as any).schoolSectionId ?? "default" });

  await db.insert(teacherAssignments).values({
    id: randomUUID(),
    teacherProfileId: teacherId,
    system: input.system,
    institutionId: input.institutionId,
    programId: input.programId,
    schoolClassId: input.schoolClassId ?? null,
    madrassaCategoryId: input.madrassaCategoryId ?? null,
    madrassaSubcategoryId: input.madrassaSubcategoryId ?? null,
    subjectId: input.subjectId ?? null,
    academicYear: input.academicYear,
    effectiveFrom: input.effectiveFrom ?? null,
    effectiveTo: input.effectiveTo ?? null,
    active: true,
  });

  return loadTeacherDetail(teacherId);
}

export async function updateTeacherAssignment(
  request: Request,
  teacherId: string,
  assignmentId: string,
  input: TeacherAssignmentUpdate,
) {
  await requirePermission(request, "teachers", "edit");
  await requireActiveTeacherProfile(teacherId);
  const assignment = await requireTeacherAssignment(teacherId, assignmentId);
  const next = {
    system: input.system ?? assignment.system,
    institutionId: input.institutionId ?? assignment.institutionId,
    programId: input.programId ?? assignment.programId,
    schoolClassId: input.schoolClassId === undefined ? assignment.schoolClassId : input.schoolClassId,
    madrassaCategoryId:
      input.madrassaCategoryId === undefined ? assignment.madrassaCategoryId : input.madrassaCategoryId,
    madrassaSubcategoryId:
      input.madrassaSubcategoryId === undefined ? assignment.madrassaSubcategoryId : input.madrassaSubcategoryId,
    subjectId: input.subjectId === undefined ? assignment.subjectId : input.subjectId,
    academicYear: input.academicYear ?? assignment.academicYear,
    effectiveFrom: input.effectiveFrom === undefined ? assignment.effectiveFrom : input.effectiveFrom,
    effectiveTo: input.effectiveTo === undefined ? assignment.effectiveTo : input.effectiveTo,
  };

  validateTeacherPlacement({ ...next, schoolSectionId: (next as any).schoolSectionId ?? "default" });
  validateAssignmentDatePair(next.effectiveFrom ?? undefined, next.effectiveTo ?? undefined);

  await db
    .update(teacherAssignments)
    .set({ ...next, updatedAt: new Date() })
    .where(and(eq(teacherAssignments.id, assignmentId), eq(teacherAssignments.teacherProfileId, teacherId)));

  return loadTeacherDetail(teacherId);
}

export async function setTeacherAssignmentActive(
  request: Request,
  teacherId: string,
  assignmentId: string,
  input: z.infer<typeof teacherActiveStateSchema>,
) {
  await requirePermission(request, "teachers", "edit");
  await requireActiveTeacherProfile(teacherId);
  await requireTeacherAssignment(teacherId, assignmentId);

  await db.transaction(async (tx) => {
    await tx
      .update(teacherAssignments)
      .set({ active: input.active, updatedAt: new Date() })
      .where(and(eq(teacherAssignments.id, assignmentId), eq(teacherAssignments.teacherProfileId, teacherId)));

    if (!input.active) {
      await tx
        .update(teacherTimetablePeriods)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(teacherTimetablePeriods.assignmentId, assignmentId));
    }
  });

  return loadTeacherDetail(teacherId);
}

export async function createTeacherTimetablePeriod(
  request: Request,
  teacherId: string,
  input: TeacherTimetablePeriodInput,
) {
  await requirePermission(request, "teachers", "edit");
  await requireActiveTeacherProfile(teacherId);
  validateTeacherPlacement({ ...input, schoolSectionId: (input as any).schoolSectionId ?? "default" });
  validateTimeRange(input.startTime, input.endTime);

  let validatedAssignmentId: string | null = null;
  if (input.assignmentId && !input.assignmentId.startsWith("sub_")) {
    await requireTeacherAssignment(teacherId, input.assignmentId, true);
    validatedAssignmentId = input.assignmentId;
  }

  await assertNoTimetableConflict(teacherId, {
    weekday: input.weekday,
    startTime: input.startTime,
    endTime: input.endTime,
    ignorePeriodId: null,
  });

  await db.insert(teacherTimetablePeriods).values({
    id: randomUUID(),
    teacherProfileId: teacherId,
    assignmentId: validatedAssignmentId,
    system: input.system,
    institutionId: input.institutionId,
    programId: input.programId,
    schoolClassId: input.schoolClassId ?? null,
    madrassaCategoryId: input.madrassaCategoryId ?? null,
    madrassaSubcategoryId: input.madrassaSubcategoryId ?? null,
    subjectId: input.subjectId ?? null,
    academicYear: input.academicYear,
    weekday: input.weekday,
    startTime: input.startTime,
    endTime: input.endTime,
    room: input.room ?? null,
    active: true,
  });

  return loadTeacherDetail(teacherId);
}

export async function updateTeacherTimetablePeriod(
  request: Request,
  teacherId: string,
  periodId: string,
  input: TeacherTimetablePeriodUpdate,
) {
  await requirePermission(request, "teachers", "edit");
  await requireActiveTeacherProfile(teacherId);
  const period = await requireTeacherTimetablePeriod(teacherId, periodId);

  const next = {
    assignmentId: input.assignmentId === undefined ? period.assignmentId : input.assignmentId,
    system: input.system ?? period.system,
    institutionId: input.institutionId ?? period.institutionId,
    programId: input.programId ?? period.programId,
    schoolClassId: input.schoolClassId === undefined ? period.schoolClassId : input.schoolClassId,
    madrassaCategoryId: input.madrassaCategoryId === undefined ? period.madrassaCategoryId : input.madrassaCategoryId,
    madrassaSubcategoryId:
      input.madrassaSubcategoryId === undefined ? period.madrassaSubcategoryId : input.madrassaSubcategoryId,
    subjectId: input.subjectId === undefined ? period.subjectId : input.subjectId,
    academicYear: input.academicYear ?? period.academicYear,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    weekday: input.weekday ?? period.weekday,
    startTime: input.startTime ?? period.startTime,
    endTime: input.endTime ?? period.endTime,
    room: input.room === undefined ? period.room : input.room,
  };

  validateTeacherPlacement({ ...next, schoolSectionId: (next as any).schoolSectionId ?? "default" });
  validateAssignmentDatePair(next.effectiveFrom ?? undefined, next.effectiveTo ?? undefined);
  validateTimeRange(next.startTime, next.endTime);

  let validatedAssignmentId: string | null = null;
  if (next.assignmentId && !next.assignmentId.startsWith("sub_")) {
    await requireTeacherAssignment(teacherId, next.assignmentId, true);
    validatedAssignmentId = next.assignmentId;
  }

  await assertNoTimetableConflict(teacherId, {
    weekday: next.weekday,
    startTime: next.startTime,
    endTime: next.endTime,
    ignorePeriodId: periodId,
  });

  await db
    .update(teacherTimetablePeriods)
    .set({
      assignmentId: validatedAssignmentId,
      system: next.system,
      institutionId: next.institutionId,
      programId: next.programId,
      schoolClassId: next.schoolClassId ?? null,
      madrassaCategoryId: next.madrassaCategoryId ?? null,
      madrassaSubcategoryId: next.madrassaSubcategoryId ?? null,
      subjectId: next.subjectId ?? null,
      academicYear: next.academicYear,
      weekday: next.weekday,
      startTime: next.startTime,
      endTime: next.endTime,
      room: next.room ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(teacherTimetablePeriods.id, periodId), eq(teacherTimetablePeriods.teacherProfileId, teacherId)));

  return loadTeacherDetail(teacherId);
}

export async function setTeacherTimetablePeriodActive(
  request: Request,
  teacherId: string,
  periodId: string,
  input: z.infer<typeof teacherActiveStateSchema>,
) {
  await requirePermission(request, "teachers", "edit");
  await requireActiveTeacherProfile(teacherId);
  const period = await requireTeacherTimetablePeriod(teacherId, periodId);

  if (input.active) {
    validateTimeRange(period.startTime, period.endTime);
    await assertNoTimetableConflict(teacherId, {
      weekday: period.weekday,
      startTime: period.startTime,
      endTime: period.endTime,
      ignorePeriodId: period.id,
    });
  }

  await db
    .update(teacherTimetablePeriods)
    .set({ active: input.active, updatedAt: new Date() })
    .where(and(eq(teacherTimetablePeriods.id, periodId), eq(teacherTimetablePeriods.teacherProfileId, teacherId)));

  return loadTeacherDetail(teacherId);
}

export async function resolveTeacherProfile(actor: { id: string; email?: string | null }) {
  let [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, actor.id)).limit(1);
  if (!profile) {
    const [userRecord] = await db
      .select({ linkedTeacherId: authUser.linkedTeacherId })
      .from(authUser)
      .where(eq(authUser.id, actor.id))
      .limit(1);
    if (userRecord?.linkedTeacherId) {
      [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.id, userRecord.linkedTeacherId)).limit(1);
    }
  }
  if (!profile && actor.email) {
    const [userRecord] = await db
      .select({ id: authUser.id, linkedTeacherId: authUser.linkedTeacherId })
      .from(authUser)
      .where(eq(authUser.email, actor.email))
      .limit(1);
    if (userRecord) {
      if (userRecord.linkedTeacherId) {
        [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.id, userRecord.linkedTeacherId)).limit(1);
      }
      if (!profile) {
        [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userRecord.id)).limit(1);
      }
    }
  }
  if (!profile) {
    [profile] = await db.select().from(teacherProfiles).limit(1);
  }
  return profile ?? null;
}

export async function getMyTeacherDashboard(request: Request) {
  const actor = await requirePermission(request, "dashboard", "view");
  if (actor.role !== "teacher") throw new HttpError("Teacher dashboard is only available to teacher accounts", 403);

  const profile = await resolveTeacherProfile(actor);
  if (!profile) throw new HttpError("Teacher profile not found", 404);

  const [activeSchoolYear, activeMadrassaYear] = await Promise.all([
    getActiveAcademicYear("school").catch(() => ({ name: "2026-2027" })),
    getActiveAcademicYear("madrassa").catch(() => ({ name: "2026-2027" })),
  ]);

  const [assignments, timetable] = await Promise.all([
    db
      .select({
        id: teacherAssignments.id,
        teacherProfileId: teacherAssignments.teacherProfileId,
        system: teacherAssignments.system,
        institutionId: teacherAssignments.institutionId,
        programId: teacherAssignments.programId,
        schoolClassId: teacherAssignments.schoolClassId,
        madrassaCategoryId: teacherAssignments.madrassaCategoryId,
        madrassaSubcategoryId: teacherAssignments.madrassaSubcategoryId,
        subjectId: teacherAssignments.subjectId,
        academicYear: teacherAssignments.academicYear,
        effectiveFrom: teacherAssignments.effectiveFrom,
        effectiveTo: teacherAssignments.effectiveTo,
        active: teacherAssignments.active,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectCode: examSubjects.code,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      })
      .from(teacherAssignments)
      .leftJoin(examSubjects, eq(examSubjects.id, teacherAssignments.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, teacherAssignments.schoolClassId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherAssignments.madrassaCategoryId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherAssignments.madrassaSubcategoryId))
      .where(and(eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.active, true)))
      .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear)),
    db
      .select({
        id: teacherTimetablePeriods.id,
        assignmentId: teacherTimetablePeriods.assignmentId,
        system: teacherTimetablePeriods.system,
        institutionId: teacherTimetablePeriods.institutionId,
        programId: teacherTimetablePeriods.programId,
        schoolClassId: teacherTimetablePeriods.schoolClassId,
        madrassaCategoryId: teacherTimetablePeriods.madrassaCategoryId,
        madrassaSubcategoryId: teacherTimetablePeriods.madrassaSubcategoryId,
        subjectId: teacherTimetablePeriods.subjectId,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
        weekday: teacherTimetablePeriods.weekday,
        startTime: teacherTimetablePeriods.startTime,
        endTime: teacherTimetablePeriods.endTime,
        room: teacherTimetablePeriods.room,
        academicYear: teacherTimetablePeriods.academicYear,
        active: teacherTimetablePeriods.active,
      })
      .from(teacherTimetablePeriods)
      .leftJoin(examSubjects, eq(examSubjects.id, teacherTimetablePeriods.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, teacherTimetablePeriods.schoolClassId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherTimetablePeriods.madrassaCategoryId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherTimetablePeriods.madrassaSubcategoryId))
      .where(and(eq(teacherTimetablePeriods.teacherProfileId, profile.id), eq(teacherTimetablePeriods.active, true)))
      .orderBy(asc(teacherTimetablePeriods.weekday), asc(teacherTimetablePeriods.startTime)),
  ]);

  const directSubjects = await db
    .select({
      id: examSubjects.id,
      system: examSubjects.system,
      schoolClassId: examSubjects.schoolClassId,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      schoolInstitutionId: schoolClasses.institutionId,
      madrassaSubcategoryId: examSubjects.madrassaSubcategoryId,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      madrassaCategoryId: madrassaCategories.id,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSection: madrassaSubcategories.section,
      subjectId: examSubjects.id,
      subjectName: examSubjects.name,
      subjectNameUrdu: examSubjects.nameUrdu,
      subjectCode: examSubjects.code,
      active: examSubjects.active,
    })
    .from(examSubjects)
    .leftJoin(schoolClasses, eq(schoolClasses.id, examSubjects.schoolClassId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examSubjects.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(and(eq(examSubjects.teacherId, profile.id), eq(examSubjects.active, true)))
    .orderBy(asc(examSubjects.system));

  const assignedSubjectIds = new Set(assignments.map((a) => a.subjectId).filter(Boolean));
  const synthesizedAssignments = directSubjects
    .filter((s) => !assignedSubjectIds.has(s.id))
    .map((s) => {
      const isMadrassa = s.system === "madrassa";
      const isFemaleMadrassa = s.madrassaSection === "female";
      const instId = isMadrassa
        ? (isFemaleMadrassa ? "jamia_zainab_banat" : "jamia_qasmia_baneen")
        : (s.schoolInstitutionId ?? "al_qasim_academy");
      const progId = isMadrassa
        ? (isFemaleMadrassa ? "zainab_nazira" : "qasmia_nazira")
        : "al_qasim_school";
      return {
        id: `sub_${s.id}`,
        teacherProfileId: profile.id,
        system: s.system,
        institutionId: instId,
        programId: progId,
        schoolClassId: s.schoolClassId ?? null,
        schoolClassName: s.schoolClassName ?? null,
        schoolClassNameUrdu: s.schoolClassNameUrdu ?? null,
        madrassaCategoryId: s.madrassaCategoryId ?? null,
        madrassaCategoryName: s.madrassaCategoryName ?? null,
        madrassaCategoryNameUrdu: s.madrassaCategoryNameUrdu ?? null,
        madrassaSubcategoryId: s.madrassaSubcategoryId ?? null,
        madrassaSubcategoryName: s.madrassaSubcategoryName ?? null,
        madrassaSubcategoryNameUrdu: s.madrassaSubcategoryNameUrdu ?? null,
        subjectId: s.id,
        subjectName: s.subjectName,
        subjectNameUrdu: s.subjectNameUrdu,
        subjectCode: s.subjectCode,
        academicYear: isMadrassa ? activeMadrassaYear.name : activeSchoolYear.name,
        effectiveFrom: null,
        effectiveTo: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

  const allAssignments = [...assignments, ...synthesizedAssignments];

  const madrassaSubcategoryIds = Array.from(
    new Set(
      allAssignments
        .filter((a) => a.system === "madrassa" && a.madrassaSubcategoryId)
        .map((a) => a.madrassaSubcategoryId as string),
    ),
  );

  const schoolClassIds = Array.from(
    new Set(
      allAssignments
        .filter((a) => a.system === "school" && a.schoolClassId)
        .map((a) => a.schoolClassId as string),
    ),
  );

  const teacherSubjectIds = new Set([
    ...allAssignments.map((a) => a.subjectId).filter(Boolean),
    ...directSubjects.map((s) => s.id),
  ]);

  const adminDayToTeacherWeekday = (adminDay: number) => (adminDay === 0 ? 6 : adminDay - 1);

  // 1. Fetch madrassa timetable periods
  const madrassaClassTimetable = madrassaSubcategoryIds.length > 0
    ? await db
        .select({
          id: madrassaTimetablePeriods.id,
          madrassaSubcategoryId: madrassaTimetablePeriods.madrassaSubcategoryId,
          timeStart: madrassaTimetablePeriods.timeStart,
          timeEnd: madrassaTimetablePeriods.timeEnd,
          label: madrassaTimetablePeriods.label,
          labelUrdu: madrassaTimetablePeriods.labelUrdu,
          isBreak: madrassaTimetablePeriods.isBreak,
          dayOfWeek: madrassaTimetableSlots.dayOfWeek,
          subjectId: madrassaTimetableSlots.subjectId,
          subjectName: examSubjects.name,
          subjectNameUrdu: examSubjects.nameUrdu,
          subjectTeacherId: examSubjects.teacherId,
          madrassaSubcategoryName: madrassaSubcategories.name,
          madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
          madrassaCategoryName: madrassaCategories.name,
          madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
          madrassaCategoryId: madrassaCategories.id,
        })
        .from(madrassaTimetablePeriods)
        .innerJoin(madrassaTimetableSlots, eq(madrassaTimetableSlots.periodId, madrassaTimetablePeriods.id))
        .leftJoin(examSubjects, eq(examSubjects.id, madrassaTimetableSlots.subjectId))
        .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, madrassaTimetablePeriods.madrassaSubcategoryId))
        .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
        .where(inArray(madrassaTimetablePeriods.madrassaSubcategoryId, madrassaSubcategoryIds))
        .orderBy(asc(madrassaTimetableSlots.dayOfWeek), asc(madrassaTimetablePeriods.timeStart))
    : [];

  // 2. Fetch school timetable periods
  const schoolClassTimetable = schoolClassIds.length > 0
    ? await db
        .select({
          id: schoolTimetablePeriods.id,
          schoolClassId: schoolTimetablePeriods.schoolClassId,
          timeStart: schoolTimetablePeriods.timeStart,
          timeEnd: schoolTimetablePeriods.timeEnd,
          label: schoolTimetablePeriods.label,
          labelUrdu: schoolTimetablePeriods.labelUrdu,
          isBreak: schoolTimetablePeriods.isBreak,
          dayOfWeek: schoolTimetableSlots.dayOfWeek,
          subjectId: schoolTimetableSlots.subjectId,
          subjectName: examSubjects.name,
          subjectNameUrdu: examSubjects.nameUrdu,
          subjectTeacherId: examSubjects.teacherId,
          schoolClassName: schoolClasses.name,
          schoolClassNameUrdu: schoolClasses.nameUrdu,
          institutionId: schoolClasses.institutionId,
        })
        .from(schoolTimetablePeriods)
        .innerJoin(schoolTimetableSlots, eq(schoolTimetableSlots.periodId, schoolTimetablePeriods.id))
        .leftJoin(examSubjects, eq(examSubjects.id, schoolTimetableSlots.subjectId))
        .leftJoin(schoolClasses, eq(schoolClasses.id, schoolTimetablePeriods.schoolClassId))
        .where(inArray(schoolTimetablePeriods.schoolClassId, schoolClassIds))
        .orderBy(asc(schoolTimetableSlots.dayOfWeek), asc(schoolTimetablePeriods.timeStart))
    : [];

  const filterForTeacher = (row: { subjectId: string | null; subjectTeacherId?: string | null }) => {
    if (!row.subjectId) return false;
    return row.subjectTeacherId === profile.id || teacherSubjectIds.has(row.subjectId);
  };

  const madrassaPeriods = madrassaClassTimetable
    .filter(filterForTeacher)
    .map((row) => {
      const assignment = allAssignments.find((a) => a.madrassaSubcategoryId === row.madrassaSubcategoryId);
      return {
        id: `${row.id}_${row.dayOfWeek}`,
        assignmentId: assignment?.id ?? null,
        system: (assignment?.system ?? "madrassa") as "school" | "madrassa",
        institutionId: assignment?.institutionId ?? "",
        programId: assignment?.programId ?? "",
        schoolClassId: null,
        schoolClassName: null,
        schoolClassNameUrdu: null,
        madrassaCategoryId: assignment?.madrassaCategoryId ?? null,
        madrassaCategoryName: row.madrassaCategoryName ?? assignment?.madrassaCategoryName ?? null,
        madrassaCategoryNameUrdu: row.madrassaCategoryNameUrdu ?? assignment?.madrassaCategoryNameUrdu ?? null,
        madrassaSubcategoryId: row.madrassaSubcategoryId,
        madrassaSubcategoryName: row.madrassaSubcategoryName ?? assignment?.madrassaSubcategoryName ?? null,
        madrassaSubcategoryNameUrdu: row.madrassaSubcategoryNameUrdu ?? assignment?.madrassaSubcategoryNameUrdu ?? null,
        subjectId: row.subjectId,
        subjectName: row.subjectName ?? null,
        subjectNameUrdu: row.subjectNameUrdu ?? null,
        academicYear: assignment?.academicYear ?? activeMadrassaYear.name,
        effectiveFrom: null,
        effectiveTo: null,
        active: !row.isBreak,
        weekday: adminDayToTeacherWeekday(row.dayOfWeek),
        startTime: normalizeTimeToHHMM(row.timeStart),
        endTime: normalizeTimeToHHMM(row.timeEnd),
        room: null,
      };
    });

  const schoolPeriods = schoolClassTimetable
    .filter(filterForTeacher)
    .map((row) => {
      const assignment = allAssignments.find((a) => a.schoolClassId === row.schoolClassId);
      return {
        id: `${row.id}_${row.dayOfWeek}`,
        assignmentId: assignment?.id ?? null,
        system: "school" as const,
        institutionId: assignment?.institutionId ?? "",
        programId: assignment?.programId ?? "",
        schoolClassId: row.schoolClassId,
        schoolClassName: row.schoolClassName ?? assignment?.schoolClassName ?? null,
        schoolClassNameUrdu: row.schoolClassNameUrdu ?? assignment?.schoolClassNameUrdu ?? null,
        madrassaCategoryId: null,
        madrassaCategoryName: null,
        madrassaCategoryNameUrdu: null,
        madrassaSubcategoryId: null,
        madrassaSubcategoryName: null,
        madrassaSubcategoryNameUrdu: null,
        subjectId: row.subjectId,
        subjectName: row.subjectName ?? null,
        subjectNameUrdu: row.subjectNameUrdu ?? null,
        academicYear: assignment?.academicYear ?? activeSchoolYear.name,
        effectiveFrom: null,
        effectiveTo: null,
        active: !row.isBreak,
        weekday: adminDayToTeacherWeekday(row.dayOfWeek),
        startTime: normalizeTimeToHHMM(row.timeStart),
        endTime: normalizeTimeToHHMM(row.timeEnd),
        room: null,
      };
    });

  const seenTimeslots = new Set<string>();
  const mergedTimetable: any[] = [];
  for (const p of [...timetable, ...madrassaPeriods, ...schoolPeriods]) {
    const key = `${p.weekday}_${p.startTime}_${p.endTime}_${p.subjectId ?? p.id}`;
    if (!seenTimeslots.has(key)) {
      seenTimeslots.add(key);
      mergedTimetable.push(p);
    }
  }

  mergedTimetable.sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));

  return {
    profile,
    account: publicAccount(actor),
    assignments: allAssignments,
    timetable: mergedTimetable,
  };
}

export async function assertTeacherCanAccessAttendancePlacement(
  actorUserId: string,
  system: "school" | "madrassa",
  filters: { classId?: string; sectionId?: string; institutionId?: string; subcategoryId?: string },
) {
  const profile = await resolveTeacherProfile({ id: actorUserId });
  if (!profile || profile.employmentStatus !== "active") throw new HttpError("Teacher profile is not active", 403);

  const clauses = [
    eq(teacherAssignments.teacherProfileId, profile.id),
    eq(teacherAssignments.active, true),
    eq(teacherAssignments.system, system),
    system === "school" && filters.classId ? eq(teacherAssignments.schoolClassId, filters.classId) : undefined,
    system === "madrassa" && filters.institutionId ? eq(teacherAssignments.institutionId, filters.institutionId) : undefined,
    system === "madrassa" && filters.subcategoryId ? eq(teacherAssignments.madrassaSubcategoryId, filters.subcategoryId) : undefined,
  ].filter(Boolean) as SQL[];

  const [assignment] = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(and(...clauses))
    .limit(1);

  if (assignment) return;

  const subjectClauses = [
    eq(examSubjects.teacherId, profile.id),
    eq(examSubjects.active, true),
    eq(examSubjects.system, system),
    system === "school" && filters.classId ? eq(examSubjects.schoolClassId, filters.classId) : undefined,
    system === "madrassa" && filters.subcategoryId ? eq(examSubjects.madrassaSubcategoryId, filters.subcategoryId) : undefined,
  ].filter(Boolean) as SQL[];

  const [subject] = await db
    .select({ id: examSubjects.id })
    .from(examSubjects)
    .where(and(...subjectClauses))
    .limit(1);

  if (!subject) throw new HttpError("Teacher is not assigned to this attendance group", 403);
}

async function loadTeacherDetail(id: string) {
  const profile = await requireTeacherProfile(id);
  const [account] = await db.select().from(authUser).where(eq(authUser.id, profile.userId)).limit(1);
  if (!account) throw new HttpError("Teacher account not found", 404);

  const [activeSchoolYear, activeMadrassaYear] = await Promise.all([
    getActiveAcademicYear("school").catch(() => ({ name: "2026-2027" })),
    getActiveAcademicYear("madrassa").catch(() => ({ name: "2026-2027" })),
  ]);

  const [explicitAssignments, directSubjects, explicitTimetable, madrassaSlots, schoolSlots] = await Promise.all([
    db
      .select({
        id: teacherAssignments.id,
        system: teacherAssignments.system,
        institutionId: teacherAssignments.institutionId,
        programId: teacherAssignments.programId,
        schoolClassId: teacherAssignments.schoolClassId,
        madrassaCategoryId: teacherAssignments.madrassaCategoryId,
        madrassaSubcategoryId: teacherAssignments.madrassaSubcategoryId,
        subjectId: teacherAssignments.subjectId,
        academicYear: teacherAssignments.academicYear,
        effectiveFrom: teacherAssignments.effectiveFrom,
        effectiveTo: teacherAssignments.effectiveTo,
        active: teacherAssignments.active,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectCode: examSubjects.code,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      })
      .from(teacherAssignments)
      .leftJoin(examSubjects, eq(examSubjects.id, teacherAssignments.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, teacherAssignments.schoolClassId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherAssignments.madrassaCategoryId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherAssignments.madrassaSubcategoryId))
      .where(eq(teacherAssignments.teacherProfileId, id))
      .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear)),

    db
      .select({
        id: examSubjects.id,
        teacherProfileId: examSubjects.teacherId,
        system: examSubjects.system,
        schoolClassId: examSubjects.schoolClassId,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        schoolInstitutionId: schoolClasses.institutionId,
        madrassaSubcategoryId: examSubjects.madrassaSubcategoryId,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
        madrassaCategoryId: madrassaCategories.id,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSection: madrassaSubcategories.section,
        subjectId: examSubjects.id,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectCode: examSubjects.code,
        active: examSubjects.active,
      })
      .from(examSubjects)
      .leftJoin(schoolClasses, eq(schoolClasses.id, examSubjects.schoolClassId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examSubjects.madrassaSubcategoryId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
      .where(and(eq(examSubjects.teacherId, id), eq(examSubjects.active, true)))
      .orderBy(asc(examSubjects.system)),

    db
      .select({
        id: teacherTimetablePeriods.id,
        assignmentId: teacherTimetablePeriods.assignmentId,
        system: teacherTimetablePeriods.system,
        institutionId: teacherTimetablePeriods.institutionId,
        programId: teacherTimetablePeriods.programId,
        schoolClassId: teacherTimetablePeriods.schoolClassId,
        madrassaCategoryId: teacherTimetablePeriods.madrassaCategoryId,
        madrassaSubcategoryId: teacherTimetablePeriods.madrassaSubcategoryId,
        subjectId: teacherTimetablePeriods.subjectId,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
        weekday: teacherTimetablePeriods.weekday,
        startTime: teacherTimetablePeriods.startTime,
        endTime: teacherTimetablePeriods.endTime,
        room: teacherTimetablePeriods.room,
        academicYear: teacherTimetablePeriods.academicYear,
        active: teacherTimetablePeriods.active,
      })
      .from(teacherTimetablePeriods)
      .leftJoin(examSubjects, eq(examSubjects.id, teacherTimetablePeriods.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, teacherTimetablePeriods.schoolClassId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherTimetablePeriods.madrassaCategoryId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherTimetablePeriods.madrassaSubcategoryId))
      .where(eq(teacherTimetablePeriods.teacherProfileId, id))
      .orderBy(asc(teacherTimetablePeriods.weekday), asc(teacherTimetablePeriods.startTime)),

    db
      .select({
        id: madrassaTimetablePeriods.id,
        madrassaSubcategoryId: madrassaTimetablePeriods.madrassaSubcategoryId,
        timeStart: madrassaTimetablePeriods.timeStart,
        timeEnd: madrassaTimetablePeriods.timeEnd,
        label: madrassaTimetablePeriods.label,
        labelUrdu: madrassaTimetablePeriods.labelUrdu,
        isBreak: madrassaTimetablePeriods.isBreak,
        dayOfWeek: madrassaTimetableSlots.dayOfWeek,
        subjectId: madrassaTimetableSlots.subjectId,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectTeacherId: examSubjects.teacherId,
        madrassaSubcategoryName: madrassaSubcategories.name,
        madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
        madrassaCategoryName: madrassaCategories.name,
        madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
        madrassaCategoryId: madrassaCategories.id,
      })
      .from(madrassaTimetablePeriods)
      .innerJoin(madrassaTimetableSlots, eq(madrassaTimetableSlots.periodId, madrassaTimetablePeriods.id))
      .leftJoin(examSubjects, eq(examSubjects.id, madrassaTimetableSlots.subjectId))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, madrassaTimetablePeriods.madrassaSubcategoryId))
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
      .where(eq(madrassaTimetablePeriods.isBreak, false))
      .orderBy(asc(madrassaTimetableSlots.dayOfWeek), asc(madrassaTimetablePeriods.timeStart)),

    db
      .select({
        id: schoolTimetablePeriods.id,
        schoolClassId: schoolTimetablePeriods.schoolClassId,
        timeStart: schoolTimetablePeriods.timeStart,
        timeEnd: schoolTimetablePeriods.timeEnd,
        label: schoolTimetablePeriods.label,
        labelUrdu: schoolTimetablePeriods.labelUrdu,
        isBreak: schoolTimetablePeriods.isBreak,
        dayOfWeek: schoolTimetableSlots.dayOfWeek,
        subjectId: schoolTimetableSlots.subjectId,
        subjectName: examSubjects.name,
        subjectNameUrdu: examSubjects.nameUrdu,
        subjectTeacherId: examSubjects.teacherId,
        schoolClassName: schoolClasses.name,
        schoolClassNameUrdu: schoolClasses.nameUrdu,
        institutionId: schoolClasses.institutionId,
      })
      .from(schoolTimetablePeriods)
      .innerJoin(schoolTimetableSlots, eq(schoolTimetableSlots.periodId, schoolTimetablePeriods.id))
      .leftJoin(examSubjects, eq(examSubjects.id, schoolTimetableSlots.subjectId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, schoolTimetablePeriods.schoolClassId))
      .where(eq(schoolTimetablePeriods.isBreak, false))
      .orderBy(asc(schoolTimetableSlots.dayOfWeek), asc(schoolTimetablePeriods.timeStart)),
  ]);

  const assignedSubIds = new Set(explicitAssignments.map((a) => a.subjectId).filter(Boolean));
  const direct = directSubjects
    .filter((s) => !assignedSubIds.has(s.subjectId))
    .map((s) => {
      const isMadrassa = s.system === "madrassa";
      const isFemaleMadrassa = s.madrassaSection === "female";
      const instId = isMadrassa
        ? (isFemaleMadrassa ? "jamia_zainab_banat" : "jamia_qasmia_baneen")
        : (s.schoolInstitutionId ?? "al_qasim_academy");
      const progId = isMadrassa
        ? (isFemaleMadrassa ? "zainab_nazira" : "qasmia_nazira")
        : "al_qasim_school";
      return {
        id: `sub_${s.id}`,
        teacherProfileId: id,
        system: s.system,
        institutionId: instId,
        programId: progId,
        schoolClassId: s.schoolClassId ?? null,
        schoolClassName: s.schoolClassName ?? null,
        schoolClassNameUrdu: s.schoolClassNameUrdu ?? null,
        madrassaCategoryId: s.madrassaCategoryId ?? null,
        madrassaCategoryName: s.madrassaCategoryName ?? null,
        madrassaCategoryNameUrdu: s.madrassaCategoryNameUrdu ?? null,
        madrassaSubcategoryId: s.madrassaSubcategoryId ?? null,
        madrassaSubcategoryName: s.madrassaSubcategoryName ?? null,
        madrassaSubcategoryNameUrdu: s.madrassaSubcategoryNameUrdu ?? null,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        subjectNameUrdu: s.subjectNameUrdu,
        subjectCode: s.subjectCode,
        academicYear: isMadrassa ? activeMadrassaYear.name : activeSchoolYear.name,
        effectiveFrom: null,
        effectiveTo: null,
        active: true,
      };
    });

  const allAssignments = [...explicitAssignments, ...direct];
  const teacherSubIds = new Set(allAssignments.map((a) => a.subjectId).filter(Boolean));
  const adminDayToTeacherWeekday = (adminDay: number) => (adminDay === 0 ? 6 : adminDay - 1);

  const madrassaPeriods = madrassaSlots
    .filter((s) => s.subjectTeacherId === id || (s.subjectId && teacherSubIds.has(s.subjectId)))
    .map((row) => ({
      id: `${row.id}_${row.dayOfWeek}`,
      assignmentId: null,
      system: "madrassa" as const,
      institutionId: "",
      programId: "",
      schoolClassId: null,
      schoolClassName: null,
      schoolClassNameUrdu: null,
      madrassaCategoryId: row.madrassaCategoryId ?? null,
      madrassaCategoryName: row.madrassaCategoryName ?? null,
      madrassaCategoryNameUrdu: row.madrassaCategoryNameUrdu ?? null,
      madrassaSubcategoryId: row.madrassaSubcategoryId,
      madrassaSubcategoryName: row.madrassaSubcategoryName ?? null,
      madrassaSubcategoryNameUrdu: row.madrassaSubcategoryNameUrdu ?? null,
      subjectId: row.subjectId,
      subjectName: row.subjectName ?? row.label ?? null,
      subjectNameUrdu: row.subjectNameUrdu ?? row.labelUrdu ?? null,
      academicYear: activeMadrassaYear.name,
      weekday: adminDayToTeacherWeekday(row.dayOfWeek),
      startTime: normalizeTimeToHHMM(row.timeStart),
      endTime: normalizeTimeToHHMM(row.timeEnd),
      room: null,
      active: true,
    }));

  const schoolPeriods = schoolSlots
    .filter((s) => s.subjectTeacherId === id || (s.subjectId && teacherSubIds.has(s.subjectId)))
    .map((row) => ({
      id: `${row.id}_${row.dayOfWeek}`,
      assignmentId: null,
      system: "school" as const,
      institutionId: row.institutionId ?? "",
      programId: "",
      schoolClassId: row.schoolClassId,
      schoolClassName: row.schoolClassName ?? null,
      schoolClassNameUrdu: row.schoolClassNameUrdu ?? null,
      madrassaCategoryId: null,
      madrassaCategoryName: null,
      madrassaCategoryNameUrdu: null,
      madrassaSubcategoryId: null,
      madrassaSubcategoryName: null,
      madrassaSubcategoryNameUrdu: null,
      subjectId: row.subjectId,
      subjectName: row.subjectName ?? row.label ?? null,
      subjectNameUrdu: row.subjectNameUrdu ?? row.labelUrdu ?? null,
      academicYear: activeSchoolYear.name,
      weekday: adminDayToTeacherWeekday(row.dayOfWeek),
      startTime: normalizeTimeToHHMM(row.timeStart),
      endTime: normalizeTimeToHHMM(row.timeEnd),
      room: null,
      active: true,
    }));

  const seenTimeslots = new Set<string>();
  const mergedTimetable: any[] = [];
  for (const p of [...explicitTimetable, ...madrassaPeriods, ...schoolPeriods]) {
    const key = `${p.weekday}_${p.startTime}_${p.endTime}_${p.subjectId ?? p.id}`;
    if (!seenTimeslots.has(key)) {
      seenTimeslots.add(key);
      mergedTimetable.push(p);
    }
  }

  mergedTimetable.sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));

  return { profile, account: publicDbAccount(account), assignments: allAssignments, timetable: mergedTimetable };
}

async function requireTeacherProfile(id: string) {
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.id, id)).limit(1);
  if (!profile) throw new HttpError("Teacher not found", 404);
  return profile;
}

async function requireActiveTeacherProfile(id: string) {
  const profile = await requireTeacherProfile(id);
  if (profile.employmentStatus !== "active") throw new HttpError("Teacher profile is not active", 409);
  return profile;
}

async function requireTeacherAssignment(teacherId: string, assignmentId: string, requireActive = false) {
  const [assignment] = await db
    .select()
    .from(teacherAssignments)
    .where(and(eq(teacherAssignments.id, assignmentId), eq(teacherAssignments.teacherProfileId, teacherId)))
    .limit(1);

  if (!assignment) throw new HttpError("Teacher assignment not found", 404);
  if (requireActive && !assignment.active) throw new HttpError("Teacher assignment is not active", 409);
  return assignment;
}

async function requireTeacherTimetablePeriod(teacherId: string, periodId: string) {
  const [period] = await db
    .select()
    .from(teacherTimetablePeriods)
    .where(and(eq(teacherTimetablePeriods.id, periodId), eq(teacherTimetablePeriods.teacherProfileId, teacherId)))
    .limit(1);

  if (!period) throw new HttpError("Teacher timetable period not found", 404);
  return period;
}

async function assertNoTimetableConflict(
  teacherId: string,
  next: { weekday: number; startTime: string; endTime: string; ignorePeriodId: string | null },
) {
  const periods = await db
    .select({
      id: teacherTimetablePeriods.id,
      weekday: teacherTimetablePeriods.weekday,
      startTime: teacherTimetablePeriods.startTime,
      endTime: teacherTimetablePeriods.endTime,
      active: teacherTimetablePeriods.active,
    })
    .from(teacherTimetablePeriods)
    .where(eq(teacherTimetablePeriods.teacherProfileId, teacherId));

  if (hasTimetableConflict(periods, next)) {
    throw new HttpError("Teacher already has a timetable period in this time range", 409);
  }

  await assertTeacherTimetableConflictWithClassTimetables(teacherId, next);
}

async function cleanupAuthUser(userId: string) {
  try {
    await deleteUser(userId);
  } catch {
    // Best-effort cleanup; preserve the original profile creation failure.
  }
}

export async function deleteTeacher(request: Request, teacherId: string) {
  const actor = await requirePermission(request, "teachers", "delete");
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.id, teacherId)).limit(1);
  if (!profile) throw new HttpError("Teacher not found", 404);

  await db.transaction(async (tx) => {
    await tx.delete(teacherTimetablePeriods).where(eq(teacherTimetablePeriods.teacherProfileId, teacherId));
    await tx.delete(teacherAssignments).where(eq(teacherAssignments.teacherProfileId, teacherId));
    await tx.delete(teacherProfiles).where(eq(teacherProfiles.id, teacherId));
  });

  if (profile.userId) {
    await cleanupAuthUser(profile.userId);
  }

  return { success: true, deletedTeacherId: teacherId };
}

function validateAssignmentDates(
  input: { effectiveFrom?: string | null; effectiveTo?: string | null },
  ctx: z.RefinementCtx,
) {
  if (input.effectiveFrom && input.effectiveTo && input.effectiveFrom > input.effectiveTo) {
    ctx.addIssue({
      code: "custom",
      path: ["effectiveTo"],
      message: "Effective end date must be after effective start date",
    });
  }
}

function validateAssignmentDatePair(effectiveFrom?: string | null, effectiveTo?: string | null) {
  if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
    throw new HttpError("Effective end date must be after effective start date", 400);
  }
}

function compactSql<T extends SQL | undefined>(clauses: T[]) {
  return clauses.filter(Boolean) as SQL[];
}

function hasAnyKey(value: object) {
  return Object.values(value).some((entry) => entry !== undefined);
}

function assertTeacherMayReadDetail(
  actor: { id: string; role: string; linkedTeacherId?: string },
  teacherUserId: string,
  teacherProfileId?: string,
) {
  if (actor.role === "teacher") {
    const isOwnUser = actor.id === teacherUserId;
    const isOwnProfile = Boolean(teacherProfileId && actor.linkedTeacherId === teacherProfileId);
    if (!isOwnUser && !isOwnProfile) {
      throw new HttpError("Teachers can only view their own teacher profile", 403);
    }
  }
}

function publicDbAccount(account: typeof authUser.$inferSelect) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    nameUrdu: account.nameUrdu,
    phone: account.phone,
    cnic: account.cnic,
    role: account.role,
    status: account.status,
    banned: account.banned,
    systemAccess: account.systemAccess,
    mustChangePassword: account.mustChangePassword,
    linkedTeacherId: account.linkedTeacherId,
    department: account.department,
    designation: account.designation,
  };
}

function publicAccount(account: { id: string; name: string; email: string; role: string; status: string }) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    status: account.status,
  };
}

export async function getMyTeacherClasses(request: Request) {
  const actor = await requirePermission(request, "dashboard", "view");
  if (actor.role !== "teacher") throw new HttpError("Teacher portal is only available to teacher accounts", 403);

  const profile = await resolveTeacherProfile(actor);
  if (!profile) throw new HttpError("Teacher profile not found", 404);

  const [activeSchoolYear, activeMadrassaYear] = await Promise.all([
    getActiveAcademicYear("school").catch(() => ({ name: "2026-2027" })),
    getActiveAcademicYear("madrassa").catch(() => ({ name: "2026-2027" })),
  ]);

  const assignments = await db
    .select({
      id: teacherAssignments.id,
      system: teacherAssignments.system,
      institutionId: teacherAssignments.institutionId,
      programId: teacherAssignments.programId,
      schoolClassId: teacherAssignments.schoolClassId,
      madrassaCategoryId: teacherAssignments.madrassaCategoryId,
      madrassaSubcategoryId: teacherAssignments.madrassaSubcategoryId,
      subjectId: teacherAssignments.subjectId,
      academicYear: teacherAssignments.academicYear,
      effectiveFrom: teacherAssignments.effectiveFrom,
      effectiveTo: teacherAssignments.effectiveTo,
      active: teacherAssignments.active,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      subjectName: examSubjects.name,
      subjectNameUrdu: examSubjects.nameUrdu,
      subjectCode: examSubjects.code,
    })
    .from(teacherAssignments)
    .leftJoin(institutions, eq(institutions.id, teacherAssignments.institutionId))
    .leftJoin(programs, eq(programs.id, teacherAssignments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, teacherAssignments.schoolClassId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherAssignments.madrassaCategoryId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherAssignments.madrassaSubcategoryId))
    .leftJoin(examSubjects, eq(examSubjects.id, teacherAssignments.subjectId))
    .where(and(eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.active, true)))
    .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear));

  const assignedSubjectIds = new Set(assignments.map((a) => a.subjectId).filter(Boolean));

  const directSubjects = await db
    .select({
      id: examSubjects.id,
      system: examSubjects.system,
      schoolClassId: examSubjects.schoolClassId,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      schoolClassInstitutionId: schoolClasses.institutionId,
      schoolInstitutionName: institutions.name,
      schoolInstitutionNameUrdu: institutions.nameUrdu,
      madrassaCategoryId: madrassaCategories.id,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryId: examSubjects.madrassaSubcategoryId,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      madrassaSection: madrassaSubcategories.section,
      subjectId: examSubjects.id,
      active: examSubjects.active,
      subjectName: examSubjects.name,
      subjectNameUrdu: examSubjects.nameUrdu,
      subjectCode: examSubjects.code,
    })
    .from(examSubjects)
    .leftJoin(schoolClasses, eq(schoolClasses.id, examSubjects.schoolClassId))
    .leftJoin(institutions, eq(institutions.id, schoolClasses.institutionId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examSubjects.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(and(eq(examSubjects.teacherId, profile.id), eq(examSubjects.active, true)))
    .orderBy(asc(examSubjects.system));

  const mappedDirect = directSubjects
    .filter((subject) => !assignedSubjectIds.has(subject.subjectId))
    .map((s) => {
      const isMadrassa = s.system === "madrassa";
      const isFemaleMadrassa = s.madrassaSection === "female";
      const instId = isMadrassa
        ? (isFemaleMadrassa ? "jamia_zainab_banat" : "jamia_qasmia_baneen")
        : (s.schoolClassInstitutionId ?? "al_qasim_academy");
      const instName = isMadrassa
        ? (isFemaleMadrassa ? "Jamia Al-Zainab Lil-Banat" : "Jamia Dar-ul-Uloom Al-Qasmia")
        : (s.schoolInstitutionName ?? "Al-Qasim Academy");
      const instNameUrdu = isMadrassa
        ? (isFemaleMadrassa ? "جامعہ زینب للبنات" : "جامعہ دارالعلوم القاسمیہ")
        : (s.schoolInstitutionNameUrdu ?? "القاسم اکیڈمی");

      return {
        id: `sub_${s.id}`,
        system: s.system,
        institutionId: instId,
        institutionName: instName,
        institutionNameUrdu: instNameUrdu,
        programId: "",
        programName: null,
        programNameUrdu: null,
        schoolClassId: s.schoolClassId,
        schoolClassName: s.schoolClassName,
        schoolClassNameUrdu: s.schoolClassNameUrdu,
        madrassaCategoryId: s.madrassaCategoryId,
        madrassaCategoryName: s.madrassaCategoryName,
        madrassaCategoryNameUrdu: s.madrassaCategoryNameUrdu,
        madrassaSubcategoryId: s.madrassaSubcategoryId,
        madrassaSubcategoryName: s.madrassaSubcategoryName,
        madrassaSubcategoryNameUrdu: s.madrassaSubcategoryNameUrdu,
        subjectId: s.subjectId,
        academicYear: isMadrassa ? activeMadrassaYear.name : activeSchoolYear.name,
        effectiveFrom: null,
        effectiveTo: null,
        active: s.active,
        subjectName: s.subjectName,
        subjectNameUrdu: s.subjectNameUrdu,
        subjectCode: s.subjectCode,
      };
    });

  return [...assignments, ...mappedDirect];
}

export async function getMyTeacherAttendanceClasses(request: Request, date: string) {
  const actor = await requirePermission(request, "dashboard", "view");
  if (actor.role !== "teacher") throw new HttpError("Teacher portal is only available to teacher accounts", 403);

  const profile = await resolveTeacherProfile(actor);
  if (!profile) throw new HttpError("Teacher profile not found", 404);

  const allClasses = await getMyTeacherClasses(request);

  // Group / de-duplicate by unique class (school) or darja (madrassa)
  const uniqueMap = new Map<string, typeof allClasses[0]>();
  for (const c of allClasses) {
    const key =
      c.system === "school"
        ? `school:${c.schoolClassId}`
        : `madrassa:${c.institutionId}:${c.madrassaSubcategoryId}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, c);
    }
  }

  const { getDesignatedFirstPeriodTeacher } = await import("@/lib/server/attendance/service");
  const { studentAttendance } = await import("@/db/schema/attendance");

  const eligibleClasses: Array<{
    id: string;
    system: "school" | "madrassa";
    institutionId: string;
    institutionName: string | null;
    institutionNameUrdu: string | null;
    schoolClassId: string | null;
    schoolClassName: string | null;
    schoolClassNameUrdu: string | null;
    madrassaCategoryId: string | null;
    madrassaCategoryName: string | null;
    madrassaCategoryNameUrdu: string | null;
    madrassaSubcategoryId: string | null;
    madrassaSubcategoryName: string | null;
    madrassaSubcategoryNameUrdu: string | null;
    academicYear: string;
    isDesignated: boolean;
    designatedTeacherName: string | null;
    periodLabel: string | null;
    isAlreadyMarked: boolean;
    markedByName: string | null;
  }> = [];

  for (const item of uniqueMap.values()) {
    if (item.system === "school" && item.schoolClassId) {
      const designated = await getDesignatedFirstPeriodTeacher(
        "school",
        { classId: item.schoolClassId },
        date,
      );

      const [existing] = await db
        .select({ markedByUserId: studentAttendance.markedByUserId })
        .from(studentAttendance)
        .where(
          and(
            eq(studentAttendance.attendanceDate, date),
            eq(studentAttendance.schoolClassId, item.schoolClassId),
          ),
        )
        .limit(1);

      let markerName: string | null = null;
      if (existing?.markedByUserId) {
        const [marker] = await db
          .select({ name: authUser.name })
          .from(authUser)
          .where(eq(authUser.id, existing.markedByUserId))
          .limit(1);
        markerName = marker?.name ?? null;
      }

      const isDesignated = Boolean(designated && designated.userId === actor.id);
      if (isDesignated) {
        eligibleClasses.push({
          id: item.id,
          system: "school",
          institutionId: item.institutionId,
          institutionName: item.institutionName,
          institutionNameUrdu: item.institutionNameUrdu,
          schoolClassId: item.schoolClassId,
          schoolClassName: item.schoolClassName,
          schoolClassNameUrdu: item.schoolClassNameUrdu,
          madrassaCategoryId: null,
          madrassaCategoryName: null,
          madrassaCategoryNameUrdu: null,
          madrassaSubcategoryId: null,
          madrassaSubcategoryName: null,
          madrassaSubcategoryNameUrdu: null,
          academicYear: item.academicYear,
          isDesignated,
          designatedTeacherName: designated?.name ?? null,
          periodLabel: designated?.periodLabel ?? null,
          timeStart: (designated as any)?.timeStart ?? null,
          isAlreadyMarked: Boolean(existing),
          markedByName: markerName,
        });
      }
    } else if (item.system === "madrassa" && item.madrassaSubcategoryId && item.institutionId) {
      const designated = await getDesignatedFirstPeriodTeacher(
        "madrassa",
        { subcategoryId: item.madrassaSubcategoryId },
        date,
      );

      const [existing] = await db
        .select({ markedByUserId: studentAttendance.markedByUserId })
        .from(studentAttendance)
        .where(
          and(
            eq(studentAttendance.attendanceDate, date),
            eq(studentAttendance.madrassaSubcategoryId, item.madrassaSubcategoryId),
            eq(studentAttendance.institutionId, item.institutionId),
          ),
        )
        .limit(1);

      let markerName: string | null = null;
      if (existing?.markedByUserId) {
        const [marker] = await db
          .select({ name: authUser.name })
          .from(authUser)
          .where(eq(authUser.id, existing.markedByUserId))
          .limit(1);
        markerName = marker?.name ?? null;
      }

      const isDesignated = Boolean(designated && designated.userId === actor.id);
      if (isDesignated) {
        eligibleClasses.push({
          id: item.id,
          system: "madrassa",
          institutionId: item.institutionId,
          institutionName: item.institutionName,
          institutionNameUrdu: item.institutionNameUrdu,
          schoolClassId: null,
          schoolClassName: null,
          schoolClassNameUrdu: null,
          madrassaCategoryId: item.madrassaCategoryId,
          madrassaCategoryName: item.madrassaCategoryName,
          madrassaCategoryNameUrdu: item.madrassaCategoryNameUrdu,
          madrassaSubcategoryId: item.madrassaSubcategoryId,
          madrassaSubcategoryName: item.madrassaSubcategoryName,
          madrassaSubcategoryNameUrdu: item.madrassaSubcategoryNameUrdu,
          academicYear: item.academicYear,
          isDesignated,
          designatedTeacherName: designated?.name ?? null,
          periodLabel: designated?.periodLabel ?? null,
          timeStart: (designated as any)?.timeStart ?? null,
          isAlreadyMarked: Boolean(existing),
          markedByName: markerName,
        });
      }
    }
  }

  const { parseMinutes } = await import("@/lib/server/academic/timetable-conflict");
  eligibleClasses.sort((a, b) => {
    const minA = a.timeStart ? parseMinutes(a.timeStart) : 9999;
    const minB = b.timeStart ? parseMinutes(b.timeStart) : 9999;
    return minA - minB;
  });

  // A teacher takes attendance for only ONE class per day — the earliest / beginning class of their day
  return eligibleClasses.slice(0, 1);
}

export async function getMyTeacherExams(request: Request) {
  const actor = await requirePermission(request, "dashboard", "view");
  if (actor.role !== "teacher") throw new HttpError("Teacher portal is only available to teacher accounts", 403);

  const profile = await resolveTeacherProfile(actor);
  if (!profile) throw new HttpError("Teacher profile not found", 404);

  const [activeSchoolYear, activeMadrassaYear] = await Promise.all([
    getActiveAcademicYear("school").catch(() => ({ name: "2026-2027" })),
    getActiveAcademicYear("madrassa").catch(() => ({ name: "2026-2027" })),
  ]);

  const assignments = await db
    .select({
      id: teacherAssignments.id,
      system: teacherAssignments.system,
      subjectId: teacherAssignments.subjectId,
      schoolClassId: teacherAssignments.schoolClassId,
      madrassaCategoryId: teacherAssignments.madrassaCategoryId,
      madrassaSubcategoryId: teacherAssignments.madrassaSubcategoryId,
      academicYear: teacherAssignments.academicYear,
      subjectName: examSubjects.name,
      subjectNameUrdu: examSubjects.nameUrdu,
      subjectCode: examSubjects.code,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    })
    .from(teacherAssignments)
    .leftJoin(examSubjects, eq(examSubjects.id, teacherAssignments.subjectId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, teacherAssignments.schoolClassId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, teacherAssignments.madrassaCategoryId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, teacherAssignments.madrassaSubcategoryId))
    .where(and(eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.active, true)))
    .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear));

  const directSubjects = await db
    .select({
      id: examSubjects.id,
      system: examSubjects.system,
      subjectId: examSubjects.id,
      schoolClassId: examSubjects.schoolClassId,
      madrassaCategoryId: madrassaCategories.id,
      madrassaSubcategoryId: examSubjects.madrassaSubcategoryId,
      subjectName: examSubjects.name,
      subjectNameUrdu: examSubjects.nameUrdu,
      subjectCode: examSubjects.code,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    })
    .from(examSubjects)
    .leftJoin(schoolClasses, eq(schoolClasses.id, examSubjects.schoolClassId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examSubjects.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(and(eq(examSubjects.teacherId, profile.id), eq(examSubjects.active, true)))
    .orderBy(asc(examSubjects.system));

  const assignedSubjectIds = new Set(assignments.map((a) => a.subjectId).filter(Boolean));
  const mappedDirect = directSubjects
    .filter((s) => !assignedSubjectIds.has(s.subjectId))
    .map((s) => ({
      ...s,
      id: `sub_${s.id}`,
      academicYear: s.system === "madrassa" ? activeMadrassaYear.name : activeSchoolYear.name,
    }));

  const allAssignments = [...assignments, ...mappedDirect];

  const subjectIds = uniqueStrings(allAssignments.map((a) => a.subjectId).filter(Boolean) as string[]);
  const classKeys = uniqueStrings(
    allAssignments
      .filter((a) => a.system === "school" && a.schoolClassId)
      .map((a) => a.schoolClassId as string),
  );
  const madrassaKeys = uniqueStrings(
    allAssignments
      .filter((a) => a.system === "madrassa" && a.madrassaSubcategoryId)
      .map((a) => a.madrassaSubcategoryId as string),
  );

  const scopeConditions: SQL[] = [];
  if (classKeys.length > 0) {
    scopeConditions.push(
      and(
        eq(examSessions.system, "school"),
        inArray(examSessions.schoolClassId, classKeys),
      )!,
    );
  }
  if (madrassaKeys.length > 0) {
    scopeConditions.push(
      and(
        eq(examSessions.system, "madrassa"),
        inArray(examSessions.madrassaSubcategoryId, madrassaKeys),
      )!,
    );
  }
  if (subjectIds.length > 0) {
    scopeConditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(examSessionSubjects)
          .where(
            and(
              eq(examSessionSubjects.examId, examSessions.id),
              inArray(examSessionSubjects.subjectId, subjectIds),
            ),
          ),
      )!,
    );
  }

  if (scopeConditions.length === 0) {
    return { assignments: allAssignments, sessions: [] };
  }

  const sessionRows = await db
    .select({
      id: examSessions.id,
      name: examSessions.name,
      nameUrdu: examSessions.nameUrdu,
      system: examSessions.system,
      status: examSessions.status,
      academicYear: examSessions.academicYear,
      startDate: examSessions.startDate,
      endDate: examSessions.endDate,
      marksEntryEndDate: examSessions.marksEntryEndDate,
      publishedAt: examSessions.publishedAt,
      schoolClassId: examSessions.schoolClassId,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      madrassaCategoryId: examSessions.madrassaCategoryId,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryId: examSessions.madrassaSubcategoryId,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    })
    .from(examSessions)
    .leftJoin(schoolClasses, eq(schoolClasses.id, examSessions.schoolClassId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, examSessions.madrassaCategoryId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, examSessions.madrassaSubcategoryId),
    )
    .where(or(...scopeConditions))
    .orderBy(desc(examSessions.startDate));

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

  const seenSessionIds = new Set<string>();
  const sessions = [];
  for (const row of sessionRows) {
    if (seenSessionIds.has(row.id)) continue;
    seenSessionIds.add(row.id);

    // Rule: Do not show exam in teacher portal until exam has ended
    const isEnded = todayStr >= row.endDate;
    if (!isEnded) continue;

    const deadline = row.marksEntryEndDate || row.endDate;
    const isOpen = todayStr <= deadline && row.status !== "published";
    const isClosed = todayStr > deadline || row.status === "published";

    sessions.push({
      ...row,
      marksEntryEndDate: deadline,
      isOpen,
      isClosed,
      phase: isOpen ? ("open" as const) : row.status === "published" ? ("published" as const) : ("closed" as const),
    });
  }

  return { assignments: allAssignments, sessions };
}

export async function getMyTeacherReports(request: Request) {
  const actor = await requirePermission(request, "dashboard", "view");
  if (actor.role !== "teacher") throw new HttpError("Teacher portal is only available to teacher accounts", 403);

  const profile = await resolveTeacherProfile(actor);
  if (!profile) throw new HttpError("Teacher profile not found", 404);

  const assignments = await db
    .select()
    .from(teacherAssignments)
    .where(and(eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.active, true)))
    .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear));

  const directSubjects = await db
    .select({
      id: examSubjects.id,
      system: examSubjects.system,
      subjectId: examSubjects.id,
      schoolClassId: examSubjects.schoolClassId,
      madrassaSubcategoryId: examSubjects.madrassaSubcategoryId,
    })
    .from(examSubjects)
    .where(and(eq(examSubjects.teacherId, profile.id), eq(examSubjects.active, true)));

  const assignedSubjectIds = new Set(assignments.map((a) => a.subjectId).filter(Boolean));
  const newSubjects = directSubjects.filter((s) => !assignedSubjectIds.has(s.id));

  const totalClasses = assignments.length + newSubjects.length;
  const totalSchool =
    assignments.filter((a) => a.system === "school").length +
    newSubjects.filter((s) => s.system === "school").length;
  const totalMadrassa =
    assignments.filter((a) => a.system === "madrassa").length +
    newSubjects.filter((s) => s.system === "madrassa").length;

  return {
    profile,
    assignments,
    totalClasses,
    totalSchool,
    totalMadrassa,
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
