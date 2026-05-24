import { Phone, MapPin, Calendar, IdCard, Wallet, User, Pencil, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { madrassaCategories, schoolClasses, type Student } from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  student: Student | null;
  onClose: () => void;
  onDelete: (id: string) => void;
};

export function StudentDetailsSheet({ student, onClose, onDelete }: Props) {
  const open = !!student;
  const group = student
    ? student.system === "madrassa"
      ? madrassaCategories.find((c) => c.id === student.categoryId)
      : schoolClasses.find((c) => c.id === student.classId)
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        {student && (
          <>
            <SheetHeader className="text-start">
              <SheetTitle className="font-heading">Student Profile</SheetTitle>
              <SheetDescription className="font-urdu text-base">
                طالبِ علم کی تفصیل
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Identity */}
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
                    {student.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-urdu text-xl leading-tight">{student.nameUrdu}</p>
                  <p className="text-sm text-muted-foreground">{student.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={student.status} />
                    <span className="font-mono text-xs text-muted-foreground">
                      {student.rollNo}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Academic */}
              <Section title="Academic" titleUrdu="تعلیمی">
                <Row
                  icon={IdCard}
                  label={student.system === "madrassa" ? "Category" : "Class"}
                  value={
                    group ? (
                      <>
                        <span className="font-urdu">{group.nameUrdu}</span>
                        <span className="text-muted-foreground ms-2 text-xs">
                          {group.name}
                        </span>
                      </>
                    ) : (
                      "—"
                    )
                  }
                />
                <Row
                  icon={Calendar}
                  label="Admitted"
                  value={formatDate(student.admissionDate)}
                />
                <Row
                  icon={Wallet}
                  label="Monthly fee"
                  value={<span className="font-mono">{formatPKR(student.monthlyFee)}</span>}
                />
              </Section>

              <Separator />

              {/* Personal */}
              <Section title="Personal" titleUrdu="ذاتی">
                <Row icon={User} label="Gender" value={student.gender} />
                <Row icon={Calendar} label="Date of birth" value={formatDate(student.dob)} />
                <Row icon={MapPin} label="Address" value={student.address} />
              </Section>

              <Separator />

              {/* Guardian */}
              <Section title="Guardian" titleUrdu="ولی">
                <Row
                  icon={User}
                  label="Name"
                  value={
                    <>
                      <span className="font-urdu">{student.guardianNameUrdu}</span>
                    </>
                  }
                />
                <Row
                  icon={Phone}
                  label="Phone"
                  value={<span className="font-mono">{student.guardianPhone}</span>}
                />
                <Row
                  icon={IdCard}
                  label="CNIC"
                  value={<span className="font-mono">{student.guardianCnic}</span>}
                />
              </Section>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => onDelete(student.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
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
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground text-end break-words">{value}</span>
      </div>
    </div>
  );
}