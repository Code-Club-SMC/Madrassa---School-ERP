import { randomUUID } from "node:crypto";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user as authUser } from "@/db/schema/auth";
import { teacherAssignments, teacherProfiles, teacherTimetablePeriods } from "@/db/schema/teachers";
import { auth } from "@/lib/auth";
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

const systemScopeSchema = z.enum(["school", "madrassa", "both"]);
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
  systemScope: systemScopeSchema.default("both"),
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
  systemScope: z.enum(["all", "school", "madrassa", "both"]).default("all"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
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
  schoolSectionId: nullableId,
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
  const result = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password,
      role: "teacher",
      data: {
        nameUrdu: input.nameUrdu,
        phone: input.phone,
        cnic: input.cnic,
        status: "active",
        systemAccess: input.systemScope,
        mustChangePassword: true,
        linkedTeacherId: profileId,
        permissions: ROLE_DEFAULTS.teacher,
        department: "Teaching",
        designation: input.designation,
      },
    },
  });

  if (!result?.user?.id) throw new HttpError("Better Auth did not return a user id", 500);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(teacherProfiles).values({
        id: profileId,
        userId: result.user.id,
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
        .where(eq(authUser.id, result.user.id));
    });

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
  } catch (error) {
    await cleanupAuthUser(result.user.id);
    throw error;
  }
}

export async function listTeachers(request: Request, query: z.infer<typeof teacherListQuerySchema>) {
  const actor = await requirePermission(request, "teachers", "view");
  const clauses = [
    eq(authUser.role, "teacher"),
    actor.role === "teacher" ? eq(teacherProfiles.userId, actor.id) : undefined,
    query.status === "all" ? undefined : eq(teacherProfiles.employmentStatus, query.status),
    query.systemScope === "all" ? undefined : eq(teacherProfiles.systemScope, query.systemScope),
    query.q
      ? or(
          ilike(authUser.name, `%${query.q}%`),
          ilike(authUser.email, `%${query.q}%`),
          ilike(teacherProfiles.designation, `%${query.q}%`),
        )
      : undefined,
  ].filter(Boolean);

  return db
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
}

export async function getTeacher(request: Request, id: string) {
  const actor = await requirePermission(request, "teachers", "view");
  const detail = await loadTeacherDetail(id);
  assertTeacherMayReadDetail(actor, detail.profile.userId);
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
          systemAccess: profileInput.systemScope,
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
  validateTeacherPlacement(input);

  await db.insert(teacherAssignments).values({
    id: randomUUID(),
    teacherProfileId: teacherId,
    system: input.system,
    institutionId: input.institutionId,
    programId: input.programId,
    schoolClassId: input.schoolClassId ?? null,
    schoolSectionId: input.schoolSectionId ?? null,
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
    schoolSectionId: input.schoolSectionId === undefined ? assignment.schoolSectionId : input.schoolSectionId,
    madrassaCategoryId:
      input.madrassaCategoryId === undefined ? assignment.madrassaCategoryId : input.madrassaCategoryId,
    madrassaSubcategoryId:
      input.madrassaSubcategoryId === undefined ? assignment.madrassaSubcategoryId : input.madrassaSubcategoryId,
    subjectId: input.subjectId === undefined ? assignment.subjectId : input.subjectId,
    academicYear: input.academicYear ?? assignment.academicYear,
    effectiveFrom: input.effectiveFrom === undefined ? assignment.effectiveFrom : input.effectiveFrom,
    effectiveTo: input.effectiveTo === undefined ? assignment.effectiveTo : input.effectiveTo,
  };

  validateTeacherPlacement(next);
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
  validateTeacherPlacement(input);
  validateTimeRange(input.startTime, input.endTime);

  if (input.assignmentId) {
    await requireTeacherAssignment(teacherId, input.assignmentId, true);
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
    assignmentId: input.assignmentId ?? null,
    system: input.system,
    institutionId: input.institutionId,
    programId: input.programId,
    schoolClassId: input.schoolClassId ?? null,
    schoolSectionId: input.schoolSectionId ?? null,
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
    schoolSectionId: input.schoolSectionId === undefined ? period.schoolSectionId : input.schoolSectionId,
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

  validateTeacherPlacement(next);
  validateAssignmentDatePair(next.effectiveFrom ?? undefined, next.effectiveTo ?? undefined);
  validateTimeRange(next.startTime, next.endTime);

  if (next.assignmentId) {
    await requireTeacherAssignment(teacherId, next.assignmentId, true);
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
      assignmentId: next.assignmentId ?? null,
      system: next.system,
      institutionId: next.institutionId,
      programId: next.programId,
      schoolClassId: next.schoolClassId ?? null,
      schoolSectionId: next.schoolSectionId ?? null,
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

export async function getMyTeacherDashboard(request: Request) {
  const actor = await requirePermission(request, "dashboard", "view");
  if (actor.role !== "teacher") throw new HttpError("Teacher dashboard is only available to teacher accounts", 403);

  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, actor.id)).limit(1);
  if (!profile) throw new HttpError("Teacher profile not found", 404);

  const [assignments, timetable] = await Promise.all([
    db
      .select()
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.active, true)))
      .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear)),
    db
      .select()
      .from(teacherTimetablePeriods)
      .where(and(eq(teacherTimetablePeriods.teacherProfileId, profile.id), eq(teacherTimetablePeriods.active, true)))
      .orderBy(asc(teacherTimetablePeriods.weekday), asc(teacherTimetablePeriods.startTime)),
  ]);

  return { profile, account: publicAccount(actor), assignments, timetable };
}

