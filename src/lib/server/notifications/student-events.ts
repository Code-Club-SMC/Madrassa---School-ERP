import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { db } from "@/db";
import { notificationEvents, type NotificationAudience } from "@/db/schema/notifications";
import { guardians, studentGuardians, students } from "@/db/schema/students";
import {
  notificationTemplatesForStudentEvent,
  type StudentNotificationTemplate,
} from "@/lib/server/notifications/domain";
import type { InsertStudentEventInput } from "@/lib/server/students/events";

type DbLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
type NotificationEventInsert = typeof notificationEvents.$inferInsert;

export async function createNotificationsForStudentEvent(
  tx: DbLike,
  input: InsertStudentEventInput & { studentEventId: string },
) {
  const [student] = await tx
    .select({
      id: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
    })
    .from(students)
    .where(eq(students.id, input.studentId))
    .limit(1);

  if (!student) return;

  const templates = notificationTemplatesForStudentEvent({
    type: input.type,
    message: input.message,
    studentName: student.name,
    studentNameUrdu: student.nameUrdu,
  });
  if (templates.length === 0) return;

  const guardianRows = await tx
    .select({
      guardianId: guardians.id,
      userId: guardians.userId,
    })
    .from(studentGuardians)
    .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
    .where(eq(studentGuardians.studentId, input.studentId));

  const values: NotificationEventInsert[] = templates.flatMap((template) =>
    notificationRowsForTemplate(template, input, guardianRows),
  );
  if (values.length === 0) return;

  await tx.insert(notificationEvents).values(values);
}

function notificationRowsForTemplate(
  template: StudentNotificationTemplate,
  input: InsertStudentEventInput & { studentEventId: string },
  guardiansForStudent: Array<{ guardianId: string; userId: string | null }>,
): NotificationEventInsert[] {
  const metadata = {
    ...(input.metadata ?? {}),
    source: "student_event",
    studentEventId: input.studentEventId,
    studentEventType: input.type,
  };

  if (template.audience === "staff") {
    return [
      {
        id: randomUUID(),
        audience: template.audience satisfies NotificationAudience,
        category: template.category,
        channel: "in_app" as const,
        status: "recorded" as const,
        source: "system" as const,
        title: template.title,
        body: template.body,
        studentId: input.studentId,
        guardianId: null,
        userId: null,
        metadata,
      },
    ];
  }

  return guardiansForStudent
    .filter((guardian) => Boolean(guardian.userId))
    .map((guardian) => ({
      id: randomUUID(),
      audience: template.audience,
      category: template.category,
      channel: "in_app" as const,
      status: "recorded" as const,
      source: "system" as const,
      title: template.title,
      body: template.body,
      studentId: input.studentId,
      guardianId: guardian.guardianId,
      userId: guardian.userId,
      metadata,
    }));
}
