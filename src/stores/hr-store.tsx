import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  staffSeed,
  payrollProfilesSeed,
  payslipsSeed,
  attendanceSeed,
  leavesSeed,
  loansSeed,
  departments as departmentsSeed,
  type StaffMember,
  type PayrollProfile,
  type Payslip,
  type AttendanceRecord,
  type LeaveRequest,
  type StaffLoan,
  type Department,
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
  departments: Department[];
  addStaff: (data: NewStaffInput) => StaffMember;
  updateStaff: (id: string, data: Partial<StaffMember>) => void;
  terminateStaff: (id: string, reason: string) => void;
  updatePayrollProfile: (staffId: string, profile: Omit<PayrollProfile, "staffId">) => void;
  generatePayroll: (month: number, year: number) => void;
  approvePayroll: (month: number, year: number) => void;
  markPayrollPaid: (month: number, year: number) => void;
  bulkSaveAttendance: (date: string, records: { staffId: string; status: AttendanceRecord["status"]; checkIn?: string; checkOut?: string }[]) => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;
  addLoan: (data: Omit<StaffLoan, "id" | "status" | "remainingBalance">) => void;
  settleLoan: (id: string) => void;
  addDepartment: (name: string) => void;
  updateDepartment: (id: string, data: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
};

const Ctx = createContext<HRStore | null>(null);

export function HRProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffMember[]>(staffSeed);
  const [payrollProfiles, setPayrollProfiles] = useState<PayrollProfile[]>(payrollProfilesSeed);
  const [payslips, setPayslips] = useState<Payslip[]>(payslipsSeed);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(attendanceSeed);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(leavesSeed);
  const [loans, setLoans] = useState<StaffLoan[]>(loansSeed);
  const [departments, setDepartments] = useState<Department[]>(departmentsSeed);

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
        const allowances = profile.hra + profile.transportAllowance + profile.medicalAllowance + profile.otherAllowances.reduce((a, b) => a + b.amount, 0);
        const gross = profile.basicSalary + allowances;
        const ded = profile.eobi + profile.incomeTax + profile.otherDeductions.reduce((a, b) => a + b.amount, 0);
        const daysAbsent = attendance.filter((a) => a.staffId === s.id && a.date.startsWith(`${year}-${String(month).padStart(2, "0")}`) && (a.status === "absent" || a.status === "leave")).length;
        const daysWorked = 26 - daysAbsent;
        const net = gross - ded - Math.round((profile.basicSalary / 26) * daysAbsent);
        additions.push({
          id: `PS-${s.id}-${year}-${month}`,
          staffId: s.id,
          month, year,
          basicSalary: profile.basicSalary,
          totalAllowances: allowances,
          grossSalary: gross,
          totalDeductions: ded,
          netSalary: net,
          daysWorked, daysAbsent,
          status: "draft",
        });
      }
      return [...prev, ...additions];
    });
  }, [staff, payrollProfiles, attendance]);

  const approvePayroll = useCallback<HRStore["approvePayroll"]>((month, year) => {
    setPayslips((p) => p.map((x) => (x.month === month && x.year === year && x.status === "draft" ? { ...x, status: "approved" } : x)));
  }, []);

  const markPayrollPaid = useCallback<HRStore["markPayrollPaid"]>((month, year) => {
    const now = new Date().toISOString().slice(0, 10);
    setPayslips((p) => p.map((x) => (x.month === month && x.year === year && x.status === "approved" ? { ...x, status: "paid", paidAt: now } : x)));
  }, []);

  const bulkSaveAttendance = useCallback<HRStore["bulkSaveAttendance"]>((date, records) => {
    setAttendance((prev) => {
      const filtered = prev.filter((a) => a.date !== date);
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
    setLoans((p) => [...p, { ...data, id: `LN-${String(Date.now()).slice(-6)}`, status: "active", remainingBalance: data.amount }]);
  }, []);
  const settleLoan = useCallback<HRStore["settleLoan"]>((id) => {
    setLoans((p) => p.map((l) => (l.id === id ? { ...l, status: "settled", remainingBalance: 0 } : l)));
  }, []);

  const addDepartment = useCallback<HRStore["addDepartment"]>((name) => {
    setDepartments((p) => [...p, { id: `dep-${Date.now()}`, name }]);
  }, []);
  const updateDepartment = useCallback<HRStore["updateDepartment"]>((id, data) => {
    setDepartments((p) => p.map((d) => (d.id === id ? { ...d, ...data } : d)));
  }, []);
  const deleteDepartment = useCallback<HRStore["deleteDepartment"]>((id) => {
    setDepartments((p) => p.filter((d) => d.id !== id));
  }, []);

  const value = useMemo<HRStore>(() => ({
    staff, payrollProfiles, payslips, attendance, leaves, loans, departments,
    addStaff, updateStaff, terminateStaff, updatePayrollProfile,
    generatePayroll, approvePayroll, markPayrollPaid,
    bulkSaveAttendance, approveLeave, rejectLeave,
    addLoan, settleLoan,
    addDepartment, updateDepartment, deleteDepartment,
  }), [staff, payrollProfiles, payslips, attendance, leaves, loans, departments, addStaff, updateStaff, terminateStaff, updatePayrollProfile, generatePayroll, approvePayroll, markPayrollPaid, bulkSaveAttendance, approveLeave, rejectLeave, addLoan, settleLoan, addDepartment, updateDepartment, deleteDepartment]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHR(): HRStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHR must be used inside HRProvider");
  return v;
}