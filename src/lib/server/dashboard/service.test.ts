import { describe, expect, it } from "bun:test";
import { createHmac } from "node:crypto";
import { getInventorySummary } from "@/lib/server/inventory/service";
import { listDonations } from "@/lib/server/finance/donations-service";
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

    expect(typeof summary.totalItems).toBe("number");
    expect(typeof summary.lowStockCount).toBe("number");
    expect(typeof summary.totalValue).toBe("number");
    expect(typeof summary.purchasedValue).toBe("number");
    expect(typeof summary.donatedValue).toBe("number");
    expect(summary.totalValue).toBe(summary.purchasedValue + summary.donatedValue);
  });

  it("populates dashboard cashflow with real expense heads including inventory", async () => {
    const summary = getInventorySummary();
    const cookie = makeAdminSessionCookie();
    const req = new Request("http://localhost:3000/api/dashboard", {
      headers: {
        cookie,
      },
    });

    const data = await getDashboardData(req, "all");

    expect(data.kpis.inventoryValue).toBe(summary.totalValue);
    expect(data.inventorySummary.totalValue).toBe(summary.totalValue);
    expect(data.inventorySummary.totalItems).toBe(summary.totalItems);

    const monthlyCashflow = data.cashflowMeta.monthly;
    expect(monthlyCashflow.totalExpenses).toBeGreaterThanOrEqual(0);

    // Check expense heads
    const expenseHeads = monthlyCashflow.expenseCategories;
    const salaryHead = expenseHeads.find((h) => h.id === "salaries");
    const utilHead = expenseHeads.find((h) => h.id === "utilities");
    const invHead = expenseHeads.find((h) => h.id === "inventory");
    const maintHead = expenseHeads.find((h) => h.id === "maintenance");

    expect(salaryHead).toBeDefined();
    expect(utilHead).toBeDefined();
    expect(invHead).toBeDefined();
    expect(maintHead).toBeDefined();

    // Income sources should have donations and zakat
    const incomeSources = monthlyCashflow.incomeSources;
    const donSource = incomeSources.find((s) => s.id === "general" || s.id === "donations");
    const zakatSource = incomeSources.find((s) => s.id === "zakat");

    expect(donSource).toBeDefined();
    expect(zakatSource).toBeDefined();

    // Verify Donations KPI and Summary matches real receipts from listDonations()
    const allDons = listDonations();
    const expectedTotal = allDons.reduce((s, d) => s + d.amountPaisa, 0) / 100;
    expect(data.kpis.donationsValue).toBe(expectedTotal);
    expect(data.donationsSummary.totalReceived).toBe(expectedTotal);
    expect(data.donationsSummary.receiptsCount).toBe(allDons.length);

    // Daily cashflow structure
    expect(data.cashflowMeta.daily.expenseCategories.length).toBeGreaterThan(0);
  });
});

