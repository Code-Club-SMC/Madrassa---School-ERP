import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Calendar,
  CalendarCheck,
  Check,
  CheckSquare,
  Clock,
  CreditCard,
  Loader2,
  Printer,
  ReceiptText,
  RotateCcw,
  Sparkles,
  Undo2,
  User,
  Users,
  WalletCards,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useLanguage } from "@/components/language-context";
import {
  chargeAndCollect,
  collectCollectivePayment,
  collectPayment,
  createCharge,
  refundPayment,
  reverseCharge,
  reversePayment,
} from "./fee-api";
import type {
  AdvanceMonthOption,
  FeeCharge,
  FeeChargeType,
  FeeLedgerPayload,
  FeePayment,
  FeePaymentMethod,
  FeeStudent,
  SiblingFeeInfo,
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

      setAmount("");
      setLabel("");
      setNotes("");
      setDueDate("");
      setPeriod("");
      setPayerName("");
      setPayerPhone("");
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
              <Loader2 className="h-4 w-4 animate-spin" />
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

export type CollectiveReceiptData = {
  payerName?: string;
  payerPhone?: string;
  method: FeePaymentMethod;
  receivedAt: string;
  totalAmountPaisa: number;
  receiptNos: string[];
  students: Array<{
    name: string;
    nameUrdu: string;
    rollNo: string;
    classOrDarja: string;
    institutionName: string;
    receiptNo: string;
    amountPaisa: number;
    items: Array<{ label: string; period?: string; amountPaisa: number }>;
  }>;
};

export function CollectPaymentDialog({
  open,
  onOpenChange,
  onSuccess,
  ledger,
}: BaseDialogProps & {
  ledger: FeeLedgerPayload | null;
}) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const primaryStudent = ledger?.student;
  const siblings = useMemo(() => ledger?.siblings ?? [], [ledger?.siblings]);
  const hasSiblings = siblings.length > 0;

  // Track which students are included in this collective payment
  const [includedStudentIds, setIncludedStudentIds] = useState<Set<string>>(new Set());

  // Track payment amounts allocated to outstanding charges (chargeId -> amount string in rupees)
  const [amountByCharge, setAmountByCharge] = useState<Record<string, string>>({});

  // Track selected advance months per student (studentId -> Set of period strings e.g. "2026-11")
  const [selectedAdvanceMonths, setSelectedAdvanceMonths] = useState<Record<string, Set<string>>>({});

  const [method, setMethod] = useState<FeePaymentMethod>("cash");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  // Completed receipt data for modal preview
  const [receiptData, setReceiptData] = useState<CollectiveReceiptData | null>(null);

  // Initialize form state when ledger or dialog opens
  useEffect(() => {
    if (!open || !ledger || !primaryStudent) return;

    // Include primary student + all siblings by default
    const initialIncluded = new Set<string>([primaryStudent.id, ...siblings.map((s) => s.id)]);
    setIncludedStudentIds(initialIncluded);

    // Collect all outstanding charges across primary student and siblings
    const initialAmounts: Record<string, string> = {};
    const primaryCharges = ledger.charges.filter(
      (c) => c.ledger.balancePaisa > 0 && c.status !== "reversed",
    );
    for (const c of primaryCharges) {
      initialAmounts[c.id] = String(paisaToRupees(c.ledger.balancePaisa));
    }
    for (const sib of siblings) {
      for (const c of sib.outstandingCharges) {
        initialAmounts[c.id] = String(paisaToRupees(c.ledger.balancePaisa));
      }
    }
    setAmountByCharge(initialAmounts);

    setSelectedAdvanceMonths({});
    setMethod("cash");
    setPayerName(ledger.student.guardianName ?? "");
    setPayerPhone(ledger.student.guardianPhone ?? "");
    setNotes("");
  }, [open, ledger, primaryStudent?.id]);

  // Primary student outstanding charges
  const primaryOutstandingCharges = useMemo(
    () => ledger?.charges.filter((c) => c.ledger.balancePaisa > 0 && c.status !== "reversed") ?? [],
    [ledger?.charges],
  );

  // Toggle student inclusion
  const toggleStudentInclusion = (studentId: string) => {
    setIncludedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Toggle advance month selection for a student
  const toggleAdvanceMonth = (studentId: string, period: string) => {
    setSelectedAdvanceMonths((prev) => {
      const currentSet = new Set(prev[studentId] ?? []);
      if (currentSet.has(period)) {
        currentSet.delete(period);
      } else {
        currentSet.add(period);
      }
      return { ...prev, [studentId]: currentSet };
    });
  };

  // Select all remaining advance months for a student
  const selectAllAdvance = (studentId: string, months: AdvanceMonthOption[]) => {
    setSelectedAdvanceMonths((prev) => ({
      ...prev,
      [studentId]: new Set(months.map((m) => m.period)),
    }));
  };

  // Clear advance months for a student
  const clearAdvance = (studentId: string) => {
    setSelectedAdvanceMonths((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  // Calculate totals per student
  const getStudentTotals = (
    studentId: string,
    charges: FeeCharge[],
    advanceMonths: AdvanceMonthOption[],
  ) => {
    const outstandingPaisa = charges.reduce((sum, c) => {
      const entered = rupeesToPaisa(amountByCharge[c.id] ?? "0");
      return sum + entered;
    }, 0);

    const selectedPeriods = selectedAdvanceMonths[studentId] ?? new Set();
    const advancePaisa = advanceMonths
      .filter((m) => selectedPeriods.has(m.period))
      .reduce((sum, m) => sum + m.amountPaisa, 0);

    return {
      outstandingPaisa,
      advancePaisa,
      totalPaisa: outstandingPaisa + advancePaisa,
      selectedAdvanceCount: selectedPeriods.size,
    };
  };

  // Primary student totals
  const primaryTotals = useMemo(() => {
    if (!primaryStudent) return { outstandingPaisa: 0, advancePaisa: 0, totalPaisa: 0, selectedAdvanceCount: 0 };
    return getStudentTotals(
      primaryStudent.id,
      primaryOutstandingCharges,
      ledger?.advanceMonths ?? [],
    );
  }, [primaryStudent?.id, primaryOutstandingCharges, ledger?.advanceMonths, amountByCharge, selectedAdvanceMonths]);

  // Grand total calculation across all included students
  const grandTotalPaisa = useMemo(() => {
    let grand = 0;
    if (primaryStudent && includedStudentIds.has(primaryStudent.id)) {
      grand += primaryTotals.totalPaisa;
    }
    for (const sib of siblings) {
      if (includedStudentIds.has(sib.id)) {
        const sibTotals = getStudentTotals(sib.id, sib.outstandingCharges, sib.advanceMonths);
        grand += sibTotals.totalPaisa;
      }
    }
    return grand;
  }, [primaryStudent?.id, primaryTotals, siblings, includedStudentIds, amountByCharge, selectedAdvanceMonths]);

  const activeStudentsCount = useMemo(() => {
    let count = 0;
    if (primaryStudent && includedStudentIds.has(primaryStudent.id)) count++;
    for (const sib of siblings) {
      if (includedStudentIds.has(sib.id)) count++;
    }
    return count;
  }, [primaryStudent?.id, siblings, includedStudentIds]);

  // Fill full outstanding dues for a student
  const fillStudentFullDues = (charges: FeeCharge[]) => {
    setAmountByCharge((prev) => {
      const next = { ...prev };
      for (const c of charges) {
        next[c.id] = String(paisaToRupees(c.ledger.balancePaisa));
      }
      return next;
    });
  };

  // Clear outstanding dues for a student
  const clearStudentDues = (charges: FeeCharge[]) => {
    setAmountByCharge((prev) => {
      const next = { ...prev };
      for (const c of charges) {
        next[c.id] = "0";
      }
      return next;
    });
  };

  // Submit collective payment
  async function save() {
    if (!ledger || !primaryStudent) return;

    const studentsPayload: Array<{
      studentId: string;
      allocations: Array<{ chargeId: string; amountPaisa: number }>;
      advanceMonths: Array<{ period: string; label: string; amountPaisa: number }>;
    }> = [];

    // 1. Primary Student
    if (includedStudentIds.has(primaryStudent.id)) {
      const allocations = primaryOutstandingCharges
        .map((c) => ({
          chargeId: c.id,
          amountPaisa: rupeesToPaisa(amountByCharge[c.id] ?? "0"),
          balancePaisa: c.ledger.balancePaisa,
        }))
        .filter((a) => a.amountPaisa > 0);

      if (allocations.some((a) => a.amountPaisa > a.balancePaisa)) {
        toast.error(`Payment for ${primaryStudent.name} cannot exceed outstanding balance`);
        return;
      }

      const primaryAdvSelected = selectedAdvanceMonths[primaryStudent.id] ?? new Set();
      const advMonths = (ledger.advanceMonths ?? [])
        .filter((m) => primaryAdvSelected.has(m.period))
        .map((m) => ({
          period: m.period,
          label: `Monthly Tuition Fee - ${m.labelEn}`,
          amountPaisa: m.amountPaisa,
        }));

      if (allocations.length > 0 || advMonths.length > 0) {
        studentsPayload.push({
          studentId: primaryStudent.id,
          allocations: allocations.map(({ chargeId, amountPaisa }) => ({ chargeId, amountPaisa })),
          advanceMonths: advMonths,
        });
      }
    }

    // 2. Siblings
    for (const sib of siblings) {
      if (!includedStudentIds.has(sib.id)) continue;

      const allocations = sib.outstandingCharges
        .map((c) => ({
          chargeId: c.id,
          amountPaisa: rupeesToPaisa(amountByCharge[c.id] ?? "0"),
          balancePaisa: c.ledger.balancePaisa,
        }))
        .filter((a) => a.amountPaisa > 0);

      if (allocations.some((a) => a.amountPaisa > a.balancePaisa)) {
        toast.error(`Payment for ${sib.name} cannot exceed outstanding balance`);
        return;
      }

      const sibAdvSelected = selectedAdvanceMonths[sib.id] ?? new Set();
      const advMonths = sib.advanceMonths
        .filter((m) => sibAdvSelected.has(m.period))
        .map((m) => ({
          period: m.period,
          label: `Monthly Tuition Fee - ${m.labelEn}`,
          amountPaisa: m.amountPaisa,
        }));

      if (allocations.length > 0 || advMonths.length > 0) {
        studentsPayload.push({
          studentId: sib.id,
          allocations: allocations.map(({ chargeId, amountPaisa }) => ({ chargeId, amountPaisa })),
          advanceMonths: advMonths,
        });
      }
    }

    if (studentsPayload.length === 0) {
      toast.error(
        isUrdu
          ? "براہ کرم فیس ادا کرنے کے لیے بقایا رقم درج کریں یا پیشگی مہینے منتخب کریں۔"
          : "Please enter an amount or select advance months to collect.",
      );
      return;
    }

    setPending(true);
    try {
      const res = await collectCollectivePayment({
        method,
        payerName: payerName.trim() || undefined,
        payerPhone: payerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        students: studentsPayload,
      });

      toast.success(
        isUrdu
          ? `فیس کامیابی سے وصول ہو گئی۔ کل وصولی: ${formatPKR(res.totalAmountPaisa)}`
          : `Fee payment collected successfully. Total: ${formatPKR(res.totalAmountPaisa)}`,
      );

      // Build structured receipt data
      const receiptBreakdowns = res.results.map((r) => {
        const isPrim = r.studentId === primaryStudent.id;
        const st = isPrim ? primaryStudent : siblings.find((s) => s.id === r.studentId);
        const studentInput = studentsPayload.find((s) => s.studentId === r.studentId);

        const items: Array<{ label: string; period?: string; amountPaisa: number }> = [];
        if (studentInput) {
          studentInput.allocations.forEach((a) => {
            const chargeObj = isPrim
              ? primaryOutstandingCharges.find((c) => c.id === a.chargeId)
              : siblings.find((s) => s.id === r.studentId)?.outstandingCharges.find((c) => c.id === a.chargeId);
            items.push({
              label: chargeObj?.label ?? "Tuition Fee Dues",
              period: chargeObj?.period ?? undefined,
              amountPaisa: a.amountPaisa,
            });
          });
          studentInput.advanceMonths.forEach((adv) => {
            items.push({
              label: adv.label,
              period: adv.period,
              amountPaisa: adv.amountPaisa,
            });
          });
        }

        return {
          name: st?.name ?? r.studentName ?? "Student",
          nameUrdu: st?.nameUrdu ?? r.studentNameUrdu ?? "",
          rollNo: st?.rollNo ?? r.rollNo ?? "—",
          classOrDarja: (st as any)?.groupLabel ?? "—",
          institutionName: (st as any)?.institutionName ?? "Al-Qasim / Jamia",
          receiptNo: r.receiptNo,
          amountPaisa: r.amountPaisa,
          items,
        };
      });

      setReceiptData({
        payerName: payerName.trim() || undefined,
        payerPhone: payerPhone.trim() || undefined,
        method,
        receivedAt: new Date().toISOString(),
        totalAmountPaisa: res.totalAmountPaisa,
        receiptNos: res.receiptNos,
        students: receiptBreakdowns,
      });

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not collect fee payment");
    } finally {
      setPending(false);
    }
  }

  // Render an individual person's fee collection section
  const renderStudentSection = (
    student: {
      id: string;
      name: string;
      nameUrdu: string;
      rollNo: string;
      groupLabel: string | null;
      institutionName: string;
      institutionNameUrdu?: string;
      system: string;
      monthlyFee: number;
      monthlyFeePaisa: number;
    },
    outstandingCharges: FeeCharge[],
    advanceMonths: AdvanceMonthOption[],
    isSibling: boolean,
  ) => {
    const isIncluded = includedStudentIds.has(student.id);
    const totals = getStudentTotals(student.id, outstandingCharges, advanceMonths);
    const selectedPeriods = selectedAdvanceMonths[student.id] ?? new Set();

    return (
      <div
        key={student.id}
        className={cn(
          "rounded-xl border-2 transition-all duration-200 overflow-hidden",
          isIncluded
            ? "border-primary/40 bg-card shadow-sm"
            : "border-border/60 bg-muted/20 opacity-70",
        )}
      >
        {/* Person Header */}
        <div
          className={cn(
            "p-4 border-b flex flex-wrap items-center justify-between gap-3",
            isIncluded ? "bg-muted/40" : "bg-muted/10",
          )}
        >
          <div className="flex items-center gap-3">
            {isSibling ? (
              <Checkbox
                id={`include-${student.id}`}
                checked={isIncluded}
                onCheckedChange={() => toggleStudentInclusion(student.id)}
                className="h-5 w-5"
              />
            ) : (
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-urdu font-bold text-base">{student.nameUrdu}</span>
                <span className="text-sm font-medium text-foreground">({student.name})</span>
                {isSibling ? (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    {isUrdu ? "بھائی / بہن" : "Sibling"}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    {isUrdu ? "مرکزی طالب علم" : "Primary Student"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {student.rollNo} · {student.groupLabel ?? "Class"} · {student.institutionName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-end">
              <span className="text-[11px] text-muted-foreground block">{isUrdu ? "ماہانہ فیس" : "Monthly Fee"}</span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {formatPKR(student.monthlyFeePaisa)}
              </span>
            </div>
            {isSibling && (
              <Label
                htmlFor={`include-${student.id}`}
                className="cursor-pointer text-xs text-muted-foreground select-none"
              >
                {isIncluded ? (isUrdu ? "شامل ہے" : "Included") : (isUrdu ? "شامل نہیں" : "Excluded")}
              </Label>
            )}
          </div>
        </div>

        {/* Person Body (shown only when student is included) */}
        {isIncluded && (
          <div className="p-4 space-y-5">
            {/* 1. Outstanding Dues Sub-section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isUrdu ? "واجب الادا فیس / سابقہ بقایا جات" : "Outstanding Dues / Overdue"}
                  </span>
                </div>
                {outstandingCharges.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fillStudentFullDues(outstandingCharges)}
                      className="h-6 text-[11px] px-2"
                    >
                      {isUrdu ? "تمام ادا کریں" : "Full Dues"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => clearStudentDues(outstandingCharges)}
                      className="h-6 text-[11px] px-2 text-muted-foreground"
                    >
                      {isUrdu ? "صفر کریں" : "Clear"}
                    </Button>
                  </div>
                )}
              </div>

              {outstandingCharges.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground bg-muted/10">
                  <Check className="h-4 w-4 inline-block me-1 text-emerald-500" />
                  {isUrdu ? "کوئی بقایا فیس نہیں ہے۔" : "No outstanding overdue charges."}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <div className="grid grid-cols-[1fr_6rem_6.5rem] bg-muted/50 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                    <span>{isUrdu ? "تفصیل" : "Charge"}</span>
                    <span className="text-end">{isUrdu ? "بقایا" : "Balance"}</span>
                    <span className="text-end">{isUrdu ? "وصولی رقم" : "Pay Amount"}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {outstandingCharges.map((charge) => (
                      <div
                        key={charge.id}
                        className="grid grid-cols-[1fr_6rem_6.5rem] items-center gap-2 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{charge.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {charge.period ?? charge.type}
                            {charge.dueDate && ` · Due: ${formatDate(charge.dueDate)}`}
                          </p>
                        </div>
                        <p className="text-end font-mono text-xs text-destructive">
                          {formatPKR(charge.ledger.balancePaisa)}
                        </p>
                        <Input
                          inputMode="decimal"
                          value={amountByCharge[charge.id] ?? ""}
                          onChange={(e) =>
                            setAmountByCharge((cur) => ({ ...cur, [charge.id]: e.target.value }))
                          }
                          className="h-8 text-end font-mono text-xs"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Pay in Advance (Remaining Months of Session) Sub-section */}
            <div className="rounded-lg border bg-muted/15 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {isUrdu ? "پیشگی فیس کی وصولی (باقی ماندہ مہینے)" : "Pay in Advance (Remaining Session Months)"}
                  </span>
                </div>
                {advanceMonths.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllAdvance(student.id, advanceMonths)}
                      className="h-6 text-[10px] px-2"
                    >
                      {isUrdu ? "تمام باقی مہینے" : "Select All Remaining"}
                    </Button>
                    {selectedPeriods.size > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAdvance(student.id)}
                        className="h-6 text-[10px] px-2 text-muted-foreground"
                      >
                        {isUrdu ? "ختم کریں" : "Clear"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {advanceMonths.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {isUrdu
                    ? "اس سیشن کے تمام مہینوں کی فیس پہلے ہی درج کی جا چکی ہے۔"
                    : "All months for this academic session have already been generated/paid."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {advanceMonths.map((month) => {
                    const isSelected = selectedPeriods.has(month.period);
                    return (
                      <button
                        type="button"
                        key={month.period}
                        onClick={() => toggleAdvanceMonth(student.id, month.period)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-lg border text-start transition-all duration-150",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/30"
                            : "border-border/80 bg-background hover:bg-muted/50 text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="truncate">
                            <span className="block text-xs font-semibold truncate font-urdu">
                              {month.labelUrdu}
                            </span>
                            <span className="block text-[10px] text-muted-foreground truncate">
                              {month.labelEn}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-semibold shrink-0 ms-2">
                          {formatPKR(month.amountPaisa)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Person Subtotal Bar */}
            <div className="rounded-lg bg-muted/40 p-3 flex flex-wrap items-center justify-between border">
              <span className="text-xs text-muted-foreground font-medium">
                {isUrdu ? `${student.name} کا میزان:` : `Subtotal for ${student.name}:`}
                <span className="ms-1.5 text-[11px] opacity-80">
                  ({isUrdu ? "بقایا جات" : "Dues"}: {formatPKR(totals.outstandingPaisa)} + {isUrdu ? "پیشگی" : "Advance"}: {formatPKR(totals.advancePaisa)})
                </span>
              </span>
              <span className="font-mono text-base font-bold text-foreground">
                {formatPKR(totals.totalPaisa)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ResponsiveDialog
        title={
          hasSiblings
            ? isUrdu
              ? "مشترکہ فیس وصولی (بہن بھائی)"
              : "Family Collective Fee Collection"
            : isUrdu
              ? "فیس وصولی"
              : "Collect Fee Payment"
        }
        description={
          hasSiblings && ledger?.guardianCnic
            ? isUrdu
              ? `والد شناختی کارڈ: ${ledger.guardianCnic} · ${activeStudentsCount} طلبہ شامل ہیں`
              : `Father CNIC: ${ledger.guardianCnic} · ${activeStudentsCount} student(s) included`
            : primaryStudent
              ? `${primaryStudent.rollNo} · ${primaryStudent.name}`
              : "Select student"
        }
        open={open}
        onOpenChange={onOpenChange}
        icon={hasSiblings ? Users : WalletCards}
        className="sm:max-w-3xl"
      >
        <div className="space-y-6 p-2 max-h-[75vh] overflow-y-auto pr-1">
          {/* Family Banner if siblings exist */}
          {hasSiblings && (
            <div className="rounded-xl bg-gradient-to-r from-primary/15 via-emerald-500/10 to-transparent p-4 border border-primary/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {isUrdu ? "خاندانی مشترکہ فیس وصولی" : "Sibling Collective Payment Mode"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isUrdu ? "والد / سرپرست شناختی کارڈ:" : "Father / Guardian CNIC:"}{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {ledger?.guardianCnic || primaryStudent?.guardianCnic || "—"}
                    </span>
                    {primaryStudent?.guardianName && ` · ${primaryStudent.guardianName}`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-card border-primary/40 font-mono">
                {siblings.length + 1} {isUrdu ? "بہن بھائی دستیاب" : "Siblings in System"}
              </Badge>
            </div>
          )}

          {/* Person-by-Person Fee Sections */}
          <div className="space-y-4">
            {/* Primary Student Section */}
            {primaryStudent &&
              renderStudentSection(
                primaryStudent,
                primaryOutstandingCharges,
                ledger?.advanceMonths ?? [],
                false,
              )}

            {/* Sibling Sections */}
            {siblings.map((sib) =>
              renderStudentSection(
                sib,
                sib.outstandingCharges,
                sib.advanceMonths,
                true,
              ),
            )}
          </div>

          {/* Grand Total Highlight Banner */}
          <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {isUrdu ? "کل واجب الادا فیس (تمام طلبہ)" : "Total Collective Fee (All Persons)"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeStudentsCount} {isUrdu ? "طلبہ شامل ہیں" : "student(s) selected"}
                </p>
              </div>
              <div className="text-end">
                <p className="font-mono text-3xl font-extrabold text-primary">
                  {formatPKR(grandTotalPaisa)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details Inputs */}
          <div className="grid gap-4 sm:grid-cols-3 pt-1">
            <Field label={isUrdu ? "ادائیگی کا طریقہ" : "Payment Method"}>
              <PaymentMethodSelect value={method} onChange={setMethod} />
            </Field>
            <Field label={isUrdu ? "ادا کنندہ کا نام" : "Payer Name"}>
              <Input
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Full name"
                className="h-10"
              />
            </Field>
            <Field label={isUrdu ? "فون نمبر" : "Payer Phone"}>
              <Input
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                className="h-10"
              />
            </Field>
          </div>

          <Field label={isUrdu ? "اضافی نوٹس" : "Notes"}>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isUrdu ? "کوئی ضروری وضاحت یا حوالہ..." : "Any payment notes or reference..."}
            />
          </Field>
        </div>

        {/* Modal Actions */}
        <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {isUrdu ? "منسوخ کریں" : "Cancel"}
          </Button>
          <Button
            onClick={save}
            disabled={!ledger || pending || grandTotalPaisa <= 0}
            className="gap-2 px-6"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUrdu ? "فیس وصول ہو رہی ہے..." : "Collecting..."}
              </>
            ) : (
              <>
                <WalletCards className="h-4 w-4" />
                {isUrdu
                  ? `فیس وصول کریں (${formatPKR(grandTotalPaisa)})`
                  : `Collect Fee (${formatPKR(grandTotalPaisa)})`}
              </>
            )}
          </Button>
        </div>
      </ResponsiveDialog>

      {/* Collective Receipt Dialog */}
      <CollectiveReceiptDialog
        data={receiptData}
        onOpenChange={(open) => {
          if (!open) {
            setReceiptData(null);
            onOpenChange(false);
          }
        }}
      />
    </>
  );
}

export function CollectiveReceiptDialog({
  data,
  onOpenChange,
}: {
  data: CollectiveReceiptData | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  return (
    <ResponsiveDialog
      title={isUrdu ? "فیس وصولی رسید" : "Official Fee Receipt"}
      description={data ? data.receiptNos.join(", ") : "Payment receipt"}
      open={!!data}
      onOpenChange={onOpenChange}
      icon={ReceiptText}
      className="sm:max-w-xl"
    >
      {data && (
        <div className="p-2 space-y-4">
          <div className="print-target overflow-hidden rounded-xl border-2 bg-card">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/15 to-transparent p-5 text-center border-b">
              <p className="font-urdu text-xl font-bold">جامعہ قاسمیہ / القاسم اکیڈمی</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">
                Al-Qasim Academy & Jamia Qasimia
              </p>
              <div className="mt-2.5 inline-block rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1">
                <p className="text-xs font-semibold text-primary">
                  {data.students.length > 1 ? "Family Collective Fee Receipt" : "Official Fee Receipt"}
                </p>
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">{isUrdu ? "رسید نمبر:" : "Receipt No(s):"}</span>
                  <span className="font-mono font-bold text-foreground">{data.receiptNos.join(", ")}</span>
                </div>
                <div className="text-end">
                  <span className="text-muted-foreground block">{isUrdu ? "تاریخ:" : "Date:"}</span>
                  <span className="font-medium text-foreground">{formatDate(data.receivedAt)}</span>
                </div>
              </div>

              {data.payerName && (
                <div className="rounded-md bg-muted/30 p-2.5 text-xs flex justify-between">
                  <span className="text-muted-foreground">{isUrdu ? "ادا کنندہ / ولی:" : "Paid By:"}</span>
                  <span className="font-semibold text-foreground">
                    {data.payerName} {data.payerPhone && `(${data.payerPhone})`}
                  </span>
                </div>
              )}

              <Separator />

              {/* Per-Child Section Breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isUrdu ? "طلبہ و فیس کی تفصیل" : "Students & Fee Breakdown"}
                </p>

                {data.students.map((st, idx) => (
                  <div key={idx} className="rounded-lg border p-3 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <div>
                        <span className="font-urdu font-bold text-sm">{st.nameUrdu}</span>
                        <span className="text-xs text-muted-foreground ms-1.5">({st.name})</span>
                      </div>
                      <span className="text-xs font-mono font-semibold">{st.receiptNo}</span>
                    </div>

                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>
                        {st.rollNo} · {st.classOrDarja}
                      </span>
                      <span>{st.institutionName}</span>
                    </div>

                    {st.items.length > 0 && (
                      <div className="pt-1 space-y-1">
                        {st.items.map((it, itIdx) => (
                          <div key={itIdx} className="flex justify-between text-xs font-mono text-muted-foreground">
                            <span className="text-[11px] truncate max-w-[240px]">{it.label}</span>
                            <span>{formatPKR(it.amountPaisa)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between pt-1 border-t text-xs font-bold">
                      <span>{isUrdu ? "اس طالب علم کی رقم:" : "Student Amount:"}</span>
                      <span className="font-mono text-primary">{formatPKR(st.amountPaisa)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Grand Total */}
              <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  {isUrdu ? "کل وصول شدہ رقم" : "Total Amount Received"}
                </p>
                <p className="mt-1 font-mono text-3xl font-extrabold text-primary">
                  {formatPKR(data.totalAmountPaisa)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 capitalize">
                  {isUrdu ? "طریقہ کار:" : "Method:"} {data.method}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-muted/20 p-3 text-center text-[10px] text-muted-foreground">
              {isUrdu
                ? "یہ کمپیوٹر سے جاری کردہ رسید ہے۔ اس پر کسی دستخط کی ضرورت نہیں۔"
                : "This is a computer-generated official receipt and requires no physical signature."}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col-reverse gap-2 print:hidden sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {isUrdu ? "بند کریں" : "Close"}
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          {isUrdu ? "رسید پرنٹ کریں" : "Print Receipt"}
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
      setReason("");
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
                <Loader2 className="h-4 w-4 animate-spin" />
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
      setAmount("");
      setReason("");
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
                <Loader2 className="h-4 w-4 animate-spin" />
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
      setPayerName("");
      setPayerPhone("");
      setNotes("");
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
      title="Bulk Fee Collection · کل فیس وصولی"
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Collecting..." : `Collect ${formatPKR(totalOutstanding)}`}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}