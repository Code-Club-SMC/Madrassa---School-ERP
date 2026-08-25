import { db } from "@/db";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import {
  admissionApplications,
  admissionEvents,
  numberSequences,
} from "@/db/schema/admission";
import {
  guardians,
  studentEnrollments,
  studentGuardians,
  studentEvents,
  students,
} from "@/db/schema/students";
import {
  institutions,
  programs,
  madrassaCategories,
  madrassaSubcategories,
} from "@/db/schema/academic";
import { ensureAcademicSeeded } from "@/lib/server/academic/seed";
import { getActiveAcademicYear } from "@/lib/server/academic-years/service";
import { buildMadrassaCategories, getMadrassaGradeById } from "@/lib/madrassa-grade-catalog";
import { eq } from "drizzle-orm";

type StudentDraft = {
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu: string;
  gender: "male" | "female";
  dob: string;
  cnicBForm: string;
  guardianName: string;
  guardianNameUrdu: string;
  guardianPhone: string;
  guardianCnic: string;
  guardianEmail: string;
  guardianRelation: string;
  address: string;
};

const NAZARA_STUDENTS: StudentDraft[] = [
  {
    name: "Ahmed Raza",
    nameUrdu: "احمد رضا",
    fatherName: "Muhammad Raza",
    fatherNameUrdu: "محمد رضا",
    gender: "male",
    dob: "2015-03-10",
    cnicBForm: "35202-1000001-1",
    guardianName: "Muhammad Raza",
    guardianNameUrdu: "محمد رضا",
    guardianPhone: "0300-1000001",
    guardianCnic: "35202-1000001-1",
    guardianEmail: "ahmed.raza@example.com",
    guardianRelation: "father",
    address: "House 1, Street 1, Lahore",
  },
  {
    name: "Ali Hassan",
    nameUrdu: "علی حسن",
    fatherName: "Hassan Ali",
    fatherNameUrdu: "حسن علی",
    gender: "male",
    dob: "2014-07-22",
    cnicBForm: "35202-1000002-3",
    guardianName: "Hassan Ali",
    guardianNameUrdu: "حسن علی",
    guardianPhone: "0300-1000002",
    guardianCnic: "35202-1000002-3",
    guardianEmail: "ali.hassan@example.com",
    guardianRelation: "father",
    address: "House 2, Street 2, Lahore",
  },
  {
    name: "Bilal Ahmed",
    nameUrdu: "بلال احمد",
    fatherName: "Ahmed Khan",
    fatherNameUrdu: "احمد خان",
    gender: "male",
    dob: "2016-01-15",
    cnicBForm: "35202-1000003-5",
    guardianName: "Ahmed Khan",
    guardianNameUrdu: "احمد خان",
    guardianPhone: "0300-1000003",
    guardianCnic: "35202-1000003-5",
    guardianEmail: "bilal.ahmed@example.com",
    guardianRelation: "father",
    address: "House 3, Street 3, Lahore",
  },
  {
    name: "Hamza Malik",
    nameUrdu: "حمزہ ملک",
    fatherName: "Malik Iqbal",
    fatherNameUrdu: "ملک اقبال",
    gender: "male",
    dob: "2015-11-08",
    cnicBForm: "35202-1000004-7",
    guardianName: "Malik Iqbal",
    guardianNameUrdu: "ملک اقبال",
    guardianPhone: "0300-1000004",
    guardianCnic: "35202-1000004-7",
    guardianEmail: "hamza.malik@example.com",
    guardianRelation: "father",
    address: "House 4, Street 4, Lahore",
  },
  {
    name: "Usman Tariq",
    nameUrdu: "عثمان طارق",
    fatherName: "Tariq Mahmood",
    fatherNameUrdu: "طارق محمود",
    gender: "male",
    dob: "2014-05-19",
    cnicBForm: "35202-1000005-9",
    guardianName: "Tariq Mahmood",
    guardianNameUrdu: "طارق محمود",
    guardianPhone: "0300-1000005",
    guardianCnic: "35202-1000005-9",
    guardianEmail: "usman.tariq@example.com",
    guardianRelation: "father",
    address: "House 5, Street 5, Lahore",
  },
  {
    name: "Zain ul Abideen",
    nameUrdu: " zain العابدین",
    fatherName: "Abideen Shah",
    fatherNameUrdu: "عابدین شاہ",
    gender: "male",
    dob: "2016-09-30",
    cnicBForm: "35202-1000006-1",
    guardianName: "Abideen Shah",
    guardianNameUrdu: "عابدین شاہ",
    guardianPhone: "0300-1000006",
    guardianCnic: "35202-1000006-1",
    guardianEmail: "zain.abideen@example.com",
    guardianRelation: "father",
    address: "House 6, Street 6, Lahore",
  },
];

