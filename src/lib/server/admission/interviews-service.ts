import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { admissionApplications, admissionEvents, admissionInterviews } from "@/db/schema/admission";
import { user as authUser } from "@/db/schema/auth";
import { teacherProfiles } from "@/db/schema/teachers";
import { teachers as mockTeachers } from "@/mock/teachers";
import {
  loadStoredApplications,
  updateStoredApplicationStatus,
  type StoredAdmissionApplication,
} from "./applications-store";
import { eq, or } from "drizzle-orm";

export type InterviewSlot = {
  id: string;
  appId: string;
  applicantName?: string;
  applicantNameUrdu?: string;
  refNo?: string;
  system?: "madrassa" | "school";
  categoryOrClass?: string;
  source?: string;
  date: string;
  time: string;
  interviewer: string;
  room: string;
  status: "scheduled" | "completed" | "passed" | "failed" | "no_show";
  marks?: number | null;
  notes?: string | null;
  guardianPhone?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocItemStatus = "verified" | "pending" | "missing" | "rejected" | "exempted";

export type DocItemDetail = {
  status: DocItemStatus;
  notes?: string;
  updatedAt?: string;
};

export type DocChecklistState = Record<
  string,
  Record<string, boolean | string | DocItemDetail>
>;

export type WaitlistEntry = {
  id: string;
  appId: string;
  rank: number;
  reason: string;
  createdAt: string;
};

export type DocType = {
  key: string;
  en: string;
  ur: string;
  required: boolean;
};

export const DEFAULT_CHECKLIST: DocType[] = [
  { key: "bform", en: "B-Form / Birth Certificate", ur: "ب فارم / پیدائش سرٹیفکیٹ", required: true },
  { key: "cnic", en: "Guardian CNIC Copy", ur: "والد/والدہ کا شناختی کارڈ", required: true },
  { key: "photos", en: "2 Passport Photos", ur: "2 پاسپورٹ سائز تصاویر", required: true },
  { key: "prev_result", en: "Previous Result Card", ur: "پچھلا نتیجہ", required: false },
  { key: "tc", en: "Transfer Certificate (if any)", ur: "ٹرانسفر سرٹیفکیٹ", required: false },
  { key: "medical", en: "Medical Fitness Form", ur: "میڈیکل فٹنس فارم", required: false },
  { key: "address", en: "Address Proof (Bill copy)", ur: "پتہ تصدیق (بل کاپی)", required: true },
];

export type StaffMember = {
  id: string;
  name: string;
  nameUrdu?: string;
  designation?: string;
  systemScope?: string;
};

export type InterviewStorageData = {
  slots: InterviewSlot[];
  docStates: DocChecklistState;
  waitlist: WaitlistEntry[];
  docTypes: DocType[];
  applications?: any[];
  staff?: StaffMember[];
};

export async function listStaffMembers(): Promise<StaffMember[]> {
  try {
    const rows = await db
      .select({
        id: teacherProfiles.id,
        name: authUser.name,
        nameUrdu: authUser.nameUrdu,
        designation: teacherProfiles.designation,
        systemScope: teacherProfiles.systemScope,
      })
      .from(teacherProfiles)
      .innerJoin(authUser, eq(authUser.id, teacherProfiles.userId))
      .where(eq(authUser.role, "teacher"));
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameUrdu: r.nameUrdu || undefined,
        designation: r.designation || undefined,
        systemScope: r.systemScope || undefined,
      }));
    }
  } catch {
    // DB offline
  }

  return mockTeachers.map((t) => ({
    id: t.id,
    name: t.name,
    nameUrdu: t.nameUrdu,
    designation: t.designation ? t.designation.replace(/_/g, " ").toUpperCase() : undefined,
    systemScope: t.system === "madrassa" ? "qasmia-madrassa" : "qasmia-school",
  }));
}

