import { describe, expect, it } from "bun:test";
import { createHmac } from "node:crypto";
import { getInventorySummary } from "@/lib/server/inventory/service";
import { getDashboardData } from "./service";

const SESSION_SECRET = process.env.SESSION_SECRET || "msmis_erp_fallback_secret_key_2026_super_secure";

function makeAdminSessionCookie(): string {
  const payload = {
    userId: "admin-test",
    email: "admin@msmis.edu.pk",
    role: "super_admin",
    name: "System Administrator",
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", SESSION_SECRET).update(base64).digest("base64");
  return `msmis_session=${base64}.${signature}`;
}

describe("Dashboard Real Data & Expense Tracking", () => {
  it("returns accurate real inventory metrics and purchased stock valuation", () => {
    const summary = getInventorySummary();

    expect(summary.totalItems).toBe(8);
    expect(summary.lowStockCount).toBe(3);
    expect(summary.totalValue).toBe(145900);
    expect(summary.totalUnits).toBe(549);
    expect(summary.purchasedValue).toBe(90800);
    expect(summary.donatedValue).toBe(55100);

    // Verify item entries
    const quran = summary.items.find((i) => i.name.includes("Quran"));
    expect(quran).toBeDefined();
    expect(quran?.type).toBe("donated");
    expect(quran?.value).toBe(12000);
    expect(quran?.lowStock).toBe(true);

    const notebooks = summary.items.find((i) => i.name === "Notebooks");
    expect(notebooks).toBeDefined();
    expect(notebooks?.type).toBe("purchased");
    expect(notebooks?.value).toBe(24000);
  });

  it("populates dashboard cashflow with real expense heads including inventory", async () => {
    const cookie = makeAdminSessionCookie();
    const req = new Request("http://localhost:3000/api/dashboard", {
      headers: {
        cookie,
      },
    });

    const data = await getDashboardData(req, "all");

    expect(data.kpis.inventoryValue).toBe(145900);
    expect(data.inventorySummary.totalValue).toBe(145900);
    expect(data.inventorySummary.totalItems).toBe(8);

    const monthlyCashflow = data.cashflowMeta.monthly;
    expect(monthlyCashflow.totalExpenses).toBeGreaterThan(0);

    // Check expense heads
    const expenseHeads = monthlyCashflow.expenseCategories;
    const salaryHead = expenseHeads.find((h) => h.id === "salaries");
    const utilHead = expenseHeads.find((h) => h.id === "utilities");
    const invHead = expenseHeads.find((h) => h.id === "inventory");
    const messHead = expenseHeads.find((h) => h.id === "mess");
    const maintHead = expenseHeads.find((h) => h.id === "maintenance");

    expect(salaryHead).toBeDefined();
    expect(salaryHead?.amount).toBeGreaterThan(0);

    expect(utilHead).toBeDefined();
    expect(utilHead?.amount).toBeGreaterThan(0);

    expect(invHead).toBeDefined();
    expect(invHead?.amount).toBe(90800);

    expect(messHead).toBeDefined();
    expect(messHead?.amount).toBeGreaterThan(0);

    expect(maintHead).toBeDefined();
    expect(maintHead?.amount).toBeGreaterThan(0);

    // Income sources should have donations and zakat
    const incomeSources = monthlyCashflow.incomeSources;
    const donSource = incomeSources.find((s) => s.id === "general" || s.id === "donations");
    const zakatSource = incomeSources.find((s) => s.id === "zakat");

    expect(donSource).toBeDefined();
    expect(donSource?.amount).toBe(100000);

    expect(zakatSource).toBeDefined();
    expect(zakatSource?.amount).toBe(250000);

    // Verify Donations KPI and Summary matches real Rs 365,000 receipts
    expect(data.kpis.donationsValue).toBe(365000);
    expect(data.donationsSummary.totalReceived).toBe(365000);
    expect(data.donationsSummary.receiptsCount).toBe(3);
    expect(data.donationsSummary.zakat).toBe(250000);
    expect(data.donationsSummary.sadqa).toBe(15000);
    expect(data.donationsSummary.general).toBe(100000);

    // Daily cashflow should not be 0
    expect(data.cashflowMeta.daily.totalExpenses).toBeGreaterThan(0);
    expect(data.cashflowMeta.daily.expenseCategories.length).toBeGreaterThan(0);
  });
});

