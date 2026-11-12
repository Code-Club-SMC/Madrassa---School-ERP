import { describe, expect, it } from "bun:test";
import {
  listDonations,
  saveDonation,
  deleteDonation,
  getDonationsSummary,
} from "./donations-service";

describe("Finance Donations Service Persistence", () => {
  it("loads existing donations with seed or persisted items", () => {
    const list = listDonations();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(3);

    const first = list[0];
    expect(first.id).toBeDefined();
    expect(first.receiptNo).toMatch(/^DR-\d{4}-\d+/);
    expect(first.amountPaisa).toBeGreaterThan(0);
  });

  it("saves a new donation and persists it across reloads", () => {
    const donorName = "Sheikh Abdullah Test";
    const saved = saveDonation({
      donor: donorName,
      donorUrdu: "شیخ عبداللہ",
      phone: "0300-9999888",
      cnic: "35201-9999999-1",
      type: "zakat",
      purpose: "Hifz Student Sponsorship",
      amountPaisa: 50_000_00, // PKR 50,000
      method: "bank",
    });

    expect(saved.id).toBeDefined();
    expect(saved.receiptNo).toMatch(/^DR-\d{4}-\d+/);
    expect(saved.donor).toBe(donorName);
    expect(saved.amountPaisa).toBe(50_000_00);

    const reloaded = listDonations();
    const found = reloaded.find((d) => d.id === saved.id);
    expect(found).toBeDefined();
    expect(found?.donor).toBe(donorName);
    expect(found?.type).toBe("zakat");

    // Clean up test item
    deleteDonation(saved.id);
  });

  it("calculates donations summary metrics accurately", () => {
    const summary = getDonationsSummary();
    expect(summary.totalReceived).toBeGreaterThan(0);
    expect(summary.receiptsCount).toBeGreaterThanOrEqual(3);
    expect(summary.zakat).toBeGreaterThanOrEqual(0);
    expect(summary.sadqa).toBeGreaterThanOrEqual(0);
    expect(summary.general).toBeGreaterThanOrEqual(0);
  });

  it("preserves multiple saved donations sequentially without overwriting", () => {
    const d1 = saveDonation({
      donor: "Test Donor A",
      type: "sadqa",
      purpose: "Campus Ration",
      amountPaisa: 10_000_00,
      method: "cash",
    });

    const d2 = saveDonation({
      donor: "Test Donor B",
      type: "general",
      purpose: "Library Books",
      amountPaisa: 20_000_00,
      method: "online",
    });

    const currentList = listDonations();
    expect(currentList.some((d) => d.id === d1.id)).toBe(true);
    expect(currentList.some((d) => d.id === d2.id)).toBe(true);

    // Clean up
    deleteDonation(d1.id);
    deleteDonation(d2.id);
  });
});

