import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { donations as dbDonations, financeTransactions } from "@/db/schema/finance";
import { desc, eq } from "drizzle-orm";

export type DonationType = "zakat" | "sadqa" | "general" | "khairat" | "fitra";

export interface Donation {
  id: string;
  receiptNo: string;
  date: string; // YYYY-MM-DD
  donor: string;
  donorUrdu: string;
  phone?: string;
  cnic?: string;
  type: DonationType;
  purpose: string;
  amountPaisa: number;
  method: "cash" | "bank" | "online";
}

function getDataFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "finance-donations.json"),
    path.join(process.cwd(), ".output", "public", "finance-donations.json"),
  ];
}

let memoryDonations: Donation[] | null = null;
let dbSyncAttempted = false;

const INITIAL_DONATIONS: Donation[] = [
  {
    id: "d1",
    receiptNo: "DR-2026-0001",
    date: "2026-05-12",
    donor: "Haji Abdul Rauf",
    donorUrdu: "حاجی عبدالرؤف",
    phone: "0300-1111111",
    cnic: "35202-1234567-1",
    type: "zakat",
    purpose: "Orphan student fees",
    amountPaisa: 250_000_00,
    method: "bank",
  },
  {
    id: "d2",
    receiptNo: "DR-2026-0002",
    date: "2026-05-18",
    donor: "Anonymous",
    donorUrdu: "گمنام",
    type: "sadqa",
    purpose: "Inventory — notebooks",
    amountPaisa: 15_000_00,
    method: "cash",
  },
  {
    id: "d3",
    receiptNo: "DR-2026-0003",
    date: "2026-05-22",
    donor: "Mrs. Aisha Khan",
    donorUrdu: "عائشہ خان",
    phone: "0321-2222222",
    type: "general",
    purpose: "Building fund",
    amountPaisa: 100_000_00,
    method: "online",
  },
];

function readFromFile(): Donation[] | null {
  for (const filePath of getDataFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed as Donation[];
        }
      }
    } catch {
      // try next path
    }
  }
  return null;
}

function writeToFile(donations: Donation[]) {
  for (const filePath of getDataFilePaths()) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(donations, null, 2), "utf-8");
    } catch {
      // ignore write error for secondary or read-only directories
    }
  }
}

export async function ensureDonationsLoaded(): Promise<Donation[]> {
  try {
    const rows = await db
      .select()
      .from(dbDonations)
      .orderBy(desc(dbDonations.createdAt));

    const mapped: Donation[] = (rows || []).map((r) => ({
      id: r.id,
      receiptNo: r.receiptNo,
      date: r.date,
      donor: r.donor,
      donorUrdu: r.donorUrdu || r.donor,
      phone: r.phone || undefined,
      cnic: r.cnic || undefined,
      type: r.type as DonationType,
      purpose: r.purpose,
      amountPaisa: r.amountPaisa,
      method: r.method as "cash" | "bank" | "online",
    }));

    memoryDonations = mapped;
    writeToFile(mapped);
    dbSyncAttempted = true;
    return mapped;
  } catch {
    if (memoryDonations !== null) {
      return memoryDonations;
    }
    const fromFile = readFromFile();
    memoryDonations = fromFile ?? [];
    return memoryDonations;
  }
}

// Background warmup
if (!dbSyncAttempted) {
  ensureDonationsLoaded().catch(() => {});
}

export function listDonations(): Donation[] {
  if (memoryDonations !== null) {
    return memoryDonations;
  }
  const fromFile = readFromFile();
  if (fromFile !== null) {
    memoryDonations = fromFile;
    return memoryDonations;
  }
  memoryDonations = [];
  return memoryDonations;
}

export async function deleteAllDonations(): Promise<boolean> {
  try {
    await db.delete(dbDonations);
  } catch (err) {
    console.error("[DonationsService] Failed to clear donations in DB:", err);
  }
  memoryDonations = [];
  writeToFile([]);
  return true;
}

