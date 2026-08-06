import type { GuardianAccountsPayload, GuardianDashboardPayload } from "./parent-types";

export type GuardianAccountListParams = {
  status?: "linked" | "unlinked" | "all";
  q?: string;
  limit?: number;
};

export const parentKeys = {
  all: ["parents"] as const,
  dashboard: () => [...parentKeys.all, "me", "dashboard"] as const,
  guardianAccounts: (params: GuardianAccountListParams) =>
    [...parentKeys.all, "admin", "guardian-accounts", params] as const,
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
  if (!response.ok) throw new Error(payload.error || "Parent portal request failed");
  return payload as T;
}

export function getGuardianDashboard() {
  return requestJson<GuardianDashboardPayload>("/api/parents/me/dashboard");
}

export function listGuardianAccounts(params: GuardianAccountListParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const suffix = search.toString();
  return requestJson<GuardianAccountsPayload>(
    `/api/parents/admin/guardian-accounts${suffix ? `?${suffix}` : ""}`,
  );
}
