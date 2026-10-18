import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { CheckCheck, Save, RotateCw, Search, Loader2, Users } from "lucide-react";
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
  const { staff, attendance, bulkSaveAttendance, isLoadingStaff, refreshStaff } = useHR();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | "school" | "madrassa">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "teacher" | "staff">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeStaff = useMemo(() => staff.filter((s) => s.status === "active"), [staff]);

  const initialRows = useMemo<Row[]>(() => {
    return activeStaff.map((s) => {
      const ex = attendance.find(
        (a) => (a.staffId === s.id || (s.userId && a.staffId === s.userId)) && a.date === date,
      );
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

  const rowMap = useMemo(() => new Map(rows.map((r) => [r.staffId, r])), [rows]);

  const filteredStaff = useMemo(() => {
    return activeStaff.filter((s) => {
      if (moduleFilter !== "all" && s.module !== moduleFilter && s.module !== "shared") {
        return false;
      }
      if (typeFilter === "teacher" && s.staffType !== "teacher") {
        return false;
      }
      if (typeFilter === "staff" && s.staffType === "teacher") {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesDesignation = s.designation.toLowerCase().includes(q);
        const matchesDept = s.department.toLowerCase().includes(q);
        if (!matchesName && !matchesDesignation && !matchesDept) return false;
      }
      return true;
    });
  }, [activeStaff, moduleFilter, typeFilter, searchQuery]);

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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStaff();
      toast.success(isUrdu ? "عملہ کی معلومات تازہ کر دی گئی" : "Staff list refreshed from system");
    } catch {
      toast.error(isUrdu ? "تازہ کاری ناکام ہو گئی" : "Failed to refresh staff");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff Attendance"
        titleUrdu="عملہ حاضری"
        description="Daily bulk entry for teachers and staff members."
        descriptionUrdu="اساتذہ اور عملے کے لیے روزانہ بلک حاضری کا اندراج۔"
      />

      {/* Date & Actions Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {isUrdu ? "تاریخ:" : "Date:"}
            </span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 h-9"
            />
          </div>

          {/* Module Filter */}
          <Select value={moduleFilter} onValueChange={(v: any) => setModuleFilter(v)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isUrdu ? "تمام شعبے" : "All Branches"}</SelectItem>
              <SelectItem value="school">{isUrdu ? "اسکول" : "School"}</SelectItem>
              <SelectItem value="madrassa">{isUrdu ? "مدرسہ" : "Madrassa"}</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isUrdu ? "تمام عملہ" : "All Personnel"}</SelectItem>
              <SelectItem value="teacher">{isUrdu ? "صرف اساتذہ" : "Teachers Only"}</SelectItem>
              <SelectItem value="staff">{isUrdu ? "انتظامی عملہ" : "Admin & Staff"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Attendance Summary Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-slate-500/30 bg-muted text-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{isUrdu ? "کل:" : "Total:"}</span>
            <span className="font-bold">{rows.length}</span>
          </Badge>
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
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingStaff}
            className="gap-1.5 h-9"
            title={isUrdu ? "عملہ تازہ کریں" : "Refresh Staff"}
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isUrdu ? "تازہ کریں" : "Refresh"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllPresent}
            className="gap-1.5 h-9"
          >
            <CheckCheck className="h-4 w-4" />
            <span>{isUrdu ? "تمام حاضر کریں" : "Mark All Present"}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAll}
            className="gap-1.5 h-9"
          >
            <Save className="h-4 w-4" />
            <span>{isUrdu ? "محفوظ کریں" : "Save All"}</span>
          </Button>
        </div>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isUrdu ? "نام یا عہدے سے تلاش کریں..." : "Search staff by name, designation, or department..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9 h-10"
        />
      </div>

      {/* Attendance Table or State */}
      <Card className="overflow-hidden">
        {isLoadingStaff && activeStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {isUrdu ? "عملہ اور اساتذہ لوڈ ہو رہے ہیں..." : "Loading staff members and teachers..."}
            </p>
          </div>
        ) : activeStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                {isUrdu ? "کوئی فعال عملہ نہیں ملا" : "No active staff members found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {isUrdu
                  ? "اس بات کو یقینی بنائیں کہ سسٹم میں اساتذہ یا عملے کے اکاؤنٹس رجسٹرڈ ہیں۔"
                  : "Ensure teachers or staff accounts are registered in the system."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleManualRefresh} className="gap-2">
              <RotateCw className="h-4 w-4" />
              <span>{isUrdu ? "دوبارہ کوشش کریں" : "Refresh Staff List"}</span>
            </Button>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {isUrdu ? "آپ کی تلاش یا فلٹر کے مطابق کوئی عملہ نہیں ملا۔" : "No staff members matched your search or filter."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">{isUrdu ? "عملہ" : "Staff"}</TableHead>
                <TableHead className="w-1/2">{isUrdu ? "کیفیت" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((s) => {
                const currentStatus = rowMap.get(s.id)?.status || "present";
                const displayName = getUserDisplayName({ name: s.fullName }, isUrdu ? "ur" : "en") || s.fullName;

                const isTeacher = s.staffType === "teacher";
                const moduleLabel =
                  s.module === "school"
                    ? isUrdu ? "اسکول" : "School"
                    : s.module === "madrassa"
                      ? isUrdu ? "مدرسہ" : "Madrassa"
                      : isUrdu ? "مشترکہ" : "Shared";

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{displayName}</span>
                        {isTeacher ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400">
                            {isUrdu ? "استاد" : "Teacher"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400">
                            {isUrdu ? "عملہ" : "Staff"}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {moduleLabel}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.designation} {s.department ? `· ${s.department}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentStatus}
                        onValueChange={(v) => {
                          setRows((prev) =>
                            prev.map((r) =>
                              r.staffId === s.id ? { ...r, status: v as AttendanceStatusOption } : r,
                            ),
                          );
                        }}
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
        )}
      </Card>
    </div>
  );
}