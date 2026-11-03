import fs from "node:fs";
import path from "node:path";
import { leavesSeed, type LeaveRequest } from "@/lib/mock/hr";

function getDataFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "hr-leaves.json"),
    path.join(process.cwd(), ".output", "public", "hr-leaves.json"),
  ];
}

let memoryLeaves: LeaveRequest[] | null = null;

function readFromFile(): LeaveRequest[] | null {
  for (const filePath of getDataFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as LeaveRequest[];
        }
      }
    } catch {
      // try next file path
    }
  }
  return null;
}

function writeToFile(leaves: LeaveRequest[]) {
  for (const filePath of getDataFilePaths()) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(leaves, null, 2), "utf-8");
    } catch {
      // ignore write error for read-only or secondary directories
    }
  }
}

export function listLeaveRequests(filterStaffId?: string): LeaveRequest[] {
  if (!memoryLeaves) {
    const fromFile = readFromFile();
    memoryLeaves = fromFile ?? [...leavesSeed];
    if (!fromFile) {
      writeToFile(memoryLeaves);
    }
  }

  if (filterStaffId) {
    return memoryLeaves.filter(
      (l) => l.staffId === filterStaffId || (l.staffName && l.staffName.toLowerCase() === filterStaffId.toLowerCase()),
    );
  }

  return memoryLeaves;
}

export function createLeaveRequest(input: {
  staffId: string;
  staffName?: string;
  leaveType: LeaveRequest["leaveType"];
  fromDate: string;
  toDate?: string;
  days?: number;
  reason: string;
}): LeaveRequest {
  const all = listLeaveRequests();

  const fromDate = input.fromDate || new Date().toISOString().slice(0, 10);
  const toDate = input.toDate || fromDate;

  // Calculate days if not provided
  let days = input.days;
  if (!days || days < 1) {
    const dFrom = new Date(fromDate);
    const dTo = new Date(toDate);
    const diffTime = Math.abs(dTo.getTime() - dFrom.getTime());
    days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }

  const newLeave: LeaveRequest = {
    id: `LV-${Date.now()}`,
    staffId: input.staffId,
    staffName: input.staffName,
    leaveType: input.leaveType || "emergency",
    fromDate,
    toDate,
    days,
    reason: input.reason.trim(),
    status: "pending",
    appliedAt: new Date().toISOString().slice(0, 10),
  };

  const updated = [newLeave, ...all];
  memoryLeaves = updated;
  writeToFile(updated);

  return newLeave;
}

export function updateLeaveStatus(
  id: string,
  status: "approved" | "rejected",
  adminNote?: string,
): LeaveRequest | null {
  const all = listLeaveRequests();
  const index = all.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const current = all[index];
  const updatedItem: LeaveRequest = {
    ...current,
    status,
    adminNote: adminNote ?? current.adminNote,
  };

  const updatedList = all.map((l) => (l.id === id ? updatedItem : l));
  memoryLeaves = updatedList;
  writeToFile(updatedList);

  return updatedItem;
}

export function getStaffLeaveSummary(staffId: string, staffName?: string) {
  const all = listLeaveRequests();
  const staffLeaves = all.filter(
    (l) =>
      l.staffId === staffId ||
      (staffName && l.staffName && l.staffName.toLowerCase() === staffName.toLowerCase()),
  );

  const approved = staffLeaves.filter((l) => l.status === "approved").length;
  const pending = staffLeaves.filter((l) => l.status === "pending").length;
  const rejected = staffLeaves.filter((l) => l.status === "rejected").length;
  const totalDaysTaken = staffLeaves
    .filter((l) => l.status === "approved")
    .reduce((sum, l) => sum + (l.days || 1), 0);

  return {
    total: staffLeaves.length,
    totalRequests: staffLeaves.length,
    approved,
    approvedRequests: approved,
    pending,
    pendingRequests: pending,
    rejected,
    rejectedRequests: rejected,
    totalDaysTaken,
    leaves: staffLeaves,
  };
}
