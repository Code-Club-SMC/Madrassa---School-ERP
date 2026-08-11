import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { admissionApplications, admissionEvents } from "@/db/schema/admission";
import { programs, schoolClasses, madrassaSubcategories } from "@/db/schema/academic";
import {
  guardians,
  studentEnrollments,
  studentGuardians,
  studentSiblings,
  students,
} from "@/db/schema/students";
import { user as authUser } from "@/db/schema/auth";
import type { AcademicYearSystem } from "@/db/schema/academic-years";
import { auth } from "@/lib/auth";
import { generateSecurePassword } from "@/lib/generate-password";
import { getActiveAcademicYear } from "@/lib/server/academic-years/service";
import { ensureAcademicSeeded } from "@/lib/server/academic/seed";
import { createUniqueParentLoginIdentity } from "@/lib/server/auth/parent-login";
import { insertStudentEvent } from "@/lib/server/students/events";
import { requireAdmissionPermission } from "./authz";
import { admissionVariantKeys, getRollPrefix, resolveAdmissionTarget } from "./catalog";
import type { AdmissionTarget } from "./catalog";
import { AdmissionError } from "./errors";
import { nextScopedNumber, visibleNumberScopeCode, visibleScopedNumberPrefix } from "./numbering";
import { normalizeAdmissionForm, normalizeFormValues } from "./normalizers";
import { saveAdmissionPhoto } from "./photos";

const formDataSchema = z.record(z.string(), z.unknown()).transform(normalizeFormValues);

export const createAdmissionApplicationSchema = z.object({
  variantKey: z.enum(admissionVariantKeys),
  form: formDataSchema,
  declaration: z.boolean().optional(),
  photoDataUrl: z.string().optional(),
  target: z
    .object({
      institutionId: z.string().optional(),
      programId: z.string().optional(),
      schoolClassId: z.string().nullable().optional(),
      schoolSectionId: z.string().nullable().optional(),
      madrassaSubcategoryId: z.string().nullable().optional(),
      darja: z.string().nullable().optional(),
    })
    .optional(),
});

export const listAdmissionApplicationsSchema = z.object({
  status: z
    .enum([
      "pending",
      "under_review",
      "interview_scheduled",
      "documents_pending",
      "waitlisted",
      "accepted",
      "rejected",
    ])
    .optional(),
  q: z.string().trim().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    "pending",
    "under_review",
    "interview_scheduled",
    "documents_pending",
    "waitlisted",
  ]),
  message: z.string().trim().optional(),
});

export const rejectAdmissionApplicationSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required"),
});

export const acceptAdmissionApplicationSchema = z.object({
  guardianId: z.string().trim().min(1).optional(),
  siblingStudentIds: z.array(z.string().trim().min(1)).default([]),
  createParentAccount: z.boolean().default(false),
  parentEmail: z.email().optional(),
  parentPassword: z.string().min(8).optional(),
});

export const guardianSuggestionsSchema = z.object({
  guardianCnic: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
});

type AdmissionAcceptanceWarning = {
  code: "parent_account_failed";
  message: string;
  metadata: { username?: string; reason: string };
};

type ParentAccountResult =
  | {
      ok: true;
      userId: string;
      email: string;
      credentials: {
        nameUrdu: string;
        nameEnglish: string;
        email: string;
        username: string;
        role: "parent";
        password: string;
      };
    }
  | {
      ok: false;
      username?: string;
      reason: string;
    }
  | null;