export const DEFAULT_SEED_APPLICATIONS = [
  {
    id: "app_pub_101",
    refNo: "APP-WEB-2026-001",
    source: "public",
    status: "interview_scheduled",
    name: "Muhammad Huzaifa",
    nameUrdu: "محمد حذیفہ",
    fatherName: "Tariq Mahmood",
    guardianName: "طارق محمود",
    guardianPhone: "0300-1234567",
    phone: "0300-1234567",
    system: "school",
    categoryOrClass: "Class 5 (Boys)",
    submittedAt: "2026-10-25T10:00:00Z",
  },
  {
    id: "app_pub_102",
    refNo: "APP-WEB-2026-002",
    source: "public",
    status: "pending",
    name: "Fatima Zahra",
    nameUrdu: "فاطمہ زہرا",
    fatherName: "Muhammad Imran",
    guardianName: "محمد عمران",
    guardianPhone: "0321-9876543",
    phone: "0321-9876543",
    system: "school",
    categoryOrClass: "Class 1 (Girls)",
    submittedAt: "2026-10-26T11:30:00Z",
  },
  {
    id: "app_dir_103",
    refNo: "APP-DIR-2026-003",
    source: "admin",
    status: "interview_scheduled",
    name: "Abdul Rehman",
    nameUrdu: "عبد الرحمن",
    fatherName: "Saeed Ahmad",
    guardianName: "سعید احمد",
    guardianPhone: "0333-5551234",
    phone: "0333-5551234",
    system: "madrassa",
    categoryOrClass: "Hifz Quran (حفظ قرآن)",
    submittedAt: "2026-10-27T09:15:00Z",
  },
  {
    id: "app_pub_104",
    refNo: "APP-WEB-2026-004",
    source: "public",
    status: "pending",
    name: "Zainab Bibi",
    nameUrdu: "زینب بی بی",
    fatherName: "Iqbal Hussain",
    guardianName: "اقبال حسین",
    guardianPhone: "0345-4448899",
    phone: "0345-4448899",
    system: "madrassa",
    categoryOrClass: "Nazira Quran (ناظرہ قرآن)",
    submittedAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "app_dir_105",
    refNo: "APP-DIR-2026-005",
    source: "admin",
    status: "pending",
    name: "Muhammad Bilal",
    nameUrdu: "محمد بلال",
    fatherName: "Rashid Ali",
    guardianName: "راشد علی",
    guardianPhone: "0312-7776655",
    phone: "0312-7776655",
    system: "school",
    categoryOrClass: "Class 7 (Boys)",
    submittedAt: "2026-10-28T16:00:00Z",
  },
];

function getDataFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "admission-interviews.json"),
    path.join(process.cwd(), ".output", "public", "admission-interviews.json"),
  ];
}

let memoryData: InterviewStorageData | null = null;
let dbSyncAttempted = false;

function loadStoredData(): InterviewStorageData {
  if (memoryData) return memoryData;

  for (const filePath of getDataFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          memoryData = {
            slots: Array.isArray(parsed.slots) ? parsed.slots : [],
            docStates: parsed.docStates && typeof parsed.docStates === "object" ? parsed.docStates : {},
            waitlist: Array.isArray(parsed.waitlist) ? parsed.waitlist : [],
            docTypes:
              Array.isArray(parsed.docTypes) && parsed.docTypes.length > 0
                ? parsed.docTypes
                : [...DEFAULT_CHECKLIST],
          };
          return memoryData;
        }
      }
    } catch (err) {
      console.error(`[InterviewsService] Error reading ${filePath}:`, err);
    }
  }

  memoryData = {
    slots: [],
    docStates: {},
    waitlist: [],
    docTypes: [...DEFAULT_CHECKLIST],
  };
  saveDataToFile(memoryData);
  return memoryData;
}

function saveDataToFile(data: InterviewStorageData) {
  memoryData = data;
  const jsonContent = JSON.stringify(data, null, 2);
  for (const filePath of getDataFilePaths()) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, jsonContent, "utf-8");
    } catch (err) {
      console.error(`[InterviewsService] Error saving to ${filePath}:`, err);
    }
  }
}