export function saveDonation(
  input: Omit<Donation, "id" | "receiptNo" | "date"> & { id?: string; receiptNo?: string; date?: string },
): Donation {
  const current = listDonations();
  const year = new Date().getFullYear();
  const nextNum = current.length + 1;
  const receiptNo = input.receiptNo || `DR-${year}-${String(nextNum).padStart(4, "0")}`;
  const id = input.id || `d${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const newDonation: Donation = {
    id,
    receiptNo,
    date: input.date || new Date().toISOString().slice(0, 10),
    donor: input.donor,
    donorUrdu: input.donorUrdu || input.donor,
    phone: input.phone,
    cnic: input.cnic,
    type: input.type,
    purpose: input.purpose || "General Welfare Contribution",
    amountPaisa: input.amountPaisa,
    method: input.method || "cash",
  };

  const existingIndex = current.findIndex((d) => d.id === id);
  let updated: Donation[];
  if (existingIndex >= 0) {
    updated = current.map((d) => (d.id === id ? newDonation : d));
  } else {
    updated = [newDonation, ...current];
  }

  memoryDonations = updated;
  writeToFile(updated);

  // Concurrently persist to PostgreSQL DB
  db.insert(dbDonations)
    .values({
      id: newDonation.id,
      receiptNo: newDonation.receiptNo,
      date: newDonation.date,
      donor: newDonation.donor,
      donorUrdu: newDonation.donorUrdu,
      phone: newDonation.phone,
      cnic: newDonation.cnic,
      type: newDonation.type,
      purpose: newDonation.purpose,
      amountPaisa: newDonation.amountPaisa,
      method: newDonation.method,
    })
    .onConflictDoUpdate({
      target: dbDonations.id,
      set: {
        receiptNo: newDonation.receiptNo,
        date: newDonation.date,
        donor: newDonation.donor,
        donorUrdu: newDonation.donorUrdu,
        phone: newDonation.phone,
        cnic: newDonation.cnic,
        type: newDonation.type,
        purpose: newDonation.purpose,
        amountPaisa: newDonation.amountPaisa,
        method: newDonation.method,
        updatedAt: new Date(),
      },
    })
    .catch((err) => {
      console.warn(
        "[DonationsService] Could not persist donation to db (file backup preserved):",
        err?.message || err,
      );
    });

  // Concurrently mirror to financeTransactions
  const pLower = (newDonation.purpose || "").toLowerCase();
  const isSchool = pLower.includes("school") || pLower.includes("اکیڈمی");
  const instId = isSchool ? "al_qasim_academy" : "jamia_qasmia_baneen";
  const donCat =
    newDonation.type === "zakat"
      ? "donation_zakat"
      : newDonation.type === "sadqa"
        ? "donation_sadqa"
        : newDonation.type === "fitra"
          ? "donation_fitra"
          : "donation_general";
  const donCatUr = newDonation.type === "zakat" ? "زکوٰۃ فنڈ" : "صدقات و خیرات";

  db.insert(financeTransactions)
    .values({
      id: `tx-don-${newDonation.id}`,
      voucherNo: newDonation.receiptNo,
      date: newDonation.date,
      type: "income",
      category: donCat,
      categoryUrdu: donCatUr,
      amount: Math.round(newDonation.amountPaisa / 100),
      system: isSchool ? "school" : "madrassa",
      institutionId: instId,
      description: newDonation.purpose ? `Donation: ${newDonation.purpose}` : `Donation receipt from ${newDonation.donor}`,
      descriptionUrdu: `عطیہ رسید #${newDonation.receiptNo} · ${newDonation.donorUrdu || newDonation.donor}`,
      partyName: newDonation.donor,
      partyRole: "Donor",
      paymentMethod: newDonation.method || "cash",
      reference: newDonation.receiptNo,
      status: "posted",
    })
    .onConflictDoUpdate({
      target: financeTransactions.id,
      set: {
        voucherNo: newDonation.receiptNo,
        date: newDonation.date,
        amount: Math.round(newDonation.amountPaisa / 100),
        category: donCat,
        categoryUrdu: donCatUr,
        partyName: newDonation.donor,
        updatedAt: new Date(),
      },
    })
    .catch(() => {});

  return newDonation;
}

export function deleteDonation(id: string): boolean {
  const current = listDonations();
  const updated = current.filter((d) => d.id !== id);
  memoryDonations = updated;
  writeToFile(updated);

  db.delete(dbDonations)
    .where(eq(dbDonations.id, id))
    .catch((err) => {
      console.warn(
        "[DonationsService] Could not delete donation from db (file backup preserved):",
        err?.message || err,
      );
    });

  db.delete(financeTransactions)
    .where(eq(financeTransactions.id, `tx-don-${id}`))
    .catch(() => {});

  return true;
}

export interface DonationsSummary {
  totalReceived: number;
  receiptsCount: number;
  zakat: number;
  sadqa: number;
  khairat: number;
  fitrana: number;
  general: number;
  donations: Donation[];
}

export function getDonationsSummary(): DonationsSummary {
  const donations = listDonations();
  const totalReceived = Math.round(
    donations.reduce((sum, d) => sum + d.amountPaisa, 0) / 100,
  );
  const receiptsCount = donations.length;

  const zakat = Math.round(
    donations
      .filter((d) => d.type === "zakat")
      .reduce((sum, d) => sum + d.amountPaisa, 0) / 100,
  );
  const sadqa = Math.round(
    donations
      .filter((d) => d.type === "sadqa")
      .reduce((sum, d) => sum + d.amountPaisa, 0) / 100,
  );
  const khairat = Math.round(
    donations
      .filter((d) => d.type === "khairat")
      .reduce((sum, d) => sum + d.amountPaisa, 0) / 100,
  );
  const fitrana = Math.round(
    donations
      .filter((d) => d.type === "fitra")
      .reduce((sum, d) => sum + d.amountPaisa, 0) / 100,
  );
  const general = Math.round(
    donations
      .filter((d) => d.type === "general")
      .reduce((sum, d) => sum + d.amountPaisa, 0) / 100,
  );

  return {
    totalReceived,
    receiptsCount,
    zakat,
    sadqa,
    khairat,
    fitrana,
    general,
    donations,
  };
}
