import { z } from "zod";
import type {
  NotificationAudience,
  NotificationCategory,
  NotificationSource,
  NotificationStatus,
} from "@/db/schema/notifications";
import type { StudentEventType } from "@/lib/server/students/events";
import type { UserRole } from "@/types";

export const notificationCategories = [
  "admission",
  "attendance",
  "exam",
  "fee",
  "guardian",
  "student",
  "system",
] as const;

export const notificationAudiences = ["staff", "parent"] as const;
export const notificationSources = [
  "system",
  "announcement",
] as const satisfies readonly NotificationSource[];
export const notificationStatuses = [
  "recorded",
  "published",
  "scheduled",
  "archived",
] as const satisfies readonly NotificationStatus[];

export const notificationReadPatchSchema = z.object({
  read: z.boolean().default(true),
});

export function isNotificationVisibleNow(input: {
  status: NotificationStatus;
  publishAt?: Date | string | null;
  expiresAt?: Date | string | null;
  now?: Date;
}) {
  if (input.status === "archived") return false;

  const now = input.now ?? new Date();
  const publishAt = dateValue(input.publishAt);
  const expiresAt = dateValue(input.expiresAt);

  if (input.status === "scheduled" && (!publishAt || publishAt > now)) return false;
  if (publishAt && publishAt > now) return false;
  if (expiresAt && expiresAt <= now) return false;
  return true;
}

export type NotificationActorContext = {
  userId: string;
  role: UserRole;
  guardianIds?: string[];
};

export type ReadableNotificationEvent = {
  audience: NotificationAudience;
  userId: string | null;
  guardianId: string | null;
  status?: NotificationStatus;
  publishAt?: Date | string | null;
  expiresAt?: Date | string | null;
};

export type StudentNotificationTemplate = {
  audience: NotificationAudience;
  category: NotificationCategory;
  title: string;
  body: string;
};

const staffRoles = new Set<UserRole>([
  "super_admin",
  "admin",
  "principal",
  "hr_manager",
  "accountant",
  "librarian",
  "receptionist",
  "teacher",
  "staff",
]);

export function canReadNotificationEvent(
  actor: NotificationActorContext,
  event: ReadableNotificationEvent,
) {
  if (staffRoles.has(actor.role)) return true;
  if (actor.role !== "parent" || event.audience !== "parent") return false;
  if (!event.userId && !event.guardianId) return true;
  if (event.userId === actor.userId) return true;
  return Boolean(event.guardianId && actor.guardianIds?.includes(event.guardianId));
}

export function notificationTemplatesForStudentEvent(input: {
  type: StudentEventType;
  message: string;
  studentName: string;
  studentNameUrdu: string;
}): StudentNotificationTemplate[] {
  const name = input.studentNameUrdu || input.studentName;
  const baseBody = `${name}: ${input.message}`;

  switch (input.type) {
    case "admission_accepted":
      return [
        { audience: "parent", category: "admission", title: "Admission accepted", body: baseBody },
      ];
    case "parent_account_created":
      return [
        { audience: "parent", category: "guardian", title: "Parent login created", body: baseBody },
      ];
    case "parent_account_failed":
      return [
        {
          audience: "staff",
          category: "guardian",
          title: "Parent account creation failed",
          body: baseBody,
        },
      ];
    case "fee_charge_created":
      return [{ audience: "parent", category: "fee", title: "Fee charged", body: baseBody }];
    case "fee_payment_recorded":
      return [
        { audience: "parent", category: "fee", title: "Fee payment recorded", body: baseBody },
      ];
    case "fee_charge_reversed":
    case "fee_payment_reversed":
    case "fee_refund_recorded":
    case "fee_adjustment_recorded":
      return [{ audience: "parent", category: "fee", title: "Fee ledger updated", body: baseBody }];
    case "attendance_absent_marked":
      return [
        { audience: "parent", category: "attendance", title: "Absence marked", body: baseBody },
      ];
    case "attendance_late_marked":
      return [
        {
          audience: "parent",
          category: "attendance",
          title: "Late attendance marked",
          body: baseBody,
        },
      ];
    case "attendance_leave_marked":
    case "attendance_corrected":
      return [
        { audience: "parent", category: "attendance", title: "Attendance updated", body: baseBody },
      ];
    case "exam_result_published":
      return [
        { audience: "parent", category: "exam", title: "Exam result published", body: baseBody },
      ];
    case "exam_result_failed":
      return [
        { audience: "parent", category: "exam", title: "Exam follow-up needed", body: baseBody },
      ];
    case "promotion_applied":
      return [
        { audience: "parent", category: "student", title: "Student promoted", body: baseBody },
      ];
    case "promotion_repeated":
      return [
        { audience: "parent", category: "student", title: "Student repeated", body: baseBody },
      ];
    case "promotion_graduated":
      return [
        { audience: "parent", category: "student", title: "Student graduated", body: baseBody },
      ];
    case "promotion_dropout":
    case "promotion_inactive":
      return [
        {
          audience: "staff",
          category: "student",
          title: "Student rollover status changed",
          body: baseBody,
        },
      ];
    case "enrollment_moved":
    case "status_changed":
      return [
        {
          audience: "parent",
          category: "student",
          title: "Student record updated",
          body: baseBody,
        },
      ];
    default:
      return [];
  }
}

function dateValue(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
