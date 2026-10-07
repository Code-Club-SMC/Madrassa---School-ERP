import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHR } from "@/stores/hr-store";
import { useLanguage } from "@/components/language-context";
import { getUserDisplayName } from "@/lib/user-names";
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

  const getStaffName = (id: string) => {
    const s = staff.find((x) => x.id === id);
    if (!s) return id;
    return getUserDisplayName({ name: s.fullName }, isUrdu ? "ur" : "en") || s.fullName;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Management"
        titleUrdu="چھٹیاں"
        description="Approve, reject and review leave requests."
        descriptionUrdu="عملے کی چھٹیوں کی درخواستوں کا جائزہ، منظوری اور مسترد کرنا۔"
      />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isUrdu ? "عملہ" : "Staff"}</TableHead>
              <TableHead>{isUrdu ? "قسم" : "Type"}</TableHead>
              <TableHead>{isUrdu ? "از تاریخ" : "From"}</TableHead>
              <TableHead>{isUrdu ? "تا تاریخ" : "To"}</TableHead>
              <TableHead>{isUrdu ? "دن" : "Days"}</TableHead>
              <TableHead>{isUrdu ? "وجہ" : "Reason"}</TableHead>
              <TableHead>{isUrdu ? "کیفیت" : "Status"}</TableHead>
              <TableHead className="text-end">{isUrdu ? "اقدامات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((l) => {
              const typeLabel = isUrdu
                ? LEAVE_TYPE_MAP[l.leaveType]?.ur ?? l.leaveType
                : LEAVE_TYPE_MAP[l.leaveType]?.en ?? l.leaveType;
              const statusLabel = isUrdu
                ? LEAVE_STATUS_MAP[l.status]?.ur ?? l.status
                : LEAVE_STATUS_MAP[l.status]?.en ?? l.status;

              return (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{getStaffName(l.staffId)}</TableCell>
                  <TableCell>{typeLabel}</TableCell>
                  <TableCell className="font-mono text-xs">{l.fromDate}</TableCell>
                  <TableCell className="font-mono text-xs">{l.toDate}</TableCell>
                  <TableCell className="font-mono">{l.days}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{l.reason}</TableCell>
                  <TableCell>
                    <Badge
                      variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}
                    >
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end space-x-1">
                    {l.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            approveLeave(l.id);
                            toast.success(isUrdu ? "چھٹی منظور کر لی گئی" : "Leave approved");
                          }}
                        >
                          {isUrdu ? "منظور کریں" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            rejectLeave(l.id);
                            toast.success(isUrdu ? "چھٹی مسترد کر دی گئی" : "Leave rejected");
                          }}
                        >
                          {isUrdu ? "مسترد کریں" : "Reject"}
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}