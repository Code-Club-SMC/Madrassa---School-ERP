import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { admissionApplications, admissionEvents } from "@/db/schema/admission";
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

export type DocChecklistState = Record<string, Record<string, boolean>>;

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

export type InterviewStorageData = {
  slots: InterviewSlot[];
  docStates: DocChecklistState;
  waitlist: WaitlistEntry[];
  docTypes: DocType[];
  applications?: any[];
};

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

const DATA_FILE = path.join(process.cwd(), "public", "admission-interviews.json");

let memoryData: InterviewStorageData | null = null;

function loadStoredData(): InterviewStorageData {
  if (memoryData) return memoryData;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
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
    console.error("[InterviewsService] Error reading admission-interviews.json:", err);
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
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[InterviewsService] Error saving admission-interviews.json:", err);
  }
}

export async function listInterviews(): Promise<InterviewStorageData> {
  const data = loadStoredData();

  let loadedApps: any[] = [];
  try {
    const pendingApps = await db
      .select()
      .from(admissionApplications)
      .limit(50);
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
    // DB query error or offline - fallback to seed applications
  }

  if (loadedApps.length === 0) {
    loadedApps = [...DEFAULT_SEED_APPLICATIONS];
  }

  // If memory slots are empty, try auto-seeding upcoming interview slots from applications
  if (data.slots.length === 0) {
    const interviewers = [
      "Maulana Imran Hussain",
      "Mufti Tariq Saeed",
      "Mrs. Saira Tariq",
      "Principal — Hafiz Bilal",
    ];
    const rooms = ["Conference Room A", "Principal's Office", "Library Room 2"];

    const candidates = loadedApps.slice(0, 3);
    const seededSlots: InterviewSlot[] = candidates.map((a, i) => {
      const slotDate = new Date(Date.now() + (i + 1) * 86400e3).toISOString().slice(0, 10);
      return {
        id: `slot_${a.id}`,
        appId: a.id,
        applicantName: a.name,
        applicantNameUrdu: a.nameUrdu,
        refNo: a.refNo,
        system: a.system,
        categoryOrClass: a.categoryOrClass,
        source: a.source,
        date: slotDate,
        time: ["10:00", "11:30", "14:00", "15:30"][i] ?? "10:00",
        interviewer: interviewers[i % interviewers.length],
        room: rooms[i % rooms.length],
        status: (i === 0 ? "scheduled" : i === 1 ? "passed" : "scheduled") as InterviewSlot["status"],
        marks: i === 1 ? 85 : null,
        notes: i === 1 ? "Passed oral & written test" : null,
        guardianPhone: a.guardianPhone ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    data.slots = seededSlots;
    if (data.waitlist.length === 0 && loadedApps.length > 3) {
      data.waitlist = loadedApps.slice(3, 5).map((a, i) => ({
        id: `wl_${a.id}`,
        appId: a.id,
        rank: i + 1,
        reason: i === 0 ? "Awaiting seat in selected grade" : "Pending document verification",
        createdAt: new Date().toISOString(),
      }));
    }
    saveDataToFile(data);
  }

  return {
    ...data,
    applications: loadedApps,
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
  const id = slot.id || `slot_${slot.appId}_${Date.now()}`;
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
    createdAt: now,
    updatedAt: now,
  };

  const existingIdx = data.slots.findIndex((s) => s.id === id || s.appId === slot.appId);
  if (existingIdx >= 0) {
    data.slots[existingIdx] = {
      ...data.slots[existingIdx],
      ...newSlot,
      createdAt: data.slots[existingIdx].createdAt,
      updatedAt: now,
    };
  } else {
    data.slots.push(newSlot);
  }

  saveDataToFile(data);

  // Sync with admission_applications in DB
  try {
    const targetStatus =
      status === "completed" || status === "passed"
        ? "interview_completed"
        : status === "failed"
          ? "rejected"
          : "interview_scheduled";

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

    // Sync with admissionApplications
    try {
      if (updates.status) {
        const targetStatus =
          updates.status === "completed" || updates.status === "passed"
            ? "interview_completed"
            : updates.status === "failed"
              ? "rejected"
              : updates.status === "scheduled"
                ? "interview_scheduled"
                : "under_review";

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
      }
    } catch {
      // ignore
    }

    return updated;
  }
  return null;
}

export async function deleteSlot(id: string): Promise<boolean> {
  const data = loadStoredData();
  const prevCount = data.slots.length;
  data.slots = data.slots.filter((s) => s.id !== id);
  if (data.slots.length !== prevCount) {
    saveDataToFile(data);
    return true;
  }
  return false;
}

export async function saveDocState(
  appId: string,
  docs: Record<string, boolean>,
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