const HAFIZ_STUDENTS: StudentDraft[] = [
  {
    name: "Abdullah Siddiqui",
    nameUrdu: "عبداللہ صدique",
    fatherName: "Siddiqui Ahmad",
    
    fatherNameUrdu: "صدique احمد",
    gender: "male",
    dob: "2013-12-05",
    cnicBForm: "35202-2000001-1",
    guardianName: "Siddiqui Ahmad",
    guardianNameUrdu: "صدique احمد",
    guardianPhone: "0300-2000001",
    guardianCnic: "35202-2000001-1",
    guardianEmail: "abdullah.s@example.com",
    guardianRelation: "father",
    address: "House 7, Street 7, Lahore",
  },
  {
    name: "Fahad Nawaz",
    nameUrdu: "فہد نواز",
    fatherName: "Nawaz Sharif",
    fatherNameUrdu: "نواز شریف",
    gender: "male",
    dob: "2012-08-14",
    cnicBForm: "35202-2000002-3",
    guardianName: "Nawaz Sharif",
    guardianNameUrdu: "نواز شریف",
    guardianPhone: "0300-2000002",
    guardianCnic: "35202-2000002-3",
    guardianEmail: "fahad.nawaz@example.com",
    guardianRelation: "father",
    address: "House 8, Street 8, Lahore",
  },
  {
    name: "Imran Khalil",
    nameUrdu: "عمران خلیل",
    fatherName: "Khalil Ur Rehman",
    fatherNameUrdu: "خلیل الرحمٰن",
    gender: "male",
    dob: "2013-04-21",
    cnicBForm: "35202-2000003-5",
    guardianName: "Khalil Ur Rehman",
    guardianNameUrdu: "خلیل الرحمٰن",
    guardianPhone: "0300-2000003",
    guardianCnic: "35202-2000003-5",
    guardianEmail: "imran.khalil@example.com",
    guardianRelation: "father",
    address: "House 9, Street 9, Lahore",
  },
  {
    name: "Kashif Mehmood",
    nameUrdu: "کاشف محمود",
    fatherName: "Mehmood Ahmed",
    fatherNameUrdu: "محمود احمد",
    gender: "male",
    dob: "2011-10-11",
    cnicBForm: "35202-2000004-7",
    guardianName: "Mehmood Ahmed",
    guardianNameUrdu: "محمود احمد",
    guardianPhone: "0300-2000004",
    guardianCnic: "35202-2000004-7",
    guardianEmail: "kashif.m@example.com",
    guardianRelation: "father",
    address: "House 10, Street 10, Lahore",
  },
  {
    name: "Saad Ur Rehman",
    nameUrdu: "سعد الرحمٰن",
    fatherName: "Rehman Gulfam",
    fatherNameUrdu: "رحمٰن غulam",
    gender: "male",
    dob: "2012-06-17",
    cnicBForm: "35202-2000005-9",
    guardianName: "Rehman Gulfam",
    guardianNameUrdu: "رحمٰن غulam",
    guardianPhone: "0300-2000005",
    guardianCnic: "35202-2000005-9",
    guardianEmail: "saad.rehman@example.com",
    guardianRelation: "father",
    address: "House 11, Street 11, Lahore",
  },
  {
    name: "Taha Waseem",
    nameUrdu: "طاہا وسیم",
    fatherName: "Waseem Akhtar",
    fatherNameUrdu: "وسیم اختر",
    gender: "male",
    dob: "2013-02-09",
    cnicBForm: "35202-2000006-1",
    guardianName: "Waseem Akhtar",
    guardianNameUrdu: "وسیم اختر",
    guardianPhone: "0300-2000006",
    guardianCnic: "35202-2000006-1",
    guardianEmail: "taha.waseem@example.com",
    guardianRelation: "father",
    address: "House 12, Street 12, Lahore",
  },
];