export async function createAdmissionApplication(
  input: z.infer<typeof createAdmissionApplicationSchema>,
  source: "public" | "admin",
) {
  await ensureAcademicSeeded();

  const id = randomUUID();
  const form = normalizeFormValues(input.form);
  const normalized = normalizeAdmissionForm(input.variantKey, form);
  const target = await resolveAdmissionTarget(input.variantKey, form, input.target);
  const rollPrefix = await getRollPrefix(target);
  const photoPath = await saveAdmissionPhoto(id, input.photoDataUrl);

  return db.transaction(async (tx) => {
    const refNo = await nextScopedNumber(tx, {
      type: "application",
      institutionId: target.institutionId,
      programId: target.programId,
      schoolClassId: target.schoolClassId,
      madrassaSubcategoryId: target.madrassaSubcategoryId,
      prefix: visibleScopedNumberPrefix(source === "public" ? "APP" : "ADM-REQ", target, rollPrefix),
    });

    const [application] = await tx
      .insert(admissionApplications)
      .values({
        id,
        refNo,
        source,
        variantKey: input.variantKey,
        status: source === "public" ? "pending" : "under_review",
        ...normalized,
        ...target,
        formData: form,
        photoPath,
      })
      .returning();

    await tx.insert(admissionEvents).values({
      id: randomUUID(),
      applicationId: id,
      type: "application_created",
      toStatus: application.status,
      message:
        source === "public"
          ? "Application submitted through public portal"
          : "Admission created by staff",
    });

    return {
      application: toApplicationResponse(application),
      event: "application_created" as const,
    };
  });
}

export async function createDirectAdmission(
  request: Request,
  input: z.infer<typeof createAdmissionApplicationSchema>,
) {
  const actor = await requireAdmissionPermission(request, "admission_new", "create");
  const created = await createAdmissionApplication(input, "admin");
  const accepted = await acceptAdmissionApplication(request, created.application.id, {
    siblingStudentIds: [],
    createParentAccount: true,
  });

  return {
    ...accepted,
    createdByUserId: actor.id,
  };
}

export async function listAdmissionApplications(
  request: Request,
  params: z.infer<typeof listAdmissionApplicationsSchema>,
) {
  await requireAdmissionPermission(request, "admission_queue", "view");
  await ensureAcademicSeeded();

  const clauses = [];
  if (params.status) clauses.push(eq(admissionApplications.status, params.status));
  if (params.q) {
    clauses.push(
      or(
        ilike(admissionApplications.refNo, `%${params.q}%`),
        ilike(admissionApplications.name, `%${params.q}%`),
        ilike(admissionApplications.nameUrdu, `%${params.q}%`),
        ilike(admissionApplications.guardianPhone, `%${params.q}%`),
      ),
    );
  }

  const rows = await db
    .select({
      application: admissionApplications,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      programSystem: programs.system,
      className: schoolClasses.name,
      classNameUrdu: schoolClasses.nameUrdu,
      subcategoryName: madrassaSubcategories.name,
      subcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    })
    .from(admissionApplications)
    .leftJoin(programs, eq(programs.id, admissionApplications.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, admissionApplications.schoolClassId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, admissionApplications.madrassaSubcategoryId),
    )
    .where(clauses.length > 0 ? and(...clauses) : undefined)
    .orderBy(desc(admissionApplications.submittedAt))
    .limit(150);

  return rows.map((row) => ({
    ...toApplicationResponse(row.application),
    system: row.programSystem === "madrassa" ? "madrassa" : "school",
    categoryOrClass:
      row.classNameUrdu ??
      row.subcategoryNameUrdu ??
      row.programNameUrdu ??
      row.className ??
      row.subcategoryName ??
      row.programName ??
      "",
  }));
}

export async function getAdmissionApplication(request: Request, id: string) {
  await requireAdmissionPermission(request, "admission_queue", "view");

  const [application] = await db
    .select()
    .from(admissionApplications)
    .where(eq(admissionApplications.id, id))
    .limit(1);
  if (!application) throw new AdmissionError("Application not found", 404);

  const events = await db
    .select()
    .from(admissionEvents)
    .where(eq(admissionEvents.applicationId, id))
    .orderBy(desc(admissionEvents.createdAt));

  return { application: toApplicationResponse(application), events };
}

