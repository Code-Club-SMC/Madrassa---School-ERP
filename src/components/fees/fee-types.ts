export type FeeSystem = "school" | "madrassa";
export type FeeChargeType = "monthly" | "admission" | "exam" | "transport" | "custom";
export type FeePaymentMethod = "cash" | "bank" | "online" | "cheque" | "other";

export type FeeStudentSummary = {
  totalChargedPaisa: number;
  totalConcessionPaisa: number;
  totalPaidPaisa: number;
  totalRefundedPaisa: number;
  totalReversedPaisa: number;
  outstandingPaisa: number;
};

export type FeeStudent = {
  id: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  rollNo: string;
  admissionNo: string;
  system: FeeSystem;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  classId?: string;
  subcategoryId?: string;
  categoryId?: string;
  categoryName?: string;
  groupLabel: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  summary: FeeStudentSummary;
};

export type FeeCharge = {
  id: string;
  type: FeeChargeType;
  label: string;
  period: string | null;
  amountPaisa: number;
  dueDate: string | null;
  status: string;
  notes: string | null;
  ledger: {
    paidPaisa: number;
    refundedPaisa: number;
    concessionPaisa: number;
    reversedPaisa: number;
    balancePaisa: number;
    status: string;
    agingBucket: "current" | "30" | "60" | "90";
  };
};

export type FeePayment = {
  id: string;
  receiptNo: string;
  amountPaisa: number;
  method: FeePaymentMethod;
  status: string;
  receivedAt: string;
  payerName: string | null;
  payerPhone: string | null;
  notes: string | null;
  allocations: Array<{
    id: string;
    chargeId: string;
    amountPaisa: number;
  }>;
};

export type FeeAdjustment = {
  id: string;
  type: string;
  amountPaisa: number;
  reason: string;
  method: FeePaymentMethod | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type FeeLedgerPayload = {
  student: FeeStudent;
  charges: FeeCharge[];
  payments: FeePayment[];
  adjustments: FeeAdjustment[];
  summary: FeeStudentSummary;
};