const DARS_STUDENTS: StudentDraft[] = [
  {
    name: "Muhammad Ammar",
    nameUrdu: "محمد عمار",
    fatherName: "Ammar Saeed",
    fatherNameUrdu: "عمار سعید",
    gender: "male",
    dob: "2010-09-25",
    cnicBForm: "35202-3000001-1",
    guardianName: "Ammar Saeed",
    guardianNameUrdu: "عمار سعید",
    guardianPhone: "0300-3000001",
    guardianCnic: "35202-3000001-1",
    guardianEmail: "ammar.saeed@example.com",
    guardianRelation: "father",
    address: "House 13, Street 13, Lahore",
  },
  {
    name: "Hassan Raza",
    nameUrdu: "حسن رضا",
    fatherName: "Raza Hussain",
    fatherNameUrdu: "رضا حسین",
    gender: "male",
    dob: "2009-03-14",
    cnicBForm: "35202-3000002-3",
    guardianName: "Raza Hussain",
    guardianNameUrdu: "رضا حسین",
    guardianPhone: "0300-3000002",
    guardianCnic: "35202-3000002-3",
    guardianEmail: "hassan.raza@example.com",
    guardianRelation: "father",
    address: "House 14, Street 14, Lahore",
  },
  {
    name: "Junaid Ashraf",
    nameUrdu: "جنید اشرف",
    fatherName: "Ashraf Ali",
    fatherNameUrdu: "اشرف علی",
    gender: "male",
    dob: "2011-07-08",
    cnicBForm: "35202-3000003-5",
    guardianName: "Ashraf Ali",
    guardianNameUrdu: "اشرف علی",
    guardianPhone: "0300-3000003",
    guardianCnic: "35202-3000003-5",
    guardianEmail: "junaid.ashraf@example.com",
    guardianRelation: "father",
    address: "House 15, Street 15, Lahore",
  },
  {
    name: "Shahzad Ahmad",
    nameUrdu: "شاہزاد احمد",
    fatherName: "Ahmad Din",
    fatherNameUrdu: "احمد دین",
    gender: "male",
    dob: "2010-01-20",
    cnicBForm: "35202-3000004-7",
    guardianName: "Ahmad Din",
    guardianNameUrdu: "احمد دین",
    guardianPhone: "0300-3000004",
    guardianCnic: "35202-3000004-7",
    guardianEmail: "shahzad.ahmad@example.com",
    guardianRelation: "father",
    address: "House 16, Street 16, Lahore",
  },
  {
    name: "Noman Shahid",
    nameUrdu: "نومان شاہد",
    fatherName: "Shahid Iqbal",
    fatherNameUrdu: "شاہد اقبال",
    gender: "male",
    dob: "2009-11-30",
    cnicBForm: "35202-3000005-9",
    guardianName: "Shahid Iqbal",
    guardianNameUrdu: "شاہد اقبال",
    guardianPhone: "0300-3000005",
    guardianCnic: "35202-3000005-9",
    guardianEmail: "noman.shahid@example.com",
    guardianRelation: "father",
    address: "House 17, Street 17, Lahore",
  },
  {
    name: "Rizwan Ahmed",
    nameUrdu: "رضوان احمد",
    fatherName: "Ahmed Rasheed",
    fatherNameUrdu: "احمد رشید",
    gender: "male",
    dob: "2011-05-12",
    cnicBForm: "35202-3000006-1",
    guardianName: "Ahmed Rasheed",
    guardianNameUrdu: "احمد رشید",
    guardianPhone: "0300-3000006",
    guardianCnic: "35202-3000006-1",
    guardianEmail: "rizwan.ahmed@example.com",
    guardianRelation: "father",
    address: "House 18, Street 18, Lahore",
  },
];

