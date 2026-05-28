export type StaffType = "teacher" | "administrator" | "support" | "accountant" | "librarian" | "helper";
export type EmploymentType = "permanent" | "contractual" | "part-time";
export type StaffStatus = "active" | "on_leave" | "terminated";
export type StaffModule = "school" | "madrassa" | "shared";

export type StaffMember = {
  id: string;
  fullName: string;
  cnic: string;
  dob: string;
  gender: "male" | "female";
  phone: string;
  emergencyContact: string;
  address: string;
  photoUrl?: string;
  staffType: StaffType;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  joinDate: string;
  status: StaffStatus;
  module: StaffModule;
};

export type PayrollProfile = {
  staffId: string;
  basicSalary: number;
  hra: number;
  transportAllowance: number;
  medicalAllowance: number;
  otherAllowances: { label: string; amount: number }[];
  eobi: number;
  incomeTax: number;
  otherDeductions: { label: string; amount: number }[];
  bankName: string;
  accountNumber: string;
  effectiveFrom: string;
};

export type Payslip = {
  id: string;
  staffId: string;
  month: number;
  year: number;
  basicSalary: number;
  totalAllowances: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  daysWorked: number;
  daysAbsent: number;
  status: "draft" | "pending" | "approved" | "paid";
  paidAt?: string;
};

export type AttendanceRecord = {
  id: string;
  staffId: string;
  date: string;
  status: "present" | "absent" | "late" | "half_day" | "leave";
  checkIn?: string;
  checkOut?: string;
};

export type LeaveRequest = {
  id: string;
  staffId: string;
  leaveType: "sick" | "annual" | "emergency" | "unpaid";
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
};

export type StaffLoan = {
  id: string;
  staffId: string;
  amount: number;
  issueDate: string;
  monthlyInstalment: number;
  remainingBalance: number;
  status: "active" | "settled";
};

export type Department = { id: string; name: string; headStaffId?: string };

export const departments: Department[] = [
  { id: "dep-quran", name: "Quran & Tajweed" },
  { id: "dep-arabic", name: "Arabic Studies" },
  { id: "dep-science", name: "Science" },
  { id: "dep-math", name: "Mathematics" },
  { id: "dep-admin", name: "Administration" },
  { id: "dep-finance", name: "Finance" },
  { id: "dep-support", name: "Support Services" },
];

const STAFF_SEED: Omit<StaffMember, "id">[] = [
  { fullName: "Muhammad Saeed Khan", cnic: "35201-1234567-1", dob: "1978-03-12", gender: "male", phone: "+92 300 1234567", emergencyContact: "+92 300 7654321", address: "House 12, Street 5, Lahore", staffType: "teacher", department: "Quran & Tajweed", designation: "Senior Qari", employmentType: "permanent", joinDate: "2015-04-01", status: "active", module: "madrassa" },
  { fullName: "Abdul Rehman Siddiqui", cnic: "35201-2233445-3", dob: "1982-07-22", gender: "male", phone: "+92 301 2233445", emergencyContact: "+92 301 5544332", address: "Block C, Model Town, Lahore", staffType: "teacher", department: "Arabic Studies", designation: "Mudarris", employmentType: "permanent", joinDate: "2017-08-15", status: "active", module: "madrassa" },
  { fullName: "Hafiz Bilal Ahmad", cnic: "35201-3344556-2", dob: "1990-11-05", gender: "male", phone: "+92 302 3344556", emergencyContact: "+92 302 6655443", address: "Gulberg III, Lahore", staffType: "teacher", department: "Quran & Tajweed", designation: "Hifz Ustaad", employmentType: "permanent", joinDate: "2019-01-10", status: "active", module: "madrassa" },
  { fullName: "Fatima Zahra", cnic: "35201-4455667-4", dob: "1988-02-18", gender: "female", phone: "+92 303 4455667", emergencyContact: "+92 303 7766554", address: "DHA Phase 5, Lahore", staffType: "teacher", department: "Mathematics", designation: "Subject Teacher", employmentType: "permanent", joinDate: "2018-04-20", status: "active", module: "school" },
  { fullName: "Ayesha Tariq", cnic: "35201-5566778-6", dob: "1992-06-30", gender: "female", phone: "+92 304 5566778", emergencyContact: "+92 304 8877665", address: "Johar Town, Lahore", staffType: "teacher", department: "Science", designation: "Science Teacher", employmentType: "contractual", joinDate: "2021-09-01", status: "active", module: "school" },
  { fullName: "Khalid Mahmood", cnic: "35201-6677889-8", dob: "1975-10-14", gender: "male", phone: "+92 305 6677889", emergencyContact: "+92 305 9988776", address: "Cantt, Lahore", staffType: "administrator", department: "Administration", designation: "Principal", employmentType: "permanent", joinDate: "2010-06-01", status: "active", module: "shared" },
  { fullName: "Saima Malik", cnic: "35201-7788990-1", dob: "1985-12-09", gender: "female", phone: "+92 306 7788990", emergencyContact: "+92 306 1100998", address: "Faisal Town, Lahore", staffType: "administrator", department: "Administration", designation: "Vice Principal", employmentType: "permanent", joinDate: "2016-07-15", status: "active", module: "shared" },
  { fullName: "Imran Hassan Qureshi", cnic: "35201-8899001-3", dob: "1983-04-25", gender: "male", phone: "+92 307 8899001", emergencyContact: "+92 307 2211009", address: "Garden Town, Lahore", staffType: "accountant", department: "Finance", designation: "Senior Accountant", employmentType: "permanent", joinDate: "2014-03-10", status: "active", module: "shared" },
  { fullName: "Nadia Raza", cnic: "35201-9900112-5", dob: "1991-08-19", gender: "female", phone: "+92 308 9900112", emergencyContact: "+92 308 3322110", address: "Iqbal Town, Lahore", staffType: "librarian", department: "Administration", designation: "Librarian", employmentType: "permanent", joinDate: "2020-02-01", status: "active", module: "shared" },
  { fullName: "Tariq Iqbal", cnic: "35201-0011223-7", dob: "1980-01-30", gender: "male", phone: "+92 309 0011223", emergencyContact: "+92 309 4433221", address: "Township, Lahore", staffType: "support", department: "Support Services", designation: "IT Support", employmentType: "contractual", joinDate: "2022-05-20", status: "active", module: "shared" },
  { fullName: "Usman Awan", cnic: "35201-1122334-9", dob: "1987-09-12", gender: "male", phone: "+92 310 1122334", emergencyContact: "+92 310 5544332", address: "Wapda Town, Lahore", staffType: "teacher", department: "Mathematics", designation: "Maths Teacher", employmentType: "permanent", joinDate: "2018-11-05", status: "active", module: "school" },
  { fullName: "Rashid Sheikh", cnic: "35201-2233445-0", dob: "1970-05-05", gender: "male", phone: "+92 311 2233445", emergencyContact: "+92 311 6655443", address: "Samanabad, Lahore", staffType: "helper", department: "Support Services", designation: "Caretaker", employmentType: "permanent", joinDate: "2008-08-08", status: "active", module: "shared" },
];