export async function updateAdmissionApplicationStatus(
  request: Request,
  id: string,
  input: z.infer<typeof updateApplicationStatusSchema>,
) {
  const actor = await requireAdmissionPermission(request, "admission_queue", "approve");

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(admissionApplications)
      .where(eq(admissionApplications.id, id))
      .limit(1);
    if (!current) throw new AdmissionError("Application not found", 404);
    if (current.status === "accepted" || current.status === "rejected") {
      throw new AdmissionError(
        "Accepted or rejected applications cannot be moved back to review",
        409,
      );
    }

    const [updated] = await tx
      .update(admissionApplications)
      .set({ status: input.status, reviewedByUserId: actor.id, updatedAt: new Date() })
      .where(eq(admissionApplications.id, id))
      .returning();

    await tx.insert(admissionEvents).values({
      id: randomUUID(),
      applicationId: id,
      type: "status_changed",
      fromStatus: current.status,
      toStatus: input.status,
      message: input.message,
      actorUserId: actor.id,
    });

    return { application: toApplicationResponse(updated) };
  });
}

export async function rejectAdmissionApplication(
  request: Request,
  id: string,
  input: z.infer<typeof rejectAdmissionApplicationSchema>,
) {
  const actor = await requireAdmissionPermission(request, "admission_queue", "approve");

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(admissionApplications)
      .where(eq(admissionApplications.id, id))
      .limit(1);
    if (!current) throw new AdmissionError("Application not found", 404);
    if (current.status === "accepted")
      throw new AdmissionError("Accepted applications cannot be rejected", 409);

    const [updated] = await tx
      .update(admissionApplications)
      .set({
        status: "rejected",
        reviewedByUserId: actor.id,
        decidedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(admissionApplications.id, id))
      .returning();

    await tx.insert(admissionEvents).values({
      id: randomUUID(),
      applicationId: id,
      type: "application_rejected",
      fromStatus: current.status,
      toStatus: "rejected",
      message: input.reason,
      actorUserId: actor.id,
    });

    return { application: toApplicationResponse(updated) };
  });
}

