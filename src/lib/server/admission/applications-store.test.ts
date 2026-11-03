import { describe, expect, it } from "bun:test";
import {
  loadStoredApplications,
  saveStoredApplication,
  updateStoredApplicationStatus,
  getAdmissionDashboardMetrics,
} from "./applications-store";
import { listAdmissionApplications } from "./service";
import { createHmac } from "node:crypto";

function createMockSuperAdminRequest(url: string, init?: RequestInit) {
  const secret = process.env.SESSION_SECRET || "msmis_erp_fallback_secret_key_2026_super_secure";
  const payload = {
    userId: "test-admin-adm-1",
    email: "superadmin@msmis.pk",
    role: "super_admin",
    name: "Super Admin",
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", secret).update(base64).digest("base64");
  const cookie = `msmis_session=${base64}.${signature}`;

  const headers = new Headers(init?.headers);
  headers.set("cookie", cookie);

  return new Request(url, {
    ...init,
    headers,
  });
}

describe("Admission Applications Store & Progress Dashboard Resilience", () => {
  it("loads realistic canonical admission applications across school and madrassa", () => {
    const apps = loadStoredApplications();
    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThanOrEqual(20);

    const first = apps[0];
    expect(first.id).toBeDefined();
    expect(first.refNo).toBeDefined();
    expect(first.name).toBeDefined();
    expect(first.status).toBeDefined();
  });

  it("calculates accurate admission pipeline progress metrics and stage breakdowns", () => {
    const metrics = getAdmissionDashboardMetrics("all");

    expect(metrics.total).toBeGreaterThanOrEqual(20);
    expect(metrics.activeProcessing).toBeGreaterThan(0);
    expect(metrics.inEvaluation).toBeGreaterThan(0);
    expect(metrics.accepted).toBeGreaterThan(0);
    expect(metrics.conversionRate).toBeGreaterThan(0);
    expect(metrics.conversionRate).toBeLessThanOrEqual(100);

    // Verify stage breakdown exists with percentages and fills
    expect(metrics.stages.length).toBe(6);
    const acceptedStage = metrics.stages.find((s) => s.id === "accepted");
    expect(acceptedStage).toBeDefined();
    expect(acceptedStage?.count).toBe(metrics.accepted);

    // Verify monthly history contains 7 months
    expect(metrics.monthlyHistory.length).toBe(7);
    expect(metrics.monthlyHistory.some((m) => m.received > 0)).toBe(true);
  });

  it("filters metrics by campus (madrassa vs school)", () => {
    const madrassaMetrics = getAdmissionDashboardMetrics("madrassa");
    const schoolMetrics = getAdmissionDashboardMetrics("school");

    expect(madrassaMetrics.total).toBeGreaterThan(0);
    expect(schoolMetrics.total).toBeGreaterThan(0);
    expect(madrassaMetrics.schoolCount).toBe(0);
    expect(schoolMetrics.madrassaCount).toBe(0);
  });

  it("saves a new application and updates its status persistently", () => {
    const newId = `test_app_${Date.now()}`;
    const newRef = `APP-TEST-${Date.now().toString().slice(-4)}`;

    const saved = saveStoredApplication({
      id: newId,
      refNo: newRef,
      source: "public",
      status: "pending",
      name: "Tariq Mehmood Jr",
      nameUrdu: "طارق محمود جونیئر",
      fatherName: "Tariq Mehmood",
      gender: "male",
      phone: "0300-9991122",
      system: "school",
      categoryOrClass: "Class 5 (Boys)",
    });

    expect(saved.id).toBe(newId);
    expect(saved.refNo).toBe(newRef);
    expect(saved.status).toBe("pending");

    // Update status to interview_scheduled
    const updated = updateStoredApplicationStatus(newId, "interview_scheduled", "Interview scheduled");
    expect(updated?.status).toBe("interview_scheduled");

    // Reload list and confirm change is persisted
    const all = loadStoredApplications();
    const found = all.find((a) => a.id === newId);
    expect(found).toBeDefined();
    expect(found?.status).toBe("interview_scheduled");

    // Clean up test application
    const cleaned = all.filter((a) => a.id !== newId);
    // Write back cleaned list
    const p = `${process.cwd()}/public/admission-applications.json`;
    require("node:fs").writeFileSync(p, JSON.stringify(cleaned, null, 2), "utf-8");
  });

  it("listAdmissionApplications returns authentic applications even when database is offline", async () => {
    const req = createMockSuperAdminRequest("http://localhost:3000/api/admission/applications");
    const result = await listAdmissionApplications(req, {});

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(20);

    const first = result[0];
    expect(first.refNo).toBeDefined();
    expect(first.name).toBeDefined();
    expect(first.system).toMatch(/madrassa|school/);
  });
});

