import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { recordFinanceTransaction } from "./transaction-service";
import { getFinanceOverview } from "./overview";
import { deleteDonation } from "./donations-service";
import { getDashboardData } from "@/lib/server/dashboard/service";

function createMockSuperAdminRequest(url: string, init?: RequestInit) {
  const secret = process.env.SESSION_SECRET || "msmis_erp_fallback_secret_key_2026_super_secure";
  const payload = {
    userId: "test-admin-fin-1",
    email: "superadmin@msmis.pk",
    role: "super_admin",
    name: "Super Admin",
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", secret).update(base64).digest("base64");
  const cookie = `msmis_session=${base64}.${signature}`;

  const headers = new Headers(init?.headers);
  headers.set("cookie", cookie);

  return new Request(url, {
    ...init,
    headers,
  });
}

describe("Finance Transactions & Dual Dashboard Synchronization", () => {
  const paymentsPath = path.join(process.cwd(), "public", "finance-fee-payments.json");
  const expensesPath = path.join(process.cwd(), "public", "finance-expenses.json");
  const donationsPath = path.join(process.cwd(), "public", "finance-donations.json");

  let origPayments = "";
  let origExpenses = "";
  let origDonations = "";

  beforeAll(() => {
    if (fs.existsSync(paymentsPath)) origPayments = fs.readFileSync(paymentsPath, "utf-8");
    if (fs.existsSync(expensesPath)) origExpenses = fs.readFileSync(expensesPath, "utf-8");
    if (fs.existsSync(donationsPath)) origDonations = fs.readFileSync(donationsPath, "utf-8");
  });

  afterAll(() => {
    if (origPayments && fs.existsSync(paymentsPath)) fs.writeFileSync(paymentsPath, origPayments, "utf-8");
    if (origExpenses && fs.existsSync(expensesPath)) fs.writeFileSync(expensesPath, origExpenses, "utf-8");
    if (origDonations && fs.existsSync(donationsPath)) fs.writeFileSync(donationsPath, origDonations, "utf-8");
  });
  it("records an income fee transaction and reflects it across finance overview and main dashboard", async () => {
    const adminReq = createMockSuperAdminRequest("http://localhost:3000/api/finance/transactions", {
      method: "POST",
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const result = await recordFinanceTransaction(adminReq, {
      type: "income",
      category: "fees",
      amount: 4500,
      date: todayStr,
      source: "Muhammad Ali",
      description: "Class 10 tuition fee payment",
      system: "school",
      paymentMethod: "cash",
    });

    expect(result.success).toBe(true);
    expect(result.transaction.voucherNo).toBeDefined();
    expect(result.transaction.amount).toBe(4500);

    // 1. Verify Finance Overview includes this transaction
    const overviewReq = createMockSuperAdminRequest("http://localhost:3000/api/finance/overview");
    const overview = await getFinanceOverview(overviewReq);
    expect(overview.recentTransactions.length).toBeGreaterThan(0);
    const foundInOverview = overview.recentTransactions.some(
      (tx) => tx.id === result.transaction.id || tx.description.includes(result.transaction.voucherNo),
    );
    expect(foundInOverview).toBe(true);

    // 2. Verify Main Dashboard includes this transaction in KPIs or Recent Activities
    const dashReq = createMockSuperAdminRequest("http://localhost:3000/api/dashboard");
    const dashboardData = await getDashboardData(dashReq, "all");
    expect(dashboardData.kpis.monthlyFee).toBeGreaterThanOrEqual(4500);

    const foundInActivities = dashboardData.recentActivities.some(
      (a) => a.id.includes(result.transaction.id) || a.title.includes(result.transaction.voucherNo) || a.title.includes("4,500"),
    );
    expect(foundInActivities).toBe(true);
  });

  it("records an operational expense and reflects it in cashflow and recent activities", async () => {
    const adminReq = createMockSuperAdminRequest("http://localhost:3000/api/finance/transactions", {
      method: "POST",
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const result = await recordFinanceTransaction(adminReq, {
      type: "expense",
      category: "salary",
      amount: 35000,
      date: todayStr,
      source: "Qari Tariq Jameel",
      description: "Senior Faculty Salary Disbursement",
      system: "madrassa",
      paymentMethod: "bank",
    });

    expect(result.success).toBe(true);
    expect(result.transaction.type).toBe("expense");
    expect(result.transaction.amount).toBe(35000);

    // Verify Finance Overview includes this expense
    const overviewReq = createMockSuperAdminRequest("http://localhost:3000/api/finance/overview");
    const overview = await getFinanceOverview(overviewReq);
    const foundInOverview = overview.recentTransactions.some(
      (tx) => tx.id === result.transaction.id || tx.description.includes(result.transaction.voucherNo),
    );
    expect(foundInOverview).toBe(true);

    // Verify Main Dashboard reflects the expense
    const dashReq = createMockSuperAdminRequest("http://localhost:3000/api/dashboard");
    const dashboardData = await getDashboardData(dashReq, "all");
    expect(dashboardData.cashflowMeta.monthly.totalExpenses).toBeGreaterThan(0);
  });

  it("records a donation transaction and updates donation metrics and cashflow", async () => {
    const adminReq = createMockSuperAdminRequest("http://localhost:3000/api/finance/transactions", {
      method: "POST",
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const result = await recordFinanceTransaction(adminReq, {
      type: "income",
      category: "charity",
      amount: 25000,
      date: todayStr,
      source: "Haji Muhammad Saeed",
      description: "Student mess support donation",
      system: "madrassa",
      paymentMethod: "cash",
    });

    expect(result.success).toBe(true);
    expect(result.transaction.category).toBe("donation_sadqa");

    const dashReq = createMockSuperAdminRequest("http://localhost:3000/api/dashboard");
    const dashboardData = await getDashboardData(dashReq, "all");
    expect(dashboardData.kpis.donationsValue).toBeGreaterThanOrEqual(25000);

    // Clean up test donation so dashboard metrics remain pristine
    deleteDonation(result.transaction.id);
  });
});
