import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  DayPicker as HijriDayPicker,
  getDateLib as getHijriDateLib,
} from "react-day-picker/hijri";
import { getDefaultClassNames } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CalendarType = "gregorian" | "hijri";

type DatePickerInputProps = {
  id?: string;
  value: string;
  calendarType?: CalendarType;
  disabled?: boolean;
  placeholder: string;
  displayValue?: string;
  selectedDate?: Date | null;
  className?: string;
  onChange: (value: string, date: Date) => void;
};

const hijriDateLib = getHijriDateLib();

export function DatePickerInput({
  id,
  value,
  calendarType = "gregorian",
  disabled,
  placeholder,
  displayValue,
  selectedDate,
  className,
  onChange,
}: DatePickerInputProps) {
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
    onChange(formatDateOnly(date), date);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("h-10 w-full justify-between gap-2 px-3 font-urdu", className)}
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
      formatters={formatters}
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

export function formatPickerDate(value: string, calendarType: CalendarType) {
  return calendarType === "hijri" ? formatHijriDate(value) : formatUrduDate(value);
}

export function formatHijriDate(value: string | Date) {
  const date = value instanceof Date ? value : (parseDateOnly(value) ?? new Date(value));
  return new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(" ہجری", "ھ");
}

export function formatHijriYear(date: Date) {
  return `${formatUrduNumber(hijriDateLib.getYear(date))}ھ`;
}

export function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatDateOnly(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUrduDate(value: string) {
  return new Intl.DateTimeFormat("ur-PK-u-ca-gregory", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDateOnly(value) ?? new Date(value));
}

function formatHijriMonthYear(date: Date) {
  return new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", {
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(" ہجری", "ھ");
}

function formatUrduNumber(value: number) {
  return new Intl.NumberFormat("ur-PK-u-nu-arabext", { useGrouping: false }).format(value);
}
