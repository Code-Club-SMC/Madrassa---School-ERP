import { describe, expect, it } from "bun:test";
import {
  listLeaveRequests,
  createLeaveRequest,
  updateLeaveStatus,
  getStaffLeaveSummary,
} from "./leaves-service";

describe("HR Leaves Service & Workflow", () => {
  it("lists leave requests and filters by staffId or staffName", () => {
    const all = listLeaveRequests();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);

    const first = all[0];
    const filtered = listLeaveRequests(first.staffId);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((l) => l.staffId === first.staffId || l.staffName === first.staffId)).toBe(true);
  });

  it("creates a new leave request for a teacher with correct single-day count", () => {
    const created = createLeaveRequest({
      staffId: "teacher-unit-test-1",
      staffName: "Maulana Test",
      leaveType: "sick",
      fromDate: "2026-11-10",
      reason: "Medical checkup and recovery",
    });

    expect(created.id).toBeDefined();
    expect(created.staffId).toBe("teacher-unit-test-1");
    expect(created.staffName).toBe("Maulana Test");
    expect(created.leaveType).toBe("sick");
    expect(created.fromDate).toBe("2026-11-10");
    expect(created.toDate).toBe("2026-11-10");
    expect(created.days).toBe(1);
    expect(created.status).toBe("pending");

    const all = listLeaveRequests("teacher-unit-test-1");
    expect(all.some((l) => l.id === created.id)).toBe(true);
  });

  it("creates a multi-day leave request with automatic duration calculation", () => {
    const created = createLeaveRequest({
      staffId: "teacher-unit-test-2",
      staffName: "Ustadha Fatima",
      leaveType: "annual",
      fromDate: "2026-11-15",
      toDate: "2026-11-17",
      reason: "Family event travel",
    });

    expect(created.days).toBe(3);
    expect(created.status).toBe("pending");
  });

  it("approves a leave request with an admin note", () => {
    const created = createLeaveRequest({
      staffId: "teacher-unit-test-3",
      staffName: "Qari Tariq",
      leaveType: "emergency",
      fromDate: "2026-11-20",
      reason: "Urgent home repair",
    });

    const approved = updateLeaveStatus(created.id, "approved", "Approved by Admin Principal");
    expect(approved).not.toBeNull();
    expect(approved?.status).toBe("approved");
    expect(approved?.adminNote).toBe("Approved by Admin Principal");

    const lookup = listLeaveRequests().find((l) => l.id === created.id);
    expect(lookup?.status).toBe("approved");
  });

  it("rejects a leave request with an admin rejection explanation", () => {
    const created = createLeaveRequest({
      staffId: "teacher-unit-test-4",
      staffName: "Hafiz Bilal",
      leaveType: "unpaid",
      fromDate: "2026-11-22",
      reason: "Personal vacation during exam week",
    });

    const rejected = updateLeaveStatus(created.id, "rejected", "Rejected: Examination schedule clash");
    expect(rejected).not.toBeNull();
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.adminNote).toBe("Rejected: Examination schedule clash");
  });

  it("accurately computes staff leave summary metrics", () => {
    const staffId = "staff-summary-test-" + Date.now();
    const l1 = createLeaveRequest({
      staffId,
      leaveType: "sick",
      fromDate: "2026-11-01",
      reason: "Flu",
    });
    const l2 = createLeaveRequest({
      staffId,
      leaveType: "annual",
      fromDate: "2026-11-02",
      reason: "Rest",
    });
    updateLeaveStatus(l1.id, "approved");

    const summary = getStaffLeaveSummary(staffId);
    expect(summary.totalRequests).toBe(2);
    expect(summary.approvedRequests).toBe(1);
    expect(summary.pendingRequests).toBe(1);
    expect(summary.rejectedRequests).toBe(0);
  });
});

