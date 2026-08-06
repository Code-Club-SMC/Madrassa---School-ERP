import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Calendar as CalendarIcon,
  CalendarRange,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  Lock,
  Plus,
} from "lucide-react";
import { DayPicker as HijriDayPicker, getDateLib as getHijriDateLib } from "react-day-picker/hijri";
import { getDefaultClassNames } from "react-day-picker";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings/academic-year")({
  component: AcademicYearPage,
});

type AcademicYearSystem = "school" | "madrassa";
type CalendarType = "gregorian" | "hijri";
type YearStatus = "active" | "archived" | "upcoming" | "locked";

type AcademicYear = {
  id: string;
  name: string;
  hijriName: string | null;
  system: AcademicYearSystem;
  calendarType: CalendarType;
  startDate: string;
  endDate: string;
  status: YearStatus;
  carryForwardEnabled: boolean;
};

type AcademicYearsResponse = {
  years: AcademicYear[];
  summary: {
    activeEnrollmentBackfillRequired: number;
    activeEnrollmentBackfillRequiredBySystem?: Record<AcademicYearSystem, number>;
  };
};

type NewYearForm = {
  system: AcademicYearSystem;
  name: string;
  hijriName: string;
  startDate: string;
  endDate: string;
  carryForwardEnabled: boolean;
};

type ConfirmAction = {
  action: "activate" | "archive" | "lock";
  year: AcademicYear;
};

const academicYearKeys = {
  all: ["academic-years"] as const,
};

const hijriDateLib = getHijriDateLib();

const STATUS_TONE: Record<YearStatus, string> = {
  active: "bg-chart-1/15 text-chart-5 border-chart-2/30 dark:text-chart-1",
  archived: "bg-muted text-muted-foreground border-border",
  upcoming: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-300",
  locked: "bg-amber-500/10 text-amber-700 border-amber-300/40 dark:text-amber-300",
};

const STATUS_LABEL: Record<YearStatus, string> = {
  active: "فعال",
  archived: "محفوظ شدہ",
  upcoming: "آنے والا",
  locked: "مقفل",
};

const SYSTEM_META: Record<
  AcademicYearSystem,
  {
    title: string;
    titleUrdu: string;
    currentLabel: string;
    calendarLabel: string;
  }
> = {
  school: {
    title: "اسکول کے تعلیمی سال",
    titleUrdu: "اسکول کے تعلیمی سال",
    currentLabel: "موجودہ اسکول سال",
    calendarLabel: "شمسی",
  },
  madrassa: {
    title: "مدارس کے تعلیمی سال",
    titleUrdu: "مدارس کے تعلیمی سال",
    currentLabel: "موجودہ مدرسہ سال",
    calendarLabel: "ہجری · محرم تا ذوالحجہ",
  },
};

function AcademicYearPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [form, setForm] = useState<NewYearForm>(() => defaultForm("school"));

  const yearsQuery = useQuery({
    queryKey: academicYearKeys.all,
    queryFn: getAcademicYears,
    staleTime: 30_000,
  });

  const years = yearsQuery.data?.years ?? [];
  const grouped = useMemo(
    () => ({
      school: years.filter((year) => year.system === "school"),
      madrassa: years.filter((year) => year.system === "madrassa"),
    }),
    [years],
  );

  const createMutation = useMutation({
    mutationFn: createAcademicYear,
    onSuccess: async () => {
      toast.success("تعلیمی سال بنا دیا گیا");
      setOpen(false);
      setForm(defaultForm(form.system));
      await queryClient.invalidateQueries({ queryKey: academicYearKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, "تعلیمی سال نہیں بن سکا")),
  });

  const actionMutation = useMutation({
    mutationFn: runYearAction,
    onSuccess: async (_, variables) => {
      toast.success(actionSuccessMessage(variables.action));
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: academicYearKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, "تعلیمی سال اپ ڈیٹ نہیں ہو سکا")),
  });

  function openNewYear(system: AcademicYearSystem) {
    setForm(defaultForm(system));
    setOpen(true);
  }

  function submitNewYear() {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error(
        form.system === "madrassa"
          ? "ہجری سال، آغاز کی تاریخ اور اختتام کی تاریخ لازمی ہیں"
          : "سال کا عنوان، آغاز کی تاریخ اور اختتام کی تاریخ لازمی ہیں",
      );
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      hijriName: form.hijriName.trim() || null,
      system: form.system,
      calendarType: calendarTypeForSystem(form.system),
      startDate: form.startDate,
      endDate: form.endDate,
      carryForwardEnabled: form.carryForwardEnabled,
    });
  }

  return (
    <div>
      <PageHeader
        title="تعلیمی سال"
        titleUrdu="تعلیمی سال"
        description="داخلوں، ترقی، فیس، حاضری اور رپورٹس کے لیے اسکول اور مدرسہ کے فعال تعلیمی سال مقرر کریں۔"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => openNewYear("school")}
            >
              <Plus className="h-4 w-4" />
              اسکول سال
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => openNewYear("madrassa")}>
              <Plus className="h-4 w-4" />
              مدرسہ سال
            </Button>
          </div>
        }
      />

      {yearsQuery.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>تعلیمی سال لوڈ نہیں ہو سکے</AlertTitle>
          <AlertDescription>{errorMessage(yearsQuery.error, "دوبارہ کوشش کریں")}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <AcademicYearSection
          system="school"
          years={grouped.school}
          loading={yearsQuery.isLoading}
          pendingAction={actionMutation.isPending ? actionMutation.variables : undefined}
          onAction={setConfirm}
          onCreate={() => openNewYear("school")}
        />
        <AcademicYearSection
          system="madrassa"
          years={grouped.madrassa}
          loading={yearsQuery.isLoading}
          pendingAction={actionMutation.isPending ? actionMutation.variables : undefined}
          onAction={setConfirm}
          onCreate={() => openNewYear("madrassa")}
        />
      </div>

      <NewAcademicYearDialog
        open={open}
        form={form}
        submitting={createMutation.isPending}
        onOpenChange={setOpen}
        onFormChange={setForm}
        onSubmit={submitNewYear}
      />

      <ConfirmYearActionDialog
        confirm={confirm}
        submitting={actionMutation.isPending}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm) actionMutation.mutate(confirm);
        }}
      />
    </div>
  );
}

function AcademicYearSection({
  system,
  years,
  loading,
  pendingAction,
  onAction,
  onCreate,
}: {
  system: AcademicYearSystem;
  years: AcademicYear[];
  loading: boolean;
  pendingAction: ConfirmAction | undefined;
  onAction: (action: ConfirmAction) => void;
  onCreate: () => void;
}) {
  const meta = SYSTEM_META[system];
  const active = years.find((year) => year.status === "active");

  return (
    <section className="space-y-3">
      <Card className="p-5 bg-primary/5 border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {meta.currentLabel}
              </p>
            </div>
            {active ? (
              <>
                <h2 className="font-urdu text-2xl font-bold mt-3">{active.name}</h2>
                <p className="font-urdu text-base text-muted-foreground mt-0.5">
                  {active.hijriName ? `ہجری ${active.hijriName}` : meta.calendarLabel}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
                  <Row label="آغاز" value={formatUrduDate(active.startDate)} />
                  <Row label="اختتام" value={formatUrduDate(active.endDate)} />
                  <Row label="کیلنڈر" value={calendarLabel(active.calendarType)} />
                  <Row label="حالت" value={<StatusBadge status={active.status} />} />
                </div>
              </>
            ) : (
              <div className="mt-4">
                <h2 className="font-urdu text-xl font-bold">کوئی فعال سال نہیں</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  داخلہ شروع کرنے کے لیے اس نظام کا فعال تعلیمی سال لازمی ہے۔
                </p>
                <Button size="sm" className="gap-1.5 mt-4" onClick={onCreate}>
                  <Plus className="h-4 w-4" />
                  سال بنائیں
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-muted/30">
          <div>
            <h3 className="font-urdu font-semibold text-sm">{meta.title}</h3>
            <p className="font-urdu text-sm text-muted-foreground">{meta.titleUrdu}</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            نیا
          </Button>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              تعلیمی سال لوڈ ہو رہے ہیں...
            </div>
          ) : years.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              ابھی کوئی سال مقرر نہیں کیا گیا۔
            </div>
          ) : (
            years.map((year) => (
              <YearRow
                key={year.id}
                year={year}
                pendingAction={pendingAction}
                onAction={onAction}
              />
            ))
          )}
        </div>
      </Card>
    </section>
  );
}

