import { cn } from "@/lib/utils";

export type StatusKey =
  | "active"
  | "inactive"
  | "pending"
  | "under_review"
  | "interview_scheduled"
  | "documents_pending"
  | "waitlisted"
  | "accepted"
  | "rejected"
  | "graduated"
  | "dropout"
  | "transferred"
  | "super_admin"
  | "admin"
  | "principal"
  | "hr_manager"
  | "accountant"
  | "librarian"
  | "receptionist"
  | "staff"
  | "teacher"
  | "parent";

const VARIANTS: Record<StatusKey, { label: string; urdu: string; className: string }> = {
  active: { label: "Active", urdu: "فعال", className: "bg-chart-1/15 text-chart-5 border-chart-2/40 dark:text-chart-1" },
  inactive: { label: "Inactive", urdu: "غیر فعال", className: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Pending", urdu: "زیر غور", className: "bg-amber-500/10 text-amber-700 border-amber-300/40 dark:text-amber-400" },
  under_review: { label: "Under Review", urdu: "زیر جائزہ", className: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-400" },
  interview_scheduled: { label: "Interview", urdu: "انٹرویو", className: "bg-cyan-500/10 text-cyan-700 border-cyan-300/40 dark:text-cyan-400" },
  documents_pending: { label: "Docs Pending", urdu: "کاغذات باقی", className: "bg-orange-500/10 text-orange-700 border-orange-300/40 dark:text-orange-400" },
  waitlisted: { label: "Waitlisted", urdu: "انتظار", className: "bg-muted text-muted-foreground border-border" },
  accepted: { label: "Accepted", urdu: "منظور", className: "bg-chart-1/15 text-chart-5 border-chart-2/40 dark:text-chart-1" },
  rejected: { label: "Rejected", urdu: "مسترد", className: "bg-destructive/10 text-destructive border-destructive/25" },
  graduated: { label: "Graduated", urdu: "فارغ التحصیل", className: "bg-primary/10 text-primary border-primary/25" },
  dropout: { label: "Dropout", urdu: "تارک", className: "bg-orange-500/10 text-orange-700 border-orange-300/40 dark:text-orange-400" },
  transferred: { label: "Transferred", urdu: "منتقل", className: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-400" },
  super_admin: { label: "Super Admin", urdu: "سپر ایڈمن", className: "bg-purple-500/10 text-purple-700 border-purple-300/40 dark:text-purple-400" },
  admin: { label: "Admin", urdu: "ایڈمن", className: "bg-primary/10 text-primary border-primary/25" },
  principal: { label: "Principal", urdu: "پرنسپل", className: "bg-indigo-500/10 text-indigo-700 border-indigo-300/40 dark:text-indigo-400" },
  hr_manager: { label: "HR Manager", urdu: "ایچ آر منیجر", className: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-300/40 dark:text-fuchsia-400" },
  accountant: { label: "Accountant", urdu: "اکاؤنٹنٹ", className: "bg-emerald-500/10 text-emerald-700 border-emerald-300/40 dark:text-emerald-400" },
  librarian: { label: "Librarian", urdu: "لائبریرین", className: "bg-cyan-500/10 text-cyan-700 border-cyan-300/40 dark:text-cyan-400" },
  receptionist: { label: "Receptionist", urdu: "استقبالیہ", className: "bg-pink-500/10 text-pink-700 border-pink-300/40 dark:text-pink-400" },
  staff: { label: "Staff", urdu: "عملہ", className: "bg-slate-500/10 text-slate-700 border-slate-300/40 dark:text-slate-400" },
  teacher: { label: "Teacher", urdu: "استاد", className: "bg-amber-500/10 text-amber-700 border-amber-300/40 dark:text-amber-400" },
  parent: { label: "Parent", urdu: "والدین", className: "bg-teal-500/10 text-teal-700 border-teal-300/40 dark:text-teal-400" },
};

type Props = { status: StatusKey; showUrdu?: boolean };

export function StatusBadge({ status, showUrdu = true }: Props) {
  const v = VARIANTS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        v.className,
      )}
    >
      {showUrdu ? (
        <span className="font-urdu text-[0.95em] leading-none">{v.urdu}</span>
      ) : (
        <span className="font-sans">{v.label}</span>
      )}
    </span>
  );
}
