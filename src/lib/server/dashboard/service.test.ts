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
    // When no finance expenses are recorded, totalExpenses is 0
    expect(monthlyCashflow.totalExpenses).toBe(0);

    // Check expense heads
    const expenseHeads = monthlyCashflow.expenseCategories;
    const salaryHead = expenseHeads.find((h) => h.id === "salaries");
    const utilHead = expenseHeads.find((h) => h.id === "utilities");
    const invHead = expenseHeads.find((h) => h.id === "inventory");
    const maintHead = expenseHeads.find((h) => h.id === "maintenance");

    expect(salaryHead).toBeDefined();
    expect(salaryHead?.amount).toBe(0);

    expect(utilHead).toBeDefined();
    expect(utilHead?.amount).toBe(0);

    expect(invHead).toBeDefined();
    expect(invHead?.amount).toBe(0);

    expect(maintHead).toBeDefined();
    expect(maintHead?.amount).toBe(0);

    // Income sources should have fees, donations and zakat
    const incomeSources = monthlyCashflow.incomeSources;
    const feeSource = incomeSources.find((s) => s.id === "fees");
    const donSource = incomeSources.find((s) => s.id === "general" || s.id === "donations");
    const zakatSource = incomeSources.find((s) => s.id === "zakat");

    expect(feeSource).toBeDefined();
    expect(donSource).toBeDefined();
    expect(zakatSource).toBeDefined();

    // Verify Donations KPI and Summary matches clean slate 0 receipts
    expect(data.kpis.donationsValue).toBe(0);
    expect(data.donationsSummary.totalReceived).toBe(0);
    expect(data.donationsSummary.receiptsCount).toBe(0);
    expect(data.donationsSummary.zakat).toBe(0);
    expect(data.donationsSummary.sadqa).toBe(0);

    // Daily cashflow should be 0 in clean state
    expect(data.cashflowMeta.daily.totalExpenses).toBe(0);
    expect(data.cashflowMeta.daily.expenseCategories.length).toBeGreaterThan(0);
  });
});

