import { describe, expect, it } from "bun:test";
import {
  getComprehensiveReportTransactions,
  donationToTransaction,
} from "./reports-service";
import { listDonations, saveDonation, deleteDonation } from "./donations-service";
import { filterTransactions, aggregateByCategory, aggregateByMonth } from "@/lib/finance/comprehensive-reports";

describe("Finance Reports & Real Data Aggregation", () => {
  it("loads realistic donations and saves new donations persistently", () => {
    const initial = listDonations();
    expect(Array.isArray(initial)).toBe(true);

    // Save a new donation
    const created = saveDonation({
      donor: "Test Philanthropist",
      donorUrdu: "ٹیسٹ مخیر",
      type: "zakat",
      purpose: "Hifz student scholarship fund",
      amountPaisa: 50_000_00,
      method: "bank",
    });

    expect(created.id).toBeDefined();
    expect(created.receiptNo).toMatch(/^DR-\d{4}-\d+/);
    expect(created.amountPaisa).toBe(50_000_00);

    const reloaded = listDonations();
    const found = reloaded.find((d) => d.id === created.id);
    expect(found).toBeDefined();
    expect(found?.donor).toBe("Test Philanthropist");

    // Clean up test donation so test state doesn't leak into subsequent tests or persistent seed
    deleteDonation(created.id);
  });

  it("converts donation to comprehensive transaction with correct category and system", () => {
    const tx = donationToTransaction({
      id: "test-d1",
      receiptNo: "DR-2026-9999",
      date: "2026-06-15",
      donor: "Haji Ahmad",
      donorUrdu: "حاجی احمد",
      type: "zakat",
      purpose: "Orphan student support at madrassa campus",
      amountPaisa: 120_000_00,
      method: "online",
    });

    expect(tx.voucherNo).toBe("DR-2026-9999");
    expect(tx.type).toBe("income");
    expect(tx.category).toBe("donation_zakat");
    expect(tx.system).toBe("madrassa");
    expect(tx.amount).toBe(120_000);
    expect(tx.partyRole).toBe("Donor");
  });

  it("fetches comprehensive report transactions returning an array", async () => {
    const txs = await getComprehensiveReportTransactions();
    expect(Array.isArray(txs)).toBe(true);
  });

  it("filters and aggregates transactions by scope, period, and category", () => {
    const sampleTxs = [
      {
        id: "tx-sample-1",
        voucherNo: "REC-2026-0001",
        date: "2026-05-10",
        month: 5,
        year: 2026,
        type: "income" as const,
        category: "school_tuition_fee" as const,
        categoryLabel: "School Tuition Fee",
        description: "Tuition",
        system: "school" as const,
        partyName: "Student A",
        amount: 5000,
      },
      {
        id: "tx-sample-2",
        voucherNo: "REC-2026-0002",
        date: "2026-05-15",
        month: 5,
        year: 2026,
        type: "income" as const,
        category: "donation_zakat" as const,
        categoryLabel: "Zakat",
        description: "Zakat Donation",
        system: "madrassa" as const,
        partyName: "Donor B",
        amount: 25000,
      },
    ];

    const schoolAnnual = filterTransactions({
      transactions: sampleTxs,
      type: "income",
      scope: "school",
      period: "annually",
      year: 2026,
    });
    expect(schoolAnnual.length).toBe(1);
    expect(schoolAnnual.every((t) => t.system === "school" || t.system === "both")).toBe(true);

    const categories = aggregateByCategory(schoolAnnual);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].total).toBe(5000);

    const monthly = aggregateByMonth(schoolAnnual);
    expect(monthly.length).toBe(12);
  });
});

