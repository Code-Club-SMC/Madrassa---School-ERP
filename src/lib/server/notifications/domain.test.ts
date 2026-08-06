import {
  canReadNotificationEvent,
  isNotificationVisibleNow,
  notificationTemplatesForStudentEvent,
} from "@/lib/server/notifications/domain";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("notification domain", () => {
  test("allows parent to read notifications addressed to their user id", () => {
    expect(
      canReadNotificationEvent(
        { userId: "u-parent", role: "parent", guardianIds: [] },
        { audience: "parent", userId: "u-parent", guardianId: null },
      ),
    ).toBe(true);
  });

  test("allows parent to read notifications addressed to their guardian id", () => {
    expect(
      canReadNotificationEvent(
        { userId: "u-parent", role: "parent", guardianIds: ["g1"] },
        { audience: "parent", userId: null, guardianId: "g1" },
      ),
    ).toBe(true);
  });

  test("allows parent to read parent-wide local announcements", () => {
    expect(
      canReadNotificationEvent(
        { userId: "u-parent", role: "parent", guardianIds: [] },
        { audience: "parent", userId: null, guardianId: null },
      ),
    ).toBe(true);
  });

  test("rejects parent reads for another guardian notification", () => {
    expect(
      canReadNotificationEvent(
        { userId: "u-parent", role: "parent", guardianIds: ["g1"] },
        { audience: "parent", userId: null, guardianId: "g2" },
      ),
    ).toBe(false);
  });

  test("allows staff roles to read operational notifications", () => {
    expect(
      canReadNotificationEvent(
        { userId: "u-admin", role: "admin" },
        { audience: "staff", userId: null, guardianId: null },
      ),
    ).toBe(true);
  });

  test("maps student events to parent-facing notification templates", () => {
    expect(
      notificationTemplatesForStudentEvent({
        type: "fee_charge_created",
        message: "Fee charge created: July fee",
        studentName: "Ahmad",
        studentNameUrdu: "Ahmad",
      }),
    ).toEqual([
      {
        audience: "parent",
        category: "fee",
        title: "Fee charged",
        body: "Ahmad: Fee charge created: July fee",
      },
    ]);
  });

  test("maps parent account failures to staff notifications only", () => {
    expect(
      notificationTemplatesForStudentEvent({
        type: "parent_account_failed",
        message: "Parent login retry failed",
        studentName: "Ahmad",
        studentNameUrdu: "Ahmad",
      }),
    ).toEqual([
      {
        audience: "staff",
        category: "guardian",
        title: "Parent account creation failed",
        body: "Ahmad: Parent login retry failed",
      },
    ]);
  });

  test("shows published notifications within their active window", () => {
    expect(
      isNotificationVisibleNow({
        status: "published",
        now: new Date("2026-07-17T10:00:00.000Z"),
      }),
    ).toBe(true);
  });

  test("hides scheduled notifications before publish time", () => {
    expect(
      isNotificationVisibleNow({
        status: "scheduled",
        publishAt: new Date("2026-07-17T11:00:00.000Z"),
        now: new Date("2026-07-17T10:00:00.000Z"),
      }),
    ).toBe(false);
  });

  test("shows scheduled notifications once publish time has passed", () => {
    expect(
      isNotificationVisibleNow({
        status: "scheduled",
        publishAt: new Date("2026-07-17T09:00:00.000Z"),
        now: new Date("2026-07-17T10:00:00.000Z"),
      }),
    ).toBe(true);
  });

  test("hides expired notifications", () => {
    expect(
      isNotificationVisibleNow({
        status: "published",
        expiresAt: new Date("2026-07-17T09:00:00.000Z"),
        now: new Date("2026-07-17T10:00:00.000Z"),
      }),
    ).toBe(false);
  });

  test("hides archived notifications", () => {
    expect(
      isNotificationVisibleNow({
        status: "archived",
        now: new Date("2026-07-17T10:00:00.000Z"),
      }),
    ).toBe(false);
  });
});
