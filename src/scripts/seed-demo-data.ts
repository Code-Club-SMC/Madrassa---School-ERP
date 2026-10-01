import "dotenv/config";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { schoolClasses, madrassaSubcategories } from "@/db/schema/academic";
import { academicYears } from "@/db/schema/academic-years";
import {
  students,
  guardians,
  studentEnrollments,
  studentGuardians,
} from "@/db/schema/students";
import { teacherProfiles, teacherAssignments } from "@/db/schema/teachers";
import { examSubjects, examSessions, examSessionSubjects, examMarks, examResults } from "@/db/schema/exams";
import { studentAttendance } from "@/db/schema/attendance";
import { feeCharges, feePayments, feePaymentAllocations } from "@/db/schema/finance";
import { admissionApplications, admissionEvents } from "@/db/schema/admission";
import { schoolTimetablePeriods, schoolTimetableSlots } from "@/db/schema/timetable";
import { hashPassword } from "@/lib/server/password";

const PREFIX = "demo";

function rid(suffix: string) {
  return `${PREFIX}_${suffix}_${randomUUID().slice(0, 8)}`;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rand = rng(20260930);
const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const FIRST_M = ["Ahmed", "Bilal", "Hamza", "Usman", "Omar", "Zaid", "Yusuf", "Ibrahim", "Kashif", "Adnan", "Faisal", "Imran"];
const FIRST_F = ["Ayesha", "Fatima", "Hina", "Maryam", "Zainab", "Sadia", "Rabia", "Hafsa", "Noor", "Amna"];
const LAST = ["Khan", "Malik", "Butt", "Chaudhry", "Qureshi", "Farooq", "Iqbal", "Aslam", "Sattar", "Javed"];

function urduName(pool: string[]) {
  return pool.join(" ");
}

const SCHOOL_CLASSES = [
  { id: `${PREFIX}_sc_nursery`, code: "NUR", name: "Nursery", nameUrdu: "نرسری", level: "pre-primary", displayOrder: 10, fee: 150000 },
  { id: `${PREFIX}_sc_kg`, code: "KG", name: "KG", nameUrdu: "کی جی", level: "pre-primary", displayOrder: 20, fee: 150000 },
  { id: `${PREFIX}_sc_1`, code: "I", name: "Class 1", nameUrdu: " جماعت اول", level: "primary", displayOrder: 30, fee: 180000 },
  { id: `${PREFIX}_sc_3`, code: "III", name: "Class 3", nameUrdu: "جماعت سوم", level: "primary", displayOrder: 50, fee: 180000 },
  { id: `${PREFIX}_sc_5`, code: "V", name: "Class 5", nameUrdu: "جماعت پنجم", level: "primary", displayOrder: 70, fee: 200000 },
  { id: `${PREFIX}_sc_7`, code: "VII", name: "Class 7", nameUrdu: "جماعت ہفتم", level: "middle", displayOrder: 90, fee: 220000 },
  { id: `${PREFIX}_sc_9`, code: "IX", name: "Class 9", nameUrdu: "جماعت نہم", level: "secondary", displayOrder: 110, fee: 240000 },
  { id: `${PREFIX}_sc_10`, code: "X", name: "Class 10", nameUrdu: "جماعت دہم", level: "secondary", displayOrder: 120, fee: 240000 },
];

const SCHOOL_SUBJECTS = [
  { code: "UR", name: "Urdu", nameUrdu: "اردو", totalMarks: 100, passingMarks: 40 },
  { code: "EN", name: "English", nameUrdu: "انگریزی", totalMarks: 100, passingMarks: 40 },
  { code: "MATH", name: "Mathematics", nameUrdu: "ریاضی", totalMarks: 100, passingMarks: 40 },
  { code: "SCI", name: "General Science", nameUrdu: "سائنس", totalMarks: 100, passingMarks: 40 },
  { code: "ISL", name: "Islamiyat", nameUrdu: "اسلامیات", totalMarks: 100, passingMarks: 35 },
  { code: "PAK", name: "Pakistan Studies", nameUrdu: "پاکستانی اسٹڈیز", totalMarks: 100, passingMarks: 35 },
];

const MADRASSA_SUBJECTS = [
  { code: "QUR", name: "Quran", nameUrdu: "قرآن", totalMarks: 100, passingMarks: 40 },
  { code: "NZA", name: "Nahw", nameUrdu: "نحو", totalMarks: 100, passingMarks: 40 },
  { code: "SHR", name: "Sarf", nameUrdu: "صرف", totalMarks: 100, passingMarks: 40 },
  { code: "HAD", name: "Hadith", nameUrdu: "حدیث", totalMarks: 100, passingMarks: 40 },
  { code: "TJQ", name: "Tajweed", nameUrdu: "تجوید", totalMarks: 100, passingMarks: 40 },
  { code: "BAL", name: "Balaqi", nameUrdu: "بالقی", totalMarks: 100, passingMarks: 40 },
];

const TEACHERS = [
  { name: "Maulana Abdul Rehman", role: "teacher", subject: "QUR", placement: "qasmia-madrassa" },
  { name: "Ustad Muhammad Yasin", role: "teacher", subject: "NZA", placement: "qasmia-madrassa" },
  { name: "Qaria Sakina Noor", role: "teacher", subject: "TJQ", placement: "zainab-madrassa" },
  { name: "Nadeem Ahmad", role: "teacher", subject: "MATH", placement: "qasim-school" },
  { name: "Sadia Iqbal", role: "teacher", subject: "EN", placement: "qasim-school" },
  { name: "Kamran Shah", role: "teacher", subject: "SCI", placement: "qasim-school" },
  { name: "Rehana Kausar", role: "teacher", subject: "UR", placement: "qasim-school" },
  { name: "Bilal Ahmed", role: "principal", subject: "PAK", placement: "qasim-school" },
  { name: "Haji Ghulam Abbas", role: "teacher", subject: "HAD", placement: "qasmia-madrassa" },
  { name: "Zarina Bibi", role: "accountant", subject: "BAL", placement: "zainab-madrassa" },
  { name: "Shabana Kausar", role: "teacher", subject: "TJQ", placement: "zainab-madrassa" },
  { name: "Rabia Noor", role: "teacher", subject: "UR", placement: "zainab-school" },
  { name: "Amna Aslam", role: "teacher", subject: "EN", placement: "zainab-school" },
] as const;

const PLACEMENT_INSTITUTION: Record<string, string> = {
  "qasmia-madrassa": "jamia_qasmia_baneen",
  "qasim-school": "al_qasim_academy",
  "zainab-madrassa": "jamia_zainab_banat",
  "zainab-school": "jamia_zainab_banat",
};

const PLACEMENT_SYSTEM: Record<string, "school" | "madrassa"> = {
  "qasmia-madrassa": "madrassa",
  "qasim-school": "school",
  "zainab-madrassa": "madrassa",
  "zainab-school": "school",
};

const counters = new Map<string, number>();

function nextNumber(scope: { type: string; institutionId: string; programId?: string; prefix: string }) {
  const year = new Date().getFullYear();
  const key = [year, scope.prefix].join(":");
  const value = (counters.get(key) ?? 0) + 1;
  counters.set(key, value);
  return `${scope.prefix}-${year}-${value.toString().padStart(4, "0")}`;
}

function isoDate(daysAgo: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const [admin] = await db.select().from(user).where(sql`role = 'super_admin'`).limit(1);
  if (!admin) throw new Error("Run seed-admin.ts first (no super admin found)");
  const adminId = admin.id;
  console.log(`Super admin: ${admin.email}`);

  const resetTables = [
    "exam_seat_assignments",
    "exam_seating_plans",
    "exam_results",
    "exam_marks",
    "exam_session_subjects",
    "exam_sessions",
    "fee_payment_allocations",
    "fee_payments",
    "fee_charges",
    "student_attendance",
    "admission_events",
    "admission_applications",
    "student_guardians",
    "guardians",
    "student_enrollments",
    "students",
    "teacher_assignments",
    "teacher_timetable_periods",
    "teacher_profiles",
    "school_timetable_slots",
    "school_timetable_periods",
    "madrassa_timetable_slots",
    "madrassa_timetable_periods",
    "exam_subjects",
    "academic_years",
    "school_classes",
  ];
  for (const table of resetTables) {
    await db.execute(sql.raw(`delete from "${table}"`));
  }
  await db.execute(sql.raw(`delete from account where user_id like '${PREFIX}%'`));
  await db.execute(sql.raw(`delete from "user" where id like '${PREFIX}%'`));
  console.log("Cleared previous demo rows.\n");

  const qasmia = { id: "jamia_qasmia_baneen" };
  const zainab = { id: "jamia_zainab_banat" };
  const schoolProgramId = "al_qasim_school";

  await db.insert(schoolClasses)
    .values(
      SCHOOL_CLASSES.map((c) => ({
        id: c.id,
        institutionId: "al_qasim_academy",
        code: c.code,
        name: c.name,
        nameUrdu: c.nameUrdu.trim(),
        level: c.level,
        gender: "mixed",
        fee: c.fee,
        displayOrder: c.displayOrder,
        active: true,
      })),
    )
    .onConflictDoNothing();
  console.log(`School classes: ${SCHOOL_CLASSES.length}`);

  const yearNow = new Date().getFullYear();
  const academicYearRows = [
    { id: `${PREFIX}_ay_school`, name: `${yearNow}-${yearNow + 1}`, hijriName: `${yearNow + 1}ھ`, system: "school" as const, calendarType: "gregorian" as const, startDate: `${yearNow}-04-01`, endDate: `${yearNow + 1}-03-31`, status: "active" as const },
    { id: `${PREFIX}_ay_school_next`, name: `${yearNow + 1}-${yearNow + 2}`, system: "school" as const, calendarType: "gregorian" as const, startDate: `${yearNow + 1}-04-01`, endDate: `${yearNow + 2}-03-31`, status: "upcoming" as const },
    { id: `${PREFIX}_ay_madrassa`, name: `${yearNow}-${yearNow + 1}`, hijriName: `${yearNow + 1}ھ`, system: "madrassa" as const, calendarType: "hijri" as const, startDate: `${yearNow}-01-01`, endDate: `${yearNow + 1}-01-01`, status: "active" as const },
  ];
  await db.insert(academicYears).values(academicYearRows).onConflictDoNothing();
  console.log(`Academic years: ${academicYearRows.length}`);

  const subcats = await db.select().from(madrassaSubcategories);
  const boysSubs = subcats.filter((s) => s.section === "baneen").slice(0, 8);
  const girlsSubs = subcats.filter((s) => s.section === "banat").slice(0, 4);
  console.log(`Madrassa subcategories in use: ${boysSubs.length + girlsSubs.length}`);

  const schoolSubjectRows: Array<Record<string, unknown>> = [];
  for (const cls of SCHOOL_CLASSES) {
    for (const [i, subj] of SCHOOL_SUBJECTS.entries()) {
      schoolSubjectRows.push({
        id: `${PREFIX}_subj_${cls.code}_${subj.code}`,
        system: "school",
        schoolClassId: cls.id,
        code: subj.code,
        name: subj.name,
        nameUrdu: subj.nameUrdu,
        group: i < 3 ? "compulsory" : "elective",
        totalMarks: subj.totalMarks,
        passingMarks: subj.passingMarks,
        displayOrder: (i + 1) * 10,
        active: true,
      });
    }
  }
  const madrassaSubjectRows: Array<Record<string, unknown>> = [];
  for (const sub of [...boysSubs, ...girlsSubs]) {
    for (const [i, subj] of MADRASSA_SUBJECTS.entries()) {
      madrassaSubjectRows.push({
        id: `${PREFIX}_msubj_${sub.rollPrefix}_${subj.code}`,
        system: "madrassa",
        madrassaSubcategoryId: sub.id,
        code: subj.code,
        name: subj.name,
        nameUrdu: subj.nameUrdu,
        group: i < 4 ? "compulsory" : "elective",
        totalMarks: subj.totalMarks,
        passingMarks: subj.passingMarks,
        displayOrder: (i + 1) * 10,
        active: true,
      });
    }
  }
  await db
    .insert(examSubjects)
    .values(schoolSubjectRows as never)
    .onConflictDoNothing();
  await db
    .insert(examSubjects)
    .values(madrassaSubjectRows as never)
    .onConflictDoNothing();
  console.log(`Exam subjects: ${schoolSubjectRows.length + madrassaSubjectRows.length}`);

  const hashed = await hashPassword("Teacher@123");
  const teacherRows: Array<Record<string, unknown>> = [];
  const accountRows: Array<Record<string, unknown>> = [];
  for (const [i, t] of TEACHERS.entries()) {
    const userId = `${PREFIX}_user_teacher_${i + 1}`;
    const email = `teacher${i + 1}@demo.local`;
    teacherRows.push({
      id: userId,
      name: t.name,
      email,
      username: email,
      emailVerified: true,
      role: t.role,
      status: "active",
      systemAccess: PLACEMENT_SYSTEM[t.placement],
      mustChangePassword: false,
      department: PLACEMENT_SYSTEM[t.placement] === "school" ? "School" : "Madrassa",
      designation: t.role === "teacher" ? "Teacher" : t.role === "principal" ? "Principal" : "Accountant",
    });
    accountRows.push({
      id: `${PREFIX}_acct_teacher_${i + 1}`,
      accountId: email,
      providerId: "credential",
      userId,
      password: hashed,
    });
  }
  await db.insert(user).values(teacherRows as never).onConflictDoNothing();
  await db.insert(account).values(accountRows as never).onConflictDoNothing();

  const profileRows: Array<Record<string, unknown>> = [];
  const assignmentRows: Array<Record<string, unknown>> = [];
  for (const [i, t] of TEACHERS.entries()) {
    const userId = `${PREFIX}_user_teacher_${i + 1}`;
    const system = PLACEMENT_SYSTEM[t.placement];
    const institutionId = PLACEMENT_INSTITUTION[t.placement];
    profileRows.push({
      id: `${PREFIX}_tp_${i + 1}`,
      userId,
      systemScope: system,
      gender: ["Qaria", "Sadia", "Rehana", "Zarina", "Shabana", "Rabia", "Amna"].some((n) => t.name.startsWith(n)) ? "female" : "male",
      designation: t.role === "teacher" ? "Teacher" : t.role === "principal" ? "Principal" : "Accountant",
      qualification: t.role === "principal" ? "M.A. Urdu, M.Ed" : "B.A. Urdu, D.I.T.",
      address: "Tal Thall, Hangu, Pakistan",
      joinedAt: `${yearNow - between(1, 8)}-0${between(1, 9)}-1${between(0, 9)}`,
      employmentStatus: "active",
      baseMonthlySalaryPaisa: between(25, 60) * 100000,
      paymentMethod: i % 3 === 0 ? "bank" : "cash",
      bankName: i % 3 === 0 ? "Meezan Bank" : null,
    });

    if (system === "school") {
      const isZainabSchool = t.placement === "zainab-school";
      const cls = pick(SCHOOL_CLASSES);
      assignmentRows.push({
        id: `${PREFIX}_ta_${i + 1}`,
        teacherProfileId: `${PREFIX}_tp_${i + 1}`,
        system: "school",
        institutionId,
        programId: isZainabSchool ? "zainab_school_support" : schoolProgramId,
        schoolClassId: cls.id,
        subjectId: `${PREFIX}_subj_${cls.code}_${t.subject}`,
        academicYear: `${yearNow}-${yearNow + 1}`,
        effectiveFrom: `${yearNow}-04-01`,
        active: true,
      });
    } else {
      const isZainab = t.placement === "zainab-madrassa";
      const pool = isZainab ? girlsSubs : boysSubs;
      const sub = t.role === "accountant" ? pool[0] : pick(pool);
      const isHifz = sub.rollPrefix.startsWith("QH");
      assignmentRows.push({
        id: `${PREFIX}_ta_${i + 1}`,
        teacherProfileId: `${PREFIX}_tp_${i + 1}`,
        system: "madrassa",
        institutionId,
        programId: isZainab ? "zainab_dars_nizami" : isHifz ? "qasmia_hifz" : "qasmia_dars_nizami",
        madrassaSubcategoryId: sub.id,
        subjectId: `${PREFIX}_msubj_${sub.rollPrefix}_${t.subject}`,
        academicYear: `${yearNow}-${yearNow + 1}`,
        effectiveFrom: `${yearNow}-04-01`,
        active: true,
      });
    }
  }
  await db.insert(teacherProfiles).values(profileRows as never).onConflictDoNothing();
  await db.insert(teacherAssignments).values(assignmentRows as never).onConflictDoNothing();
  console.log(`Teachers: ${TEACHERS.length} (login: teacher1@demo.local / Teacher@123)`);

  const periodRows: Array<Record<string, unknown>> = [];
  const slotRows: Array<Record<string, unknown>> = [];
  const slotTimes = [
    ["08:00", "08:40"],
    ["08:45", "09:25"],
    ["09:30", "10:10"],
    ["10:30", "11:10"],
    ["11:15", "11:55"],
  ];
  for (const cls of SCHOOL_CLASSES) {
    for (const [i, [s, e]] of slotTimes.entries()) {
      const periodId = `${PREFIX}_stp_${cls.code}_${i + 1}`;
      periodRows.push({
        id: periodId,
        schoolClassId: cls.id,
        timeStart: s,
        timeEnd: e,
        label: `Period ${i + 1}`,
        labelUrdu: `گھرٹہ ${i + 1}`,
        displayOrder: (i + 1) * 10,
        isBreak: false,
      });
      for (let day = 1; day <= 6; day += 1) {
        slotRows.push({
          id: `${PREFIX}_sts_${cls.code}_${i + 1}_${day}`,
          periodId,
          dayOfWeek: day,
          subjectId: `${PREFIX}_subj_${cls.code}_${pick(SCHOOL_SUBJECTS).code}`,
        });
      }
    }
  }
  await db.insert(schoolTimetablePeriods).values(periodRows as never).onConflictDoNothing();
  await db.insert(schoolTimetableSlots).values(slotRows as never).onConflictDoNothing();
  console.log(`Timetable: ${periodRows.length} periods, ${slotRows.length} slots`);

  const enrolments: Array<{
    enrollmentId: string;
    studentId: string;
    institutionId: string;
    programId: string;
    schoolClassId: string | null;
    madrassaSubcategoryId: string | null;
    section: "school" | "madrassa";
    rollNo: string;
  }> = [];

  async function createStudentSet(opts: {
    count: number;
    section: "school" | "madrassa";
    institutionId: string;
    programId: string;
    schoolClassId?: string;
    madrassaSubcategoryId?: string;
    gender: "male" | "female";
    rollPrefix: string;
    classRollPrefix: string;
    fee: number;
  }) {
    for (let i = 0; i < opts.count; i += 1) {
      const gender = opts.gender;
      const first = gender === "male" ? pick(FIRST_M) : pick(FIRST_F);
      const last = pick(LAST);
      const name = `${first} ${last}`;
      const father = `${pick(FIRST_M)} ${last}`;
      const studentId = rid("stu");
      const enrollmentId = rid("enr");
      const guardianId = rid("grd");
      const rollNo = `${opts.classRollPrefix}-${(i + 1).toString().padStart(3, "0")}`;
      const admissionNo = nextNumber({
        type: "admission",
        institutionId: opts.institutionId,
        programId: opts.programId,
        prefix: opts.rollPrefix,
      });

      const ageYears = opts.section === "school" ? between(4, 15) : between(7, 18);
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - ageYears);
      dob.setMonth(between(0, 11), between(1, 28));

      await db.insert(students).values({
        id: studentId,
        name,
        nameUrdu: urduName([first, last]),
        fatherName: father,
        fatherNameUrdu: urduName([father.split(" ")[0], father.split(" ")[1]]),
        gender,
        dob,
        cnicBForm: `35202-${between(1000000, 9999999)}-${between(1, 9)}`,
        status: "active",
      });

      await db.insert(guardians).values({
        id: guardianId,
        name: father,
        nameUrdu: urduName([father.split(" ")[0], father.split(" ")[1]]),
        cnic: `35202-${between(1000000, 9999999)}-${between(1, 9)}`,
        phone: `030${between(0, 9)}-${between(1000000, 9999999)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${between(1, 99)}@example.com`,
        address: `House ${between(1, 200)}, Street ${between(1, 30)}, Tal Thall`,
        status: "active",
      });

      await db.insert(studentGuardians).values({
        studentId,
        guardianId,
        relation: "father",
        isPrimary: true,
      });

      await db.insert(studentEnrollments).values({
        id: enrollmentId,
        studentId,
        institutionId: opts.institutionId,
        programId: opts.programId,
        academicYearId: opts.section === "school" ? `${PREFIX}_ay_school` : `${PREFIX}_ay_madrassa`,
        schoolClassId: opts.schoolClassId ?? null,
        madrassaSubcategoryId: opts.madrassaSubcategoryId ?? null,
        darja: null,
        admissionNo,
        rollNo,
        status: "active",
        startedAt: new Date(`${yearNow}-04-01T09:00:00Z`),
      });

      await db.insert(admissionApplications).values({
        id: rid("adm"),
        refNo: admissionNo,
        source: pick(["web", "admin", "walkin"]),
        variantKey:
          opts.section === "school"
            ? pick(["school-boys-main", "school-girls-main", "school-girls-shoba"])
            : pick(["madrassa-boys-nazira", "madrassa-boys-hifz", "madrassa-boys-general", "madrassa-girls-general"]),
        status: "accepted",
        name,
        nameUrdu: urduName([first, last]),
        fatherName: father,
        gender,
        dob,
        guardianName: father,
        guardianPhone: `030${between(0, 9)}-${between(1000000, 9999999)}`,
        guardianRelation: "father",
        address: `House ${between(1, 200)}, Street ${between(1, 30)}, Tal Thall`,
        institutionId: opts.institutionId,
        programId: opts.programId,
        schoolClassId: opts.schoolClassId ?? null,
        madrassaSubcategoryId: opts.madrassaSubcategoryId ?? null,
        formData: {},
        submittedAt: new Date(`${yearNow}-03-${String(between(1, 28)).padStart(2, "0")}T09:00:00Z`),
        decidedAt: new Date(`${yearNow}-03-${String(between(1, 28)).padStart(2, "0")}T12:00:00Z`),
        acceptedStudentId: studentId,
        acceptedEnrollmentId: enrollmentId,
        matchedGuardianId: guardianId,
        reviewedByUserId: adminId,
      });

      enrolments.push({
        enrollmentId,
        studentId,
        institutionId: opts.institutionId,
        programId: opts.programId,
        schoolClassId: opts.schoolClassId ?? null,
        madrassaSubcategoryId: opts.madrassaSubcategoryId ?? null,
        section: opts.section,
        rollNo,
      });

      void opts.fee;
    }
  }

  for (const cls of SCHOOL_CLASSES) {
    await createStudentSet({
      count: between(8, 14),
      section: "school",
      institutionId: "al_qasim_academy",
      programId: schoolProgramId,
      schoolClassId: cls.id,
      gender: pick(["male", "female"] as const),
      rollPrefix: "ADM-SCH",
      classRollPrefix: cls.code,
      fee: cls.fee,
    });
  }

  for (const sub of boysSubs) {
    await createStudentSet({
      count: between(6, 12),
      section: "madrassa",
      institutionId: qasmia.id,
      programId: sub.rollPrefix.startsWith("QH") ? "qasmia_hifz" : "qasmia_dars_nizami",
      madrassaSubcategoryId: sub.id,
      gender: "male",
      rollPrefix: "ADM-MDR",
      classRollPrefix: sub.rollPrefix,
      fee: 120000,
    });
  }

  for (const sub of girlsSubs) {
    await createStudentSet({
      count: between(6, 10),
      section: "madrassa",
      institutionId: zainab.id,
      programId: "zainab_dars_nizami",
      madrassaSubcategoryId: sub.id,
      gender: "female",
      rollPrefix: "ADM-ZNB",
      classRollPrefix: sub.rollPrefix,
      fee: 110000,
    });
  }
  console.log(`Students/enrollments: ${enrolments.length}`);

  const pendingApps: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 6; i += 1) {
    const gender = pick(["male", "female"] as const);
    const first = gender === "male" ? pick(FIRST_M) : pick(FIRST_F);
    const last = pick(LAST);
    const father = `${pick(FIRST_M)} ${last}`;
    const sub = gender === "male" ? pick(boysSubs) : pick(girlsSubs);
    const institutionId = gender === "male" ? qasmia.id : zainab.id;
    const programId = gender === "male" ? (sub.rollPrefix.startsWith("QH") ? "qasmia_hifz" : "qasmia_dars_nizami") : "zainab_dars_nizami";
    const appId = rid("app");
    const refNo = nextNumber({ type: "application", institutionId, programId, prefix: "ADM-REQ" });
    const status = pick(["pending", "under_review", "approved"] as const);
    pendingApps.push({
      id: appId,
      refNo,
      source: "web",
      variantKey: gender === "male" ? pick(["madrassa-boys-nazira", "madrassa-boys-hifz", "madrassa-boys-general"]) : "madrassa-girls-general",
      status,
      name: `${first} ${last}`,
      nameUrdu: urduName([first, last]),
      fatherName: father,
      gender,
      guardianName: father,
      guardianPhone: `030${between(0, 9)}-${between(1000000, 9999999)}`,
      guardianRelation: "father",
      address: `House ${between(1, 200)}, Street ${between(1, 30)}, Tal Thall`,
      institutionId,
      programId,
      madrassaSubcategoryId: sub.id,
      formData: { note: "Submitted from public admission form" },
      submittedAt: new Date(Date.now() - between(1, 20) * 86400000),
      decidedAt: status === "approved" ? new Date() : null,
      reviewedByUserId: status === "pending" ? null : adminId,
    });
  }
  await db.insert(admissionApplications).values(pendingApps as never).onConflictDoNothing();
  await db.insert(admissionEvents).values(
    pendingApps.map((a) => ({
      id: rid("aev"),
      applicationId: a.id as string,
      type: "application_submitted",
      toStatus: "pending",
      message: "Application received",
      actorUserId: null,
    })),
  );
  console.log(`Pending admission applications: ${pendingApps.length}`);

  const attendanceRows: Array<Record<string, unknown>> = [];
  for (const e of enrolments) {
    for (let d = 1; d <= 20; d += 1) {
      const date = isoDate(d);
      const dow = new Date(date).getDay();
      if (dow === 0) continue;
      const roll = rand();
      const status = roll > 0.9 ? "absent" : roll > 0.82 ? "late" : roll > 0.78 ? "leave" : "present";
      attendanceRows.push({
        id: rid("att"),
        studentId: e.studentId,
        enrollmentId: e.enrollmentId,
        institutionId: e.institutionId,
        programId: e.programId,
        schoolClassId: e.schoolClassId,
        madrassaSubcategoryId: e.madrassaSubcategoryId,
        attendanceDate: date,
        status,
        markedByUserId: adminId,
      });
    }
  }
  for (let i = 0; i < attendanceRows.length; i += 500) {
    await db.insert(studentAttendance).values(attendanceRows.slice(i, i + 500) as never).onConflictDoNothing();
  }
  console.log(`Attendance records: ${attendanceRows.length}`);

  const chargeRows: Array<Record<string, unknown>> = [];
  const paymentRows: Array<Record<string, unknown>> = [];
  const allocRows: Array<Record<string, unknown>> = [];
  for (const [idx, e] of enrolments.entries()) {
    const baseFee = e.section === "school" ? 180000 : 120000;
    const months = ["2026-04", "2026-05", "2026-06"];
    for (const [mi, period] of months.entries()) {
      const chargeId = rid("chg");
      const amount = baseFee + between(-10, 20) * 5000;
      chargeRows.push({
        id: chargeId,
        studentId: e.studentId,
        enrollmentId: e.enrollmentId,
        institutionId: e.institutionId,
        programId: e.programId,
        schoolClassId: e.schoolClassId,
        madrassaSubcategoryId: e.madrassaSubcategoryId,
        type: "monthly",
        label: `Monthly fee ${period}`,
        period,
        amountPaisa: amount,
        dueDate: new Date(`${period}-10T00:00:00Z`),
        status: "open",
        createdByUserId: adminId,
      });

      const roll = rand();
      if (roll < 0.45) {
        const paymentId = rid("pay");
        const receiptNo = nextNumber({ type: "fee_receipt", institutionId: e.institutionId, prefix: "FR" });
        paymentRows.push({
          id: paymentId,
          receiptNo,
          studentId: e.studentId,
          enrollmentId: e.enrollmentId,
          institutionId: e.institutionId,
          amountPaisa: amount,
          method: pick(["cash", "bank", "online", "cheque"] as const),
          receivedAt: new Date(`${period}-0${between(5, 9)}T10:00:00Z`),
          receivedByUserId: adminId,
          status: "posted",
        });
        allocRows.push({ id: rid("alc"), paymentId, chargeId, amountPaisa: amount });
        chargeRows[chargeRows.length - 1].status = "paid";
      } else if (roll < 0.7) {
        const paymentId = rid("pay");
        const receiptNo = nextNumber({ type: "fee_receipt", institutionId: e.institutionId, prefix: "FR" });
        const partial = Math.round(amount / 2);
        paymentRows.push({
          id: paymentId,
          receiptNo,
          studentId: e.studentId,
          enrollmentId: e.enrollmentId,
          institutionId: e.institutionId,
          amountPaisa: partial,
          method: pick(["cash", "online"] as const),
          receivedAt: new Date(`${period}-0${between(5, 9)}T11:00:00Z`),
          receivedByUserId: adminId,
          status: "posted",
        });
        allocRows.push({ id: rid("alc"), paymentId, chargeId, amountPaisa: partial });
        chargeRows[chargeRows.length - 1].status = "partial";
      }
      void mi;
      void idx;
    }
  }
  for (let i = 0; i < chargeRows.length; i += 500) {
    await db.insert(feeCharges).values(chargeRows.slice(i, i + 500) as never).onConflictDoNothing();
  }
  for (let i = 0; i < paymentRows.length; i += 500) {
    await db.insert(feePayments).values(paymentRows.slice(i, i + 500) as never).onConflictDoNothing();
  }
  for (let i = 0; i < allocRows.length; i += 500) {
    await db.insert(feePaymentAllocations).values(allocRows.slice(i, i + 500) as never).onConflictDoNothing();
  }
  console.log(`Fee charges: ${chargeRows.length}, payments: ${paymentRows.length}`);

  const examDefinitions = [
    { id: `${PREFIX}_exam_monthly_school`, system: "school" as const, type: "monthly" as const, name: "Monthly Test - April", nameUrdu: "ماہانہ امتحان - اپریل", startDate: "2026-04-20", endDate: "2026-04-28", status: "published" as const, scope: "school" as const },
    { id: `${PREFIX}_exam_quarterly_school`, system: "school" as const, type: "quarterly" as const, name: "First Quarterly", nameUrdu: "پہلی سہ ماہی", startDate: "2026-07-15", endDate: "2026-07-25", status: "published" as const, scope: "school" as const },
    { id: `${PREFIX}_exam_sahmahi_madrassa`, system: "madrassa" as const, type: "sahmahi" as const, name: "Sahmahi Exam", nameUrdu: "سہ ماہی امتحان", startDate: "2026-05-01", endDate: "2026-05-10", status: "published" as const, scope: "madrassa" as const },
    { id: `${PREFIX}_exam_salanah_madrassa`, system: "madrassa" as const, type: "salanah" as const, name: "Annual Exam", nameUrdu: "سالانہ امتحان", startDate: "2026-03-01", endDate: "2026-03-15", status: "published" as const, scope: "madrassa" as const },
  ];

  let markCount = 0;
  let resultCount = 0;
  for (const exam of examDefinitions) {
    const scopeEnrols = enrolments.filter((e) => e.section === exam.scope);
    const byClass = new Map<string, typeof scopeEnrols>();
    for (const e of scopeEnrols) {
      const key = e.schoolClassId ?? e.madrassaSubcategoryId ?? "none";
      byClass.set(key, [...(byClass.get(key) ?? []), e]);
    }

    for (const [key, group] of byClass) {
      const sessionSubjects = await db
        .select()
        .from(examSubjects)
        .where(
          exam.scope === "school"
            ? sql`school_class_id = ${key}`
            : sql`madrassa_subcategory_id = ${key}`,
        );

      const first = group[0];
      const examId = `${exam.id}_${key}`;
      const sessionSubjectsToInsert = sessionSubjects.map((s, i) => ({
        id: `${examId}_ss_${s.code}`,
        examId,
        subjectId: s.id,
        code: s.code,
        name: s.name,
        nameUrdu: s.nameUrdu,
        totalMarks: s.totalMarks,
        passingMarks: s.passingMarks,
        examDate: exam.startDate,
        startTime: "09:00",
        endTime: "12:00",
        displayOrder: (i + 1) * 10,
        locked: true,
      }));
      if (sessionSubjectsToInsert.length === 0) continue;

      await db.insert(examSessions).values({
        id: examId,
        system: exam.system,
        institutionId: first.institutionId,
        programId: first.programId,
        schoolClassId: first.schoolClassId,
        madrassaCategoryId: null,
        madrassaSubcategoryId: first.madrassaSubcategoryId,
        academicYear: `${yearNow}-${yearNow + 1}`,
        type: exam.type,
        name: `${exam.name} - ${key}`,
        nameUrdu: exam.nameUrdu,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
        createdByUserId: adminId,
        publishedAt: new Date(),
        publishedByUserId: adminId,
      });
      await db.insert(examSessionSubjects).values(sessionSubjectsToInsert).onConflictDoNothing();

      const marks: Array<Record<string, unknown>> = [];
      const results: Array<Record<string, unknown>> = [];
      for (const e of group) {
        let obtained = 0;
        let total = 0;
        const failed: Array<{ code: string; name: string; nameUrdu: string }> = [];
        for (const ss of sessionSubjectsToInsert) {
          const attendanceRoll = rand();
          const attendanceStatus = attendanceRoll > 0.95 ? "absent" : "present";
          const ability = 0.35 + rand() * 0.6;
          const obtainedMarks = Math.min(ss.totalMarks, Math.round(ss.totalMarks * ability));
          marks.push({
            id: `${ss.id}_${e.studentId}`,
            examId,
            examSubjectId: ss.id,
            studentId: e.studentId,
            enrollmentId: e.enrollmentId,
            institutionId: e.institutionId,
            programId: e.programId,
            schoolClassId: e.schoolClassId,
            madrassaSubcategoryId: e.madrassaSubcategoryId,
            attendanceStatus,
            obtainedMarks: attendanceStatus === "present" ? obtainedMarks : null,
            status: "locked",
            enteredByUserId: adminId,
          });
          total += ss.totalMarks;
          if (attendanceStatus !== "present") {
            failed.push({ code: ss.code, name: ss.name, nameUrdu: ss.nameUrdu });
          } else {
            obtained += obtainedMarks;
            if (obtainedMarks < ss.passingMarks) failed.push({ code: ss.code, name: ss.name, nameUrdu: ss.nameUrdu });
          }
        }
        const pct = total ? (obtained / total) * 100 : 0;
        const grade = pct >= 80 ? "A1" : pct >= 70 ? "A" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : pct >= 33 ? "E" : "F";
        results.push({
          id: `${examId}_res_${e.studentId}`,
          examId,
          studentId: e.studentId,
          enrollmentId: e.enrollmentId,
          institutionId: e.institutionId,
          programId: e.programId,
          schoolClassId: e.schoolClassId,
          madrassaSubcategoryId: e.madrassaSubcategoryId,
          obtainedMarks: obtained,
          totalMarks: total,
          percentageTimes100: Math.round(pct * 100),
          grade,
          status: failed.length === 0 ? "pass" : "fail",
          position: null,
          failedSubjects: failed,
          publishedAt: new Date(),
        });
      }

      for (let i = 0; i < marks.length; i += 500) {
        await db.insert(examMarks).values(marks.slice(i, i + 500) as never).onConflictDoNothing();
      }
      markCount += marks.length;

      const sorted = [...results].sort(
        (a, b) =>
          (b.obtainedMarks as number) - (a.obtainedMarks as number) ||
          (b.percentageTimes100 as number) - (a.percentageTimes100 as number),
      );
      sorted.forEach((r, idx) => {
        r.position = idx + 1;
      });
      for (let i = 0; i < results.length; i += 500) {
        await db.insert(examResults).values(results.slice(i, i + 500) as never).onConflictDoNothing();
      }
      resultCount += results.length;
    }
  }
  console.log(`Exam marks: ${markCount}, results: ${resultCount}`);

  const counts = await db.execute(sql`
    select
      (select count(*) from students) as students,
      (select count(*) from student_enrollments) as enrollments,
      (select count(*) from guardians) as guardians,
      (select count(*) from teacher_profiles) as teachers,
      (select count(*) from exam_sessions) as exams,
      (select count(*) from exam_results) as results,
      (select count(*) from student_attendance) as attendance,
      (select count(*) from fee_charges) as charges,
      (select count(*) from fee_payments) as payments,
      (select count(*) from admission_applications) as applications
  `);
  console.log("\nFinal counts:", (counts as { rows: Record<string, number>[] }).rows[0]);
  console.log("\nLogins:");
  console.log("  super admin: admin@example.com / admin123");
  console.log("  teacher:     teacher1@demo.local / Teacher@123");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