export async function acceptAdmissionApplication(
  request: Request,
  id: string,
  input: z.infer<typeof acceptAdmissionApplicationSchema>,
) {
  const actor = await requireAdmissionPermission(request, "admission_queue", "approve");
  await ensureAcademicSeeded();

  const [application] = await db
    .select()
    .from(admissionApplications)
    .where(eq(admissionApplications.id, id))
    .limit(1);
  if (!application) throw new AdmissionError("Application not found", 404);
  if (application.status === "accepted")
    throw new AdmissionError("Application is already accepted", 409);
  if (application.status === "rejected")
    throw new AdmissionError("Rejected applications cannot be accepted", 409);

  const target: AdmissionTarget = {
    institutionId: application.institutionId,
    programId: application.programId,
    schoolClassId: application.schoolClassId,
    schoolSectionId: application.schoolSectionId,
    madrassaSubcategoryId: application.madrassaSubcategoryId,
    darja: application.darja,
  };

  const academicYearSystem = await resolveProgramAcademicYearSystem(target.programId);
  const activeAcademicYear = await getActiveAcademicYear(academicYearSystem);
  const rollPrefix = await getRollPrefix(target);
  const rollScopeCode = visibleNumberScopeCode(target, rollPrefix);
  const parentUser = await maybeCreateParentAccount(application, input);

  try {
    return await db.transaction(async (tx) => {
      const studentId = randomUUID();
      const enrollmentId = randomUUID();
      const guardianId =
        input.guardianId ??
        (await findReusableGuardianId(application.guardianCnic, application.guardianPhone));

      const admissionNo = await nextScopedNumber(tx, {
        type: "admission",
        institutionId: target.institutionId,
        programId: target.programId,
        schoolClassId: target.schoolClassId,
        madrassaSubcategoryId: target.madrassaSubcategoryId,
        prefix: `AD-${rollScopeCode}`,
      });

      const rollNo = await nextScopedNumber(tx, {
        type: "roll",
        institutionId: target.institutionId,
        programId: target.programId,
        schoolClassId: target.schoolClassId,
        madrassaSubcategoryId: target.madrassaSubcategoryId,
        prefix: rollScopeCode,
      });

      await tx.insert(students).values({
        id: studentId,
        name: application.name,
        nameUrdu: application.nameUrdu,
        fatherName: application.fatherName,
        fatherNameUrdu: application.fatherNameUrdu,
        gender: application.gender,
        dob: application.dob,
        cnicBForm: application.cnicBForm,
        photoPath: application.photoPath,
      });

      await tx.insert(studentEnrollments).values({
        id: enrollmentId,
        studentId,
        academicYearId: activeAcademicYear.id,
        ...target,
        admissionNo,
        rollNo,
      });

      const resolvedGuardianId = await upsertGuardianForStudent(tx, {
        existingGuardianId: guardianId,
        userId: parentUser?.ok ? parentUser.userId : null,
        name: application.guardianName,
        nameUrdu: application.guardianNameUrdu,
        cnic: application.guardianCnic,
        phone: application.guardianPhone,
        email: application.guardianEmail,
        address: application.address,
      });

      await tx.insert(studentGuardians).values({
        studentId,
        guardianId: resolvedGuardianId,
        relation: application.guardianRelation,
        isPrimary: true,
      });

      await insertSiblingLinks(tx, studentId, input.siblingStudentIds, actor.id);

      await insertStudentEvent(tx, {
        studentId,
        enrollmentId,
        type: "admission_accepted",
        message: `Admission accepted with roll ${rollNo}`,
        metadata: {
          applicationId: id,
          refNo: application.refNo,
          source: application.source,
          variantKey: application.variantKey,
          admissionNo,
          rollNo,
          institutionId: target.institutionId,
          programId: target.programId,
          schoolClassId: target.schoolClassId,
          schoolSectionId: target.schoolSectionId,
          madrassaSubcategoryId: target.madrassaSubcategoryId,
          darja: target.darja,
        },
        actorUserId: actor.id,
      });

      if (parentUser?.ok) {
        await insertStudentEvent(tx, {
          studentId,
          enrollmentId,
          type: "parent_account_created",
          message: "Parent login created",
          metadata: {
            userId: parentUser.userId,
            username: parentUser.credentials.username,
            guardianId: resolvedGuardianId,
          },
          actorUserId: actor.id,
        });
      }

      if (parentUser && !parentUser.ok) {
        await insertStudentEvent(tx, {
          studentId,
          enrollmentId,
          type: "parent_account_failed",
          message: "Parent login could not be created",
          metadata: {
            username: parentUser.username,
            reason: parentUser.reason,
            guardianId: resolvedGuardianId,
          },
          actorUserId: actor.id,
        });
      }

      const [updated] = await tx
        .update(admissionApplications)
        .set({
          status: "accepted",
          acceptedStudentId: studentId,
          acceptedEnrollmentId: enrollmentId,
          matchedGuardianId: resolvedGuardianId,
          reviewedByUserId: actor.id,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(admissionApplications.id, id))
        .returning();

      await tx.insert(admissionEvents).values([
        {
          id: randomUUID(),
          applicationId: id,
          type: "application_accepted",
          fromStatus: application.status,
          toStatus: "accepted",
          actorUserId: actor.id,
          metadata: {
            studentId,
            enrollmentId,
            guardianId: resolvedGuardianId,
            rollNo,
            admissionNo,
          },
        },
        ...(parentUser?.ok
          ? [
              {
                id: randomUUID(),
                applicationId: id,
                type: "parent_account_created",
                actorUserId: actor.id,
                metadata: { userId: parentUser.userId, username: parentUser.credentials.username },
              },
            ]
          : []),
      ]);

      const warnings: AdmissionAcceptanceWarning[] =
        parentUser && !parentUser.ok
          ? [
              {
                code: "parent_account_failed",
                message: "داخلہ منظور ہو گیا، مگر والدین کا لاگ اِن نہیں بن سکا۔",
                metadata: { username: parentUser.username, reason: parentUser.reason },
              },
            ]
          : [];

      return {
        application: toApplicationResponse(updated),
        student: { id: studentId, rollNo, admissionNo },
        guardian: { id: resolvedGuardianId },
        parentCredentials: parentUser?.ok ? parentUser.credentials : null,
        warnings,
      };
    });
  } catch (error) {
    if (parentUser?.ok) await cleanupParentAccount(parentUser.userId);
    throw error;
  }
}

async function resolveProgramAcademicYearSystem(programId: string): Promise<AcademicYearSystem> {
  const [program] = await db
    .select({ system: programs.system })
    .from(programs)
    .where(eq(programs.id, programId))
    .limit(1);

  if (!program) throw new AdmissionError("Admission program not found", 404);
  if (program.system !== "school" && program.system !== "madrassa") {
    throw new AdmissionError("Admission program has an invalid academic-year system", 500);
  }

  return program.system;
}

export async function suggestGuardians(
  request: Request,
  input: z.infer<typeof guardianSuggestionsSchema>,
) {
  await requireAdmissionPermission(request, "admission_new", "create");

  const clauses = [
    input.guardianCnic ? eq(guardians.cnic, input.guardianCnic) : undefined,
    input.guardianPhone ? eq(guardians.phone, input.guardianPhone) : undefined,
  ].filter(Boolean);

  if (clauses.length === 0) return [];

  const rows = await db
    .select({
      id: guardians.id,
      name: guardians.name,
      nameUrdu: guardians.nameUrdu,
      cnic: guardians.cnic,
      phone: guardians.phone,
      email: guardians.email,
      linkedUserId: guardians.userId,
      studentId: students.id,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      rollNo: studentEnrollments.rollNo,
    })
    .from(guardians)
    .leftJoin(studentGuardians, eq(studentGuardians.guardianId, guardians.id))
    .leftJoin(students, eq(students.id, studentGuardians.studentId))
    .leftJoin(
      studentEnrollments,
      and(eq(studentEnrollments.studentId, students.id), eq(studentEnrollments.status, "active")),
    )
    .where(or(...clauses))
    .limit(50);

  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      nameUrdu: string | null;
      cnic: string | null;
      phone: string | null;
      email: string | null;
      linkedUserId: string | null;
      students: Array<{ id: string; name: string; nameUrdu: string; rollNo: string | null }>;
    }
  >();

  for (const row of rows) {
    const current = grouped.get(row.id) ?? {
      id: row.id,
      name: row.name,
      nameUrdu: row.nameUrdu,
      cnic: row.cnic,
      phone: row.phone,
      email: row.email,
      linkedUserId: row.linkedUserId,
      students: [],
    };

    if (row.studentId && !current.students.some((student) => student.id === row.studentId)) {
      current.students.push({
        id: row.studentId,
        name: row.studentName ?? "",
        nameUrdu: row.studentNameUrdu ?? "",
        rollNo: row.rollNo,
      });
    }

    grouped.set(row.id, current);
  }

  return [...grouped.values()];
}

