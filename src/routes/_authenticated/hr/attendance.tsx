import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useHR } from "@/stores/hr-store";
import { toast } from "sonner";
import type { AttendanceRecord } from "@/lib/mock/hr";

export const Route = createFileRoute("/_authenticated/hr/attendance")({ component: HRAttendancePage });

type Row = { staffId: string; status: AttendanceRecord["status"]; checkIn?: string; checkOut?: string };

function HRAttendancePage() {
  const { staff, attendance, bulkSaveAttendance } = useHR();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const active = useMemo(() => staff.filter((s) => s.status === "active"), [staff]);
  const initial = useMemo<Row[]>(() => active.map((s) => {
    const ex = attendance.find((a) => a.staffId === s.id && a.date === date);
    return { staffId: s.id, status: ex?.status ?? "present", checkIn: ex?.checkIn, checkOut: ex?.checkOut };
  }), [active, attendance, date]);
  const [rows, setRows] = useState<Row[]>(initial);
  useEffect(() => { setRows(initial); }, [initial]);

  return (
    <div>
      <PageHeader title="Staff Attendance" titleUrdu="عملہ حاضری" description="Daily bulk entry." />
      <Card className="p-3 mb-3 flex items-center gap-3">
        <span className="text-xs">Date</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        <div className="flex-1" />
        <Button onClick={() => { bulkSaveAttendance(date, rows); toast.success("Saved"); }}>Save All</Button>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Status</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => { const s = staff.find((x) => x.id === r.staffId); return (
              <TableRow key={r.staffId}>
                <TableCell className="font-medium">{s?.fullName}</TableCell>
                <TableCell><Select value={r.status} onValueChange={(v) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, status: v as AttendanceRecord["status"] } : x))}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{["present","absent","late","half_day","leave"].map((x) => <SelectItem key={x} value={x} className="capitalize">{x.replace("_"," ")}</SelectItem>)}</SelectContent></Select></TableCell>
                <TableCell><Input type="time" value={r.checkIn ?? ""} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, checkIn: e.target.value } : x))} className="w-28" /></TableCell>
                <TableCell><Input type="time" value={r.checkOut ?? ""} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, checkOut: e.target.value } : x))} className="w-28" /></TableCell>
              </TableRow>
            ); })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}