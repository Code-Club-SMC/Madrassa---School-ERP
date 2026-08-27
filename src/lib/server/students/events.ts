import { randomUUID } from "node:crypto";
import type { db } from "@/db";
import { studentEvents } from "@/db/schema/students";
import { createNotificationsForStudentEvent } from "@/lib/server/notifications/student-events";

export const studentEventTypes = [
  "admission_accepted",
  "parent_account_created",
  "parent_account_failed",
  "student_updated",
  "status_changed",
  "student_deleted",
  "guardian_linked",
  "guardian_updated",
  "sibling_linked",
  "sibling_removed",
  "enrollment_moved",
  "fee_charge_created",
  "fee_payment_recorded",
  "fee_charge_reversed",
  "fee_payment_reversed",
  "fee_refund_recorded",
  "fee_adjustment_recorded",
  "attendance_absent_marked",
  "attendance_late_marked",
  "attendance_leave_marked",
  "attendance_corrected",
  "exam_result_published",
  "exam_result_failed",
  "exam_dmc_generated",
  "promotion_applied",
  "promotion_repeated",
  "promotion_graduated",
  "promotion_dropout",
  "promotion_inactive",
] as const;

export type StudentEventType = (typeof studentEventTypes)[number];
export type StudentEventMetadata = Record<string, unknown>;

type DbLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type InsertStudentEventInput = {
  studentId: string;
  enrollmentId?: string | null;
  type: StudentEventType;
  message: string;
  metadata?: StudentEventMetadata;
  actorUserId?: string | null;
};

export async function insertStudentEvent(tx: DbLike, input: InsertStudentEventInput) {
  const studentEventId = randomUUID();
  await tx.insert(studentEvents).values({
    id: studentEventId,
    studentId: input.studentId,
    enrollmentId: input.enrollmentId ?? null,
    type: input.type,
    message: input.message,
    metadata: input.metadata ?? {},
    actorUserId: input.actorUserId ?? null,
  });
  await createNotificationsForStudentEvent(tx, { ...input, studentEventId });
}
