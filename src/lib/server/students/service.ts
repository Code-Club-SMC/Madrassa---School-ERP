import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
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
import { admissionApplications } from "@/db/schema/admission";
import { user as authUser } from "@/db/schema/auth";
import {
  guardians,
  studentEnrollments,
  studentEvents,
  studentGuardians,
  studentSiblings,
  students,
} from "@/db/schema/students";
import { auth } from "@/lib/auth";
import { generateSecurePassword } from "@/lib/generate-password";
import { requireEditableAcademicYearId } from "@/lib/server/academic-years/service";
import { createUniqueParentLoginIdentity } from "@/lib/server/auth/parent-login";
import { insertStudentEvent } from "@/lib/server/students/events";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import type { ModuleKey, PermissionAction } from "@/lib/permissions/module-registry";

const studentStatuses = ["active", "inactive", "graduated", "dropout", "transferred"] as const;
type StudentSystem = "school" | "madrassa";

type StudentListRow = {
  id: string;
  enrollmentId: string;
  rollNo: string;
  admissionNo: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu: string | null;
  gender: string;
  dob: Date | null;
  cnicBForm: string | null;
  status: string;
  photoPath: string | null;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  institutionSection: string | null;
  programId: string;
  programName: string;
  programNameUrdu: string;
  programSystem: string;
  schoolClassId: string | null;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  schoolSectionId: string | null;
  schoolSectionName: string | null;
  madrassaCategoryId: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  darja: string | null;
  startedAt: Date;
  guardianId: string | null;
  guardianName: string | null;
  guardianNameUrdu: string | null;
  guardianPhone: string | null;
  guardianCnic: string | null;
  guardianEmail: string | null;
  guardianAddress: string | null;
};

type StudentProfileRow = StudentListRow & {
  enrollmentStatus: string;
  endedAt: Date | null;
};

export const listStudentsQuerySchema = z.object({
  system: z.enum(["school", "madrassa"]),
  status: z.enum(studentStatuses).optional(),
  q: z.string().trim().optional(),
  institutionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  subcategoryId: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export const updateStudentSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    nameUrdu: z.string().trim().min(1).optional(),
    fatherName: z.string().trim().min(1).optional(),
    fatherNameUrdu: z.string().trim().nullable().optional(),
    dob: z.string().trim().nullable().optional(),
    cnicBForm: z.string().trim().nullable().optional(),
    photoPath: z.string().trim().nullable().optional(),
  })
  .refine(hasAnyKey, { message: "At least one field is required" });

export const updateStudentStatusSchema = z
  .object({
    status: z.enum(studentStatuses),
    reason: z.string().trim().optional(),
  })
  .refine((input) => input.status === "active" || Boolean(input.reason), {
    message: "Reason is required when status is not active",
    path: ["reason"],
  });

export const upsertStudentGuardianSchema = z
  .object({
    guardianId: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    nameUrdu: z.string().trim().nullable().optional(),
    cnic: z.string().trim().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    email: z.email().nullable().optional(),
    address: z.string().trim().nullable().optional(),
    relation: z.string().trim().min(1).default("father"),
    isPrimary: z.boolean().default(true),
  })
  .refine((input) => Boolean(input.guardianId || input.name), {
    message: "Existing guardian id or guardian name is required",
  });

export const updateGuardianSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    nameUrdu: z.string().trim().nullable().optional(),
    cnic: z.string().trim().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    email: z.email().nullable().optional(),
    address: z.string().trim().nullable().optional(),
    relation: z.string().trim().min(1).optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine(hasAnyKey, { message: "At least one field is required" });

export const siblingInputSchema = z.object({
  siblingStudentId: z.string().trim().min(1),
});