export async function assertTeacherCanAccessAttendancePlacement(
  actorUserId: string,
  system: "school" | "madrassa",
  filters: { classId?: string; sectionId?: string; institutionId?: string; subcategoryId?: string },
) {
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, actorUserId)).limit(1);
  if (!profile || profile.employmentStatus !== "active") throw new HttpError("Teacher profile is not active", 403);

  const clauses = [
    eq(teacherAssignments.teacherProfileId, profile.id),
    eq(teacherAssignments.active, true),
    eq(teacherAssignments.system, system),
    system === "school" ? eq(teacherAssignments.schoolClassId, filters.classId ?? "") : undefined,
    system === "school" ? eq(teacherAssignments.schoolSectionId, filters.sectionId ?? "") : undefined,
    system === "madrassa" ? eq(teacherAssignments.institutionId, filters.institutionId ?? "") : undefined,
    system === "madrassa" ? eq(teacherAssignments.madrassaSubcategoryId, filters.subcategoryId ?? "") : undefined,
  ].filter(Boolean);

  const [assignment] = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(and(...clauses))
    .limit(1);

  if (!assignment) throw new HttpError("Teacher is not assigned to this attendance group", 403);
}

async function loadTeacherDetail(id: string) {
  const profile = await requireTeacherProfile(id);
  const [account] = await db.select().from(authUser).where(eq(authUser.id, profile.userId)).limit(1);
  if (!account) throw new HttpError("Teacher account not found", 404);

  const [assignments, timetable] = await Promise.all([
    db
      .select()
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherProfileId, id))
      .orderBy(asc(teacherAssignments.system), asc(teacherAssignments.academicYear)),
    db
      .select()
      .from(teacherTimetablePeriods)
      .where(eq(teacherTimetablePeriods.teacherProfileId, id))
      .orderBy(asc(teacherTimetablePeriods.weekday), asc(teacherTimetablePeriods.startTime)),
  ]);

  return { profile, account: publicDbAccount(account), assignments, timetable };
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
}

async function cleanupAuthUser(userId: string) {
  try {
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUser(userId);
  } catch {
    // Best-effort cleanup; preserve the original profile creation failure.
  }
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

function hasAnyKey(value: object) {
  return Object.values(value).some((entry) => entry !== undefined);
}

function assertTeacherMayReadDetail(actor: { id: string; role: string }, teacherUserId: string) {
  if (actor.role === "teacher" && actor.id !== teacherUserId) {
    throw new HttpError("Teachers can only view their own teacher profile", 403);
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
