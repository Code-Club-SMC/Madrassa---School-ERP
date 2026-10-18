const bunTestModule: string = "bun:test";
const { describe, expect, it } = await import(bunTestModule);
import { buildStaffListFromUsersAndTeachers } from "./hr-store";

describe("buildStaffListFromUsersAndTeachers", () => {
  it("maps registered users to staff members excluding parents and students", () => {
    const users = [
      { id: "u-1", name: "Teacher One", role: "teacher", status: "active", systemAccess: "school", phone: "123" },
      { id: "u-2", name: "Admin Two", role: "admin", status: "active", systemAccess: "both" },
      { id: "u-3", name: "Parent Three", role: "parent", status: "active" },
      { id: "u-4", name: "Student Four", role: "student", status: "active" },
      { id: "u-5", name: "Accountant Five", role: "accountant", status: "active" },
    ];

    const result = buildStaffListFromUsersAndTeachers(users, []);

    expect(result).toHaveLength(3);
    expect(result.map((s) => s.id)).toEqual(["u-1", "u-2", "u-5"]);

    const teacher = result.find((s) => s.id === "u-1");
    expect(teacher?.staffType).toBe("teacher");
    expect(teacher?.module).toBe("school");
    expect(teacher?.fullName).toBe("Teacher One");

    const admin = result.find((s) => s.id === "u-2");
    expect(admin?.staffType).toBe("administrator");
    expect(admin?.module).toBe("shared");

    const accountant = result.find((s) => s.id === "u-5");
    expect(accountant?.staffType).toBe("accountant");
    expect(accountant?.department).toBe("Finance");
  });

  it("enriches teachers with teacher profile details when available", () => {
    const users = [
      { id: "u-teacher", name: "Qari Ahmad", role: "teacher", status: "active" },
    ];
    const teachers = [
      {
        id: "tp-123",
        userId: "u-teacher",
        name: "Qari Ahmad",
        systemScope: "madrassa",
        designation: "Senior Mudarris",
        joinedAt: "2023-05-01",
        employmentStatus: "active",
      },
    ];

    const result = buildStaffListFromUsersAndTeachers(users, teachers);

    expect(result).toHaveLength(1);
    const s = result[0];
    expect(s.id).toBe("tp-123");
    expect(s.userId).toBe("u-teacher");
    expect(s.designation).toBe("Senior Mudarris");
    expect(s.module).toBe("madrassa");
    expect(s.joinDate).toBe("2023-05-01");
    expect(s.status).toBe("active");
  });

  it("correctly handles inactive or terminated status", () => {
    const users = [
      { id: "u-inactive", name: "Old Teacher", role: "teacher", status: "inactive" },
    ];

    const result = buildStaffListFromUsersAndTeachers(users, []);
    expect(result[0].status).toBe("terminated");
  });

  it("includes teachers that do not have a matching user record", () => {
    const teachers = [
      {
        id: "tp-orphan",
        name: "Visiting Teacher",
        systemScope: "school",
        designation: "Guest Lecturer",
        employmentStatus: "active",
      },
    ];

    const result = buildStaffListFromUsersAndTeachers([], teachers);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tp-orphan");
    expect(result[0].fullName).toBe("Visiting Teacher");
    expect(result[0].module).toBe("school");
  });

  it("preserves custom user-created staff while omitting mock seed items", () => {
    const users = [{ id: "u-real", name: "Real User", role: "teacher", status: "active" }];
    const customStaff = [
      {
        id: "STF-001", // This is a seed id, should not duplicate
        fullName: "Muhammad Saeed Khan",
        cnic: "35201-1234567-1",
        dob: "1978-03-12",
        gender: "male" as const,
        phone: "+92 300 1234567",
        emergencyContact: "+92 300 7654321",
        address: "Lahore",
        staffType: "teacher" as const,
        department: "Quran",
        designation: "Senior Qari",
        employmentType: "permanent" as const,
        joinDate: "2015-04-01",
        status: "active" as const,
        module: "madrassa" as const,
      },
      {
        id: "STF-999999", // User-created staff
        fullName: "Custom Staff Member",
        cnic: "11111-2222222-3",
        dob: "1985-01-01",
        gender: "female" as const,
        phone: "+92 321 0000000",
        emergencyContact: "+92 321 0000000",
        address: "Campus",
        staffType: "support" as const,
        department: "General",
        designation: "Assistant",
        employmentType: "permanent" as const,
        joinDate: "2024-01-01",
        status: "active" as const,
        module: "school" as const,
      },
    ];

    const result = buildStaffListFromUsersAndTeachers(users, [], customStaff);
    expect(result).toHaveLength(2);
    expect(result.some((s) => s.id === "u-real")).toBe(true);
    expect(result.some((s) => s.id === "STF-999999")).toBe(true);
    expect(result.some((s) => s.id === "STF-001")).toBe(false);
  });
});