export const moveEnrollmentSchema = z.object({
  enrollmentId: z.string().trim().min(1).optional(),
  institutionId: z.string().trim().min(1),
  programId: z.string().trim().min(1),
  schoolClassId: z.string().trim().nullable().optional(),
  schoolSectionId: z.string().trim().nullable().optional(),
  madrassaSubcategoryId: z.string().trim().nullable().optional(),
  darja: z.string().trim().nullable().optional(),
  reason: z.string().trim().min(1),
});

export const retryGuardianParentAccountSchema = z.object({
  password: z.string().min(8).optional(),
});

type ParentAccountRetryWarning = {
  code: "parent_account_failed";
  message: string;
  metadata: {
    username?: string;
    reason: string;
    guardianId: string;
  };
};

export async function listStudents(
  request: Request,
  query: z.infer<typeof listStudentsQuerySchema>,
) {
  await requirePermission(request, moduleForSystem(query.system), "view");

  const clauses = [
    query.system === "madrassa"
      ? eq(programs.system, "madrassa")
      : or(eq(programs.system, "school"), eq(programs.system, "school_support")),
    query.status ? eq(students.status, query.status) : undefined,
    query.institutionId ? eq(studentEnrollments.institutionId, query.institutionId) : undefined,
    query.programId ? eq(studentEnrollments.programId, query.programId) : undefined,
    query.classId ? eq(studentEnrollments.schoolClassId, query.classId) : undefined,
    query.subcategoryId
      ? eq(studentEnrollments.madrassaSubcategoryId, query.subcategoryId)
      : undefined,
    isNull(studentEnrollments.endedAt),
    query.q
      ? or(
          ilike(students.name, `%${query.q}%`),
          ilike(students.nameUrdu, `%${query.q}%`),
          ilike(studentEnrollments.rollNo, `%${query.q}%`),
          ilike(guardians.phone, `%${query.q}%`),
        )
      : undefined,
  ].filter(Boolean);

  const where = and(...clauses);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select(studentListSelection())
      .from(students)
      .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
      .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
      .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
      .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
      .leftJoin(
        madrassaSubcategories,
        eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
      )
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
      .leftJoin(
        studentGuardians,
        and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true)),
      )
      .leftJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
      .where(where)
      .orderBy(desc(studentEnrollments.startedAt), desc(students.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(students)
      .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
      .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
      .leftJoin(
        studentGuardians,
        and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true)),
      )
      .leftJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
      .where(where),
  ]);

  return {
    students: rows.map(toStudentListItem),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: Number(totalRows[0]?.count ?? 0),
    },
  };
}

export async function getStudentProfile(request: Request, studentId: string) {
  const context = await getStudentPermissionContext(request, studentId, "view");

  const [profileRows, guardianRows, eventRows, admissionRows] = await Promise.all([
    db
      .select(studentProfileSelection())
      .from(students)
      .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
      .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
      .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
      .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
      .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
      .leftJoin(
        madrassaSubcategories,
        eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
      )
      .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
      .leftJoin(
        studentGuardians,
        and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true)),
      )
      .leftJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
      .where(eq(students.id, studentId))
      .orderBy(desc(studentEnrollments.startedAt)),
    db
      .select({
        guardianId: guardians.id,
        userId: guardians.userId,
        name: guardians.name,
        nameUrdu: guardians.nameUrdu,
        cnic: guardians.cnic,
        phone: guardians.phone,
        email: guardians.email,
        address: guardians.address,
        relation: studentGuardians.relation,
        isPrimary: studentGuardians.isPrimary,
        parentUserEmail: authUser.email,
        parentUserUsername: authUser.username,
      })
      .from(studentGuardians)
      .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
      .leftJoin(authUser, eq(authUser.id, guardians.userId))
      .where(eq(studentGuardians.studentId, studentId)),
    db
      .select({
        id: studentEvents.id,
        studentId: studentEvents.studentId,
        enrollmentId: studentEvents.enrollmentId,
        type: studentEvents.type,
        message: studentEvents.message,
        metadata: studentEvents.metadata,
        actorUserId: studentEvents.actorUserId,
        actorName: authUser.name,
        actorEmail: authUser.email,
        createdAt: studentEvents.createdAt,
      })
      .from(studentEvents)
      .leftJoin(authUser, eq(authUser.id, studentEvents.actorUserId))
      .where(eq(studentEvents.studentId, studentId))
      .orderBy(desc(studentEvents.createdAt))
      .limit(100),
    db
      .select({
        id: admissionApplications.id,
        refNo: admissionApplications.refNo,
        source: admissionApplications.source,
        variantKey: admissionApplications.variantKey,
        submittedAt: admissionApplications.submittedAt,
        decidedAt: admissionApplications.decidedAt,
      })
      .from(admissionApplications)
      .where(eq(admissionApplications.acceptedStudentId, studentId))
      .orderBy(desc(admissionApplications.decidedAt)),
  ]);

  if (profileRows.length === 0) throw new HttpError("Student not found", 404);

  return {
    student: toStudentProfileIdentity(profileRows[0], context.system),
    enrollments: profileRows.map(toEnrollmentProfile),
    guardians: guardianRows,
    siblings: await listSiblingProfiles(studentId),
    events: eventRows.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    })),
    admission: admissionRows[0] ?? null,
  };
}