export const staffSeed: StaffMember[] = STAFF_SEED.map((s, i) => ({ ...s, id: `STF-${String(i + 1).padStart(3, "0")}` }));

function makePayroll(s: StaffMember): PayrollProfile {
  const basic = s.staffType === "teacher" ? 60000 + Math.floor(Math.random() * 20000) : s.staffType === "administrator" ? 90000 : s.staffType === "accountant" ? 70000 : 40000;
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
    effectiveFrom: "2025-01-01",
  };
}

export const payrollProfilesSeed: PayrollProfile[] = staffSeed.map(makePayroll);

function makePayslips(s: StaffMember, profile: PayrollProfile): Payslip[] {
  const months = [
    { m: 3, y: 2026 },
    { m: 4, y: 2026 },
    { m: 5, y: 2026 },
  ];
  const allowances = profile.hra + profile.transportAllowance + profile.medicalAllowance;
  const gross = profile.basicSalary + allowances;
  const ded = profile.eobi + profile.incomeTax;
  return months.map((mm, idx) => ({
    id: `PS-${s.id}-${mm.y}-${mm.m}`,
    staffId: s.id,
    month: mm.m,
    year: mm.y,
    basicSalary: profile.basicSalary,
    totalAllowances: allowances,
    grossSalary: gross,
    totalDeductions: ded,
    netSalary: gross - ded,
    daysWorked: 26 - (idx % 2),
    daysAbsent: idx % 2,
    status: idx === 2 ? "approved" : "paid",
    paidAt: idx === 2 ? undefined : `${mm.y}-${String(mm.m).padStart(2, "0")}-28`,
  }));
}

export const payslipsSeed: Payslip[] = staffSeed.flatMap((s) => {
  const p = payrollProfilesSeed.find((pp) => pp.staffId === s.id)!;
  return makePayslips(s, p);
});

export const attendanceSeed: AttendanceRecord[] = (() => {
  const out: AttendanceRecord[] = [];
  const today = new Date(2026, 4, 28);
  for (const s of staffSeed) {
    for (let d = 0; d < 90; d++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - d);
      const wd = dt.getDay();
      if (wd === 5) continue; // Friday off
      const rand = (d * (parseInt(s.id.replace(/\D/g, "")) || 1)) % 20;
      const status: AttendanceRecord["status"] =
        rand === 0 ? "absent" : rand === 1 ? "late" : rand === 2 ? "leave" : rand === 3 ? "half_day" : "present";
      out.push({
        id: `ATT-${s.id}-${dt.toISOString().slice(0, 10)}`,
        staffId: s.id,
        date: dt.toISOString().slice(0, 10),
        status,
        checkIn: status === "absent" || status === "leave" ? undefined : "08:00",
        checkOut: status === "absent" || status === "leave" ? undefined : status === "half_day" ? "12:00" : "15:30",
      });
    }
  }
  return out;
})();

export const leavesSeed: LeaveRequest[] = [
  { id: "LV-001", staffId: "STF-002", leaveType: "sick", fromDate: "2026-05-20", toDate: "2026-05-22", days: 3, reason: "Fever", status: "pending", appliedAt: "2026-05-19" },
  { id: "LV-002", staffId: "STF-004", leaveType: "annual", fromDate: "2026-06-01", toDate: "2026-06-07", days: 7, reason: "Family vacation", status: "pending", appliedAt: "2026-05-24" },
  { id: "LV-003", staffId: "STF-005", leaveType: "emergency", fromDate: "2026-05-10", toDate: "2026-05-10", days: 1, reason: "Family emergency", status: "approved", appliedAt: "2026-05-09" },
];

export const loansSeed: StaffLoan[] = [
  { id: "LN-001", staffId: "STF-001", amount: 100000, issueDate: "2026-01-15", monthlyInstalment: 10000, remainingBalance: 60000, status: "active" },
  { id: "LN-002", staffId: "STF-006", amount: 200000, issueDate: "2025-06-01", monthlyInstalment: 15000, remainingBalance: 50000, status: "active" },
];