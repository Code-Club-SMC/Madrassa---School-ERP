import type {
  CreateAnnouncementInput,
  CreateAnnouncementPayload,
  NotificationAudience,
  NotificationCategory,
  NotificationListPayload,
  NotificationSource,
  NotificationStatus,
} from "./notification-types";

export type NotificationListParams = {
  audience?: NotificationAudience;
  category?: NotificationCategory;
  source?: NotificationSource;
  status?: NotificationStatus;
  read?: "true" | "false";
  limit?: number;
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: NotificationListParams) => [...notificationKeys.lists(), params] as const,
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Notification request failed");
  return payload as T;
}

export function listNotifications(params: NotificationListParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const suffix = search.toString();
  return requestJson<NotificationListPayload>(`/api/notifications${suffix ? `?${suffix}` : ""}`);
}

export function createLocalAnnouncement(input: CreateAnnouncementInput) {
  return requestJson<CreateAnnouncementPayload>("/api/notifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markNotificationRead(id: string, read: boolean) {
  return requestJson<{ read: boolean; readAt: string | null }>(`/api/notifications/${id}/read`, {
    method: "POST",
    body: JSON.stringify({ read }),
  });
}