function YearRow({
  year,
  pendingAction,
  onAction,
}: {
  year: AcademicYear;
  pendingAction: ConfirmAction | undefined;
  onAction: (action: ConfirmAction) => void;
}) {
  const pending = pendingAction?.year.id === year.id ? pendingAction.action : null;

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{year.name}</p>
          <p className="font-urdu text-sm text-muted-foreground">
            {year.hijriName ? `ہجری ${year.hijriName}` : calendarLabel(year.calendarType)}
          </p>
          <p className="font-urdu text-xs text-muted-foreground mt-0.5">
            {formatUrduDate(year.startDate)} تا {formatUrduDate(year.endDate)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <StatusBadge status={year.status} />
        {year.status !== "active" && year.status !== "locked" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction({ action: "activate", year })}
          >
            {pending === "activate" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "فعال کریں"
            )}
          </Button>
        )}
        {year.status !== "archived" && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onAction({ action: "lock", year })}
          >
            {pending === "lock" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            مقفل کریں
          </Button>
        )}
        {year.status !== "active" && year.status !== "archived" && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onAction({ action: "archive", year })}
          >
            {pending === "archive" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            محفوظ کریں
          </Button>
        )}
      </div>
    </div>
  );
}

function NewAcademicYearDialog({
  open,
  form,
  submitting,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  form: NewYearForm;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: NewYearForm) => void;
  onSubmit: () => void;
}) {
  const isMadrassa = form.system === "madrassa";

  function applyMadrassaHijriYear(date: Date) {
    const range = hijriAcademicYearRange(date);
    onFormChange({
      ...form,
      name: `${range.hijriYear}ھ`,
      hijriName: range.hijriYear,
      startDate: formatDateOnly(range.startDate),
      endDate: formatDateOnly(range.endDate),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        lang="ur"
        className="max-h-[92vh] overflow-y-auto text-right font-urdu sm:max-w-2xl"
      >
        <DialogHeader className="space-y-2 pr-8 text-right sm:text-right">
          <DialogTitle className="text-xl leading-8">
            {isMadrassa ? "نیا مدرسہ تعلیمی سال" : "نیا اسکول تعلیمی سال"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <Alert className="py-4 pl-4 pr-4 [&>svg]:left-auto [&>svg]:right-4 [&>svg~*]:pl-0 [&>svg~*]:pr-7">
            <CalendarRange className="h-4 w-4" />
            <AlertTitle>{isMadrassa ? "ہجری تعلیمی سال" : "شمسی تعلیمی سال"}</AlertTitle>
            <AlertDescription className="leading-7">
              {isMadrassa
                ? "ہجری سال منتخب کریں؛ نظام یکم محرم سے آخری ذوالحجہ تک کی شمسی تاریخیں خود بھر دے گا۔"
                : "اسکول کے آغاز اور اختتام کی تصدیق شدہ تاریخیں درج کریں۔"}
            </AlertDescription>
          </Alert>

          <div className={cn("grid gap-4", isMadrassa && "sm:grid-cols-2")}>
            <div className="space-y-1.5">
              <Label>سال کا عنوان</Label>
              <Input
                value={form.name}
                onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                placeholder={isMadrassa ? "1448ھ" : "2026-2027"}
                disabled={submitting}
                className="h-10 text-right font-urdu"
              />
            </div>
            {isMadrassa && (
              <DatePickerField
                label="ہجری سال"
                value={form.hijriName}
                calendarType="hijri"
                disabled={submitting}
                placeholder="ہجری سال منتخب کریں"
                displayValue={form.hijriName ? formatHijriYear(form.hijriName) : undefined}
                selectedDate={parseDateOnly(form.startDate)}
                onSelect={applyMadrassaHijriYear}
                helpText="ہجری کیلنڈر سے کوئی دن منتخب کریں؛ اسی سال کا مکمل تعلیمی دورانیہ خود مقرر ہو جائے گا۔"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DatePickerField
              label="آغاز کی تاریخ"
              value={form.startDate}
              calendarType={isMadrassa ? "hijri" : "gregorian"}
              disabled={submitting}
              placeholder="آغاز منتخب کریں"
              onSelect={(date) => {
                const hijriYear = isMadrassa ? hijriYearFromDate(date) : form.hijriName;
                onFormChange({
                  ...form,
                  startDate: formatDateOnly(date),
                  hijriName: isMadrassa ? hijriYear : form.hijriName,
                  name: isMadrassa ? `${hijriYear}ھ` : form.name,
                });
              }}
              helpText={
                form.startDate && isMadrassa
                  ? `محفوظ شمسی تاریخ: ${formatUrduDate(form.startDate)}`
                  : undefined
              }
            />
            <DatePickerField
              label="اختتام کی تاریخ"
              value={form.endDate}
              calendarType={isMadrassa ? "hijri" : "gregorian"}
              disabled={submitting}
              placeholder="اختتام منتخب کریں"
              onSelect={(date) => {
                onFormChange({
                  ...form,
                  endDate: formatDateOnly(date),
                });
              }}
              helpText={
                form.endDate && isMadrassa
                  ? `محفوظ شمسی تاریخ: ${formatUrduDate(form.endDate)}`
                  : undefined
              }
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
            <Checkbox
              className="mt-1"
              checked={form.carryForwardEnabled}
              onCheckedChange={(value) =>
                onFormChange({ ...form, carryForwardEnabled: value === true })
              }
              disabled={submitting}
            />
            <span className="space-y-1.5">
              <span className="block text-sm font-medium leading-6">
                سالانہ ترقی میں طلبہ شامل کریں
              </span>
              <span className="block text-xs leading-6 text-muted-foreground">
                یہ فوری طور پر کسی طالب علم کو منتقل نہیں کرتا۔ یہ صرف اس تعلیمی سال کی پالیسی محفوظ
                کرتا ہے تاکہ سالانہ ترقی یا رول اوور چلاتے وقت فعال طلبہ کو اگلے سال میں لے جایا جا
                سکے۔
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="sm:justify-start sm:space-x-0 sm:space-x-reverse sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            منسوخ
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            بنائیں
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DatePickerField({
  label,
  value,
  calendarType = "gregorian",
  disabled,
  placeholder,
  displayValue,
  selectedDate,
  helpText,
  onSelect,
}: {
  label: string;
  value: string;
  calendarType?: CalendarType;
  disabled: boolean;
  placeholder: string;
  displayValue?: string;
  selectedDate?: Date | null;
  helpText?: string;
  onSelect: (date: Date) => void;
}) {
  const selected = selectedDate ?? parseDateOnly(value);
  const selectedKey = selected ? formatDateOnly(selected) : "";
  const resolvedValue =
    displayValue ?? (value ? formatPickerDate(value, calendarType) : placeholder);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date | undefined>(() =>
    selectedKey ? (parseDateOnly(selectedKey) ?? undefined) : undefined,
  );

  useEffect(() => {
    setVisibleMonth(selectedKey ? (parseDateOnly(selectedKey) ?? undefined) : undefined);
  }, [selectedKey]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setVisibleMonth(selectedKey ? (parseDateOnly(selectedKey) ?? undefined) : undefined);
    }
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onSelect(date);
    setOpen(false);
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-between gap-2 px-3 font-urdu"
          >
            <span className="min-w-0 flex-1 truncate text-right">{resolvedValue}</span>
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent dir="rtl" lang="ur" align="start" className="w-auto p-0 font-urdu">
          {calendarType === "hijri" ? (
            <HijriCalendar
              mode="single"
              selected={selected ?? undefined}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={handleSelect}
              captionLayout="dropdown"
              formatters={urduHijriCalendarFormatters}
            />
          ) : (
            <Calendar
              mode="single"
              selected={selected ?? undefined}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={handleSelect}
              captionLayout="dropdown"
              formatters={urduCalendarFormatters}
            />
          )}
        </PopoverContent>
      </Popover>
      {helpText && <p className="mt-1 text-xs leading-5 text-muted-foreground">{helpText}</p>}
    </div>
  );
}

function HijriCalendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof HijriDayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <HijriDayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      numerals="arabext"
      formatters={{
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day,
        ),
        range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function ConfirmYearActionDialog({
  confirm,
  submitting,
  onOpenChange,
  onConfirm,
}: {
  confirm: ConfirmAction | null;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={Boolean(confirm)} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl" lang="ur" className="text-right font-urdu">
        <AlertDialogHeader className="text-right sm:text-right">
          <AlertDialogTitle>
            {confirm ? `تعلیمی سال ${actionLabel(confirm.action)}؟` : "عمل کی تصدیق"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirm ? confirmationDescription(confirm) : "یہ عمل تعلیمی سال کو اپ ڈیٹ کرے گا۔"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-start sm:space-x-0 sm:space-x-reverse sm:gap-2">
          <AlertDialogCancel disabled={submitting}>منسوخ</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            تصدیق کریں
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: YearStatus }) {
  return (
    <Badge variant="outline" className={STATUS_TONE[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function defaultForm(system: AcademicYearSystem): NewYearForm {
  return {
    system,
    name: "",
    hijriName: "",
    startDate: "",
    endDate: "",
    carryForwardEnabled: true,
  };
}

function calendarTypeForSystem(system: AcademicYearSystem): CalendarType {
  return system === "madrassa" ? "hijri" : "gregorian";
}

function calendarLabel(calendarType: CalendarType) {
  return calendarType === "hijri" ? "ہجری" : "شمسی";
}

function actionLabel(action: ConfirmAction["action"]) {
  if (action === "activate") return "فعال کریں";
  if (action === "lock") return "مقفل کریں";
  return "محفوظ کریں";
}

function actionSuccessMessage(action: ConfirmAction["action"]) {
  if (action === "activate") return "تعلیمی سال فعال کر دیا گیا";
  if (action === "lock") return "تعلیمی سال مقفل کر دیا گیا";
  return "تعلیمی سال محفوظ کر دیا گیا";
}

function confirmationDescription(confirm: ConfirmAction) {
  if (confirm.action === "activate") {
    return `${confirm.year.name} کو فعال کرنے سے اسی نظام کا موجودہ فعال سال محفوظ ہو جائے گا۔ نئے داخلے اسی سال میں درج ہوں گے۔`;
  }
  if (confirm.action === "lock") {
    return `${confirm.year.name} کو مقفل کرنے کے بعد اس سال سے متعلق داخلوں، ترقی اور ریکارڈ میں تبدیلی نہیں ہو سکے گی۔`;
  }
  return `${confirm.year.name} کو محفوظ کرنے کے بعد یہ فعال کارروائیوں میں استعمال نہیں ہو گا، لیکن سابقہ ریکارڈ باقی رہے گا۔`;
}

async function getAcademicYears(): Promise<AcademicYearsResponse> {
  const response = await fetch("/api/academic-years", { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payloadError(payload, "تعلیمی سال لوڈ نہیں ہو سکے"));
  return payload;
}

async function createAcademicYear(input: {
  name: string;
  hijriName: string | null;
  system: AcademicYearSystem;
  calendarType: CalendarType;
  startDate: string;
  endDate: string;
  carryForwardEnabled: boolean;
}) {
  const response = await fetch("/api/academic-years", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payloadError(payload, "تعلیمی سال نہیں بن سکا"));
  return payload;
}

async function runYearAction(confirm: ConfirmAction) {
  const path =
    confirm.action === "archive"
      ? `/api/academic-years/${confirm.year.id}`
      : `/api/academic-years/${confirm.year.id}/${confirm.action}`;
  const response = await fetch(path, {
    method: confirm.action === "archive" ? "DELETE" : "POST",
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payloadError(payload, "تعلیمی سال اپ ڈیٹ نہیں ہو سکا"));
  return payload;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const urduCalendarFormatters = {
  formatCaption: (date: Date) =>
    new Intl.DateTimeFormat("ur-PK-u-ca-gregory", {
      month: "long",
      year: "numeric",
    }).format(date),
  formatMonthDropdown: (date: Date) =>
    new Intl.DateTimeFormat("ur-PK-u-ca-gregory", { month: "short" }).format(date),
  formatWeekdayName: (date: Date) =>
    new Intl.DateTimeFormat("ur-PK-u-ca-gregory", { weekday: "short" }).format(date),
  formatDay: (date: Date) =>
    new Intl.NumberFormat("ur-PK").format(
      Number(new Intl.DateTimeFormat("en", { day: "numeric" }).format(date)),
    ),
  formatYearDropdown: (date: Date) =>
    new Intl.NumberFormat("ur-PK", { useGrouping: false }).format(date.getFullYear()),
};

const urduHijriCalendarFormatters = {
  formatCaption: (date: Date) => formatHijriMonthYear(date),
  formatMonthDropdown: (date: Date) =>
    new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", { month: "short" }).format(date),
  formatWeekdayName: (date: Date) =>
    new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", { weekday: "short" }).format(date),
  formatDay: (date: Date) =>
    new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", { day: "numeric" }).format(date),
  formatYearDropdown: (date: Date) => formatUrduNumber(hijriDateLib.getYear(date)),
};

function payloadError(payload: unknown, fallback: string) {
  if (typeof payload !== "object" || payload === null) return fallback;
  const data = payload as {
    error?: unknown;
    issues?: Array<{ message?: unknown }>;
  };

  if (Array.isArray(data.issues) && typeof data.issues[0]?.message === "string") {
    return data.issues[0].message;
  }

  if (
    typeof data.error === "string" &&
    data.error !== "Invalid request body" &&
    data.error !== "Invalid JSON body"
  ) {
    return data.error;
  }

  return fallback;
}

function formatUrduDate(value: string) {
  return new Intl.DateTimeFormat("ur-PK-u-ca-gregory", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPickerDate(value: string, calendarType: CalendarType) {
  return calendarType === "hijri" ? formatHijriDate(value) : formatUrduDate(value);
}

function formatHijriDate(value: string) {
  const date = parseDateOnly(value) ?? new Date(value);
  return new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(" ہجری", "ھ");
}

function formatHijriMonthYear(date: Date) {
  return new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", {
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(" ہجری", "ھ");
}

function formatHijriYear(value: string) {
  const numeric = Number(value);
  const year = Number.isFinite(numeric) ? formatUrduNumber(numeric) : value;
  return `${year}ھ`;
}

function formatUrduNumber(value: number) {
  return new Intl.NumberFormat("ur-PK-u-nu-arabext", { useGrouping: false }).format(value);
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hijriAcademicYearRange(date: Date) {
  const hijriYear = hijriYearFromDate(date);
  const startDate = hijriDateLib.newDate(Number(hijriYear), 0, 1);
  return {
    hijriYear,
    startDate,
    endDate: hijriDateLib.endOfYear(startDate),
  };
}

function hijriYearFromDate(date: Date) {
  return String(hijriDateLib.getYear(date));
}
