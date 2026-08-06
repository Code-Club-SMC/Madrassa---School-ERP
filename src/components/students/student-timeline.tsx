import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BanknoteX,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { formatPKR as formatPaisaPKR } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  ParentAccountRetryResponse,
  ParentCreds,
  StudentGuardianProfile,
  StudentProfilePayload,
} from "@/components/students/student-types";

type TimelineCategory =
  | "all"
  | "admission"
  | "academic"
  | "guardian"
  | "sibling"
  | "account"
  | "status"
  | "attendance"
  | "finance"
  | "exam";
type EventCategory = Exclude<TimelineCategory, "all">;

const eventCategories: Record<string, EventCategory> = {
  admission_accepted: "admission",
  parent_account_created: "account",
  parent_account_failed: "account",
  student_updated: "status",
  status_changed: "status",
  guardian_linked: "guardian",
  guardian_updated: "guardian",
  sibling_linked: "sibling",
  sibling_removed: "sibling",
  enrollment_moved: "academic",
  fee_charge_created: "finance",
  fee_payment_recorded: "finance",
  fee_charge_reversed: "finance",
  fee_payment_reversed: "finance",
  fee_refund_recorded: "finance",
  fee_adjustment_recorded: "finance",
  attendance_absent_marked: "attendance",
  attendance_late_marked: "attendance",
  attendance_leave_marked: "attendance",
  attendance_corrected: "attendance",
  exam_result_published: "exam",
  exam_result_failed: "exam",
  exam_dmc_generated: "exam",
};

const warningTypes = new Set(["parent_account_failed", "attendance_absent_marked", "exam_result_failed"]);

const timelineFilters: Array<{ value: TimelineCategory; label: string }> = [
  { value: "all", label: "سب" },
  { value: "admission", label: "داخلہ" },
  { value: "academic", label: "تعلیم" },
  { value: "guardian", label: "سرپرست" },
  { value: "sibling", label: "بہن بھائی" },
  { value: "account", label: "اکاؤنٹس" },
  { value: "attendance", label: "حاضری" },
  { value: "finance", label: "فیس" },
  { value: "exam", label: "امتحانات" },
  { value: "status", label: "حالت" },
];

const categoryIcons: Record<EventCategory, LucideIcon> = {
  admission: CheckCircle2,
  academic: GraduationCap,
  guardian: UserRound,
  sibling: UsersRound,
  account: ShieldCheck,
  status: Clock,
  attendance: CalendarCheck,
  finance: Banknote,
  exam: GraduationCap,
};

const financeEventTypes = [
  "fee_charge_created",
  "fee_payment_recorded",
  "fee_charge_reversed",
  "fee_payment_reversed",
  "fee_refund_recorded",
  "fee_adjustment_recorded",
] as const;

const attendanceEventTypes = [
  "attendance_absent_marked",
  "attendance_late_marked",
  "attendance_leave_marked",
  "attendance_corrected",
] as const;

const examEventTypes = [
  "exam_result_published",
  "exam_result_failed",
  "exam_dmc_generated",
] as const;

type FinanceEventType = (typeof financeEventTypes)[number];
type AttendanceEventType = (typeof attendanceEventTypes)[number];
type ExamEventType = (typeof examEventTypes)[number];
type TimelineTone =
  | "default"
  | "financeCharge"
  | "financePayment"
  | "financeReversal"
  | "financeRefund"
  | "financeAdjustment";
type MetadataDetailKind = "text" | "title" | "money" | "date";

type MetadataDetailField = {
  keys: string[];
  label: string;
  kind?: MetadataDetailKind;
};

type FinanceEventDefinition = {
  title: string;
  label: string;
  icon: LucideIcon;
  tone: TimelineTone;
  fields: MetadataDetailField[];
};

type AttendanceEventDefinition = {
  title: string;
  label: string;
  icon: LucideIcon;
  fields: MetadataDetailField[];
};

type ExamEventDefinition = {
  title: string;
  label: string;
  icon: LucideIcon;
  fields: MetadataDetailField[];
};