export async function updateStudent(
  request: Request,
  studentId: string,
  input: z.infer<typeof updateStudentSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");

  const [updated] = await db
    .update(students)
    .set({
      ...input,
      dob: input.dob
        ? new Date(`${input.dob}T00:00:00.000Z`)
        : input.dob === null
          ? null
          : undefined,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  await insertStudentEvent(db, {
    studentId,
    enrollmentId: context.enrollmentId,
    type: "student_updated",
    message: "Student identity details updated",
    metadata: {},
    actorUserId: context.actor.id,
  });
  return updated;
}

export async function updateStudentStatus(
  request: Request,
  studentId: string,
  input: z.infer<typeof updateStudentStatusSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");

  const [current] = await db
    .select({ status: students.status })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  if (!current) throw new HttpError("Student not found", 404);

  const [updated] = await db
    .update(students)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(students.id, studentId))
    .returning();

  await db
    .update(studentEnrollments)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(studentEnrollments.id, context.enrollmentId));

  await insertStudentEvent(db, {
    studentId,
    enrollmentId: context.enrollmentId,
    type: "status_changed",
    message: input.reason ?? `Status changed to ${input.status}`,
    metadata: {
      previousStatus: current.status,
      status: input.status,
      reason: input.reason ?? null,
    },
    actorUserId: context.actor.id,
  });

  return updated;
}

export async function upsertStudentGuardian(
  request: Request,
  studentId: string,
  input: z.infer<typeof upsertStudentGuardianSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");

  const guardianId = input.guardianId ?? randomUUID();
  const [existingGuardian] = input.guardianId
    ? await db
        .select({ name: guardians.name })
        .from(guardians)
        .where(eq(guardians.id, input.guardianId))
        .limit(1)
    : [];
  if (!input.guardianId) {
    await db.insert(guardians).values({
      id: guardianId,
      name: input.name ?? "Guardian",
      nameUrdu: input.nameUrdu ?? null,
      cnic: input.cnic ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
    });
  }

  await db
    .insert(studentGuardians)
    .values({
      studentId,
      guardianId,
      relation: input.relation,
      isPrimary: input.isPrimary,
    })
    .onConflictDoUpdate({
      target: [studentGuardians.studentId, studentGuardians.guardianId],
      set: { relation: input.relation, isPrimary: input.isPrimary },
    });

  if (input.isPrimary) {
    await db
      .update(studentGuardians)
      .set({ isPrimary: false })
      .where(and(eq(studentGuardians.studentId, studentId), eq(studentGuardians.isPrimary, true)));
    await db
      .update(studentGuardians)
      .set({ isPrimary: true })
      .where(
        and(eq(studentGuardians.studentId, studentId), eq(studentGuardians.guardianId, guardianId)),
      );
  }

  await insertStudentEvent(db, {
    studentId,
    enrollmentId: context.enrollmentId,
    type: "guardian_linked",
    message: "Guardian linked to student",
    metadata: {
      guardianId,
      guardianName: input.name ?? existingGuardian?.name ?? "Guardian",
      relation: input.relation,
      isPrimary: input.isPrimary,
    },
    actorUserId: context.actor.id,
  });
  return { guardianId };
}