async function syncInterviewsWithDb(data: InterviewStorageData): Promise<InterviewStorageData> {
  try {
    const rows = await db.select().from(admissionInterviews);
    if (rows && rows.length > 0) {
      const dbSlots: InterviewSlot[] = rows.map((r) => ({
        id: r.id,
        appId: r.appId,
        applicantName: r.applicantName || undefined,
        applicantNameUrdu: r.applicantNameUrdu || undefined,
        refNo: r.refNo || undefined,
        system: (r.system as "madrassa" | "school") || undefined,
        categoryOrClass: r.categoryOrClass || undefined,
        source: r.source || undefined,
        date: r.date,
        time: r.time,
        interviewer: r.interviewer,
        room: r.room,
        status: (r.status as InterviewSlot["status"]) || "scheduled",
        marks: r.marks != null ? r.marks : null,
        notes: r.notes || null,
        guardianPhone: r.guardianPhone || undefined,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
      }));

      // Database is authoritative
      data.slots = dbSlots;
      saveDataToFile(data);
    } else if (data.slots.length > 0 && !dbSyncAttempted) {
      for (const s of data.slots) {
        try {
          await db
            .insert(admissionInterviews)
            .values({
              id: s.id,
              appId: s.appId,
              applicantName: s.applicantName,
              applicantNameUrdu: s.applicantNameUrdu,
              refNo: s.refNo,
              system: s.system,
              categoryOrClass: s.categoryOrClass,
              source: s.source,
              date: s.date,
              time: s.time,
              interviewer: s.interviewer,
              room: s.room,
              status: s.status,
              marks: s.marks ?? null,
              notes: s.notes ?? null,
              guardianPhone: s.guardianPhone,
            })
            .onConflictDoNothing();
        } catch {
          // ignore seed errors
        }
      }
    }
    dbSyncAttempted = true;
  } catch {
    // DB offline/unavailable
  }
  return data;
}

export async function listInterviews(): Promise<InterviewStorageData> {
  const data = loadStoredData();
  await syncInterviewsWithDb(data);

  const staff = await listStaffMembers();

  let loadedApps: any[] = [];
  try {
    const pendingApps = await db
      .select()
      .from(admissionApplications)
      .limit(100);
    if (pendingApps && pendingApps.length > 0) {
      loadedApps = pendingApps.map((a) => ({
        id: a.id,
        refNo: a.refNo,
        source: a.source,
        status: a.status,
        name: a.name,
        nameUrdu: a.nameUrdu,
        fatherName: a.fatherName,
        guardianName: a.guardianName,
        guardianPhone: a.guardianPhone,
        phone: a.guardianPhone,
        system: (a.darja ? "madrassa" : "school") as "madrassa" | "school",
        categoryOrClass: a.darja || "Class 5",
        submittedAt: a.submittedAt ? a.submittedAt.toISOString() : new Date().toISOString(),
      }));
    }
  } catch {
    // DB query error or offline - fallback to stored applications
  }

  const storedApps = loadStoredApplications();
  const appMap = new Map<string, any>();
  storedApps.forEach((a) => appMap.set(a.id, a));
  loadedApps.forEach((a) => appMap.set(a.id, a));
  loadedApps = Array.from(appMap.values());

  if (loadedApps.length === 0) {
    loadedApps = [...DEFAULT_SEED_APPLICATIONS];
  }

  return {
    ...data,
    applications: loadedApps,
    staff,
  };
}

