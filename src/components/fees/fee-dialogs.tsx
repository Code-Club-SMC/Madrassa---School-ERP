import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Banknote, Printer, ReceiptText, RotateCcw, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatPKR, paisaToRupees, rupeesToPaisa } from "@/lib/formatters";
import {
  chargeAndCollect,
  collectPayment,
  createCharge,
  refundPayment,
  reverseCharge,
  reversePayment,
} from "./fee-api";
import type {
  FeeCharge,
  FeeChargeType,
  FeeLedgerPayload,
  FeePayment,
  FeePaymentMethod,
  FeeStudent,
} from "./fee-types";

type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const chargeTypes: Array<{ value: FeeChargeType; label: string }> = [
  { value: "monthly", label: "Monthly fee" },
  { value: "admission", label: "Admission fee" },
  { value: "exam", label: "Exam fee" },
  { value: "transport", label: "Transport fee" },
  { value: "custom", label: "Custom charge" },
];

const paymentMethods: Array<{ value: FeePaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "online", label: "Online" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export function ChargeDialog({
  open,
  onOpenChange,
  onSuccess,
  student,
  collectNow = false,
}: BaseDialogProps & {
  student: FeeStudent | null;
  collectNow?: boolean;
}) {
  const [type, setType] = useState<FeeChargeType>("monthly");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<FeePaymentMethod>("cash");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType("monthly");
    setLabel(collectNow ? "Fee charge and collection" : "Fee charge");
    setAmount("");
    setPeriod(new Date().toISOString().slice(0, 7));
    setDueDate("");
    setNotes("");
    setMethod("cash");
    setPayerName(student?.guardianName ?? "");
    setPayerPhone(student?.guardianPhone ?? "");
  }, [collectNow, open, student]);

  async function save() {
    if (!student) return;
    const amountPaisa = rupeesToPaisa(amount);
    if (!label.trim()) {
      toast.error("Charge label is required");
      return;
    }
    if (amountPaisa <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    setPending(true);
    try {
      const input = {
        studentId: student.id,
        type,
        label: label.trim(),
        amountPaisa,
        dueDate: dueDate || undefined,
        period: period || undefined,
        notes: notes.trim() || undefined,
      };

      if (collectNow) {
        await chargeAndCollect({
          ...input,
          method,
          payerName: payerName.trim() || undefined,
          payerPhone: payerPhone.trim() || undefined,
        });
        toast.success("Charge created and payment collected");
      } else {
        await createCharge(input);
        toast.success("Fee charge created");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save fee charge");
    } finally {
      setPending(false);
    }
  }

  return (
    <ResponsiveDialog
      title={collectNow ? "Charge + Collect Now" : "Create Fee Charge"}
      description={student ? `${student.rollNo} · ${student.name}` : "Select a student before continuing."}
      open={open}
      onOpenChange={onOpenChange}
      icon={collectNow ? WalletCards : Banknote}
    >
      <div className="grid gap-4 p-1 sm:grid-cols-2">
        <Field label="Type">
          <Select value={type} onValueChange={(value) => setType(value as FeeChargeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chargeTypes.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Amount">
          <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
        </Field>
        <Field label="Label" className="sm:col-span-2">
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="July monthly fee" />
        </Field>
        <Field label="Period">
          <Input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="2026-07" />
        </Field>
        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </Field>
        {collectNow && (
          <>
            <Field label="Payment method">
              <PaymentMethodSelect value={method} onChange={setMethod} />
            </Field>
            <Field label="Payer phone">
              <Input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} />
            </Field>
            <Field label="Payer name" className="sm:col-span-2">
              <Input value={payerName} onChange={(event) => setPayerName(event.target.value)} />
            </Field>
          </>
        )}
        <Field label="Notes" className="sm:col-span-2">
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!student || pending}>
          {pending ? "Saving..." : collectNow ? "Charge & Collect" : "Create Charge"}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}

export function CollectPaymentDialog({
  open,
  onOpenChange,
  onSuccess,
  ledger,
}: BaseDialogProps & {
  ledger: FeeLedgerPayload | null;
}) {
  const outstandingCharges = useMemo(
    () => ledger?.charges.filter((charge) => charge.ledger.balancePaisa > 0 && charge.status !== "reversed") ?? [],
    [ledger],
  );
  const [amountByCharge, setAmountByCharge] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<FeePaymentMethod>("cash");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || !ledger) return;
    setAmountByCharge(
      Object.fromEntries(
        outstandingCharges.map((charge) => [charge.id, String(paisaToRupees(charge.ledger.balancePaisa))]),
      ),
    );
    setMethod("cash");
    setPayerName(ledger.student.guardianName ?? "");
    setPayerPhone(ledger.student.guardianPhone ?? "");
    setNotes("");
  }, [ledger, open, outstandingCharges]);

  const totalPaisa = outstandingCharges.reduce((sum, charge) => {
    return sum + rupeesToPaisa(amountByCharge[charge.id] ?? "0");
  }, 0);

  async function save() {
    if (!ledger) return;
    const allocations = outstandingCharges
      .map((charge) => ({
        chargeId: charge.id,
        amountPaisa: rupeesToPaisa(amountByCharge[charge.id] ?? "0"),
        balancePaisa: charge.ledger.balancePaisa,
      }))
      .filter((allocation) => allocation.amountPaisa > 0);

    if (allocations.length === 0) {
      toast.error("Enter at least one payment amount");
      return;
    }
    if (allocations.some((allocation) => allocation.amountPaisa > allocation.balancePaisa)) {
      toast.error("Payment cannot exceed outstanding balance");
      return;
    }

    setPending(true);
    try {
      await collectPayment({
        studentId: ledger.student.id,
        allocations: allocations.map(({ chargeId, amountPaisa }) => ({ chargeId, amountPaisa })),
        method,
        payerName: payerName.trim() || undefined,
        payerPhone: payerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Payment collected");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not collect payment");
    } finally {
      setPending(false);
    }
  }

  return (
    <ResponsiveDialog
      title="Collect Payment"
      description={ledger ? `${ledger.student.rollNo} · Outstanding ${formatPKR(ledger.summary.outstandingPaisa)}` : "Select a student before continuing."}
      open={open}
      onOpenChange={onOpenChange}
      icon={WalletCards}
      className="sm:max-w-2xl"
    >
      <div className="space-y-4 p-1">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Method">
            <PaymentMethodSelect value={method} onChange={setMethod} />
          </Field>
          <Field label="Payer name">
            <Input value={payerName} onChange={(event) => setPayerName(event.target.value)} />
          </Field>
          <Field label="Payer phone">
            <Input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} />
          </Field>
        </div>

        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-[1fr_8rem_8rem] bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Charge</span>
            <span className="text-end">Balance</span>
            <span className="text-end">Pay now</span>
          </div>
          {outstandingCharges.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No outstanding charges.</p>
          ) : (
            outstandingCharges.map((charge) => (
              <div key={charge.id} className="grid grid-cols-[1fr_8rem_8rem] items-center gap-2 border-t px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{charge.label}</p>
                  <p className="text-[11px] text-muted-foreground">{charge.period ?? charge.type}</p>
                </div>
                <p className="text-end font-mono text-xs">{formatPKR(charge.ledger.balancePaisa)}</p>
                <Input
                  inputMode="decimal"
                  value={amountByCharge[charge.id] ?? ""}
                  onChange={(event) =>
                    setAmountByCharge((current) => ({ ...current, [charge.id]: event.target.value }))
                  }
                  className="h-8 text-end"
                />
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">Payment total</span>
          <span className="font-mono text-sm font-semibold">{formatPKR(totalPaisa)}</span>
        </div>

        <Field label="Notes">
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!ledger || pending || totalPaisa <= 0}>
          {pending ? "Collecting..." : "Collect Payment"}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}

export function ReverseDialog({
  target,
  onOpenChange,
  onSuccess,
}: {
  target: { kind: "charge" | "payment"; id: string; label: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (target) setReason("");
  }, [target]);

  async function confirm() {
    if (!target || !reason.trim()) return;
    setPending(true);
    try {
      if (target.kind === "charge") await reverseCharge(target.id, reason.trim());
      else await reversePayment(target.id, reason.trim());
      toast.success(target.kind === "charge" ? "Charge reversed" : "Payment reversed");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reverse record");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={!!target} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reverse {target?.kind}</AlertDialogTitle>
          <AlertDialogDescription>
            This keeps the original record and posts a reversal entry. Enter a reason before continuing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">{target?.label}</p>
          <Label>Reason</Label>
          <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={pending || reason.trim().length < 3}>
            {pending ? "Reversing..." : "Confirm Reversal"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RefundDialog({
  payment,
  onOpenChange,
  onSuccess,
}: {
  payment: FeePayment | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<FeePaymentMethod>("cash");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!payment) return;
    setAmount(String(paisaToRupees(payment.amountPaisa)));
    setMethod(payment.method);
    setReason("");
  }, [payment]);

  async function confirm() {
    if (!payment) return;
    const amountPaisa = rupeesToPaisa(amount);
    if (amountPaisa <= 0 || amountPaisa > payment.amountPaisa) {
      toast.error("Refund amount is invalid");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Reason is required");
      return;
    }

    setPending(true);
    try {
      await refundPayment(payment.id, { amountPaisa, method, reason: reason.trim() });
      toast.success("Refund recorded");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record refund");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={!!payment} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Record refund</AlertDialogTitle>
          <AlertDialogDescription>
            This records a refund against receipt {payment?.receiptNo}. The original payment remains in history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount">
            <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>
          <Field label="Method">
            <PaymentMethodSelect value={method} onChange={setMethod} />
          </Field>
          <Field label="Reason" className="sm:col-span-2">
            <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={pending || reason.trim().length < 3}>
            {pending ? "Recording..." : "Confirm Refund"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FeeReceiptDialog({
  payment,
  ledger,
  onOpenChange,
}: {
  payment: FeePayment | null;
  ledger: FeeLedgerPayload | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveDialog
      title="Fee Receipt"
      description={payment ? payment.receiptNo : "Payment receipt"}
      open={!!payment}
      onOpenChange={onOpenChange}
      icon={ReceiptText}
      className="sm:max-w-md"
    >
      {payment && ledger && (
        <div className="print-target space-y-4 rounded-md border p-5">
          <div className="border-b pb-3 text-center">
            <p className="font-urdu text-lg font-bold">{ledger.student.institutionNameUrdu}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {ledger.student.institutionName}
            </p>
          </div>
          <ReceiptRow label="Receipt No." value={payment.receiptNo} mono />
          <ReceiptRow label="Date" value={formatDate(payment.receivedAt)} />
          <ReceiptRow label="Student" value={`${ledger.student.name} · ${ledger.student.nameUrdu}`} />
          <ReceiptRow label="Roll No." value={ledger.student.rollNo} mono />
          <ReceiptRow label="Class/Darja" value={ledger.student.groupLabel ?? "—"} />
          <ReceiptRow label="Method" value={title(payment.method)} />
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount paid</span>
              <span className="font-mono text-2xl font-semibold">{formatPKR(payment.amountPaisa)}</span>
            </div>
          </div>
        </div>
      )}
      <div className="mt-5 flex flex-col-reverse gap-2 print:hidden sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
    </ResponsiveDialog>
  );
}

function PaymentMethodSelect({
  value,
  onChange,
}: {
  value: FeePaymentMethod;
  onChange: (value: FeePaymentMethod) => void;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as FeePaymentMethod)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {paymentMethods.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : "text-end"}>{value}</span>
    </div>
  );
}

function title(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function chargeCanBeReversed(charge: FeeCharge) {
  return charge.status !== "reversed" && charge.ledger.paidPaisa === 0;
}