export async function updateStudentGuardian(
  request: Request,
  studentId: string,
  guardianId: string,
  input: z.infer<typeof updateGuardianSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");
  await assertGuardianLinked(studentId, guardianId);
  const [existingGuardian] = await db
    .select({
      name: guardians.name,
      relation: studentGuardians.relation,
      isPrimary: studentGuardians.isPrimary,
    })
    .from(guardians)
    .innerJoin(studentGuardians, eq(studentGuardians.guardianId, guardians.id))
    .where(and(eq(guardians.id, guardianId), eq(studentGuardians.studentId, studentId)))
    .limit(1);

  const guardianUpdates = {
    name: input.name,
    nameUrdu: input.nameUrdu,
    cnic: input.cnic,
    phone: input.phone,
    email: input.email,
    address: input.address,
    updatedAt: new Date(),
  };

  await db.update(guardians).set(guardianUpdates).where(eq(guardians.id, guardianId));

  if (input.relation !== undefined || input.isPrimary !== undefined) {
    await db
      .update(studentGuardians)
      .set({
        relation: input.relation,
        isPrimary: input.isPrimary,
      })
      .where(
        and(eq(studentGuardians.studentId, studentId), eq(studentGuardians.guardianId, guardianId)),
      );
  }

  if (input.isPrimary === true) {
    await db
      .update(studentGuardians)
      .set({ isPrimary: false })
      .where(and(eq(studentGuardians.studentId, studentId), eq(studentGuardians.isPrimary, true)));
    await db
      .update(studentGuardians)
      .set({ isPrimary: true })
      .where(
        and(eq(studentGuardians.studentId, studentId), eq(studentGuardians.guardianId, guardianId)),
      );
  }

  await insertStudentEvent(db, {
    studentId,
    enrollmentId: context.enrollmentId,
    type: "guardian_updated",
    message: "Guardian details updated",
    metadata: {
      guardianId,
      guardianName: input.name ?? existingGuardian?.name ?? "Guardian",
      relation: input.relation ?? existingGuardian?.relation ?? "guardian",
      isPrimary: input.isPrimary ?? existingGuardian?.isPrimary ?? false,
    },
    actorUserId: context.actor.id,
  });
  return { guardianId };
}

export async function addStudentSibling(
  request: Request,
  studentId: string,
  input: z.infer<typeof siblingInputSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");
  if (studentId === input.siblingStudentId)
    throw new HttpError("A student cannot be linked as their own sibling", 400);

  const [sibling] = await db
    .select({ id: students.id, name: students.name, nameUrdu: students.nameUrdu })
    .from(students)
    .where(eq(students.id, input.siblingStudentId))
    .limit(1);
  if (!sibling) throw new HttpError("Sibling student not found", 404);

  const [left, right] = [studentId, input.siblingStudentId].sort();
  await db
    .insert(studentSiblings)
    .values({ studentId: left, siblingId: right, confirmedBy: context.actor.id })
    .onConflictDoNothing();

  await insertStudentEvent(db, {
    studentId,
    enrollmentId: context.enrollmentId,
    type: "sibling_linked",
    message: "Sibling link confirmed",
    metadata: {
      siblingStudentId: input.siblingStudentId,
      siblingName: sibling.name,
      siblingNameUrdu: sibling.nameUrdu,
    },
    actorUserId: context.actor.id,
  });
  return { studentId: left, siblingId: right };
}

