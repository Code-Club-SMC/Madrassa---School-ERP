import { createHmac } from "node:crypto";
import { db } from "@/db";
import {
  admissionApplications,
  admissionEvents,
  admissionInterviews,
} from "@/db/schema/admission";
import {
  students,
  studentEnrollments,
  studentGuardians,
  guardians,
} from "@/db/schema/students";
import { eq } from "drizzle-orm";

const BASE_URL = "http://127.0.0.1:3000";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "msmis_erp_fallback_secret_key_2026_super_secure";

function getAdminCookie() {
  const payload = {
    userId: "user_1791353309530_mdc6y87",
    email: "admin@example.com",
    role: "super_admin",
    name: "Super Admin",
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", SESSION_SECRET).update(base64).digest("base64");
  return `msmis_session=${base64}.${signature}`;
}

const adminHeaders = {
  Cookie: getAdminCookie(),
  "Content-Type": "application/json",
};

async function runAdmissionE2ETests() {
  console.log("=== Starting MSMIS Admission End-to-End Audit & Verification ===");

  // 1. Verify Online Application Portal Catalog
  console.log("\n[Step 1] Checking Online Application Catalog Classes...");
  const classesRes = await fetch(`${BASE_URL}/api/admission/classes`);
  if (!classesRes.ok) {
    throw new Error(`Failed to load classes: ${classesRes.status} ${await classesRes.text()}`);
  }
  const classesData = await classesRes.json();
  console.log(`✓ Classes loaded: ${classesData.classes.length} active classes available.`);

  // 2. Submit Public Madrassa Application via /api/admission/applications
  console.log("\n[Step 2] Submitting Public Online Madrassa Application (/apply)...");
  const uniqueSuffix = Date.now().toString().slice(-4);
  const madrassaPayload = {
    variantKey: "madrassa-boys-general",
    form: {
      name: `محمد حمزہ ${uniqueSuffix}`,
      father: "طارق جمیل",
      dob: "2010-05-15",
      b_form: `17301-7654321-${uniqueSuffix.slice(-1)}`,
      guardian_name: "طارق جمیل",
      guardian_phone: "03001234567",
      guardian_cnic: "17301-1234567-1",
      guardian_rel: "father",
      address: "محلہ عثمان آباد، پشاور",
      phone: "03009876543",
      req_darja: "bn-dars-ula",
      prev_school: "دارالعلوم نعمانیہ",
    },
  };

  const appRes1 = await fetch(`${BASE_URL}/api/admission/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(madrassaPayload),
  });

  if (!appRes1.ok) {
    throw new Error(`Failed to submit madrassa application: ${appRes1.status} ${await appRes1.text()}`);
  }

  const appData1 = await appRes1.json();
  const app1 = appData1.application;
  console.log(`✓ Madrassa application submitted successfully: Ref No: ${app1.refNo}, ID: ${app1.id}, Status: ${app1.status}`);

  // Verify PostgreSQL record for App 1
  const [dbApp1] = await db
    .select()
    .from(admissionApplications)
    .where(eq(admissionApplications.id, app1.id));
  if (!dbApp1) throw new Error("Application 1 not found in Neon PostgreSQL!");
  console.log(`✓ Real-time PostgreSQL record confirmed: Ref: ${dbApp1.refNo}, Darja: ${dbApp1.darja}, Status: ${dbApp1.status}`);

  // 3. Submit Public School Application via /api/admission/applications
  console.log("\n[Step 3] Submitting Public Online School Application (/apply)...");
  const schoolPayload = {
    variantKey: "school-boys-main",
    form: {
      name: `عمران خان ${uniqueSuffix}`,
      father: "احمد خان",
      dob: "2014-08-20",
      b_form: `17301-8765432-${uniqueSuffix.slice(-1)}`,
      guardian_name: "احمد خان",
      guardian_phone: "03121234567",
      guardian_cnic: "17301-2345678-1",
      guardian_rel: "father",
      address: "گلبرگ 3، پشاور",
      class: "class_1",
    },
  };

  const appRes2 = await fetch(`${BASE_URL}/api/admission/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schoolPayload),
  });

  if (!appRes2.ok) {
    throw new Error(`Failed to submit school application: ${appRes2.status} ${await appRes2.text()}`);
  }

  const appData2 = await appRes2.json();
  const app2 = appData2.application;
  console.log(`✓ School application submitted successfully: Ref No: ${app2.refNo}, ID: ${app2.id}, Status: ${app2.status}`);

  // 4. Admin Application Queue & Status Transition
  console.log("\n[Step 4] Admin Panel: Viewing Applications Queue...");
  const queueRes = await fetch(`${BASE_URL}/api/admission/applications`, {
    headers: adminHeaders,
  });
  if (!queueRes.ok) {
    throw new Error(`Failed to load queue: ${queueRes.status} ${await queueRes.text()}`);
  }
  const queueData = await queueRes.json();
  const foundApp1 = queueData.applications.find((a: any) => a.id === app1.id);
  if (!foundApp1) throw new Error("Created application not found in admin queue!");
  console.log(`✓ Application found in admin queue with status: ${foundApp1.status}`);

  console.log("[Step 4b] Updating Application Status to 'under_review' via Admin PATCH...");
  const statusRes = await fetch(`${BASE_URL}/api/admission/applications/${app1.id}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      status: "under_review",
      message: "Documents verified by admission office, scheduled for interview",
    }),
  });
  if (!statusRes.ok) {
    throw new Error(`Failed to update status: ${statusRes.status} ${await statusRes.text()}`);
  }
  const statusData = await statusRes.json();
  console.log(`✓ Application status updated to: ${statusData.application?.status}`);

  // 5. Interview Scheduling
  console.log("\n[Step 5] Admin Panel: Scheduling Interview Slot...");
  const interviewPayload = {
    appId: app1.id,
    applicantName: app1.name,
    applicantNameUrdu: app1.nameUrdu,
    refNo: app1.refNo,
    system: "madrassa",
    categoryOrClass: "Darja Ula",
    source: "public",
    date: "2026-11-25",
    time: "10:30 AM",
    interviewer: "Mufti Abdul Rehman",
    room: "Admin Hall 1",
    status: "scheduled",
    guardianPhone: "03001234567",
  };

  const scheduleRes = await fetch(`${BASE_URL}/api/admission/interviews`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify(interviewPayload),
  });
  if (!scheduleRes.ok) {
    throw new Error(`Failed to schedule interview: ${scheduleRes.status} ${await scheduleRes.text()}`);
  }
  const scheduleData = await scheduleRes.json();
  const slotId = scheduleData.slot.id;
  console.log(`✓ Interview slot scheduled successfully: Slot ID ${slotId}, Room: ${scheduleData.slot.room}`);

  // Verify DB record for interview
  const [dbSlot] = await db
    .select()
    .from(admissionInterviews)
    .where(eq(admissionInterviews.id, slotId));
  if (!dbSlot) throw new Error("Interview slot not found in Neon PostgreSQL!");
  console.log(`✓ PostgreSQL interview record confirmed: Interviewer: ${dbSlot.interviewer}, Time: ${dbSlot.time}`);

  // 6. Document Verification Workflow
  console.log("\n[Step 6] Admin Panel: Document Verification Checklist...");
  const docsPayload = {
    appId: app1.id,
    docs: {
      b_form: {
        status: "verified",
        notes: "Original NADRA B-Form verified",
        updatedAt: new Date().toISOString(),
      },
      father_cnic: {
        status: "verified",
        notes: "Valid CNIC copy received",
        updatedAt: new Date().toISOString(),
      },
      previous_result: {
        status: "verified",
        notes: "Darul Uloom transcript verified",
        updatedAt: new Date().toISOString(),
      },
      photos: {
        status: "verified",
        notes: "4 passport size photographs submitted",
        updatedAt: new Date().toISOString(),
      },
    },
  };

  const docsRes = await fetch(`${BASE_URL}/api/admission/interviews/docs`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify(docsPayload),
  });
  if (!docsRes.ok) {
    throw new Error(`Failed to save doc state: ${docsRes.status} ${await docsRes.text()}`);
  }
  const docsData = await docsRes.json();
  console.log(`✓ Document verification state saved. Verified ${Object.keys(docsData.docStates[app1.id] || {}).length} documents.`);

  // 7. Interview Evaluation & Scoring
  console.log("\n[Step 7] Admin Panel: Recording Interview Score & Evaluation...");
  const evalRes = await fetch(`${BASE_URL}/api/admission/interviews/${slotId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      status: "passed",
      marks: 94,
      notes: "Exceptional Quran tajweed, fluent recitation, well-mannered candidate",
    }),
  });
  if (!evalRes.ok) {
    throw new Error(`Failed to update interview: ${evalRes.status} ${await evalRes.text()}`);
  }
  const evalData = await evalRes.json();
  console.log(`✓ Interview evaluated: Status: ${evalData.slot.status}, Marks: ${evalData.slot.marks}/100, Notes: "${evalData.slot.notes}"`);

  // 8. Waitlist Management Test (on App 2)
  console.log("\n[Step 8] Admin Panel: Waitlist Workflow Test...");
  const waitlistRes = await fetch(`${BASE_URL}/api/admission/interviews/waitlist`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      appId: app2.id,
      rank: 1,
      reason: "Class 1 section full, awaiting second shift seat opening",
    }),
  });
  if (!waitlistRes.ok) {
    throw new Error(`Failed to add to waitlist: ${waitlistRes.status} ${await waitlistRes.text()}`);
  }
  const waitlistData = await waitlistRes.json();
  console.log(`✓ Added to waitlist: Rank ${waitlistData.entry.rank}, Reason: ${waitlistData.entry.reason}`);

  // Remove / promote from waitlist
  const rmWaitlistRes = await fetch(`${BASE_URL}/api/admission/interviews/waitlist?appId=${app2.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  if (!rmWaitlistRes.ok) {
    throw new Error(`Failed to remove from waitlist: ${rmWaitlistRes.status}`);
  }
  console.log("✓ Waitlist promotion / removal completed successfully.");

  // 9. Acceptance & Student Enrollment Conversion
  console.log("\n[Step 9] Admin Panel: Converting Application to Enrolled Student...");
  const acceptRes = await fetch(`${BASE_URL}/api/admission/applications/${app1.id}/accept`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      createParentAccount: true,
      parentEmail: `parent.${uniqueSuffix}@parents.msmis.invalid`,
      parentPassword: "ParentPassword@123!",
    }),
  });
  if (!acceptRes.ok) {
    throw new Error(`Failed to accept application: ${acceptRes.status} ${await acceptRes.text()}`);
  }
  const acceptData = await acceptRes.json();
  console.log(`✓ Application accepted! Enrolled Student ID: ${acceptData.student.id}, Admission No: ${acceptData.student.admissionNo}, Roll No: ${acceptData.student.rollNo}`);

  // Verify in Neon PostgreSQL database
  const [dbStudent] = await db
    .select()
    .from(students)
    .where(eq(students.id, acceptData.student.id));
  if (!dbStudent) throw new Error("Enrolled student missing in students table!");

  const [dbEnrollment] = await db
    .select()
    .from(studentEnrollments)
    .where(eq(studentEnrollments.studentId, acceptData.student.id));
  if (!dbEnrollment) throw new Error("Enrollment missing in student_enrollments table!");

  console.log(`✓ Verified in Neon PostgreSQL:`);
  console.log(`  - Student Name: ${dbStudent.name} (${dbStudent.nameUrdu})`);
  console.log(`  - Admission No: ${dbEnrollment.admissionNo}`);
  console.log(`  - Roll No: ${dbEnrollment.rollNo}`);
  console.log(`  - Darja: ${dbEnrollment.darja}`);

  // 10. Rejection Workflow Test (on App 2)
  console.log("\n[Step 10] Admin Panel: Application Rejection Test...");
  const rejectRes = await fetch(`${BASE_URL}/api/admission/applications/${app2.id}/reject`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      reason: "Applicant age does not meet minimum Class 1 admission cutoff.",
    }),
  });
  if (!rejectRes.ok) {
    throw new Error(`Failed to reject application: ${rejectRes.status} ${await rejectRes.text()}`);
  }
  const rejectData = await rejectRes.json();
  console.log(`✓ Application rejected: ID: ${rejectData.application.id}, Status: ${rejectData.application.status}`);

  // Verify rejection in PostgreSQL
  const [dbApp2] = await db
    .select()
    .from(admissionApplications)
    .where(eq(admissionApplications.id, app2.id));
  if (!dbApp2 || dbApp2.status !== "rejected") {
    throw new Error("Application 2 status is not 'rejected' in Neon PostgreSQL!");
  }
  console.log(`✓ Rejection verified in PostgreSQL: Status: ${dbApp2.status}`);

  console.log("\n=======================================================");
  console.log("🎉 ALL 10 ADMISSION LIFECYCLE CHECKS PASSED FLAWLESSLY!");
  console.log("=======================================================");
}

runAdmissionE2ETests().then(
  () => process.exit(0),
  (err) => {
    console.error("\n❌ E2E ADMISSION TEST FAILED:", err);
    process.exit(1);
  },
);
