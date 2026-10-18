const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);
import { resolveUserPassword, generateUniquePasswordForUser } from "@/lib/user-passwords";

describe("user password resolution", () => {
  test("returns saved plain password when initialPassword is set", () => {
    const cred = resolveUserPassword({
      name: "Qasim",
      role: "teacher",
      initialPassword: "CustomSecretPass!9",
    });
    expect(cred.password).toBe("CustomSecretPass!9");
    expect(cred.isRealPassword).toBe(true);
  });

  test("generates unique distinct passwords for different teachers", () => {
    const teacher1 = resolveUserPassword({
      id: "teacher-1",
      name: "Qasim",
      role: "teacher",
    });
    const teacher2 = resolveUserPassword({
      id: "teacher-2",
      name: "Zainab",
      role: "teacher",
    });
    const teacher3 = resolveUserPassword({
      id: "teacher-3",
      name: "Tariq",
      role: "teacher",
    });

    expect(teacher1.password).not.toBe(teacher2.password);
    expect(teacher2.password).not.toBe(teacher3.password);
    expect(teacher1.password.startsWith("Qasim@")).toBe(true);
    expect(teacher2.password.startsWith("Zainab@")).toBe(true);
    expect(teacher3.password.startsWith("Tariq@")).toBe(true);
    expect(teacher1.isRealPassword).toBe(false);
  });

  test("returns Admin@123 for super admin without initialPassword", () => {
    const superAdmin = resolveUserPassword({
      id: "admin-1",
      name: "Super Admin",
      role: "super_admin",
    });
    expect(superAdmin.password).toBe("Admin@123");
  });

  test("deterministic generation produces exact same password for same ID and name", () => {
    const pwd1 = generateUniquePasswordForUser("Qasim", "teacher", "teacher-qasim-1");
    const pwd2 = generateUniquePasswordForUser("Qasim", "teacher", "teacher-qasim-1");
    expect(pwd1).toBe(pwd2);
  });
});