export async function removeStudentSibling(
  request: Request,
  studentId: string,
  siblingStudentId: string,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");
  const [sibling] = await db
    .select({ id: students.id, name: students.name, nameUrdu: students.nameUrdu })
    .from(students)
    .where(eq(students.id, siblingStudentId))
    .limit(1);
  const [left, right] = [studentId, siblingStudentId].sort();

  await db
    .delete(studentSiblings)
    .where(and(eq(studentSiblings.studentId, left), eq(studentSiblings.siblingId, right)));
  await insertStudentEvent(db, {
    studentId,
    enrollmentId: context.enrollmentId,
    type: "sibling_removed",
    message: "Sibling link removed",
    metadata: {
      siblingStudentId,
      siblingName: sibling?.name ?? null,
      siblingNameUrdu: sibling?.nameUrdu ?? null,
    },
    actorUserId: context.actor.id,
  });
  return { studentId: left, siblingId: right };
}

export async function moveStudentEnrollment(
  request: Request,
  studentId: string,
  input: z.infer<typeof moveEnrollmentSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");
  const enrollmentId = input.enrollmentId ?? context.enrollmentId;
  const [currentEnrollment] = await db
    .select(studentProfileSelection())
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
    )
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .leftJoin(
      studentGuardians,
      and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true)),
    )
    .leftJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
    .where(and(eq(students.id, studentId), eq(studentEnrollments.id, enrollmentId)))
    .limit(1);
  if (!currentEnrollment) throw new HttpError("Enrollment not found", 404);

  const target = await validateEnrollmentTarget(studentId, input);

  const [updated] = await db
    .update(studentEnrollments)
    .set({
      institutionId: target.institutionId,
      programId: target.programId,
      schoolClassId: target.schoolClassId,
      schoolSectionId: target.schoolSectionId,
      madrassaSubcategoryId: target.madrassaSubcategoryId,
      darja: target.darja,
      updatedAt: new Date(),
    })
    .where(
      and(eq(studentEnrollments.id, enrollmentId), eq(studentEnrollments.studentId, studentId)),
    )
    .returning();

  if (!updated) throw new HttpError("Enrollment not found", 404);

  await insertStudentEvent(db, {
    studentId,
    enrollmentId,
    type: "enrollment_moved",
    message: input.reason,
    metadata: {
      reason: input.reason,
      from: {
        institutionName: currentEnrollment.institutionName,
        programName: currentEnrollment.programName,
        groupName: currentEnrollment.schoolClassName ?? currentEnrollment.madrassaSubcategoryName,
        sectionName: currentEnrollment.schoolSectionName,
        darja: currentEnrollment.darja,
      },
      to: {
        institutionId: target.institutionId,
        programId: target.programId,
        schoolClassId: target.schoolClassId,
        schoolSectionId: target.schoolSectionId,
        madrassaSubcategoryId: target.madrassaSubcategoryId,
        darja: target.darja,
      },
    },
    actorUserId: context.actor.id,
  });

  return updated;
}

