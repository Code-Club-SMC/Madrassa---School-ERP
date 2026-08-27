import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Banknote, Printer, ReceiptText, RotateCcw, Undo2, WalletCards } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatPKR, paisaToRupees, rupeesToPaisa } from "@/lib/formatters";
import { cn } from "@/lib/utils";
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
      className="sm:max-w-xl"
    >
      <div className="space-y-6 p-2">
        {/* Student Info Banner */}
        {student && (
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-transparent p-4">
            <p className="font-urdu text-lg font-semibold">{student.nameUrdu}</p>
            <p className="text-sm text-muted-foreground">
              {student.name} · {student.rollNo} · {student.groupLabel ?? student.institutionName}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Charge Type">
            <Select value={type} onValueChange={(value) => setType(value as FeeChargeType)}>
              <SelectTrigger className="h-10">
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
          
          <Field label="Amount (PKR)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="pl-10 h-10 font-mono"
              />
            </div>
          </Field>
          
          <Field label="Label" className="sm:col-span-2">
            <Input 
              value={label} 
              onChange={(event) => setLabel(event.target.value)} 
              placeholder="e.g., July monthly fee" 
              className="h-10"
            />
          </Field>
          
          <Field label="Period">
            <Input 
              type="month"
              value={period} 
              onChange={(event) => setPeriod(event.target.value)} 
              className="h-10"
            />
          </Field>
          
          <Field label="Due Date">
            <Input 
              type="date" 
              value={dueDate} 
              onChange={(event) => setDueDate(event.target.value)} 
              className="h-10"
            />
          </Field>

          {collectNow && (
            <>
              <div className="sm:col-span-2">
                <div className="rounded-lg border-2 border-dashed p-4">
                  <p className="mb-3 text-sm font-semibold text-muted-foreground">Payment Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Payment Method">
                      <PaymentMethodSelect value={method} onChange={setMethod} />
                    </Field>
                    <Field label="Payer Phone">
                      <Input 
                        value={payerPhone} 
                        onChange={(event) => setPayerPhone(event.target.value)} 
                        className="h-10"
                        placeholder="03XX-XXXXXXX"
                      />
                    </Field>
                    <Field label="Payer Name" className="sm:col-span-2">
                      <Input 
                        value={payerName} 
                        onChange={(event) => setPayerName(event.target.value)} 
                        className="h-10"
                        placeholder="Full name of payer"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <Field label="Notes" className="sm:col-span-2">
            <Textarea 
              rows={3} 
              value={notes} 
              onChange={(event) => setNotes(event.target.value)} 
              placeholder="Any additional notes..."
            />
          </Field>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancel
        </Button>
        <Button 
          onClick={save} 
          disabled={!student || pending}
          className="gap-2"
        >
          {pending ? (
            <>
              <span className="animate-spin">⏳</span>
              Saving...
            </>
          ) : collectNow ? (
            <>
              <WalletCards className="h-4 w-4" />
              Charge & Collect
            </>
          ) : (
            <>
              <Banknote className="h-4 w-4" />
              Create Charge
            </>
          )}
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
    [ledger?.charges],
  );
  const [amountByCharge, setAmountByCharge] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<FeePaymentMethod>("cash");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || !ledger) return;
    const charges = ledger.charges.filter(c => c.ledger.balancePaisa > 0 && c.status !== "reversed");
    setAmountByCharge(
      Object.fromEntries(
        charges.map((charge) => [charge.id, String(paisaToRupees(charge.ledger.balancePaisa))]),
      ),
    );
    setMethod("cash");
    setPayerName(ledger.student.guardianName ?? "");
    setPayerPhone(ledger.student.guardianPhone ?? "");
    setNotes("");
  }, [open, ledger?.id]);

  const totalPaisa = outstandingCharges.reduce((sum, charge) => {
    return sum + rupeesToPaisa(amountByCharge[charge.id] ?? "0");
  }, 0);

  const totalOutstanding = outstandingCharges.reduce((sum, charge) => {
    return sum + charge.ledger.balancePaisa;
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

  const fillFullOutstanding = () => {
    setAmountByCharge(
      Object.fromEntries(
        outstandingCharges.map((charge) => [charge.id, String(paisaToRupees(charge.ledger.balancePaisa))]),
      ),
    );
  };

  return (
    <ResponsiveDialog
      title="Collect Payment"
      description={ledger ? `Outstanding balance: ${formatPKR(ledger.summary.outstandingPaisa)}` : "Select a student before continuing."}
      open={open}
      onOpenChange={onOpenChange}
      icon={WalletCards}
      className="sm:max-w-2xl"
    >
      <div className="space-y-5 p-2">
        {/* Student Summary */}
        {ledger && (
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-urdu text-lg font-semibold">{ledger.student.nameUrdu}</p>
                <p className="text-sm text-muted-foreground">
                  {ledger.student.name} · {ledger.student.rollNo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="font-mono text-xl font-bold text-destructive">
                  {formatPKR(totalOutstanding)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Payment Method">
            <PaymentMethodSelect value={method} onChange={setMethod} />
          </Field>
          <Field label="Payer Name">
            <Input value={payerName} onChange={(event) => setPayerName(event.target.value)} className="h-10" />
          </Field>
          <Field label="Payer Phone">
            <Input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} className="h-10" />
          </Field>
        </div>

        {/* Charges Allocation */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm font-semibold">Allocate Payment</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fillFullOutstanding}
              className="h-7 text-xs"
            >
              Fill Full Outstanding
            </Button>
          </div>
          
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1fr_7rem_7rem] bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
              <span>Charge</span>
              <span className="text-end">Balance</span>
              <span className="text-end">Pay Now</span>
            </div>
            {outstandingCharges.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No outstanding charges.
              </p>
            ) : (
              outstandingCharges.map((charge, index) => (
                <div 
                  key={charge.id} 
                  className={cn(
                    "grid grid-cols-[1fr_7rem_7rem] items-center gap-2 border-t px-4 py-3",
                    index % 2 === 0 && "bg-muted/20"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{charge.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {charge.period ?? charge.type}
                      {charge.dueDate && ` · Due: ${formatDate(charge.dueDate)}`}
                    </p>
                  </div>
                  <p className="text-end font-mono text-xs">{formatPKR(charge.ledger.balancePaisa)}</p>
                  <Input
                    inputMode="decimal"
                    value={amountByCharge[charge.id] ?? ""}
                    onChange={(event) =>
                      setAmountByCharge((current) => ({ ...current, [charge.id]: event.target.value }))
                    }
                    className="h-9 text-end font-mono"
                    placeholder="0"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total */}
        <div className="rounded-lg bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Payment Total</span>
            <span className="font-mono text-2xl font-bold text-primary">
              {formatPKR(totalPaisa)}
            </span>
          </div>
        </div>

        <Field label="Notes">
          <Textarea 
            rows={2} 
            value={notes} 
            onChange={(event) => setNotes(event.target.value)} 
            placeholder="Any payment notes..."
          />
        </Field>
      </div>
      
      <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancel
        </Button>
        <Button 
          onClick={save} 
          disabled={!ledger || pending || totalPaisa <= 0}
          className="gap-2"
        >
          {pending ? (
            <>
              <span className="animate-spin">⏳</span>
              Collecting...
            </>
          ) : (
            <>
              <WalletCards className="h-4 w-4" />
              Collect Payment
            </>
          )}
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
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <RotateCcw className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">
            Reverse {target?.kind}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This action will post a reversal entry while keeping the original record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">{target?.label}</p>
          </div>
          <div className="space-y-2">
            <Label>Reason for Reversal</Label>
            <Textarea 
              rows={3} 
              value={reason} 
              onChange={(event) => setReason(event.target.value)} 
              placeholder="Enter a clear reason for this reversal..."
              className="resize-none"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirm} 
            disabled={pending || reason.trim().length < 3}
            className="gap-2 bg-destructive hover:bg-destructive/90"
          >
            {pending ? (
              <>
                <span className="animate-spin">⏳</span>
                Reversing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Confirm Reversal
              </>
            )}
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
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Undo2 className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center">Record Refund</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Refund against receipt {payment?.receiptNo}. The original payment remains in history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Amount</span>
              <span className="font-mono font-semibold">{formatPKR(payment?.amountPaisa ?? 0)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Receipt No.</span>
              <span className="font-mono">{payment?.receiptNo}</span>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Refund Amount">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
                <Input 
                  inputMode="decimal" 
                  value={amount} 
                  onChange={(event) => setAmount(event.target.value)} 
                  className="pl-10 font-mono"
                />
              </div>
            </Field>
            <Field label="Refund Method">
              <PaymentMethodSelect value={method} onChange={setMethod} />
            </Field>
            <Field label="Reason" className="sm:col-span-2">
              <Textarea 
                rows={3} 
                value={reason} 
                onChange={(event) => setReason(event.target.value)} 
                placeholder="Enter reason for refund..."
                className="resize-none"
              />
            </Field>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirm} 
            disabled={pending || reason.trim().length < 3}
            className="gap-2 bg-amber-600 hover:bg-amber-700"
          >
            {pending ? (
              <>
                <span className="animate-spin">⏳</span>
                Recording...
              </>
            ) : (
              <>
                <Undo2 className="h-4 w-4" />
                Confirm Refund
              </>
            )}
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
        <div className="p-2">
          <div className="print-target overflow-hidden rounded-lg border-2">
            {/* Receipt Header */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 text-center">
              <p className="font-urdu text-xl font-bold">{ledger.student.institutionNameUrdu}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {ledger.student.institutionName}
              </p>
              <div className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1">
                <p className="text-xs font-semibold text-primary">Official Fee Receipt</p>
              </div>
            </div>
            
            {/* Receipt Body */}
            <div className="space-y-3 p-5">
              <ReceiptRow label="Receipt No." value={payment.receiptNo} mono />
              <ReceiptRow label="Date" value={formatDate(payment.receivedAt)} />
              <Separator />
              <ReceiptRow label="Student" value={`${ledger.student.name} · ${ledger.student.nameUrdu}`} />
              <ReceiptRow label="Roll No." value={ledger.student.rollNo} mono />
              <ReceiptRow label="Class/Darja" value={ledger.student.groupLabel ?? "—"} />
              <ReceiptRow label="Payment Method" value={title(payment.method)} />
              <Separator />
              
              {/* Amount */}
              <div className="rounded-lg bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="mt-1 font-mono text-3xl font-bold text-primary">
                  {formatPKR(payment.amountPaisa)}
                </p>
              </div>
              
              {payment.payerName && (
                <ReceiptRow label="Paid By" value={payment.payerName} />
              )}
            </div>
            
            {/* Receipt Footer */}
            <div className="border-t bg-muted/20 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                This is a computer-generated receipt and does not require a signature.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-5 flex flex-col-reverse gap-2 print:hidden sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print Receipt
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
      <SelectTrigger className="h-10">
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
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-end font-medium", mono && "font-mono")}>{value}</span>
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

export function BulkCollectDialog({
  open,
  onOpenChange,
  students,
  onSuccess,
}: BaseDialogProps & {
  students: FeeStudent[];
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState<FeePaymentMethod>("cash");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod("cash");
    setReceivedAt(new Date().toISOString().slice(0, 10));
    setPayerName("");
    setPayerPhone("");
    setNotes("");
  }, [open]);

  const totalOutstanding = useMemo(
    () => students.reduce((sum, s) => sum + s.summary.outstandingPaisa, 0),
    [students],
  );

  const handleSubmit = async () => {
    if (students.length === 0) {
      toast.error("No students selected");
      return;
    }

    setPending(true);
    try {
      const promises = students.map((student) => {
        const allocations = student.summary.outstandingPaisa > 0
          ? [{ chargeId: "", amountPaisa: student.summary.outstandingPaisa }]
          : [];
        
        if (allocations.length === 0) return Promise.resolve();

        return collectPayment({
          studentId: student.id,
          allocations,
          method,
          receivedAt: receivedAt || undefined,
          payerName: payerName || undefined,
          payerPhone: payerPhone || undefined,
          notes: notes || undefined,
        });
      });

      await Promise.all(promises.filter(Boolean));
      toast.success(`Fee collected for ${students.length} student${students.length > 1 ? "s" : ""}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not collect fees");
    } finally {
      setPending(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Bulk Fee Collection"
      titleUrdu="کل فیس وصولی"
      description={`Collect fees for ${students.length} selected student${students.length > 1 ? "s" : ""}`}
      className="sm:max-w-lg"
    >
      <div className="space-y-4 py-4">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium">Selected Students</p>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between text-sm">
                <span className="font-urdu">{student.nameUrdu}</span>
                <span className="font-mono text-xs">
                  {formatPKR(student.summary.outstandingPaisa)}
                </span>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Total Outstanding</span>
            <span className="font-mono">{formatPKR(totalOutstanding)}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment Method">
            <Select value={method} onValueChange={(value) => setMethod(value as FeePaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>
                    {pm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Received Date">
            <Input
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Payer Name (optional)">
          <Input
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="Enter payer name"
          />
        </Field>

        <Field label="Payer Phone (optional)">
          <Input
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            placeholder="Enter phone number"
          />
        </Field>

        <Field label="Notes (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={2}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Collecting..." : `Collect ${formatPKR(totalOutstanding)}`}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}