import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { CheckCheck, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useHR } from "@/stores/hr-store";
import { useLanguage } from "@/components/language-context";
import { getUserDisplayName } from "@/lib/user-names";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/attendance")({ component: HRAttendancePage });

type AttendanceStatusOption = "present" | "absent" | "leave";

type Row = {
  staffId: string;
  status: AttendanceStatusOption;
};

function normalizeStatus(status?: string): AttendanceStatusOption {
  if (status === "absent") return "absent";
  if (status === "leave") return "leave";
  return "present";
}

function HRAttendancePage() {
  const { staff, attendance, bulkSaveAttendance } = useHR();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const activeStaff = useMemo(() => staff.filter((s) => s.status === "active"), [staff]);

  const initialRows = useMemo<Row[]>(() => {
    return activeStaff.map((s) => {
      const ex = attendance.find((a) => a.staffId === s.id && a.date === date);
      return {
        staffId: s.id,
        status: normalizeStatus(ex?.status),
      };
    });
  }, [activeStaff, attendance, date]);

  const [rows, setRows] = useState<Row[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const presentCount = rows.filter((r) => r.status === "present").length;
  const absentCount = rows.filter((r) => r.status === "absent").length;
  const leaveCount = rows.filter((r) => r.status === "leave").length;

  const handleMarkAllPresent = () => {
    setRows((prev) => prev.map((r) => ({ ...r, status: "present" })));
    toast.info(isUrdu ? "تمام عملہ حاضر نشان زد کر دیا گیا" : "Marked all staff as present");
  };

  const handleSaveAll = () => {
    bulkSaveAttendance(
      date,
      rows.map((r) => ({
        staffId: r.staffId,
        status: r.status,
      })),
    );
    toast.success(isUrdu ? "عملہ حاضری کامیابی سے محفوظ ہو گئی" : "Staff attendance saved successfully");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff Attendance"
        titleUrdu="عملہ حاضری"
        description="Daily bulk entry."
      />

      {/* Date & Actions Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {isUrdu ? "تاریخ" : "Date"}
          </span>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>

        {/* Attendance Summary Badges */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{isUrdu ? "حاضر:" : "Present:"}</span>
            <span className="font-bold">{presentCount}</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>{isUrdu ? "غیر حاضر:" : "Absent:"}</span>
            <span className="font-bold">{absentCount}</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>{isUrdu ? "رخصت:" : "Leave:"}</span>
            <span className="font-bold">{leaveCount}</span>
          </Badge>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllPresent}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            <span>{isUrdu ? "تمام حاضر کریں" : "Mark All Present"}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAll}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>{isUrdu ? "محفوظ کریں" : "Save All"}</span>
          </Button>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">{isUrdu ? "عملہ" : "Staff"}</TableHead>
              <TableHead className="w-1/2">{isUrdu ? "کیفیت" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const s = staff.find((x) => x.id === r.staffId);
              const displayName = s
                ? getUserDisplayName({ name: s.fullName }, isUrdu ? "ur" : "en") || s.fullName
                : r.staffId;

              return (
                <TableRow key={r.staffId}>
                  <TableCell>
                    <div className="font-medium text-foreground">{displayName}</div>
                    {s && (
                      <div className="text-xs text-muted-foreground">
                        {s.designation} · {s.department}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        setRows((prev) =>
                          prev.map((x, idx) =>
                            idx === i ? { ...x, status: v as AttendanceStatusOption } : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>{isUrdu ? "حاضر" : "Present"}</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="absent">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span>{isUrdu ? "غیر حاضر" : "Absent"}</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="leave">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span>{isUrdu ? "رخصت" : "Leave"}</span>
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
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