export async function retryGuardianParentAccount(
  request: Request,
  studentId: string,
  guardianId: string,
  input: z.infer<typeof retryGuardianParentAccountSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");
  await assertGuardianLinked(studentId, guardianId);

  const [guardian] = await db.select().from(guardians).where(eq(guardians.id, guardianId)).limit(1);
  if (!guardian) throw new HttpError("Guardian not found", 404);
  if (guardian.userId) throw new HttpError("Guardian already has a parent login", 409);

  let identity: Awaited<ReturnType<typeof createUniqueParentLoginIdentity>> | null = null;

  try {
    identity = await createUniqueParentLoginIdentity(guardian.name);
    const password = input.password ?? generateSecurePassword(12);
    const result = await auth.api.createUser({
      body: {
        name: guardian.name,
        email: identity.email,
        password,
        role: "parent",
        data: {
          username: identity.username,
          displayUsername: identity.username,
          status: "active",
          systemAccess: "both",
          mustChangePassword: true,
        },
      },
    });

    if (!result?.user?.id) throw new Error("Better Auth did not return a user id");

    await db
      .update(guardians)
      .set({ userId: result.user.id, updatedAt: new Date() })
      .where(eq(guardians.id, guardianId));
    await insertStudentEvent(db, {
      studentId,
      enrollmentId: context.enrollmentId,
      type: "parent_account_created",
      message: "Parent login created after retry",
      metadata: {
        userId: result.user.id,
        username: identity.username,
        guardianId,
        source: "student_profile_retry",
      },
      actorUserId: context.actor.id,
    });

    return {
      parentCredentials: {
        nameUrdu: guardian.nameUrdu ?? guardian.name,
        nameEnglish: guardian.name,
        email: identity.email,
        username: identity.username,
        role: "parent" as const,
        password,
      },
      warning: undefined,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Parent account creation failed";
    const warning: ParentAccountRetryWarning = {
      code: "parent_account_failed",
      message: "والدین کا لاگ اِن نہیں بن سکا۔",
      metadata: { username: identity?.username, reason, guardianId },
    };

    await insertStudentEvent(db, {
      studentId,
      enrollmentId: context.enrollmentId,
      type: "parent_account_failed",
      message: "Parent login retry failed",
      metadata: { ...warning.metadata, source: "student_profile_retry" },
      actorUserId: context.actor.id,
    });

    return { parentCredentials: null, warning };
  }
}

function studentListSelection() {
  return {
    id: students.id,
    name: students.name,
    nameUrdu: students.nameUrdu,
    fatherName: students.fatherName,
    fatherNameUrdu: students.fatherNameUrdu,
    gender: students.gender,
    dob: students.dob,
    cnicBForm: students.cnicBForm,
    status: students.status,
    photoPath: students.photoPath,
    enrollmentId: studentEnrollments.id,
    rollNo: studentEnrollments.rollNo,
    admissionNo: studentEnrollments.admissionNo,
    institutionId: institutions.id,
    institutionName: institutions.name,
    institutionNameUrdu: institutions.nameUrdu,
    institutionSection: institutions.section,
    programId: programs.id,
    programName: programs.name,
    programNameUrdu: programs.nameUrdu,
    programSystem: programs.system,
    schoolClassId: schoolClasses.id,
    schoolClassName: schoolClasses.name,
    schoolClassNameUrdu: schoolClasses.nameUrdu,
    schoolSectionId: schoolClassSections.id,
    schoolSectionName: schoolClassSections.name,
    madrassaCategoryId: madrassaCategories.id,
    madrassaCategoryName: madrassaCategories.name,
    madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
    madrassaSubcategoryId: madrassaSubcategories.id,
    madrassaSubcategoryName: madrassaSubcategories.name,
    madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    darja: studentEnrollments.darja,
    startedAt: studentEnrollments.startedAt,
    guardianId: guardians.id,
    guardianName: guardians.name,
    guardianNameUrdu: guardians.nameUrdu,
    guardianPhone: guardians.phone,
    guardianCnic: guardians.cnic,
    guardianEmail: guardians.email,
    guardianAddress: guardians.address,
  };
}

function studentProfileSelection() {
  return {
    ...studentListSelection(),
    enrollmentStatus: studentEnrollments.status,
    endedAt: studentEnrollments.endedAt,
  };
}

function toStudentListItem(row: StudentListRow) {
  const system: StudentSystem = row.programSystem === "madrassa" ? "madrassa" : "school";
  return {
    id: row.id,
    rollNo: row.rollNo,
    admissionNo: row.admissionNo,
    name: row.name,
    nameUrdu: row.nameUrdu,
    fatherName: row.fatherName,
    fatherNameUrdu: row.fatherNameUrdu,
    gender: row.gender,
    dob: row.dob?.toISOString() ?? "",
    cnicBForm: row.cnicBForm,
    status: row.status,
    photoPath: row.photoPath,
    system,
    institutionId: row.institutionId,
    institutionName: row.institutionName,
    institutionNameUrdu: row.institutionNameUrdu,
    institutionSection: row.institutionSection ?? (row.gender === "female" ? "banat" : "baneen"),
    programId: row.programId,
    programName: row.programName,
    programNameUrdu: row.programNameUrdu,
    classId: row.schoolClassId ?? undefined,
    section: row.schoolSectionName ?? undefined,
    categoryId: row.madrassaCategoryId ?? undefined,
    subcategoryId: row.madrassaSubcategoryId ?? undefined,
    darja: row.darja ?? undefined,
    groupLabel: row.schoolClassNameUrdu ?? row.madrassaSubcategoryNameUrdu ?? row.programNameUrdu,
    groupEnglish: row.schoolClassName ?? row.madrassaSubcategoryName ?? row.programName,
    admissionDate: row.startedAt.toISOString(),
    guardianId: row.guardianId,
    guardianName: row.guardianName ?? "—",
    guardianNameUrdu: row.guardianNameUrdu ?? row.guardianName ?? "—",
    guardianPhone: row.guardianPhone ?? "",
    guardianCnic: row.guardianCnic ?? "",
    guardianEmail: row.guardianEmail,
    guardianAddress: row.guardianAddress ?? "",
    monthlyFee: 0,
    monthlyFeePaisa: 0,
  };
}

function toStudentProfileIdentity(row: StudentProfileRow, system: StudentSystem) {
  return {
    ...toStudentListItem(row),
    system,
  };
}

function toEnrollmentProfile(row: StudentProfileRow) {
  return {
    id: row.enrollmentId,
    rollNo: row.rollNo,
    admissionNo: row.admissionNo,
    status: row.enrollmentStatus,
    institutionId: row.institutionId,
    institutionName: row.institutionName,
    institutionNameUrdu: row.institutionNameUrdu,
    programId: row.programId,
    programName: row.programName,
    programNameUrdu: row.programNameUrdu,
    programSystem: row.programSystem,
    schoolClassId: row.schoolClassId,
    schoolClassName: row.schoolClassName,
    schoolClassNameUrdu: row.schoolClassNameUrdu,
    schoolSectionId: row.schoolSectionId,
    schoolSectionName: row.schoolSectionName,
    madrassaCategoryId: row.madrassaCategoryId,
    madrassaCategoryName: row.madrassaCategoryName,
    madrassaCategoryNameUrdu: row.madrassaCategoryNameUrdu,
    madrassaSubcategoryId: row.madrassaSubcategoryId,
    madrassaSubcategoryName: row.madrassaSubcategoryName,
    madrassaSubcategoryNameUrdu: row.madrassaSubcategoryNameUrdu,
    darja: row.darja,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
  };
}

async function getStudentPermissionContext(
  request: Request,
  studentId: string,
  action: PermissionAction,
) {
  const [row] = await db
    .select({
      enrollmentId: studentEnrollments.id,
      academicYearId: studentEnrollments.academicYearId,
      programSystem: programs.system,
    })
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .where(and(eq(students.id, studentId), isNull(studentEnrollments.endedAt)))
    .orderBy(desc(studentEnrollments.startedAt))
    .limit(1);

  if (!row) throw new HttpError("Student not found", 404);

  const system: StudentSystem = row.programSystem === "madrassa" ? "madrassa" : "school";
  const actor = await requirePermission(request, moduleForSystem(system), action);
  if (action !== "view") await requireEditableAcademicYearId(row.academicYearId);
  return { actor, system, enrollmentId: row.enrollmentId, academicYearId: row.academicYearId };
}

function moduleForSystem(system: "school" | "madrassa"): ModuleKey {
  return system === "madrassa" ? "madrassa_students" : "school_students";
}

async function assertGuardianLinked(studentId: string, guardianId: string) {
  const [link] = await db
    .select()
    .from(studentGuardians)
    .where(
      and(eq(studentGuardians.studentId, studentId), eq(studentGuardians.guardianId, guardianId)),
    )
    .limit(1);
  if (!link) throw new HttpError("Guardian is not linked to this student", 404);
}

async function listSiblingProfiles(studentId: string) {
  const links = await db
    .select()
    .from(studentSiblings)
    .where(or(eq(studentSiblings.studentId, studentId), eq(studentSiblings.siblingId, studentId)));

  const siblingIds = links.map((link) =>
    link.studentId === studentId ? link.siblingId : link.studentId,
  );
  if (siblingIds.length === 0) return [];

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      rollNo: studentEnrollments.rollNo,
      status: students.status,
    })
    .from(students)
    .leftJoin(
      studentEnrollments,
      and(eq(studentEnrollments.studentId, students.id), isNull(studentEnrollments.endedAt)),
    )
    .where(inArray(students.id, siblingIds));

  return rows;
}