const AL_ZAINIB_STUDENTS: StudentDraft[] = [
  {
    name: "Ayesha Tariq",
    nameUrdu: "عائشہ طارق",
    fatherName: "Tariq Jameel",
    fatherNameUrdu: "طارق جمیل",
    gender: "female",
    dob: "2012-04-18",
    cnicBForm: "35202-4000001-3",
    guardianName: "Tariq Jameel",
    guardianNameUrdu: "طارق جمیل",
    guardianPhone: "0300-4000001",
    guardianCnic: "35202-4000001-3",
    guardianEmail: "ayesha.tariq@example.com",
    guardianRelation: "father",
    address: "House 19, Street 19, Lahore",
  },
  {
    name: "Fatima Noor",
    nameUrdu: "فاطمہ نور",
    fatherName: "Noor Hassan",
    fatherNameUrdu: "نور حسن",
    gender: "female",
    dob: "2011-08-07",
    cnicBForm: "35202-4000002-5",
    guardianName: "Noor Hassan",
    guardianNameUrdu: "نور حسن",
    guardianPhone: "0300-4000002",
    guardianCnic: "35202-4000002-5",
    guardianEmail: "fatima.noor@example.com",
    guardianRelation: "father",
    address: "House 20, Street 20, Lahore",
  },
  {
    name: "Khadija Rashid",
    nameUrdu: "خدیجہ راشد",
    fatherName: "Rashid Minhas",
    fatherNameUrdu: "راشد منہاس",
    gender: "female",
    dob: "2013-01-29",
    cnicBForm: "35202-4000003-7",
    guardianName: "Rashid Minhas",
    guardianNameUrdu: "راشد منہاس",
    guardianPhone: "0300-4000003",
    guardianCnic: "35202-4000003-7",
    guardianEmail: "khadija.rashid@example.com",
    guardianRelation: "father",
    address: "House 21, Street 21, Lahore",
  },
  {
    name: "Maryam Saeed",
    nameUrdu: "مریم سعید",
    fatherName: "Saeed Anwar",
    fatherNameUrdu: "سعید انور",
    gender: "female",
    dob: "2012-06-15",
    cnicBForm: "35202-4000004-9",
    guardianName: "Saeed Anwar",
    guardianNameUrdu: "سعید انور",
    guardianPhone: "0300-4000004",
    guardianCnic: "35202-4000004-9",
    guardianEmail: "maryam.saeed@example.com",
    guardianRelation: "father",
    address: "House 22, Street 22, Lahore",
  },
  {
    name: "Sidra Ijaz",
    nameUrdu: "سدرہ اعجاز",
    fatherName: "Ijaz Ahmed",
    fatherNameUrdu: "اعجاز احمد",
    gender: "female",
    dob: "2010-12-03",
    cnicBForm: "35202-4000005-1",
    guardianName: "Ijaz Ahmed",
    guardianNameUrdu: "اعجاز احمد",
    guardianPhone: "0300-4000005",
    guardianCnic: "35202-4000005-1",
    guardianEmail: "sidra.ijaz@example.com",
    guardianRelation: "father",
    address: "House 23, Street 23, Lahore",
  },
  {
    name: "Zainab Khalid",
    nameUrdu: "زینب خالد",
    fatherName: "Khalid Mehmood",
    fatherNameUrdu: "خالد محمود",
    gender: "female",
    dob: "2011-10-21",
    cnicBForm: "35202-4000006-3",
    guardianName: "Khalid Mehmood",
    guardianNameUrdu: "خالد محمود",
    guardianPhone: "0300-4000006",
    guardianCnic: "35202-4000006-3",
    guardianEmail: "zainab.khalid@example.com",
    guardianRelation: "father",
    address: "House 24, Street 24, Lahore",
  },
];

type CategoryConfig = {
  variantKey: string;
  institutionId: string;
  programId: string;
  madrassaSubcategoryId: string;
  students: StudentDraft[];
  rollPrefix: string;
};

