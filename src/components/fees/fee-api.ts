import type {
  FeeChargeType,
  FeeLedgerPayload,
  FeePaymentMethod,
  FeeStudent,
  FeeSystem,
} from "./fee-types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload as T;
}

export function listFeeStudents(system: FeeSystem, q: string) {
  const params = new URLSearchParams({ system });
  if (q.trim()) params.set("q", q.trim());
  return requestJson<{ students: FeeStudent[] }>(`/api/fees/students?${params.toString()}`);
}

export function getFeeLedger(system: FeeSystem, studentId: string) {
  return requestJson<FeeLedgerPayload>(`/api/fees/students/${studentId}/ledger?system=${system}`);
}

export function createCharge(input: {
  studentId: string;
  type: FeeChargeType;
  label: string;
  amountPaisa: number;
  dueDate?: string;
  period?: string;
  notes?: string;
}) {
  return requestJson("/api/fees/charges", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function chargeAndCollect(
  input: Parameters<typeof createCharge>[0] & {
    method: FeePaymentMethod;
    receivedAt?: string;
    payerName?: string;
    payerPhone?: string;
  },
) {
  return requestJson("/api/fees/charge-and-collect", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function collectPayment(input: {
  studentId: string;
  allocations: Array<{ chargeId: string; amountPaisa: number }>;
  method: FeePaymentMethod;
  receivedAt?: string;
  payerName?: string;
  payerPhone?: string;
  notes?: string;
}) {
  return requestJson("/api/fees/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function reverseCharge(chargeId: string, reason: string) {
  return requestJson(`/api/fees/charges/${chargeId}/reverse`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function reversePayment(paymentId: string, reason: string) {
  return requestJson(`/api/fees/payments/${paymentId}/reverse`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function refundPayment(paymentId: string, input: { amountPaisa: number; method: FeePaymentMethod; reason: string }) {
  return requestJson(`/api/fees/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