async function maybeCreateParentAccount(
  application: typeof admissionApplications.$inferSelect,
  input: z.infer<typeof acceptAdmissionApplicationSchema>,
): Promise<ParentAccountResult> {
  if (!input.createParentAccount) return null;

  const existingGuardianId =
    input.guardianId ??
    (await findReusableGuardianId(application.guardianCnic, application.guardianPhone));
  let parentLoginName = application.guardianName;
  if (existingGuardianId) {
    const [existingGuardian] = await db
      .select()
      .from(guardians)
      .where(eq(guardians.id, existingGuardianId))
      .limit(1);
    if (existingGuardian?.userId) return null;
    if (existingGuardian?.name) parentLoginName = existingGuardian.name;
  }

  let identity: Awaited<ReturnType<typeof createUniqueParentLoginIdentity>> | null = null;

  try {
    identity = await createUniqueParentLoginIdentity(parentLoginName);
    const password = input.parentPassword ?? generateSecurePassword(12);
    const result = await (auth as any).api.createUser({
      body: {
        name: application.guardianName,
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

    return {
      ok: true as const,
      userId: result.user.id,
      email: identity.email,
      credentials: {
        nameUrdu: application.guardianNameUrdu ?? application.guardianName,
        nameEnglish: application.guardianName,
        email: identity.email,
        username: identity.username,
        role: "parent",
        password,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      username: identity?.username,
      reason: error instanceof Error ? error.message : "Parent account creation failed",
    };
  }
}

async function cleanupParentAccount(userId: string) {
  try {
    const ctx = await (auth as any).$context;
    await ctx.internalAdapter.deleteUser(userId);
  } catch {
    // Best-effort cleanup only. The event log still shows the accepted admission context.
  }
}

async function findReusableGuardianId(cnic: string | null, phone: string | null) {
  if (!cnic && !phone) return null;

  const [guardian] = await db
    .select({ id: guardians.id })
    .from(guardians)
    .where(
      or(
        cnic ? eq(guardians.cnic, cnic) : undefined,
        phone ? eq(guardians.phone, phone) : undefined,
      ),
    )
    .limit(1);

  return guardian?.id ?? null;
}

async function upsertGuardianForStudent(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    existingGuardianId: string | null;
    userId: string | null;
    name: string;
    nameUrdu: string | null;
    cnic: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  },
) {
  if (input.existingGuardianId) {
    const [updated] = await tx
      .update(guardians)
      .set({
        userId: input.userId ? input.userId : sql`coalesce(${guardians.userId}, null)`,
        name: input.name,
        nameUrdu: input.nameUrdu,
        phone: input.phone,
        email: input.email,
        address: input.address,
        updatedAt: new Date(),
      })
      .where(eq(guardians.id, input.existingGuardianId))
      .returning({ id: guardians.id });

    if (updated) return updated.id;
  }

  const id = randomUUID();
  const [created] = await tx
    .insert(guardians)
    .values({
      id,
      userId: input.userId,
      name: input.name,
      nameUrdu: input.nameUrdu,
      cnic: input.cnic,
      phone: input.phone,
      email: input.email,
      address: input.address,
    })
    .returning({ id: guardians.id });

  return created.id;
}

async function insertSiblingLinks(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  studentId: string,
  siblingStudentIds: string[],
  actorUserId: string,
) {
  const uniqueSiblingIds = [...new Set(siblingStudentIds)].filter((id) => id !== studentId);
  if (uniqueSiblingIds.length === 0) return;

  await tx
    .insert(studentSiblings)
    .values(
      uniqueSiblingIds.map((siblingId) => {
        const [left, right] = [studentId, siblingId].sort();
        return { studentId: left, siblingId: right, confirmedBy: actorUserId };
      }),
    )
    .onConflictDoNothing();
}

function toApplicationResponse(application: typeof admissionApplications.$inferSelect) {
  return {
    id: application.id,
    refNo: application.refNo,
    source: application.source,
    variantKey: application.variantKey,
    status: application.status,
    name: application.name,
    nameUrdu: application.nameUrdu,
    fatherName: application.fatherName,
    fatherNameUrdu: application.fatherNameUrdu,
    gender: application.gender,
    dob: application.dob?.toISOString() ?? null,
    phone: application.guardianPhone ?? "",
    guardianName: application.guardianName,
    guardianPhone: application.guardianPhone,
    guardianCnic: application.guardianCnic,
    address: application.address,
    formData: application.formData,
    institutionId: application.institutionId,
    programId: application.programId,
    schoolClassId: application.schoolClassId,
    schoolSectionId: application.schoolSectionId,
    madrassaSubcategoryId: application.madrassaSubcategoryId,
    darja: application.darja,
    photoPath: application.photoPath,
    acceptedStudentId: application.acceptedStudentId,
    acceptedEnrollmentId: application.acceptedEnrollmentId,
    submittedAt: application.submittedAt.toISOString(),
    decidedAt: application.decidedAt?.toISOString() ?? null,
  };
}
