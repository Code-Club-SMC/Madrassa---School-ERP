import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CircleDollarSign,
  HandCoins,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  Undo2,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPKR } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getFeeLedger, listFeeStudents } from "./fee-api";
import {
  ChargeDialog,
  CollectPaymentDialog,
  FeeReceiptDialog,
  RefundDialog,
  ReverseDialog,
  chargeCanBeReversed,
} from "./fee-dialogs";
import type { FeeCharge, FeeLedgerPayload, FeePayment, FeeStudent, FeeSystem } from "./fee-types";

type LedgerTab = "charges" | "receipts" | "adjustments";

export function FeeWorkspace({ system }: { system: FeeSystem }) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<FeeStudent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<FeeLedgerPayload | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [tab, setTab] = useState<LedgerTab>("charges");
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeCollectOpen, setChargeCollectOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);
  const [refund, setRefund] = useState<FeePayment | null>(null);
  const [reverseTarget, setReverseTarget] = useState<{ kind: "charge" | "payment"; id: string; label: string } | null>(null);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const payload = await listFeeStudents(system, query);
      const nextStudents = payload.students ?? [];
      setStudents(nextStudents);
      setSelectedId((current) => {
        if (current && nextStudents.some((student) => student.id === current)) return current;
        return nextStudents[0]?.id ?? null;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load fee students");
      setStudents([]);
      setSelectedId(null);
    } finally {
      setStudentsLoading(false);
    }
  }, [query, system]);

  const loadLedger = useCallback(async () => {
    if (!selectedId) {
      setLedger(null);
      return;
    }

    setLedgerLoading(true);
    try {
      setLedger(await getFeeLedger(system, selectedId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load fee ledger");
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }, [selectedId, system]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const selected = students.find((student) => student.id === selectedId) ?? null;
  const totals = useMemo(() => summarizeStudents(students), [students]);
  const outstandingCharges = ledger?.charges.filter((charge) => charge.ledger.balancePaisa > 0) ?? [];
  const title = system === "school" ? "School Fees" : "Madrassa Fees";
  const titleUrdu = system === "school" ? "اسکول — فیس" : "مدرسہ کی فیس";

  const refreshCurrent = async () => {
    await Promise.all([loadStudents(), loadLedger()]);
  };

  return (
    <div>
      <PageHeader
        title={title}
        titleUrdu={titleUrdu}
        description="On-demand charges, collections, receipts, reversals, refunds, and outstanding balances."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void refreshCurrent()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!selected} onClick={() => setChargeOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Charge
            </Button>
            <Button size="sm" className="gap-1.5" disabled={!selected} onClick={() => setChargeCollectOpen(true)}>
              <WalletCards className="h-4 w-4" />
              Charge + Collect
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Banknote} label="Total charged" value={formatPKR(totals.totalChargedPaisa)} />
        <Kpi icon={HandCoins} label="Collected" value={formatPKR(totals.totalPaidPaisa)} tone="positive" />
        <Kpi icon={Undo2} label="Refunded" value={formatPKR(totals.totalRefundedPaisa)} tone="warning" />
        <Kpi icon={AlertCircle} label="Outstanding" value={formatPKR(totals.outstandingPaisa)} tone="negative" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roll, name, phone..."
                className="pe-9"
              />
            </div>
          </div>
          <div className="max-h-[650px] overflow-y-auto">
            {studentsLoading ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Loading students...</p>
            ) : students.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={CircleDollarSign} heading="No students found" headingUrdu="کوئی طالبِ علم نہیں ملا" />
              </div>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedId(student.id)}
                  className={cn(
                    "block w-full border-b px-3 py-3 text-start transition-colors hover:bg-muted/60",
                    selectedId === student.id && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-urdu text-sm">{student.nameUrdu}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.rollNo} · {student.groupLabel ?? student.institutionName}
                      </p>
                      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                        {student.guardianPhone || "No phone"}
                      </p>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="font-mono text-xs font-semibold">{formatPKR(student.summary.outstandingPaisa)}</p>
                      <Badge variant={student.summary.outstandingPaisa > 0 ? "outline" : "secondary"} className="mt-1 text-[10px]">
                        {student.summary.outstandingPaisa > 0 ? "Due" : "Clear"}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="min-h-[650px] overflow-hidden">
          {!selected ? (
            <div className="p-10">
              <EmptyState icon={ReceiptText} heading="Select a student" headingUrdu="طالبِ علم منتخب کریں" />
            </div>
          ) : (
            <>
              <div className="border-b p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-urdu text-xl font-semibold">{selected.nameUrdu}</p>
                    <p className="text-sm text-muted-foreground">
                      {selected.name} · {selected.rollNo} · {selected.groupLabel ?? selected.institutionName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Guardian: {selected.guardianName ?? "—"} · {selected.guardianPhone ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCollectOpen(true)} disabled={!ledger || outstandingCharges.length === 0}>
                      <HandCoins className="h-4 w-4" />
                      Collect Payment
                    </Button>
                  </div>
                </div>
                {ledger && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    <Mini label="Charged" value={formatPKR(ledger.summary.totalChargedPaisa)} />
                    <Mini label="Paid" value={formatPKR(ledger.summary.totalPaidPaisa)} />
                    <Mini label="Refunded" value={formatPKR(ledger.summary.totalRefundedPaisa)} />
                    <Mini label="Balance" value={formatPKR(ledger.summary.outstandingPaisa)} alert={ledger.summary.outstandingPaisa > 0} />
                  </div>
                )}
              </div>

              <div className="border-b p-3">
                <Tabs value={tab} onValueChange={(value) => setTab(value as LedgerTab)}>
                  <TabsList>
                    <TabsTrigger value="charges">Charges</TabsTrigger>
                    <TabsTrigger value="receipts">Receipts</TabsTrigger>
                    <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {ledgerLoading ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Loading ledger...</p>
              ) : tab === "charges" ? (
                <ChargesTable charges={ledger?.charges ?? []} onReverse={setReverseTarget} />
              ) : tab === "receipts" ? (
                <ReceiptsTable
                  payments={ledger?.payments ?? []}
                  onReceipt={setReceipt}
                  onReverse={(payment) =>
                    setReverseTarget({
                      kind: "payment",
                      id: payment.id,
                      label: `${payment.receiptNo} · ${formatPKR(payment.amountPaisa)}`,
                    })
                  }
                  onRefund={setRefund}
                />
              ) : (
                <AdjustmentsTable ledger={ledger} />
              )}
            </>
          )}
        </Card>
      </div>

      <ChargeDialog open={chargeOpen} onOpenChange={setChargeOpen} onSuccess={() => void refreshCurrent()} student={selected} />
      <ChargeDialog
        open={chargeCollectOpen}
        onOpenChange={setChargeCollectOpen}
        onSuccess={() => void refreshCurrent()}
        student={selected}
        collectNow
      />
      <CollectPaymentDialog open={collectOpen} onOpenChange={setCollectOpen} onSuccess={() => void refreshCurrent()} ledger={ledger} />
      <FeeReceiptDialog payment={receipt} ledger={ledger} onOpenChange={(open) => !open && setReceipt(null)} />
      <RefundDialog payment={refund} onOpenChange={(open) => !open && setRefund(null)} onSuccess={() => void refreshCurrent()} />
      <ReverseDialog
        target={reverseTarget}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        onSuccess={() => void refreshCurrent()}
      />
    </div>
  );
}

function ChargesTable({
  charges,
  onReverse,
}: {
  charges: FeeCharge[];
  onReverse: (target: { kind: "charge"; id: string; label: string }) => void;
}) {
  if (charges.length === 0) {
    return (
      <div className="p-8">
        <EmptyState icon={Banknote} heading="No charges yet" headingUrdu="ابھی کوئی فیس نہیں" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>Charge</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="text-end">Amount</TableHead>
          <TableHead className="text-end">Paid</TableHead>
          <TableHead className="text-end">Balance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-end">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {charges.map((charge) => (
          <TableRow key={charge.id}>
            <TableCell>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{charge.label}</p>
                <p className="text-[11px] text-muted-foreground">{charge.period ?? charge.type}</p>
              </div>
            </TableCell>
            <TableCell className="text-xs">{charge.dueDate ? formatDate(charge.dueDate) : "—"}</TableCell>
            <TableCell className="text-end font-mono text-xs">{formatPKR(charge.amountPaisa)}</TableCell>
            <TableCell className="text-end font-mono text-xs">{formatPKR(charge.ledger.paidPaisa)}</TableCell>
            <TableCell className="text-end font-mono text-xs">{formatPKR(charge.ledger.balancePaisa)}</TableCell>
            <TableCell>
              <Badge variant={charge.ledger.status === "paid" ? "secondary" : "outline"}>{charge.ledger.status}</Badge>
            </TableCell>
            <TableCell className="text-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
                disabled={!chargeCanBeReversed(charge)}
                onClick={() => onReverse({ kind: "charge", id: charge.id, label: `${charge.label} · ${formatPKR(charge.amountPaisa)}` })}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reverse
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReceiptsTable({
  payments,
  onReceipt,
  onReverse,
  onRefund,
}: {
  payments: FeePayment[];
  onReceipt: (payment: FeePayment) => void;
  onReverse: (payment: FeePayment) => void;
  onRefund: (payment: FeePayment) => void;
}) {
  if (payments.length === 0) {
    return (
      <div className="p-8">
        <EmptyState icon={ReceiptText} heading="No receipts yet" headingUrdu="ابھی کوئی رسید نہیں" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>Receipt</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-end">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-end">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-mono text-xs">{payment.receiptNo}</TableCell>
            <TableCell className="text-xs">{formatDate(payment.receivedAt)}</TableCell>
            <TableCell className="text-xs capitalize">{payment.method}</TableCell>
            <TableCell className="text-end font-mono text-xs">{formatPKR(payment.amountPaisa)}</TableCell>
            <TableCell>
              <Badge variant={payment.status === "posted" ? "secondary" : "outline"}>{payment.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => onReceipt(payment)}>
                  <ReceiptText className="h-3.5 w-3.5" />
                  Receipt
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5" disabled={payment.status === "reversed"} onClick={() => onRefund(payment)}>
                  <Undo2 className="h-3.5 w-3.5" />
                  Refund
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5" disabled={payment.status === "reversed"} onClick={() => onReverse(payment)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reverse
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AdjustmentsTable({ ledger }: { ledger: FeeLedgerPayload | null }) {
  const adjustments = ledger?.adjustments ?? [];
  if (adjustments.length === 0) {
    return (
      <div className="p-8">
        <EmptyState icon={RotateCcw} heading="No adjustments" headingUrdu="کوئی تبدیلی نہیں" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adjustments.map((adjustment) => (
          <TableRow key={adjustment.id}>
            <TableCell className="text-xs">{formatDate(adjustment.createdAt)}</TableCell>
            <TableCell>
              <Badge variant="outline">{adjustment.type}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{adjustment.reason}</TableCell>
            <TableCell className="text-end font-mono text-xs">{formatPKR(adjustment.amountPaisa)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "positive" | "negative" | "warning";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 truncate font-mono text-xl font-semibold",
              tone === "positive" && "text-emerald-700 dark:text-emerald-300",
              tone === "negative" && "text-destructive",
              tone === "warning" && "text-amber-700 dark:text-amber-300",
            )}
          >
            {value}
          </p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
    </Card>
  );
}

function Mini({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("truncate font-mono text-sm font-semibold", alert && "text-destructive")}>{value}</p>
    </div>
  );
}

function summarizeStudents(students: FeeStudent[]) {
  return students.reduce(
    (summary, student) => ({
      totalChargedPaisa: summary.totalChargedPaisa + student.summary.totalChargedPaisa,
      totalConcessionPaisa: summary.totalConcessionPaisa + student.summary.totalConcessionPaisa,
      totalPaidPaisa: summary.totalPaidPaisa + student.summary.totalPaidPaisa,
      totalRefundedPaisa: summary.totalRefundedPaisa + student.summary.totalRefundedPaisa,
      totalReversedPaisa: summary.totalReversedPaisa + student.summary.totalReversedPaisa,
      outstandingPaisa: summary.outstandingPaisa + student.summary.outstandingPaisa,
    }),
    {
      totalChargedPaisa: 0,
      totalConcessionPaisa: 0,
      totalPaidPaisa: 0,
      totalRefundedPaisa: 0,
      totalReversedPaisa: 0,
      outstandingPaisa: 0,
    },
  );
}