const CATEGORIES: CategoryConfig[] = [
  {
    variantKey: "madrassa-boys-nazira",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_nazira",
    madrassaSubcategoryId: "bn-nazira-1",
    students: NAZARA_STUDENTS,
    rollPrefix: "NZ",
  },
  {
    variantKey: "madrassa-boys-hifz",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_hifz",
    madrassaSubcategoryId: "bn-hifz-1",
    students: HAFIZ_STUDENTS,
    rollPrefix: "HF",
  },
  {
    variantKey: "madrassa-boys-general",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_dars_nizami",
    madrassaSubcategoryId: "bn-idadiya-awwal",
    students: DARS_STUDENTS,
    rollPrefix: "DN",
  },
  {
    variantKey: "madrassa-girls-general",
    institutionId: "jamia_zainab_banat",
    programId: "zainab_dars_nizami",
    madrassaSubcategoryId: "bt-tarjuma",
    students: AL_ZAINIB_STUDENTS,
    rollPrefix: "ZDN",
  },
];

async function nextNumber(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  scope: {
    type: "application" | "admission" | "roll";
    institutionId: string;
    programId: string;
    madrassaSubcategoryId: string;
    prefix: string;
  },
) {
  const year = new Date().getFullYear();
  const id = [
    year,
    scope.type,
    scope.institutionId,
    scope.programId ?? "program-none",
    "class-none",
    scope.madrassaSubcategoryId ?? "sub-none",
  ].join(":");

  const [row] = await tx
    .insert(numberSequences)
    .values({
      id,
      year,
      type: scope.type,
      institutionId: scope.institutionId,
      programId: scope.programId,
      schoolClassId: null,
      madrassaSubcategoryId: scope.madrassaSubcategoryId,
      prefix: scope.prefix,
      currentValue: 1,
    })
    .onConflictDoUpdate({
      target: numberSequences.id,
      set: {
        currentValue: sql`${numberSequences.currentValue} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ value: numberSequences.currentValue });

  const value = row?.value ?? 1;
  return `${scope.prefix}-${year}-${value.toString().padStart(4, "0")}`;
}

async function seedMadrassaCatalog() {
  const categories = buildMadrassaCategories();

  for (const category of categories) {
    const [existingCategory] = await db
      .select()
      .from(madrassaCategories)
      .where(eq(madrassaCategories.id, category.id))
      .limit(1);

      if (!existingCategory) {
        const categorySection = category.subcategories[0]?.section ?? "male";
        await db.insert(madrassaCategories).values({
          id: category.id,
          name: category.name,
          nameUrdu: category.nameUrdu,
          description: category.description,
          descriptionUrdu: category.descriptionUrdu,
          displayOrder: category.displayOrder ?? 0,
          active: true,
          section: categorySection,
        });
      console.log(`Created madrassa category: ${category.nameUrdu}`);
    }

    for (const sub of category.subcategories) {
      const grade = getMadrassaGradeById(sub.id);
      const displayOrder = grade?.displayOrder ?? sub.displayOrder;

      const [existingSub] = await db
        .select()
        .from(madrassaSubcategories)
        .where(eq(madrassaSubcategories.id, sub.id))
        .limit(1);

      if (!existingSub) {
        await db.insert(madrassaSubcategories).values({
          id: sub.id,
          categoryId: category.id,
          name: sub.name,
          nameUrdu: sub.nameUrdu,
          rollPrefix: sub.rollPrefix,
          darja: sub.darja ?? null,
          govtEquivalent: sub.govtEquivalent ?? null,
          durationYears: sub.durationYears,
          fee: null,
          displayOrder: displayOrder ?? 0,
          active: true,
          section: sub.section,
        });
      }
    }
  }
}

async function seedCategory(category: CategoryConfig) {
  const activeAcademicYear = await getActiveAcademicYear("madrassa");
  if (!activeAcademicYear) {
    throw new Error("No active madrassa academic year found");
  }

  for (const draft of category.students) {
    await db.transaction(async (tx) => {
      const studentId = randomUUID();
      const enrollmentId = randomUUID();
      const guardianId = randomUUID();

      const admissionNo = await nextNumber(tx, {
        type: "admission",
        institutionId: category.institutionId,
        programId: category.programId,
        madrassaSubcategoryId: category.madrassaSubcategoryId,
        prefix: `AD-${category.rollPrefix}`,
      });

      const rollNo = await nextNumber(tx, {
        type: "roll",
        institutionId: category.institutionId,
        programId: category.programId,
        madrassaSubcategoryId: category.madrassaSubcategoryId,
        prefix: category.rollPrefix,
      });

      const applicationId = randomUUID();
      const applicationNo = await nextNumber(tx, {
        type: "application",
        institutionId: category.institutionId,
        programId: category.programId,
        madrassaSubcategoryId: category.madrassaSubcategoryId,
        prefix: `ADM-REQ-${category.rollPrefix}`,
      });

      await tx.insert(students).values({
        id: studentId,
        name: draft.name,
        nameUrdu: draft.nameUrdu,
        fatherName: draft.fatherName,
        fatherNameUrdu: draft.fatherNameUrdu,
        gender: draft.gender,
        dob: new Date(draft.dob),
        cnicBForm: draft.cnicBForm,
        status: "active",
      });

      await tx.insert(studentEnrollments).values({
        id: enrollmentId,
        studentId,
        academicYearId: activeAcademicYear.id,
        institutionId: category.institutionId,
        programId: category.programId,
        schoolClassId: null,
        schoolSectionId: null,
        madrassaSubcategoryId: category.madrassaSubcategoryId,
        darja: null,
        admissionNo,
        rollNo,
        status: "active",
        startedAt: new Date(),
      });

      await tx.insert(guardians).values({
        id: guardianId,
        name: draft.guardianName,
        nameUrdu: draft.guardianNameUrdu,
        cnic: draft.guardianCnic,
        phone: draft.guardianPhone,
        email: draft.guardianEmail,
        address: draft.address,
        status: "active",
      });

      await tx.insert(studentGuardians).values({
        studentId,
        guardianId,
        relation: draft.guardianRelation,
        isPrimary: true,
      });

      await tx.insert(admissionApplications).values({
        id: applicationId,
        refNo: applicationNo,
        source: "admin",
        variantKey: category.variantKey as any,
        status: "accepted",
        name: draft.name,
        nameUrdu: draft.nameUrdu,
        fatherName: draft.fatherName,
        fatherNameUrdu: draft.fatherNameUrdu,
        gender: draft.gender,
        dob: new Date(draft.dob),
        cnicBForm: draft.cnicBForm,
        guardianName: draft.guardianName,
        guardianNameUrdu: draft.guardianNameUrdu,
        guardianPhone: draft.guardianPhone,
        guardianCnic: draft.guardianCnic,
        guardianEmail: draft.guardianEmail,
        guardianRelation: draft.guardianRelation,
        address: draft.address,
        institutionId: category.institutionId,
        programId: category.programId,
        schoolClassId: null,
        schoolSectionId: null,
        madrassaSubcategoryId: category.madrassaSubcategoryId,
        darja: null,
        formData: {},
        submittedAt: new Date(),
        decidedAt: new Date(),
        acceptedStudentId: studentId,
        acceptedEnrollmentId: enrollmentId,
        matchedGuardianId: guardianId,
      });

      await tx.insert(admissionEvents).values({
        id: randomUUID(),
        applicationId,
        type: "application_accepted",
        fromStatus: "under_review",
        toStatus: "accepted",
        actorUserId: null,
        metadata: {
          studentId,
          enrollmentId,
          guardianId,
          rollNo,
          admissionNo,
        },
      });

      await tx.insert(studentEvents).values({
        id: randomUUID(),
        studentId,
        enrollmentId,
        type: "admission_accepted",
        message: `Admission accepted with roll ${rollNo}`,
        metadata: {
          applicationId,
          refNo: applicationNo,
          source: "admin",
          variantKey: category.variantKey,
          admissionNo,
          rollNo,
          institutionId: category.institutionId,
          programId: category.programId,
          madrassaSubcategoryId: category.madrassaSubcategoryId,
        },
        actorUserId: null,
      });

      console.log(`Created: ${draft.name} (${category.variantKey}) - Roll: ${rollNo}`);
    });
  }
}

async function main() {
  await ensureAcademicSeeded();
  console.log("Academic catalog seeded.\n");

  await seedMadrassaCatalog();
  console.log("Madrassa categories and subcategories seeded.\n");

  for (const category of CATEGORIES) {
    console.log(`Seeding ${category.variantKey}...`);
    await seedCategory(category);
    console.log(`Done: ${category.variantKey}\n`);
  }

  console.log("All test students seeded successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed test students:", error);
    process.exit(1);
  });
