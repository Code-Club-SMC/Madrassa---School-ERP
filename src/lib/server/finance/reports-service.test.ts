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
    expect(initial.length).toBeGreaterThan(0);

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

  it("fetches comprehensive report transactions combining fees, donations, and expenses", async () => {
    const txs = await getComprehensiveReportTransactions();
    expect(Array.isArray(txs)).toBe(true);
    expect(txs.length).toBeGreaterThan(0);

    const incomeTxs = txs.filter((t) => t.type === "income");
    const expenseTxs = txs.filter((t) => t.type === "expense");

    expect(incomeTxs.length).toBeGreaterThan(0);
    expect(expenseTxs.length).toBeGreaterThan(0);

    // Check income has both student fees and donations
    const feeTxs = incomeTxs.filter((t) => t.category.includes("fee"));
    const donationTxs = incomeTxs.filter((t) => t.category.includes("donation"));

    expect(feeTxs.length).toBeGreaterThan(0);
    expect(donationTxs.length).toBeGreaterThan(0);

    // Verify all transactions have valid required fields
    for (const tx of txs.slice(0, 30)) {
      expect(tx.id).toBeDefined();
      expect(tx.voucherNo).toBeDefined();
      expect(tx.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tx.amount).toBeGreaterThan(0);
      expect(tx.partyName).toBeDefined();
    }
  });

  it("filters and aggregates real transactions by scope, period, and category", async () => {
    const txs = await getComprehensiveReportTransactions();

    const schoolAnnual = filterTransactions({
      transactions: txs,
      type: "income",
      scope: "school",
      period: "annually",
      year: 2026,
    });
    expect(schoolAnnual.length).toBeGreaterThan(0);
    expect(schoolAnnual.every((t) => t.system === "school" || t.system === "both")).toBe(true);

    const categories = aggregateByCategory(schoolAnnual);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].total).toBeGreaterThan(0);

    const monthly = aggregateByMonth(schoolAnnual);
    expect(monthly.length).toBe(12);
  });
});

