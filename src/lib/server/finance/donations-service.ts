import fs from "node:fs";
import path from "node:path";

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

const DATA_FILE = path.join(process.cwd(), "public", "finance-donations.json");

let memoryDonations: Donation[] | null = null;

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

function loadStoredDonations(): Donation[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryDonations = parsed;
        return memoryDonations;
      }
    }
  } catch (err) {
    console.error("[DonationsService] Error reading finance-donations.json:", err);
  }

  // Initialize with seed donations
  memoryDonations = [...INITIAL_DONATIONS];
  saveDonationsToFile(memoryDonations);
  return memoryDonations;
}

function saveDonationsToFile(donations: Donation[]) {
  memoryDonations = donations;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(donations, null, 2), "utf-8");
  } catch (err) {
    console.error("[DonationsService] Error saving finance-donations.json:", err);
  }
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
  const totalReceived = Math.round(donations.reduce((sum, d) => sum + d.amountPaisa, 0) / 100);
  const receiptsCount = donations.length;

  const zakat = Math.round(donations.filter((d) => d.type === "zakat").reduce((sum, d) => sum + d.amountPaisa, 0) / 100);
  const sadqa = Math.round(donations.filter((d) => d.type === "sadqa").reduce((sum, d) => sum + d.amountPaisa, 0) / 100);
  const khairat = Math.round(donations.filter((d) => d.type === "khairat").reduce((sum, d) => sum + d.amountPaisa, 0) / 100);
  const fitrana = Math.round(donations.filter((d) => d.type === "fitra").reduce((sum, d) => sum + d.amountPaisa, 0) / 100);
  const general = Math.round(donations.filter((d) => d.type === "general").reduce((sum, d) => sum + d.amountPaisa, 0) / 100);

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

export function listDonations(): Donation[] {
  return loadStoredDonations();
}

export function saveDonation(input: Omit<Donation, "id" | "receiptNo"> & { id?: string; receiptNo?: string }): Donation {
  const current = loadStoredDonations();
  const year = new Date().getFullYear();
  const nextNum = current.length + 1;
  const receiptNo = input.receiptNo || `DR-${year}-${String(nextNum).padStart(4, "0")}`;
  const id = input.id || `d${Date.now()}`;

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

  saveDonationsToFile(updated);
  return newDonation;
}

export function deleteDonation(id: string): boolean {
  const current = loadStoredDonations();
  const updated = current.filter((d) => d.id !== id);
  saveDonationsToFile(updated);
  return true;
}

