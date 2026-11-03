import fs from "node:fs";
import path from "node:path";
import type { AuditEntry } from "@/types";
import { auditLog as BASE_AUDIT_LOG } from "@/mock/audit-log";

function getDataFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "msmis-audit-log.json"),
    path.join(process.cwd(), ".output", "public", "msmis-audit-log.json"),
  ];
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function safeWriteJson<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[audit-service] Failed writing to ${filePath}:`, err);
  }
}

let memoryLogs: AuditEntry[] | null = null;

function loadStoredLogs(): AuditEntry[] {
  if (memoryLogs) return memoryLogs;

  for (const fp of getDataFilePaths()) {
    const data = safeReadJson<AuditEntry[]>(fp);
    if (Array.isArray(data) && data.length > 0) {
      memoryLogs = data;
      return memoryLogs;
    }
  }

  memoryLogs = [];
  return memoryLogs;
}

function saveStoredLogs(logs: AuditEntry[]) {
  memoryLogs = logs;
  for (const fp of getDataFilePaths()) {
    safeWriteJson(fp, logs);
  }
}

/**
 * Synthesizes live audit events from actual system entities in public JSON files.
 */
function extractLiveSystemEvents(): AuditEntry[] {
  const events: AuditEntry[] = [];

  // 1. Donations
  const donationsPath = path.join(process.cwd(), "public", "finance-donations.json");
  const rawDonations = safeReadJson<any>(donationsPath);
  const donations = Array.isArray(rawDonations) ? rawDonations : rawDonations?.donations ?? [];
  for (const d of donations) {
    if (d.receiptNo) {
      const amount = d.amountPaisa ? Math.round(d.amountPaisa / 100) : 0;
      events.push({
        id: `audit-don-${d.id || d.receiptNo}`,
        at: d.date ? `${d.date}T10:00:00.000Z` : new Date().toISOString(),
        userId: "u-admin",
        userName: "Admin",
        action: "donation.record",
        entity: "Donation",
        entityId: d.receiptNo,
        details: `Donation received: Rs ${amount.toLocaleString()} (${d.type ?? "general"} - ${d.purpose ?? "General Fund"}) from ${d.donor || "Anonymous"} [${d.method || "cash"}]`,
      });
    }
  }

  // 2. HR Leaves
  const leavesPath = path.join(process.cwd(), "public", "hr-leaves.json");
  const rawLeaves = safeReadJson<any>(leavesPath);
  const leaves = Array.isArray(rawLeaves) ? rawLeaves : rawLeaves?.leaves ?? [];
  for (const l of leaves) {
    if (l.id) {
      const action =
        l.status === "approved"
          ? "leave.approve"
          : l.status === "rejected"
            ? "leave.reject"
            : "leave.request";
      const staffName = l.staffName || `Staff ${l.staffId || ""}`;
      const leaveType = l.leaveType || l.type || "leave";
      const days = l.days ?? l.daysCount ?? 1;
      events.push({
        id: `audit-leave-${l.id}`,
        at: l.appliedAt
          ? l.appliedAt.includes("T")
            ? l.appliedAt
            : `${l.appliedAt}T09:00:00.000Z`
          : l.createdAt || new Date().toISOString(),
        userId: l.staffId || "u-staff",
        userName: staffName,
        action,
        entity: "LeaveRequest",
        entityId: l.id,
        details: `${staffName} ${leaveType} leave (${days} day${days > 1 ? "s" : ""}) - Status: ${l.status}${l.reason ? ` (${l.reason})` : ""}`,
      });
    }
  }

  // 3. Inventory
  const inventoryPath = path.join(process.cwd(), "public", "inventory-items.json");
  const rawInventory = safeReadJson<any>(inventoryPath);
  const inventory = Array.isArray(rawInventory) ? rawInventory : rawInventory?.items ?? [];
  for (const i of inventory) {
    if (i.id) {
      events.push({
        id: `audit-inv-${i.id}`,
        at: i.updatedAt || i.createdAt || new Date().toISOString(),
        userId: "u-admin",
        userName: "Admin",
        action: "inventory.adjust",
        entity: "InventoryItem",
        entityId: i.id,
        details: `Inventory recorded: ${i.name || i.nameUrdu} (${i.quantity} ${i.unit || "units"}) - ${i.category || "General"}`,
      });
    }
  }

  // 4. Admission Interviews & Verification
  const interviewsPath = path.join(process.cwd(), "public", "admission-interviews.json");
  const rawInterviews = safeReadJson<any>(interviewsPath);
  const interviews = Array.isArray(rawInterviews)
    ? rawInterviews
    : Array.isArray(rawInterviews?.slots)
      ? rawInterviews.slots
      : [];
  for (const s of interviews) {
    if (s.id) {
      const action =
        s.status === "passed"
          ? "admission.accept"
          : s.status === "rejected"
            ? "admission.reject"
            : "admission.interview";
      events.push({
        id: `audit-int-${s.id}`,
        at:
          s.createdAt ||
          (s.date
            ? `${s.date}T${s.time || "10:00"}:00.000Z`
            : new Date().toISOString()),
        userId: s.interviewer || "u-admin",
        userName: s.interviewer || "Admin",
        action,
        entity: "AdmissionInterview",
        entityId: s.id,
        details: `${s.applicantName || "Applicant"} interview (${s.categoryOrClass || s.darjaOrClass || "General"}) - Result: ${s.status}${s.marks != null ? ` (Marks: ${s.marks})` : ""}`,
      });
    }
  }

  return events;
}

/**
 * Returns complete administrative audit logs merged with real live system events
 * and canonical baseline logs, sorted newest first.
 */
export async function listAuditLogs(): Promise<AuditEntry[]> {
  const stored = loadStoredLogs();
  const live = extractLiveSystemEvents();
  const base = BASE_AUDIT_LOG;

  // Merge with deduplication by id
  const map = new Map<string, AuditEntry>();

  for (const item of base) {
    map.set(item.id, item);
  }

  for (const item of live) {
    map.set(item.id, item);
  }

  for (const item of stored) {
    map.set(item.id, item);
  }

  const result = Array.from(map.values());

  // Sort newest first
  result.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return result;
}

/**
 * Records a new audit log entry.
 */
export async function recordAuditLog(
  entry: Omit<AuditEntry, "id" | "at"> & { at?: string },
): Promise<AuditEntry> {
  const stored = loadStoredLogs();
  const newEntry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    at: entry.at || new Date().toISOString(),
    userId: entry.userId,
    userName: entry.userName,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    details: entry.details,
  };

  stored.unshift(newEntry);
  saveStoredLogs(stored);
  return newEntry;
}