type TimelineEventPresentation = {
  title: string;
  label: string;
  details: string[];
  icon: LucideIcon;
  tone: TimelineTone;
};

const toneStyles: Record<TimelineTone, { icon: string; card: string; badge: string }> = {
  default: {
    icon: "border-primary/20 text-primary",
    card: "",
    badge: "",
  },
  financeCharge: {
    icon: "border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-300",
    card: "border-sky-200/70 dark:border-sky-900/70",
    badge:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300",
  },
  financePayment: {
    icon: "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
    card: "border-emerald-200/70 dark:border-emerald-900/70",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  financeReversal: {
    icon: "border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300",
    card: "border-rose-200/70 dark:border-rose-900/70",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
  },
  financeRefund: {
    icon: "border-cyan-200 text-cyan-700 dark:border-cyan-800 dark:text-cyan-300",
    card: "border-cyan-200/70 dark:border-cyan-900/70",
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300",
  },
  financeAdjustment: {
    icon: "border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300",
    card: "border-violet-200/70 dark:border-violet-900/70",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300",
  },
};

const financeEventDefinitions: Record<FinanceEventType, FinanceEventDefinition> = {
  fee_charge_created: {
    title: "فیس چارج بنی",
    label: "چارج",
    icon: ReceiptText,
    tone: "financeCharge",
    fields: [
      { keys: ["amountPaisa"], label: "رقم", kind: "money" },
      { keys: ["type", "chargeType"], label: "چارج کی قسم", kind: "title" },
      { keys: ["period"], label: "مدت" },
      { keys: ["dueDate"], label: "آخری تاریخ", kind: "date" },
      { keys: ["chargeId"], label: "چارج حوالہ" },
    ],
  },
  fee_payment_recorded: {
    title: "فیس ادائیگی درج ہوئی",
    label: "ادائیگی",
    icon: BanknoteArrowDown,
    tone: "financePayment",
    fields: [
      { keys: ["receiptNo"], label: "رسید" },
      { keys: ["amountPaisa"], label: "رقم", kind: "money" },
      { keys: ["method"], label: "طریقہ", kind: "title" },
      { keys: ["payerName"], label: "ادا کرنے والا" },
      { keys: ["paymentId"], label: "ادائیگی حوالہ" },
    ],
  },
  fee_charge_reversed: {
    title: "فیس چارج واپس ہوئی",
    label: "چارج واپسی",
    icon: RotateCcw,
    tone: "financeReversal",
    fields: [
      { keys: ["amountPaisa"], label: "رقم", kind: "money" },
      { keys: ["reason"], label: "وجہ" },
      { keys: ["chargeId"], label: "چارج حوالہ" },
      { keys: ["adjustmentId"], label: "ایڈجسٹمنٹ حوالہ" },
    ],
  },
  fee_payment_reversed: {
    title: "فیس ادائیگی واپس ہوئی",
    label: "ادائیگی واپسی",
    icon: BanknoteX,
    tone: "financeReversal",
    fields: [
      { keys: ["receiptNo"], label: "رسید" },
      { keys: ["amountPaisa"], label: "رقم", kind: "money" },
      { keys: ["reason"], label: "وجہ" },
      { keys: ["paymentId"], label: "ادائیگی حوالہ" },
      { keys: ["adjustmentId"], label: "ایڈجسٹمنٹ حوالہ" },
    ],
  },
  fee_refund_recorded: {
    title: "فیس ریفنڈ درج ہوا",
    label: "ریفنڈ",
    icon: BanknoteArrowUp,
    tone: "financeRefund",
    fields: [
      { keys: ["refundNo", "refundReceiptNo"], label: "ریفنڈ رسید" },
      { keys: ["receiptNo", "paymentReceiptNo", "originalReceiptNo"], label: "ادائیگی رسید" },
      { keys: ["amountPaisa"], label: "رقم", kind: "money" },
      { keys: ["method"], label: "طریقہ", kind: "title" },
      { keys: ["reason"], label: "وجہ" },
      { keys: ["paymentId"], label: "ادائیگی حوالہ" },
      { keys: ["adjustmentId"], label: "ایڈجسٹمنٹ حوالہ" },
    ],
  },
  fee_adjustment_recorded: {
    title: "فیس ایڈجسٹمنٹ درج ہوئی",
    label: "ایڈجسٹمنٹ",
    icon: BadgeDollarSign,
    tone: "financeAdjustment",
    fields: [
      { keys: ["adjustmentType", "type"], label: "ایڈجسٹمنٹ", kind: "title" },
      { keys: ["amountPaisa"], label: "رقم", kind: "money" },
      { keys: ["reason"], label: "وجہ" },
      { keys: ["chargeId"], label: "چارج حوالہ" },
      { keys: ["paymentId"], label: "ادائیگی حوالہ" },
      { keys: ["adjustmentId"], label: "ایڈجسٹمنٹ حوالہ" },
    ],
  },
};

const attendanceDetailFields: MetadataDetailField[] = [
  { keys: ["date"], label: "تاریخ", kind: "date" },
  { keys: ["previousStatus"], label: "پہلی حالت", kind: "title" },
  { keys: ["nextStatus"], label: "حالت", kind: "title" },
  { keys: ["institutionName"], label: "ادارہ" },
  { keys: ["programName"], label: "پروگرام" },
  { keys: ["className"], label: "جماعت" },
  { keys: ["sectionName"], label: "سیکشن" },
  { keys: ["madrassaCategoryName"], label: "درجہ بندی" },
  { keys: ["madrassaSubcategoryName"], label: "مدرسہ درجہ" },
  { keys: ["darja"], label: "درجہ" },
  { keys: ["notes"], label: "نوٹ" },
];

const attendanceEventDefinitions: Record<AttendanceEventType, AttendanceEventDefinition> = {
  attendance_absent_marked: {
    title: "غیر حاضری درج ہوئی",
    label: "غیر حاضر",
    icon: CalendarCheck,
    fields: attendanceDetailFields,
  },
  attendance_late_marked: {
    title: "تاخیر درج ہوئی",
    label: "تاخیر",
    icon: CalendarCheck,
    fields: attendanceDetailFields,
  },
  attendance_leave_marked: {
    title: "رخصت درج ہوئی",
    label: "رخصت",
    icon: CalendarCheck,
    fields: attendanceDetailFields,
  },
  attendance_corrected: {
    title: "حاضری درست ہوئی",
    label: "درستگی",
    icon: CalendarCheck,
    fields: attendanceDetailFields,
  },
};

const examDetailFields: MetadataDetailField[] = [
  { keys: ["examName"], label: "امتحان" },
  { keys: ["academicYear"], label: "تعلیمی سال" },
  { keys: ["grade"], label: "گریڈ" },
  { keys: ["percentage"], label: "فیصد" },
  { keys: ["position"], label: "پوزیشن" },
  { keys: ["status"], label: "حالت", kind: "title" },
];

const examEventDefinitions: Record<ExamEventType, ExamEventDefinition> = {
  exam_result_published: {
    title: "نتیجہ شائع ہوا",
    label: "نتیجہ",
    icon: GraduationCap,
    fields: examDetailFields,
  },
  exam_result_failed: {
    title: "نتیجہ ناکام ہوا",
    label: "ناکام نتیجہ",
    icon: AlertTriangle,
    fields: examDetailFields,
  },
  exam_dmc_generated: {
    title: "ڈی ایم سی بنی",
    label: "ڈی ایم سی",
    icon: FileText,
    fields: examDetailFields,
  },
};

type TimelineItem = {
  id: string;
  type: string;
  title: string;
  label: string;
  category: EventCategory;
  metadata: Record<string, unknown> | null;
  details: string[];
  icon: LucideIcon;
  tone: TimelineTone;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
  date: Date | null;
  warning: boolean;
};

type TimelineGroup = {
  key: string;
  label: string;
  items: TimelineItem[];
};

type RetryTarget = {
  guardian: StudentGuardianProfile;
};

export function StudentTimeline({
  profile,
  onParentCredentials,
}: {
  profile: StudentProfilePayload;
  onParentCredentials: (creds: ParentCreds) => void;
}) {
  const [filter, setFilter] = useState<TimelineCategory>("all");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const items = useMemo(() => buildTimelineItems(profile), [profile]);
  const counts = useMemo(() => countByCategory(items), [items]);
  const filtered = filter === "all" ? items : items.filter((item) => item.category === filter);
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  async function retryParentAccount(item: TimelineItem) {
    const target = resolveRetryTarget(item, profile.guardians);
    if (!target) {
      toast.error("کوئی ایسا سرپرست نہیں ملا جس کا لاگ اِن ابھی نہ بنا ہو");
      return;
    }

    setRetryingId(item.id);
    try {
      const response = await fetch(
        `/api/students/${profile.student.id}/guardians/${target.guardian.guardianId}/parent-account`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        },
      );
      const payload = (await response
        .json()
        .catch(() => ({}))) as Partial<ParentAccountRetryResponse> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "والدین کا لاگ اِن نہیں بن سکا");

      if (payload.parentCredentials) {
        onParentCredentials(payload.parentCredentials);
        toast.success("والدین کا لاگ اِن بن گیا", {
          description: payload.parentCredentials.username,
        });
      }

      if (payload.warning) {
        toast.warning(payload.warning.message, { description: payload.warning.metadata?.reason });
      }

      if (!payload.parentCredentials && !payload.warning) toast.success("والدین لاگ اِن کی کارروائی مکمل ہو گئی");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "والدین کا لاگ اِن نہیں بن سکا");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <Card className="mt-3 overflow-hidden p-0">
      <div className="border-b border-border p-3">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as TimelineCategory)}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1">
            {timelineFilters.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="gap-1.5">
                {item.label}
                <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {item.value === "all" ? items.length : counts[item.value as EventCategory]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="p-5">
        {groups.length === 0 ? (
          <p className="font-urdu text-sm text-muted-foreground">اس فلٹر میں کوئی واقعہ موجود نہیں۔</p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <TimelineGroupView
                key={group.key}
                group={group}
                profile={profile}
                retryingId={retryingId}
                onRetry={(item) => void retryParentAccount(item)}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function TimelineGroupView({
  group,
  profile,
  retryingId,
  onRetry,
}: {
  group: TimelineGroup;
  profile: StudentProfilePayload;
  retryingId: string | null;
  onRetry: (item: TimelineItem) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">{group.label}</h3>
        <span className="font-urdu text-[11px] text-muted-foreground">واقعات: {group.items.length}</span>
      </div>

      <div className="space-y-3">
        {group.items.map((item) => (
          <TimelineEntry
            key={item.id}
            item={item}
            retryTarget={resolveRetryTarget(item, profile.guardians)}
            retrying={retryingId === item.id}
            onRetry={() => onRetry(item)}
          />
        ))}
      </div>
    </section>
  );
}

function TimelineEntry({
  item,
  retryTarget,
  retrying,
  onRetry,
}: {
  item: TimelineItem;
  retryTarget: RetryTarget | null;
  retrying: boolean;
  onRetry: () => void;
}) {
  const Icon = item.warning ? AlertTriangle : item.icon;
  const actor = item.actorName || item.actorEmail || "نظام";
  const tone = toneStyles[item.tone];

  return (
    <article className="grid grid-cols-[2rem_1fr] gap-3">
      <div className="flex justify-center">
        <span
          className={cn(
            "mt-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background",
            item.warning
              ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
              : tone.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div
        className={cn(
          "rounded-lg border border-border bg-card p-3",
          !item.warning && tone.card,
          item.warning &&
            "border-amber-300/70 bg-amber-50/80 dark:border-amber-700/70 dark:bg-amber-950/20",
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-medium leading-5">{item.title}</h4>
              <Badge
                variant={item.warning ? "destructive" : "outline"}
                className={cn("text-[10px]", !item.warning && tone.badge)}
              >
                {item.label}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3 w-3" />
                {actor}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimestamp(item.date)}
              </span>
            </div>
          </div>

          {retryTarget && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 self-start"
              disabled={retrying}
              onClick={onRetry}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
              والدین لاگ اِن دوبارہ بنائیں
            </Button>
          )}
        </div>

        {item.details.length > 0 && (
          <dl className="mt-3 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
            {item.details.map((detail) => (
              <div key={detail} className="min-w-0 rounded-md bg-background/70 px-2 py-1">
                <dd className="break-words">{detail}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}

function buildTimelineItems(profile: StudentProfilePayload): TimelineItem[] {
  const eventItems = profile.events.map((event) => {
    const category = eventCategories[event.type] ?? "status";
    const date = parseDate(event.createdAt);
    const presentation = eventPresentationFor(event.type, category, event.metadata);

    return {
      id: event.id,
      type: event.type,
      title: urduMessageOrFallback(event.message, presentation.title),
      label: presentation.label,
      category,
      metadata: event.metadata,
      details: presentation.details,
      icon: presentation.icon,
      tone: presentation.tone,
      actorName: event.actorName,
      actorEmail: event.actorEmail,
      createdAt: event.createdAt,
      date,
      warning: warningTypes.has(event.type),
    };
  });

  if (eventItems.length > 0) {
    return sortTimelineItems(eventItems);
  }

  if (!profile.admission) return [];

  return [
    {
      id: `admission:${profile.admission.id}`,
      type: "admission_record",
      title: `داخلہ ${profile.admission.refNo}`,
      label: "داخلہ ریکارڈ",
      category: "admission",
      metadata: {
        source: profile.admission.source,
        variantKey: profile.admission.variantKey,
        decidedAt: profile.admission.decidedAt,
      },
      details: metadataText({
        source: profile.admission.source,
        variantKey: profile.admission.variantKey,
        decidedAt: profile.admission.decidedAt,
      }),
      icon: categoryIcons.admission,
      tone: "default",
      actorName: null,
      actorEmail: null,
      createdAt: profile.admission.submittedAt,
      date: parseDate(profile.admission.submittedAt),
      warning: false,
    },
  ];
}

function sortTimelineItems(items: TimelineItem[]) {
  return [...items].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

function groupByDay(items: TimelineItem[]): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const item of items) {
    const key = item.date ? dayKey(item.date) : "undated";
    const label = item.date
      ? formatDate(item.date, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
      : "بغیر تاریخ";
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, label, items: [item] });
    }
  }

  return Array.from(groups.values());
}

function countByCategory(items: TimelineItem[]) {
  return items.reduce<Record<EventCategory, number>>(
    (counts, item) => {
      counts[item.category] += 1;
      return counts;
    },
    {
      admission: 0,
      academic: 0,
      guardian: 0,
      sibling: 0,
      account: 0,
      status: 0,
      attendance: 0,
      finance: 0,
      exam: 0,
    },
  );
}

function resolveRetryTarget(
  item: TimelineItem,
  guardians: StudentGuardianProfile[],
): RetryTarget | null {
  if (item.type !== "parent_account_failed") return null;

  const unlinkedGuardians = guardians.filter((guardian) => !guardian.userId);
  if (unlinkedGuardians.length === 0) return null;

  const metadataGuardianId = metadataString(item.metadata, "guardianId");
  const metadataGuardian = metadataGuardianId
    ? unlinkedGuardians.find((guardian) => guardian.guardianId === metadataGuardianId)
    : null;
  const primaryGuardian = unlinkedGuardians.find((guardian) => guardian.isPrimary);
  const orderedCandidates = uniqueGuardians([
    metadataGuardian,
    primaryGuardian,
    ...unlinkedGuardians,
  ]);

  return orderedCandidates[0] ? { guardian: orderedCandidates[0] } : null;
}

function uniqueGuardians(guardians: Array<StudentGuardianProfile | null | undefined>) {
  const seen = new Set<string>();
  const unique: StudentGuardianProfile[] = [];

  for (const guardian of guardians) {
    if (!guardian || seen.has(guardian.guardianId)) continue;
    seen.add(guardian.guardianId);
    unique.push(guardian);
  }

  return unique;
}

function eventPresentationFor(
  type: string,
  category: EventCategory,
  metadata: Record<string, unknown> | null | undefined,
): TimelineEventPresentation {
  const attendancePresentation = attendanceEventPresentationFor(type, metadata);
  if (attendancePresentation) return attendancePresentation;

  const financePresentation = financeEventPresentationFor(type, metadata);
  if (financePresentation) return financePresentation;

  const examPresentation = examEventPresentationFor(type, metadata);
  if (examPresentation) return examPresentation;

  const label = titleFor(type);
  return {
    title: label,
    label,
    details: metadataText(metadata),
    icon: categoryIcons[category],
    tone: "default",
  };
}

function attendanceEventPresentationFor(
  type: string,
  metadata: Record<string, unknown> | null | undefined,
): TimelineEventPresentation | null {
  if (!isAttendanceEventType(type)) return null;

  const definition = attendanceEventDefinitions[type];
  return {
    title: definition.title,
    label: definition.label,
    details: buildMetadataDetails(metadata, definition.fields),
    icon: definition.icon,
    tone: "default",
  };
}

function financeEventPresentationFor(
  type: string,
  metadata: Record<string, unknown> | null | undefined,
): TimelineEventPresentation | null {
  if (!isFinanceEventType(type)) return null;

  const definition = financeEventDefinitions[type];
  return {
    title: definition.title,
    label: definition.label,
    details: buildMetadataDetails(metadata, definition.fields),
    icon: definition.icon,
    tone: definition.tone,
  };
}

function examEventPresentationFor(
  type: string,
  metadata: Record<string, unknown> | null | undefined,
): TimelineEventPresentation | null {
  if (!isExamEventType(type)) return null;

  const definition = examEventDefinitions[type];
  return {
    title: definition.title,
    label: definition.label,
    details: buildMetadataDetails(metadata, definition.fields),
    icon: definition.icon,
    tone: "default",
  };
}

function isAttendanceEventType(type: string): type is AttendanceEventType {
  return (attendanceEventTypes as readonly string[]).includes(type);
}

function isFinanceEventType(type: string): type is FinanceEventType {
  return (financeEventTypes as readonly string[]).includes(type);
}

function isExamEventType(type: string): type is ExamEventType {
  return (examEventTypes as readonly string[]).includes(type);
}

function buildMetadataDetails(
  metadata: Record<string, unknown> | null | undefined,
  fields: MetadataDetailField[],
) {
  if (!metadata) return [];

  const consumedKeys = new Set<string>();
  const details: string[] = [];

  for (const field of fields) {
    for (const key of field.keys) {
      consumedKeys.add(key);
    }

    const entry = firstMetadataEntry(metadata, field.keys);
    if (!entry) continue;

    const value = formatMetadataDetail(entry.value, field.kind ?? "text");
    if (value) details.push(`${field.label}: ${value}`);
  }

  return [...details, ...metadataText(metadata, consumedKeys)];
}

function firstMetadataEntry(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(metadata, key)) continue;
    const value = metadata[key];
    if (value === null || value === undefined) continue;
    return { key, value };
  }

  return null;
}

function formatMetadataDetail(value: unknown, kind: MetadataDetailKind) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "object" ||
    typeof value === "function"
  )
    return null;

  if (kind === "money") {
    const amount = metadataNumber(value);
    return amount === null ? null : formatPaisaPKR(amount);
  }

  if (kind === "date") {
    const date = parseMetadataDate(value);
    return date ? formatDate(date) : null;
  }

  const text = String(value).trim();
  if (!text) return null;

  if (kind === "title") return valueLabel(text);

  return text;
}

function metadataNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMetadataDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function titleFor(value: string) {
  const mapped = eventTypeLabel(value) ?? metadataKeyLabel(value) ?? valueLabel(value);
  if (mapped !== value) return mapped;

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function metadataText(
  metadata: Record<string, unknown> | null | undefined,
  omitKeys = new Set<string>(),
) {
  if (!metadata) return [];

  return Object.entries(metadata)
    .filter(
      ([key, value]) =>
        !omitKeys.has(key) &&
        !isSensitiveKey(key) &&
        value !== null &&
        value !== undefined &&
        typeof value !== "object" &&
        typeof value !== "function",
    )
    .map(([key, value]) => `${metadataKeyLabel(key) ?? titleFor(key)}: ${String(value)}`);
}

function urduMessageOrFallback(message: string | null | undefined, fallback: string) {
  const trimmed = message?.trim();
  if (!trimmed) return fallback;
  return /[\u0600-\u06ff]/.test(trimmed) ? trimmed : fallback;
}

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isSensitiveKey(key: string) {
  return /password|secret|token/i.test(key);
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimestamp(date: Date | null) {
  if (!date) return "وقت موجود نہیں";
  const day = formatDate(date);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

function eventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    admission_record: "داخلہ ریکارڈ",
    admission_accepted: "داخلہ منظور ہوا",
    parent_account_created: "والدین لاگ اِن بنا",
    parent_account_failed: "والدین لاگ اِن نہیں بن سکا",
    student_updated: "طالب علم کی معلومات تبدیل ہوئیں",
    status_changed: "حالت تبدیل ہوئی",
    guardian_linked: "سرپرست منسلک ہوا",
    guardian_updated: "سرپرست کی معلومات تبدیل ہوئیں",
    sibling_linked: "بہن بھائی منسلک ہوا",
    sibling_removed: "بہن بھائی ہٹایا گیا",
    enrollment_moved: "تعلیمی جگہ تبدیل ہوئی",
    fee_charge_created: "فیس چارج بنی",
    fee_payment_recorded: "فیس ادائیگی درج ہوئی",
    fee_charge_reversed: "فیس چارج واپس ہوئی",
    fee_payment_reversed: "فیس ادائیگی واپس ہوئی",
    fee_refund_recorded: "فیس ریفنڈ درج ہوا",
    fee_adjustment_recorded: "فیس ایڈجسٹمنٹ درج ہوئی",
    attendance_absent_marked: "غیر حاضری درج ہوئی",
    attendance_late_marked: "تاخیر درج ہوئی",
    attendance_leave_marked: "رخصت درج ہوئی",
    attendance_corrected: "حاضری درست ہوئی",
    exam_result_published: "نتیجہ شائع ہوا",
    exam_result_failed: "نتیجہ ناکام ہوا",
    exam_dmc_generated: "ڈی ایم سی بنی",
  };
  return labels[type] ?? null;
}

function metadataKeyLabel(key: string) {
  const labels: Record<string, string> = {
    source: "ذریعہ",
    variantKey: "فارم قسم",
    decidedAt: "فیصلہ تاریخ",
    username: "لاگ اِن آئی ڈی",
    guardianId: "سرپرست حوالہ",
    guardianName: "سرپرست",
    reason: "وجہ",
    rollNo: "رول نمبر",
    admissionNo: "داخلہ نمبر",
    previousValue: "پہلی قدر",
    nextValue: "نئی قدر",
    institutionName: "ادارہ",
    programName: "پروگرام",
    className: "جماعت",
    sectionName: "سیکشن",
    madrassaCategoryName: "درجہ بندی",
    madrassaSubcategoryName: "مدرسہ درجہ",
    darja: "درجہ",
    notes: "نوٹ",
  };
  return labels[key] ?? null;
}

function valueLabel(value: string) {
  const labels: Record<string, string> = {
    active: "فعال",
    inactive: "غیر فعال",
    pending: "زیر غور",
    accepted: "منظور",
    rejected: "مسترد",
    present: "حاضر",
    absent: "غیر حاضر",
    late: "تاخیر",
    leave: "رخصت",
    cash: "نقد",
    bank: "بینک",
    online: "آن لائن",
    cheque: "چیک",
    monthly: "ماہانہ",
    admission: "داخلہ",
    exam: "امتحان",
    other: "دیگر",
  };
  return labels[value] ?? value;
}
