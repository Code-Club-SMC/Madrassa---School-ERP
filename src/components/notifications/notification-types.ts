export type NotificationAudience = "staff" | "parent";
export type NotificationCategory =
  | "admission"
  | "attendance"
  | "exam"
  | "fee"
  | "guardian"
  | "student"
  | "system";
export type NotificationSource = "system" | "announcement";
export type NotificationStatus = "recorded" | "published" | "scheduled" | "archived";

export type NotificationItem = {
  id: string;
  audience: NotificationAudience;
  category: NotificationCategory;
  channel: "in_app";
  status: NotificationStatus;
  source: NotificationSource;
  title: string;
  body: string;
  studentId: string | null;
  guardianId: string | null;
  userId: string | null;
  metadata: Record<string, unknown>;
  publishAt: string | null;
  expiresAt: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListPayload = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export type CreateAnnouncementInput = {
  audience: NotificationAudience;
  category: NotificationCategory;
  title: string;
  body: string;
  publishAt?: string | null;
  expiresAt?: string | null;
};

export type CreateAnnouncementPayload = {
  notification: NotificationItem;
};
