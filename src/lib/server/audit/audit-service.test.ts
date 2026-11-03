import { listAuditLogs, recordAuditLog } from "@/lib/server/audit/audit-service";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("Administrative Audit Logs Service", () => {
  test("listAuditLogs returns merged audit trail with live system events and canonical entries", async () => {
    const logs = await listAuditLogs();
    expect(logs.length).toBeGreaterThan(0);

    // Verify properties on entries
    for (const log of logs.slice(0, 10)) {
      expect(log.id).toBeTruthy();
      expect(log.at).toBeTruthy();
      expect(log.userName).toBeTruthy();
      expect(log.action).toBeTruthy();
      expect(log.entity).toBeTruthy();
      expect(log.entityId).toBeTruthy();
    }

    // Verify presence of various modules
    const modules = new Set(logs.map((l) => l.action.split(".")[0]));
    expect(modules.size).toBeGreaterThanOrEqual(4);
    expect(modules.has("donation") || modules.has("fee")).toBe(true);
  });

  test("recordAuditLog accurately appends a new administrative event", async () => {
    const initialLogs = await listAuditLogs();
    const initialCount = initialLogs.length;

    const newEvent = await recordAuditLog({
      userId: "test-admin-1",
      userName: "Super Admin Test",
      action: "system.config_update",
      entity: "SystemSetting",
      entityId: "SETTING-001",
      details: "Updated institution general configuration",
    });

    expect(newEvent.id).toBeTruthy();
    expect(newEvent.userName).toBe("Super Admin Test");
    expect(newEvent.action).toBe("system.config_update");

    const updatedLogs = await listAuditLogs();
    expect(updatedLogs.length).toBeGreaterThanOrEqual(initialCount);
    expect(updatedLogs.some((l) => l.id === newEvent.id)).toBe(true);
  });

  test("audit entries are ordered chronologically with newest first", async () => {
    const logs = await listAuditLogs();
    if (logs.length >= 2) {
      const firstTime = new Date(logs[0].at).getTime();
      const secondTime = new Date(logs[1].at).getTime();
      expect(firstTime).toBeGreaterThanOrEqual(secondTime);
    }
  });
});

