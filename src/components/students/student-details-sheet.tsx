import { Link } from "@tanstack/react-router";
import { Calendar, IdCard, MapPin, Phone, Printer, User, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ResponsiveSheet } from "@/components/custom/responsive-sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentListItem } from "./student-types";

type Props = {
  student: StudentListItem | null;
  onClose: () => void;
};

export function StudentDetailsSheet({ student, onClose }: Props) {
  const open = !!student;

  return (
    <ResponsiveSheet
      title="Student Profile"
      description="طالبِ علم کی تفصیل"
      open={open}
      onOpenChange={(value) => !value && onClose()}
      icon={User}
      className="w-full min-w-0 sm:min-w-[420px] sm:max-w-md"
    >
      {student && (
        <div className="mt-6 space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback
                className={cn(
                  "text-lg font-bold",
                  student.gender === "female"
                    ? "bg-pink-500/10 text-pink-700 dark:text-pink-300"
                    : "bg-primary/10 text-primary",
                )}
              >
                {initials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-urdu text-xl leading-tight">{student.nameUrdu}</p>
              <p className="text-sm text-muted-foreground">{student.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={student.status} />
                <span className="font-mono text-xs text-muted-foreground">{student.rollNo}</span>
              </div>
            </div>
          </div>

          <Separator />

          <Section title="Academic" titleUrdu="تعلیمی">
            <Row
              icon={IdCard}
              label={student.system === "madrassa" ? "Class" : "Class"}
              labelUrdu={student.system === "madrassa" ? "درجہ" : undefined}
              value={
                <>
                  <span className="font-urdu">{student.groupLabel}</span>
                  <span className="text-muted-foreground ms-2 text-xs">{student.groupEnglish}</span>
                </>
              }
            />
            <Row icon={User} label="Institution" value={student.institutionName} />
            <Row icon={Calendar} label="Admitted" value={formatMaybeDate(student.admissionDate)} />
            <Row
              icon={Wallet}
              label="Monthly fee"
              value={<span className="font-mono">{formatPKR(student.monthlyFee)}</span>}
            />
          </Section>

          <Separator />

          <Section title="Personal" titleUrdu="ذاتی">
            <Row icon={User} label="Father" value={student.fatherNameUrdu ?? student.fatherName} />
            <Row icon={User} label="Gender" value={student.gender} />
            <Row icon={Calendar} label="Date of birth" value={formatMaybeDate(student.dob)} />
            <Row
              icon={IdCard}
              label="B-Form"
              value={<span className="font-mono">{student.cnicBForm ?? "—"}</span>}
            />
          </Section>

          <Separator />

          <Section title="Guardian" titleUrdu="ولی">
            <Row
              icon={User}
              label="Name"
              value={<span className="font-urdu">{student.guardianNameUrdu}</span>}
            />
            <Row
              icon={Phone}
              label="Phone"
              value={<span className="font-mono">{student.guardianPhone || "—"}</span>}
            />
            <Row
              icon={IdCard}
              label="CNIC"
              value={<span className="font-mono">{student.guardianCnic || "—"}</span>}
            />
            <Row icon={MapPin} label="Address" value={student.guardianAddress || "—"} />
          </Section>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5" asChild>
              <Link to="/students/$id" params={{ id: student.id }}>
                <IdCard className="h-3.5 w-3.5" /> Open profile
              </Link>
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>
      )}
    </ResponsiveSheet>
  );
}

function Section({
  title,
  titleUrdu,
  children,
}: {
  title: string;
  titleUrdu: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h4>
        <span className="font-urdu text-sm text-muted-foreground">{titleUrdu}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  labelUrdu,
  value,
}: {
  icon: typeof Phone;
  label: string;
  labelUrdu?: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {label}
          {labelUrdu && <span className="ms-2 font-urdu">{labelUrdu}</span>}
        </span>
        <span className="text-sm text-foreground text-end break-words">{value}</span>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMaybeDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date);
}
