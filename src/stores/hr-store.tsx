import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type StaffMember,
  type PayrollProfile,
  type Payslip,
  type AttendanceRecord,
  type LeaveRequest,
  type StaffLoan,
  type StaffType,
  type StaffModule,
  type StaffStatus,
  staffSeed,
  payrollProfilesSeed,
  payslipsSeed,
  attendanceSeed,
  leavesSeed,
  loansSeed,
} from "@/lib/mock/hr";

type NewStaffInput = Omit<StaffMember, "id"> & {
  payroll: Omit<PayrollProfile, "staffId" | "effectiveFrom">;
};

type HRStore = {
  staff: StaffMember[];
  payrollProfiles: PayrollProfile[];
  payslips: Payslip[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  loans: StaffLoan[];
  isLoadingStaff: boolean;
  refreshStaff: () => Promise<void>;
  addStaff: (data: NewStaffInput) => StaffMember;
  updateStaff: (id: string, data: Partial<StaffMember>) => void;
  terminateStaff: (id: string, reason: string) => void;
  updatePayrollProfile: (staffId: string, profile: Omit<PayrollProfile, "staffId">) => void;
  generatePayroll: (month: number, year: number) => void;
  approvePayroll: (month: number, year: number) => void;
  markPayrollPaid: (month: number, year: number) => void;
  bulkSaveAttendance: (
    date: string,
    records: { staffId: string; status: AttendanceRecord["status"]; checkIn?: string; checkOut?: string }[],
  ) => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;
  addLoan: (data: Omit<StaffLoan, "id" | "status" | "remainingBalance">) => void;
  settleLoan: (id: string) => void;
};

function makeDefaultPayrollProfile(s: StaffMember, baseSalary?: number): PayrollProfile {
  const basic =
    baseSalary && baseSalary > 0
      ? baseSalary
      : s.staffType === "teacher"
        ? 60000
        : s.staffType === "administrator"
          ? 80000
          : s.staffType === "accountant"
            ? 65000
            : 40000;

  return {
    staffId: s.id,
    basicSalary: basic,
    hra: Math.round(basic * 0.4),
    transportAllowance: 5000,
    medicalAllowance: 3000,
    otherAllowances: [],
    eobi: 250,
    incomeTax: Math.round(basic * 0.05),
    otherDeductions: [],
    bankName: "Meezan Bank",
    accountNumber: `0123${Math.floor(100000 + Math.random() * 900000)}`,
    effectiveFrom: s.joinDate || "2025-01-01",
  };
}

export function buildStaffListFromUsersAndTeachers(
  users: any[],
  teachers: any[] = [],
  customStaff: StaffMember[] = [],
): StaffMember[] {
  const teacherByUserId = new Map<string, any>();
  const teacherByEmail = new Map<string, any>();
  const teacherByName = new Map<string, any>();

  for (const t of teachers) {
    if (t.userId) teacherByUserId.set(t.userId, t);
    if (t.email) teacherByEmail.set(t.email.toLowerCase(), t);
    if (t.name) teacherByName.set(t.name.toLowerCase().trim(), t);
  }

  const staffMembers: StaffMember[] = [];
  const processedUserIds = new Set<string>();
  const processedTeacherIds = new Set<string>();

  // Process all organizational users (excluding parent and student)
  for (const u of users) {
    const role = (u.role || "").toLowerCase();
    if (role === "parent" || role === "student") continue;

    processedUserIds.add(u.id);

    const teacher =
      teacherByUserId.get(u.id) ||
      (u.email ? teacherByEmail.get(u.email.toLowerCase()) : undefined) ||
      (u.name ? teacherByName.get(u.name.toLowerCase().trim()) : undefined);

    if (teacher?.id) {
      processedTeacherIds.add(teacher.id);
    }

    let staffType: StaffType = "support";
    if (role === "teacher" || teacher) staffType = "teacher";
    else if (
      role === "admin" ||
      role === "super_admin" ||
      role === "principal" ||
      role.includes("admin") ||
      role === "hr_manager"
    ) {
      staffType = "administrator";
    } else if (role === "accountant") {
      staffType = "accountant";
    } else if (role === "librarian") {
      staffType = "librarian";
    }

    const sys = (teacher?.systemScope || u.systemAccess || "").toLowerCase();
    let module: StaffModule = "shared";
    if (
      (sys.includes("school") || sys === "school") &&
      !sys.includes("madrassa") &&
      !sys.includes("both") &&
      sys !== "all"
    ) {
      module = "school";
    } else if (
      (sys.includes("madrassa") || sys === "madrassa") &&
      !sys.includes("school") &&
      !sys.includes("both") &&
      sys !== "all"
    ) {
      module = "madrassa";
    }

    const isTerminated =
      u.status === "inactive" ||
      u.banned ||
      teacher?.employmentStatus === "inactive" ||
      teacher?.employmentStatus === "terminated";
    const isOnLeave = teacher?.employmentStatus === "on_leave";
    const status: StaffStatus = isTerminated ? "terminated" : isOnLeave ? "on_leave" : "active";

    const designation =
      teacher?.designation ||
      u.designation ||
      (role === "teacher"
        ? "Teacher"
        : role === "principal"
          ? "Principal"
          : role === "super_admin" || role === "admin"
            ? "Administrator"
            : role === "accountant"
              ? "Accountant"
              : role === "librarian"
                ? "Librarian"
                : role === "receptionist"
                  ? "Receptionist"
                  : role === "hr_manager"
                    ? "HR Manager"
                    : "Staff Member");

    const department =
      u.department ||
      (staffType === "teacher"
        ? module === "madrassa"
          ? "Islamic Studies"
          : "Teaching"
        : staffType === "accountant"
          ? "Finance"
          : staffType === "librarian"
            ? "Library"
            : "Administration");

    staffMembers.push({
      id: teacher?.id || u.id,
      userId: u.id,
      fullName: u.name || teacher?.name || "Staff Member",
      cnic: u.cnic || teacher?.cnic || "—",
      dob: "1990-01-01",
      gender: teacher?.gender === "female" ? "female" : "male",
      phone: u.phone || teacher?.phone || "—",
      emergencyContact: u.phone || teacher?.phone || "—",
      address: teacher?.address || "Campus",
      photoUrl: u.image || undefined,
      staffType,
      department,
      designation,
      employmentType: "permanent",
      joinDate: teacher?.joinedAt || u.createdAt?.slice(0, 10) || "2024-01-01",
      status,
      module,
    });
  }

  // Also include any teachers from teachers dashboard that didn't match a user row
  for (const t of teachers) {
    if (t.userId && processedUserIds.has(t.userId)) continue;
    if (t.id && processedTeacherIds.has(t.id)) continue;
    if (staffMembers.some((s) => s.id === t.id || s.userId === t.userId)) continue;

    const sys = (t.systemScope || "").toLowerCase();
    let module: StaffModule = "shared";
    if (
      (sys.includes("school") || sys === "school") &&
      !sys.includes("madrassa") &&
      !sys.includes("both") &&
      sys !== "all"
    ) {
      module = "school";
    } else if (
      (sys.includes("madrassa") || sys === "madrassa") &&
      !sys.includes("school") &&
      !sys.includes("both") &&
      sys !== "all"
    ) {
      module = "madrassa";
    }

    staffMembers.push({
      id: t.id,
      userId: t.userId,
      fullName: t.name || "Teacher",
      cnic: t.cnic || "—",
      dob: "1990-01-01",
      gender: "male",
      phone: t.phone || "—",
      emergencyContact: t.phone || "—",
      address: "Campus",
      staffType: "teacher",
      department: module === "madrassa" ? "Islamic Studies" : "Teaching",
      designation: t.designation || "Teacher",
      employmentType: "permanent",
      joinDate: t.joinedAt || "2024-01-01",
      status: t.employmentStatus === "active" ? "active" : "terminated",
      module,
    });
  }

  // Include custom staff added by the user in HR (ones not in seeds and not in DB)
  const seedIds = new Set(staffSeed.map((s) => s.id));
  for (const cs of customStaff) {
    if (
      !seedIds.has(cs.id) &&
      !staffMembers.some(
        (s) =>
          s.id === cs.id ||
          (cs.userId && s.userId === cs.userId) ||
          s.fullName.toLowerCase() === cs.fullName.toLowerCase(),
      )
    ) {
      staffMembers.push(cs);
    }
  }

  return staffMembers;
}

const Ctx = createContext<HRStore | null>(null);

export function HRProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_hr_staff");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return staffSeed;
  });

  const [payrollProfiles, setPayrollProfiles] = useState<PayrollProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_hr_payroll_profiles");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return payrollProfilesSeed;
  });

  const [payslips, setPayslips] = useState<Payslip[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_hr_payslips");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return payslipsSeed;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_hr_attendance");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return attendanceSeed;
  });

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_hr_leaves");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return leavesSeed;
  });

  const [loans, setLoans] = useState<StaffLoan[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_hr_loans");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return loansSeed;
  });

  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(true);

  const refreshStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const [usersRes, teachersRes] = await Promise.allSettled([
        fetch("/api/users", { credentials: "include" }),
        fetch("/api/teachers/dashboard", { credentials: "include" }),
      ]);

      let usersList: any[] = [];
      let teachersList: any[] = [];

      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const data = await usersRes.value.json().catch(() => null);
        if (data?.users && Array.isArray(data.users)) {
          usersList = data.users;
        }
      }

      if (teachersRes.status === "fulfilled" && teachersRes.value.ok) {
        const data = await teachersRes.value.json().catch(() => null);
        if (Array.isArray(data)) {
          teachersList = data;
        }
      }

      if (usersList.length > 0 || teachersList.length > 0) {
        let syncedStaff: StaffMember[] = [];
        setStaff((prevStaff) => {
          const merged = buildStaffListFromUsersAndTeachers(usersList, teachersList, prevStaff);
          syncedStaff = merged.length > 0 ? merged : prevStaff;
          return syncedStaff;
        });

        // Ensure each synced staff member has a payroll profile
        setPayrollProfiles((prevProfiles) => {
          const existingIds = new Set(prevProfiles.map((p) => p.staffId));
          const additions: PayrollProfile[] = [];
          for (const s of syncedStaff) {
            if (!existingIds.has(s.id)) {
              const teacher = teachersList.find((t) => t.id === s.id || (s.userId && t.userId === s.userId));
              const baseSalary = teacher?.baseMonthlySalaryPaisa
                ? Math.round(teacher.baseMonthlySalaryPaisa / 100)
                : undefined;
              additions.push(makeDefaultPayrollProfile(s, baseSalary));
            }
          }
          return additions.length > 0 ? [...prevProfiles, ...additions] : prevProfiles;
        });
      }
    } catch (err) {
      console.warn("Failed to sync staff from server:", err);
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    refreshStaff();
  }, [refreshStaff]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (staff.length > 0) {
          localStorage.setItem("msmis_hr_staff", JSON.stringify(staff));
        }
        if (payrollProfiles.length > 0) {
          localStorage.setItem("msmis_hr_payroll_profiles", JSON.stringify(payrollProfiles));
        }
        if (payslips.length > 0) {
          localStorage.setItem("msmis_hr_payslips", JSON.stringify(payslips));
        }
        if (attendance.length > 0) {
          localStorage.setItem("msmis_hr_attendance", JSON.stringify(attendance));
        }
        if (leaves.length > 0) {
          localStorage.setItem("msmis_hr_leaves", JSON.stringify(leaves));
        }
        if (loans.length > 0) {
          localStorage.setItem("msmis_hr_loans", JSON.stringify(loans));
        }
      } catch (err) {
        console.warn("Failed to save HR state to localStorage:", err);
      }
    }
  }, [staff, payrollProfiles, payslips, attendance, leaves, loans]);

  const addStaff = useCallback<HRStore["addStaff"]>((data) => {
    const id = `STF-${String(Date.now()).slice(-6)}`;
    const { payroll, ...rest } = data;
    const newStaff: StaffMember = { ...rest, id };
    setStaff((p) => [...p, newStaff]);
    setPayrollProfiles((p) => [...p, { ...payroll, staffId: id, effectiveFrom: new Date().toISOString().slice(0, 10) }]);
    return newStaff;
  }, []);

  const updateStaff = useCallback<HRStore["updateStaff"]>((id, data) => {
    setStaff((p) => p.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }, []);

  const terminateStaff = useCallback<HRStore["terminateStaff"]>((id) => {
    setStaff((p) => p.map((s) => (s.id === id ? { ...s, status: "terminated" } : s)));
  }, []);

  const updatePayrollProfile = useCallback<HRStore["updatePayrollProfile"]>((staffId, profile) => {
    setPayrollProfiles((p) => [...p, { ...profile, staffId }]);
  }, []);

  const generatePayroll = useCallback<HRStore["generatePayroll"]>((month, year) => {
    setPayslips((prev) => {
      const existing = new Set(prev.filter((x) => x.month === month && x.year === year).map((x) => x.staffId));
      const additions: Payslip[] = [];
      for (const s of staff) {
        if (s.status !== "active") continue;
        if (existing.has(s.id)) continue;
        const profile = [...payrollProfiles].reverse().find((p) => p.staffId === s.id);
        if (!profile) continue;
        const allowances =
          profile.hra +
          profile.transportAllowance +
          profile.medicalAllowance +
          profile.otherAllowances.reduce((a, b) => a + b.amount, 0);
        const gross = profile.basicSalary + allowances;
        const ded = profile.eobi + profile.incomeTax + profile.otherDeductions.reduce((a, b) => a + b.amount, 0);
        const daysAbsent = attendance.filter(
          (a) =>
            a.staffId === s.id &&
            a.date.startsWith(`${year}-${String(month).padStart(2, "0")}`) &&
            (a.status === "absent" || a.status === "leave"),
        ).length;
        const daysWorked = 26 - daysAbsent;
        const net = gross - ded - Math.round((profile.basicSalary / 26) * daysAbsent);
        additions.push({
          id: `PS-${s.id}-${year}-${month}`,
          staffId: s.id,
          month,
          year,
          basicSalary: profile.basicSalary,
          totalAllowances: allowances,
          grossSalary: gross,
          totalDeductions: ded,
          netSalary: net,
          daysWorked,
          daysAbsent,
          status: "draft",
        });
      }
      return [...prev, ...additions];
    });
  }, [staff, payrollProfiles, attendance]);

  const approvePayroll = useCallback<HRStore["approvePayroll"]>((month, year) => {
    setPayslips((p) =>
      p.map((x) => (x.month === month && x.year === year && x.status === "draft" ? { ...x, status: "approved" } : x)),
    );
  }, []);

  const markPayrollPaid = useCallback<HRStore["markPayrollPaid"]>((month, year) => {
    const now = new Date().toISOString().slice(0, 10);
    setPayslips((p) =>
      p.map((x) =>
        x.month === month && x.year === year && x.status === "approved" ? { ...x, status: "paid", paidAt: now } : x,
      ),
    );
  }, []);

  const bulkSaveAttendance = useCallback<HRStore["bulkSaveAttendance"]>((date, records) => {
    setAttendance((prev) => {
      const recordIds = new Set(records.map((r) => r.staffId));
      const filtered = prev.filter((a) => !(a.date === date && recordIds.has(a.staffId)));
      const adds: AttendanceRecord[] = records.map((r) => ({
        id: `ATT-${r.staffId}-${date}`,
        staffId: r.staffId,
        date,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
      }));
      return [...filtered, ...adds];
    });
  }, []);

  const approveLeave = useCallback<HRStore["approveLeave"]>((id) => {
    setLeaves((p) => p.map((l) => (l.id === id ? { ...l, status: "approved" } : l)));
  }, []);

  const rejectLeave = useCallback<HRStore["rejectLeave"]>((id) => {
    setLeaves((p) => p.map((l) => (l.id === id ? { ...l, status: "rejected" } : l)));
  }, []);

  const addLoan = useCallback<HRStore["addLoan"]>((data) => {
    setLoans((p) => [
      ...p,
      { ...data, id: `LN-${String(Date.now()).slice(-6)}`, status: "active", remainingBalance: data.amount },
    ]);
  }, []);

  const settleLoan = useCallback<HRStore["settleLoan"]>((id) => {
    setLoans((p) => p.map((l) => (l.id === id ? { ...l, status: "settled", remainingBalance: 0 } : l)));
  }, []);

  const value = useMemo<HRStore>(
    () => ({
      staff,
      payrollProfiles,
      payslips,
      attendance,
      leaves,
      loans,
      isLoadingStaff,
      refreshStaff,
      addStaff,
      updateStaff,
      terminateStaff,
      updatePayrollProfile,
      generatePayroll,
      approvePayroll,
      markPayrollPaid,
      bulkSaveAttendance,
      approveLeave,
      rejectLeave,
      addLoan,
      settleLoan,
    }),
    [
      staff,
      payrollProfiles,
      payslips,
      attendance,
      leaves,
      loans,
      isLoadingStaff,
      refreshStaff,
      addStaff,
      updateStaff,
      terminateStaff,
      updatePayrollProfile,
      generatePayroll,
      approvePayroll,
      markPayrollPaid,
      bulkSaveAttendance,
      approveLeave,
      rejectLeave,
      addLoan,
      settleLoan,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHR(): HRStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHR must be used inside HRProvider");
  return v;
}