export async function createOrUpdateSlot(slot: {
  id?: string;
  appId: string;
  applicantName?: string;
  applicantNameUrdu?: string;
  refNo?: string;
  system?: "madrassa" | "school";
  categoryOrClass?: string;
  source?: string;
  date: string;
  time: string;
  interviewer: string;
  room: string;
  status?: "scheduled" | "completed" | "passed" | "failed" | "no_show";
  marks?: number | null;
  notes?: string | null;
  guardianPhone?: string;
}): Promise<InterviewSlot> {
  const data = loadStoredData();
  const now = new Date().toISOString();
  const existingIdx = data.slots.findIndex((s) => s.id === (slot.id || "") || s.appId === slot.appId);
  const id = slot.id || (existingIdx >= 0 ? data.slots[existingIdx].id : `slot_${slot.appId}_${Date.now()}`);
  const status = slot.status || "scheduled";

  const newSlot: InterviewSlot = {
    id,
    appId: slot.appId,
    applicantName: slot.applicantName,
    applicantNameUrdu: slot.applicantNameUrdu,
    refNo: slot.refNo,
    system: slot.system,
    categoryOrClass: slot.categoryOrClass,
    source: slot.source,
    date: slot.date,
    time: slot.time,
    interviewer: slot.interviewer,
    room: slot.room,
    status,
    marks: slot.marks ?? null,
    notes: slot.notes ?? null,
    guardianPhone: slot.guardianPhone,
    createdAt: existingIdx >= 0 ? data.slots[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    data.slots[existingIdx] = {
      ...data.slots[existingIdx],
      ...newSlot,
    };
  } else {
    data.slots.push(newSlot);
  }

  saveDataToFile(data);

  // Sync with admission_interviews in DB
  try {
    await db
      .delete(admissionInterviews)
      .where(or(eq(admissionInterviews.id, newSlot.id), eq(admissionInterviews.appId, newSlot.appId)));

    await db.insert(admissionInterviews).values({
      id: newSlot.id,
      appId: newSlot.appId,
      applicantName: newSlot.applicantName,
      applicantNameUrdu: newSlot.applicantNameUrdu,
      refNo: newSlot.refNo,
      system: newSlot.system,
      categoryOrClass: newSlot.categoryOrClass,
      source: newSlot.source,
      date: newSlot.date,
      time: newSlot.time,
      interviewer: newSlot.interviewer,
      room: newSlot.room,
      status: newSlot.status,
      marks: newSlot.marks ?? null,
      notes: newSlot.notes ?? null,
      guardianPhone: newSlot.guardianPhone,
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error("[interviews] DB insert error:", err);
  }

  // Sync with stored application and admission_applications in DB
  const targetStatus: StoredAdmissionApplication["status"] =
    status === "completed" || status === "passed"
      ? "under_review"
      : status === "failed"
        ? "rejected"
        : "interview_scheduled";

  try {
    updateStoredApplicationStatus(slot.appId, targetStatus);
  } catch {}

  try {
    await db
      .update(admissionApplications)
      .set({ status: targetStatus, updatedAt: new Date() })
      .where(eq(admissionApplications.id, slot.appId));

    await db.insert(admissionEvents).values({
      id: randomUUID(),
      applicationId: slot.appId,
      type: "interview_updated",
      toStatus: targetStatus,
      message: `Interview status: ${status}. Marks: ${slot.marks ?? "N/A"}. Interviewer: ${slot.interviewer}. Notes: ${slot.notes || "None"}`,
    });
  } catch {
    // ignore DB offline
  }

  return newSlot;
}

export async function updateSlot(
  id: string,
  updates: Partial<Omit<InterviewSlot, "id" | "appId" | "createdAt">>,
): Promise<InterviewSlot | null> {
  const data = loadStoredData();
  const slotIdx = data.slots.findIndex((s) => s.id === id);
  if (slotIdx >= 0) {
    const updated: InterviewSlot = {
      ...data.slots[slotIdx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    data.slots[slotIdx] = updated;
    saveDataToFile(data);

    // Sync with admission_interviews in DB
    try {
      const updateValues: Record<string, any> = { updatedAt: new Date() };
      if (updates.date !== undefined) updateValues.date = updates.date;
      if (updates.time !== undefined) updateValues.time = updates.time;
      if (updates.interviewer !== undefined) updateValues.interviewer = updates.interviewer;
      if (updates.room !== undefined) updateValues.room = updates.room;
      if (updates.status !== undefined) updateValues.status = updates.status;
      if (updates.marks !== undefined) updateValues.marks = updates.marks;
      if (updates.notes !== undefined) updateValues.notes = updates.notes;

      await db
        .update(admissionInterviews)
        .set(updateValues)
        .where(eq(admissionInterviews.id, id));
    } catch {
      // ignore DB offline
    }

    // Sync with stored application and admissionApplications
    if (updates.status) {
      const targetStatus: StoredAdmissionApplication["status"] =
        updates.status === "completed" || updates.status === "passed"
          ? "under_review"
          : updates.status === "failed"
            ? "rejected"
            : updates.status === "scheduled"
              ? "interview_scheduled"
              : "under_review";

      try {
        updateStoredApplicationStatus(updated.appId, targetStatus);
      } catch {}

      try {
        await db
          .update(admissionApplications)
          .set({ status: targetStatus, updatedAt: new Date() })
          .where(eq(admissionApplications.id, updated.appId));

        await db.insert(admissionEvents).values({
          id: randomUUID(),
          applicationId: updated.appId,
          type: "interview_status_changed",
          toStatus: targetStatus,
          message: `Interview status updated to: ${updates.status}. Score: ${updated.marks ?? "N/A"}. Remarks: ${updated.notes || "None"}`,
        });
      } catch {
        // ignore
      }
    }

    return updated;
  }
  return null;
}

export async function deleteSlot(id: string): Promise<boolean> {
  const data = loadStoredData();
  const targetSlot = data.slots.find((s) => s.id === id || s.appId === id);
  const targetAppId = targetSlot?.appId;

  data.slots = data.slots.filter((s) => s.id !== id && s.appId !== id);
  saveDataToFile(data);

  try {
    await db
      .delete(admissionInterviews)
      .where(or(eq(admissionInterviews.id, id), eq(admissionInterviews.appId, id)));
  } catch (err) {
    console.error("[interviews] deleteSlot db error:", err);
  }

  if (targetAppId) {
    try {
      updateStoredApplicationStatus(targetAppId, "under_review", "Interview slot removed");
      await db
        .update(admissionApplications)
        .set({ status: "under_review", updatedAt: new Date() })
        .where(eq(admissionApplications.id, targetAppId));
    } catch {}
  }

  return true;
}

export async function saveDocState(
  appId: string,
  docs: Record<string, boolean | string | DocItemDetail>,
): Promise<DocChecklistState> {
  const data = loadStoredData();
  data.docStates[appId] = { ...(data.docStates[appId] || {}), ...docs };
  saveDataToFile(data);
  return data.docStates;
}

export async function listDocTypes(): Promise<DocType[]> {
  const data = loadStoredData();
  return data.docTypes;
}

export async function saveDocTypes(docTypes: DocType[]): Promise<DocType[]> {
  const data = loadStoredData();
  data.docTypes = docTypes;
  saveDataToFile(data);
  return data.docTypes;
}

export async function addOrUpdateDocType(docType: DocType): Promise<DocType[]> {
  const data = loadStoredData();
  const index = data.docTypes.findIndex((d) => d.key === docType.key);
  if (index >= 0) {
    data.docTypes[index] = docType;
  } else {
    data.docTypes.push(docType);
  }
  saveDataToFile(data);
  return data.docTypes;
}

export async function deleteDocType(key: string): Promise<DocType[]> {
  const data = loadStoredData();
  data.docTypes = data.docTypes.filter((d) => d.key !== key);
  saveDataToFile(data);
  return data.docTypes;
}

export async function resetDocTypes(): Promise<DocType[]> {
  const data = loadStoredData();
  data.docTypes = [...DEFAULT_CHECKLIST];
  saveDataToFile(data);
  return data.docTypes;
}

export async function saveWaitlist(entries: WaitlistEntry[]): Promise<WaitlistEntry[]> {
  const data = loadStoredData();
  data.waitlist = entries;
  saveDataToFile(data);
  return data.waitlist;
}

export async function addWaitlistEntry(appId: string, rank: number, reason: string): Promise<WaitlistEntry> {
  const data = loadStoredData();
  const entry: WaitlistEntry = {
    id: `wl_${appId}_${Date.now()}`,
    appId,
    rank,
    reason,
    createdAt: new Date().toISOString(),
  };
  data.waitlist = data.waitlist.filter((w) => w.appId !== appId);
  data.waitlist.push(entry);
  data.waitlist.sort((a, b) => a.rank - b.rank);
  saveDataToFile(data);

  try {
    await db
      .update(admissionApplications)
      .set({ status: "waitlisted", updatedAt: new Date() })
      .where(eq(admissionApplications.id, appId));
  } catch {
    // ignore
  }

  return entry;
}

export async function removeWaitlistEntry(appId: string): Promise<boolean> {
  const data = loadStoredData();
  data.waitlist = data.waitlist.filter((w) => w.appId !== appId);
  saveDataToFile(data);
  return true;
}

