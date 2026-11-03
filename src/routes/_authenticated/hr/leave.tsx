import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHR } from "@/stores/hr-store";
import { useLanguage } from "@/components/language-context";
import { getUserDisplayName } from "@/lib/user-names";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/leave")({ component: LeavePage });

const LEAVE_TYPE_MAP: Record<string, { en: string; ur: string }> = {
  sick: { en: "Sick", ur: "بیماری" },
  annual: { en: "Annual", ur: "سالانہ" },
  emergency: { en: "Emergency", ur: "ہنگامی" },
  unpaid: { en: "Unpaid", ur: "بلا تنخواہ" },
};

const LEAVE_STATUS_MAP: Record<string, { en: string; ur: string }> = {
  approved: { en: "Approved", ur: "منظور شدہ" },
  rejected: { en: "Rejected", ur: "مسترد شدہ" },
  pending: { en: "Pending", ur: "زیرِ التواء" },
};

function LeavePage() {
  const { staff, leaves, approveLeave, rejectLeave } = useHR();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getStaffName = (id: string, l?: any) => {
    if (l?.staffName) return l.staffName;
    const s = staff.find((x) => x.id === id || (x.userId && x.userId === id));
    if (!s) return id;
    return getUserDisplayName({ name: s.fullName }, isUrdu ? "ur" : "en") || s.fullName;
  };

  const getStaffDepartment = (id: string) => {
    const s = staff.find((x) => x.id === id || (x.userId && x.userId === id));
    return s?.department || s?.designation || (isUrdu ? "تدریسی شعبہ" : "Academic Staff");
  };

  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected").length;

  const filteredLeaves = statusFilter === "all" ? leaves : leaves.filter((l) => l.status === statusFilter);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Management"
        titleUrdu="چھٹیاں و رخصت انتظامیہ"
        description="Approve, reject and review leave requests from teachers and staff."
        descriptionUrdu="اساتذہ اور عملے کی چھٹیوں کی درخواستوں کا جائزہ، منظوری اور انتظام۔"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <p className="text-xs text-muted-foreground">{isUrdu ? "کل درخواستیں" : "Total Requests"}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{totalLeaves}</p>
        </Card>
        <Card className="p-3.5 border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/10">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{isUrdu ? "زیرِ التواء" : "Pending Review"}</p>
          <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400 tabular-nums">{pendingLeaves}</p>
        </Card>
        <Card className="p-3.5 border-emerald-300/40 bg-emerald-50/30 dark:bg-emerald-950/10">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{isUrdu ? "منظور شدہ" : "Approved"}</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">{approvedLeaves}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-muted-foreground">{isUrdu ? "مسترد شدہ" : "Rejected"}</p>
          <p className="text-2xl font-bold mt-1 text-muted-foreground tabular-nums">{rejectedLeaves}</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b pb-2">
        {(["all", "pending", "approved", "rejected"] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === st
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {st === "all"
              ? (isUrdu ? `تمام (${totalLeaves})` : `All (${totalLeaves})`)
              : st === "pending"
              ? (isUrdu ? `زیرِ التواء (${pendingLeaves})` : `Pending (${pendingLeaves})`)
              : st === "approved"
              ? (isUrdu ? `منظور شدہ (${approvedLeaves})` : `Approved (${approvedLeaves})`)
              : (isUrdu ? `مسترد (${rejectedLeaves})` : `Rejected (${rejectedLeaves})`)}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>{isUrdu ? "استاد / عملہ" : "Staff / Teacher"}</TableHead>
              <TableHead>{isUrdu ? "قسم" : "Type"}</TableHead>
              <TableHead>{isUrdu ? "تاریخ" : "Dates"}</TableHead>
              <TableHead className="text-center">{isUrdu ? "دن" : "Days"}</TableHead>
              <TableHead>{isUrdu ? "وجہ" : "Reason"}</TableHead>
              <TableHead>{isUrdu ? "کیفیت" : "Status"}</TableHead>
              <TableHead className="text-end">{isUrdu ? "اقدامات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeaves.length === 0 ? (
              <TableRow>
                <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                  {isUrdu ? "اس زمرے میں کوئی چھٹی کی درخواست نہیں" : "No leave requests in this category."}
                </td>
              </TableRow>
            ) : (
              filteredLeaves.map((l) => {
                const typeLabel = isUrdu
                  ? LEAVE_TYPE_MAP[l.leaveType]?.ur ?? l.leaveType
                  : LEAVE_TYPE_MAP[l.leaveType]?.en ?? l.leaveType;
                const statusLabel = isUrdu
                  ? LEAVE_STATUS_MAP[l.status]?.ur ?? l.status
                  : LEAVE_STATUS_MAP[l.status]?.en ?? l.status;

                return (
                  <TableRow key={l.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <p className="font-medium">{getStaffName(l.staffId, l)}</p>
                      <p className="text-[10px] text-muted-foreground">{getStaffDepartment(l.staffId)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.fromDate === l.toDate || !l.toDate ? l.fromDate : `${l.fromDate} → ${l.toDate}`}
                    </TableCell>
                    <TableCell className="font-mono text-center tabular-nums font-semibold">{l.days}</TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate" title={l.reason}>
                      {l.reason}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "approved"
                            ? "default"
                            : l.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          l.status === "approved"
                            ? "bg-emerald-600 text-white"
                            : l.status === "pending"
                            ? "bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-400"
                            : ""
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end space-x-1">
                      {l.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={processingId === l.id}
                            onClick={() => {
                              setProcessingId(l.id);
                              try {
                                approveLeave(l.id);
                                toast.success(isUrdu ? "چھٹی منظور کر لی گئی" : "Leave approved");
                              } finally {
                                setProcessingId(null);
                              }
                            }}
                          >
                            {processingId === l.id && <Loader2 className="h-3 w-3 animate-spin me-1" />}
                            {isUrdu ? "منظور کریں" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            disabled={processingId === l.id}
                            onClick={() => {
                              setProcessingId(l.id);
                              try {
                                rejectLeave(l.id);
                                toast.success(isUrdu ? "چھٹی مسترد کر دی گئی" : "Leave rejected");
                              } finally {
                                setProcessingId(null);
                              }
                            }}
                          >
                            {processingId === l.id && <Loader2 className="h-3 w-3 animate-spin me-1" />}
                            {isUrdu ? "مسترد کریں" : "Reject"}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}