async function validateEnrollmentTarget(
  studentId: string,
  input: z.infer<typeof moveEnrollmentSchema>,
) {
  const [student] = await db
    .select({ gender: students.gender })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  if (!student) throw new HttpError("Student not found", 404);

  const [program] = await db
    .select({
      id: programs.id,
      institutionId: programs.institutionId,
      system: programs.system,
      kind: programs.kind,
    })
    .from(programs)
    .where(and(eq(programs.id, input.programId), eq(programs.institutionId, input.institutionId)))
    .limit(1);

  if (!program) throw new HttpError("Program does not belong to the selected institution", 400);

  if (program.system === "madrassa") {
    if (input.institutionId === "jamia_qasmia_baneen" && student.gender !== "male") {
      throw new HttpError("Jamia Qasmia Lil-Baneen is the boys madrassa", 400);
    }
    if (input.institutionId === "jamia_zainab_banat" && student.gender !== "female") {
      throw new HttpError("Jamia Zainab Lil-Banat is the girls madrassa", 400);
    }
    if (!input.madrassaSubcategoryId) throw new HttpError("Madrassa subcategory is required", 400);
    const [subcategory] = await db
      .select({ id: madrassaSubcategories.id, darja: madrassaSubcategories.darja })
      .from(madrassaSubcategories)
      .where(eq(madrassaSubcategories.id, input.madrassaSubcategoryId))
      .limit(1);
    if (!subcategory) throw new HttpError("Madrassa subcategory not found", 404);
    return {
      institutionId: input.institutionId,
      programId: input.programId,
      schoolClassId: null,
      schoolSectionId: null,
      madrassaSubcategoryId: input.madrassaSubcategoryId,
      darja: input.darja ?? subcategory.darja ?? null,
    };
  }

  if (!input.schoolClassId) throw new HttpError("School class is required", 400);
  if (
    program.system === "school_support" &&
    !["nursery", "kg", "c1", "c2", "c3", "c4", "c5"].includes(input.schoolClassId)
  ) {
    throw new HttpError("Jamia Zainab school support cannot exceed Class 5", 400);
  }

  if (input.schoolSectionId) {
    const [section] = await db
      .select({ id: schoolClassSections.id })
      .from(schoolClassSections)
      .where(
        and(
          eq(schoolClassSections.id, input.schoolSectionId),
          eq(schoolClassSections.classId, input.schoolClassId),
        ),
      )
      .limit(1);
    if (!section) throw new HttpError("School section does not belong to selected class", 400);
  }

  return {
    institutionId: input.institutionId,
    programId: input.programId,
    schoolClassId: input.schoolClassId,
    schoolSectionId: input.schoolSectionId ?? null,
    madrassaSubcategoryId: null,
    darja: null,
  };
}

function hasAnyKey(value: Record<string, unknown>) {
  return Object.values(value).some((item) => item !== undefined);
}
