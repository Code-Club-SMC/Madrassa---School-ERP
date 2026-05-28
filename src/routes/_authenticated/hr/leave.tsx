import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHR } from "@/stores/hr-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/leave")({ component: LeavePage });

function LeavePage() {
  const { staff, leaves, approveLeave, rejectLeave } = useHR();
  const nameOf = (id: string) => staff.find((s) => s.id === id)?.fullName ?? id;
  return (
    <div>
      <PageHeader title="Leave Management" titleUrdu="چھٹیاں" description="Approve, reject and review leave requests." />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead className="text-end">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {leaves.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{nameOf(l.staffId)}</TableCell><TableCell className="capitalize">{l.leaveType}</TableCell><TableCell>{l.fromDate}</TableCell><TableCell>{l.toDate}</TableCell><TableCell>{l.days}</TableCell><TableCell className="text-xs max-w-[200px] truncate">{l.reason}</TableCell><TableCell><Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge></TableCell>
                <TableCell className="text-end space-x-1">
                  {l.status === "pending" && <><Button size="sm" onClick={() => { approveLeave(l.id); toast.success("Approved"); }}>Approve</Button><Button size="sm" variant="outline" onClick={() => { rejectLeave(l.id); toast.success("Rejected"); }}>Reject</Button></>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}