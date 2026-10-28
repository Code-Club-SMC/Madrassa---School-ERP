import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  GraduationCap,
  Layers,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/components/language-context";

type AcademicYear = {
  id: string;
  name: string;
  hijriName: string | null;
  system: "school" | "madrassa";
  status: "active" | "archived" | "upcoming" | "locked";
  startDate: string;
  endDate: string;
};

type StudentPromotionDecision = {
  studentId: string;
  sourceEnrollmentId: string;
  outcome: "promote" | "repeat" | "graduate" | "dropout";
  targetClassId: string | null;
  targetDarja: string | null;
};

type RosterStudent = {
  studentId: string;
  enrollmentId: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  gender: string;
  rollNo: string;
  admissionNo: string;
  outstandingBalancePaisa: number;
  suggestedTargetClassId: string | null;
  suggestedOutcome: "promote" | "graduate";
};

type RosterClass = {
  id: string;
  name: string;
  nameUrdu: string;
  displayOrder: number;
  suggestedTargetClassId: string | null;
  suggestedOutcome: "promote" | "graduate";
  studentCount: number;
  students: RosterStudent[];
};

type TargetClassOption = {
  id: string;
  name: string;
  nameUrdu: string;
  displayOrder: number;
};

type RosterResponse = {
  sourceAcademicYear: AcademicYear;
  system: "school" | "madrassa";
  institutionId: string;
  institutionName: string;
  programId: string;
  programName: string;
  classes: RosterClass[];
  availableTargetClasses: TargetClassOption[];
  totalStudents: number;
  totalBalancePaisa: number;
};

export function ClassWisePromotion({
  years,
  initialSystem = "school",
}: {
  years: AcademicYear[];
  initialSystem?: "school" | "madrassa";
}) {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [system, setSystem] = useState<"school" | "madrassa">(initialSystem);
  const systemYears = useMemo(() => years.filter((y) => y.system === system), [years, system]);

  const defaultSourceYear = useMemo(() => {
    // Prefer locked or active year as source
    const locked = systemYears.find((y) => y.status === "locked");
    if (locked) return locked.id;
    const active = systemYears.find((y) => y.status === "active");
    if (active) return active.id;
    return systemYears[0]?.id ?? "";
  }, [systemYears]);

  const [sourceYearId, setSourceYearId] = useState<string>(defaultSourceYear);

  const defaultTargetYear = useMemo(() => {
    // Prefer upcoming or active year that is different from sourceYearId
    const upcoming = systemYears.find((y) => y.status === "upcoming" && y.id !== sourceYearId);
    if (upcoming) return upcoming.id;
    const active = systemYears.find((y) => y.status === "active" && y.id !== sourceYearId);
    if (active) return active.id;
    const other = systemYears.find((y) => y.id !== sourceYearId);
    return other?.id ?? "";
  }, [systemYears, sourceYearId]);

  const [targetYearId, setTargetYearId] = useState<string>(defaultTargetYear);
  const [carryForwardFees, setCarryForwardFees] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  // Student decisions map: studentId -> decision
  const [decisions, setDecisions] = useState<Record<string, StudentPromotionDecision>>({});
  const [classBatchTargets, setClassBatchTargets] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Update source/target when system changes
  useEffect(() => {
    if (systemYears.length > 0) {
      const src =
        systemYears.find((y) => y.status === "locked")?.id ??
        systemYears.find((y) => y.status === "active")?.id ??
        systemYears[0].id;
      setSourceYearId(src);

      const tgt =
        systemYears.find((y) => y.status === "upcoming" && y.id !== src)?.id ??
        systemYears.find((y) => y.status === "active" && y.id !== src)?.id ??
        systemYears.find((y) => y.id !== src)?.id ??
        "";
      setTargetYearId(tgt);
    }
  }, [system, systemYears]);

  const rosterQuery = useQuery({
    queryKey: ["promotion-roster", sourceYearId, system],
    queryFn: async (): Promise<RosterResponse> => {
      if (!sourceYearId) throw new Error("Source academic year required");
      const res = await fetch(
        `/api/promotions/roster?sourceAcademicYearId=${encodeURIComponent(sourceYearId)}&system=${system}`,
        { credentials: "include" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load class roster");
      return data;
    },
    enabled: Boolean(sourceYearId),
  });

  const roster = rosterQuery.data;

  // Initialize decisions when roster loads
  useEffect(() => {
    if (roster && roster.classes) {
      const initialDecisions: Record<string, StudentPromotionDecision> = {};
      const initialBatchTargets: Record<string, string> = {};
      const initialExpanded: Record<string, boolean> = {};

      roster.classes.forEach((c) => {
        initialBatchTargets[c.id] = c.suggestedTargetClassId || "";
        initialExpanded[c.id] = true; // expand all by default

        c.students.forEach((st) => {
          initialDecisions[st.studentId] = {
            studentId: st.studentId,
            sourceEnrollmentId: st.enrollmentId,
            outcome: st.suggestedOutcome,
            targetClassId: st.suggestedTargetClassId,
            targetDarja: null,
          };
        });
      });

      setDecisions(initialDecisions);
      setClassBatchTargets(initialBatchTargets);
      setExpandedClasses(initialExpanded);
    }
  }, [roster]);

  const setStudentOutcome = (
    studentId: string,
    sourceEnrollmentId: string,
    currentClassId: string,
    outcome: "promote" | "repeat" | "graduate" | "dropout",
    defaultTargetClassId: string | null,
  ) => {
    setDecisions((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        sourceEnrollmentId,
        outcome,
        targetClassId:
          outcome === "repeat"
            ? currentClassId
            : outcome === "promote"
              ? (prev[studentId]?.targetClassId || defaultTargetClassId)
              : null,
        targetDarja: null,
      },
    }));
  };

  const setStudentTargetClass = (
    studentId: string,
    sourceEnrollmentId: string,
    targetClassId: string,
  ) => {
    setDecisions((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        sourceEnrollmentId,
        outcome: "promote",
        targetClassId,
        targetDarja: null,
      },
    }));
  };

  const applyBatchClassTarget = (classItem: RosterClass, targetClassId: string) => {
    setDecisions((prev) => {
      const updated = { ...prev };
      classItem.students.forEach((st) => {
        updated[st.studentId] = {
          studentId: st.studentId,
          sourceEnrollmentId: st.enrollmentId,
          outcome: "promote",
          targetClassId,
          targetDarja: null,
        };
      });
      return updated;
    });
    setClassBatchTargets((prev) => ({ ...prev, [classItem.id]: targetClassId }));
    toast.success(
      t(
        `All students in ${classItem.name} mapped to target class`,
        `${classItem.nameUrdu || classItem.name} کے تمام طلبہ کو منتخب جماعت میں شامل کر دیا گیا`,
      ),
    );
  };

  const toggleClassExpand = (classId: string) => {
    setExpandedClasses((prev) => ({ ...prev, [classId]: !prev[classId] }));
  };

  // Promotion execution mutation
  const promoteMutation = useMutation({
    mutationFn: async () => {
      if (!roster) throw new Error("Roster not loaded");
      if (!targetYearId) throw new Error("Target academic year is required");
      if (sourceYearId === targetYearId) throw new Error("Source and target years must be different");

      const items = Object.values(decisions).map((d) => ({
        studentId: d.studentId,
        sourceEnrollmentId: d.sourceEnrollmentId,
        outcome: d.outcome,
        targetSchoolClassId: d.targetClassId,
        targetMadrassaSubcategoryId: d.targetClassId,
        targetDarja: d.targetDarja,
      }));

      // 1. Create preview
      const previewRes = await fetch("/api/promotions/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sourceAcademicYearId: sourceYearId,
          targetAcademicYearId: targetYearId,
          system,
          institutionId: roster.institutionId,
          programId: roster.programId,
          carryForwardFees,
          items,
        }),
      });

      const previewData = await previewRes.json();
      if (!previewRes.ok) {
        throw new Error(previewData.error || "Could not generate promotion preview");
      }

      // 2. Apply promotion run
      const runId = previewData.run?.id;
      if (!runId) throw new Error("Invalid promotion run ID");

      const applyRes = await fetch(`/api/promotions/runs/${encodeURIComponent(runId)}/apply`, {
        method: "POST",
        credentials: "include",
      });

      const applyData = await applyRes.json();
      if (!applyRes.ok) {
        throw new Error(applyData.error || "Could not apply promotion run");
      }

      return applyData;
    },
    onSuccess: async (data) => {
      toast.success(
        t(
          `Annual student promotion successfully applied! (${data.appliedCount ?? 0} students promoted)`,
          `طلباء کی سالانہ ترقی کامیابی سے مکمل ہو گئی! (${data.appliedCount ?? 0} طلبہ منتقل ہوئے)`,
        ),
      );
      setConfirmOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["promotion-roster"] }),
        queryClient.invalidateQueries({ queryKey: ["academic-years"] }),
        queryClient.invalidateQueries({ queryKey: ["classes"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
      ]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Promotion failed");
    },
  });

  // Calculate live summary counters
  const summaryCounters = useMemo(() => {
    let promote = 0;
    let repeat = 0;
    let graduate = 0;
    let dropout = 0;
    let totalDuesPaisa = 0;

    if (!roster) return { promote, repeat, graduate, dropout, totalDuesPaisa, totalStudents: 0 };

    roster.classes.forEach((c) => {
      c.students.forEach((st) => {
        const dec = decisions[st.studentId];
        if (dec) {
          if (dec.outcome === "promote") promote++;
          else if (dec.outcome === "repeat") repeat++;
          else if (dec.outcome === "graduate") graduate++;
          else if (dec.outcome === "dropout") dropout++;
        }
        if (st.outstandingBalancePaisa > 0) {
          totalDuesPaisa += st.outstandingBalancePaisa;
        }
      });
    });

    return {
      promote,
      repeat,
      graduate,
      dropout,
      totalDuesPaisa,
      totalStudents: roster.totalStudents,
    };
  }, [roster, decisions]);

  const sourceYearObj = useMemo(
    () => years.find((y) => y.id === sourceYearId),
    [years, sourceYearId],
  );
  const targetYearObj = useMemo(
    () => years.find((y) => y.id === targetYearId),
    [years, targetYearId],
  );

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <Card className="p-5 border-primary/20 bg-card shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="font-urdu text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("Annual Student Promotion & Transition", "طلباء کی سالانہ ترقی اور جماعت بندی")}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 font-urdu">
                {t(
                  "Promote students to their next class in the new academic year with carry-forward fee balances.",
                  "تعلیمی سال کے اختتام پر طلباء کو اگلی جماعت میں ترقی دیں اور بقایا فیس نئے سال میں منتقل کریں۔",
                )}
              </p>
            </div>

            {/* System Selector */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="sm"
                variant={system === "school" ? "default" : "ghost"}
                className="text-xs h-8 px-3"
                onClick={() => setSystem("school")}
              >
                {t("School", "اسکول")}
              </Button>
              <Button
                size="sm"
                variant={system === "madrassa" ? "default" : "ghost"}
                className="text-xs h-8 px-3"
                onClick={() => setSystem("madrassa")}
              >
                {t("Madrassa", "مدرسہ")}
              </Button>
            </div>
          </div>

          {/* Academic Years Selectors */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                {t("From Source Academic Year", "گزشتہ / منسوخ تعلیمی سال")}
              </Label>
              <Select value={sourceYearId} onValueChange={setSourceYearId}>
                <SelectTrigger className="mt-1.5 font-medium">
                  <SelectValue placeholder={t("Select source year", "سال منتخب کریں")} />
                </SelectTrigger>
                <SelectContent>
                  {systemYears.map((yr) => (
                    <SelectItem key={yr.id} value={yr.id}>
                      {yr.name} {yr.hijriName ? `(${yr.hijriName})` : ""}{" "}
                      <span className="text-xs text-muted-foreground">
                        [{yr.status === "active" ? t("Active", "فعال") : yr.status === "locked" ? t("Locked", "مقفل") : yr.status}]
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                {t("To Target Academic Year", "نیا تعلیمی سال (ہدف)")}
              </Label>
              <Select value={targetYearId} onValueChange={setTargetYearId}>
                <SelectTrigger className="mt-1.5 font-medium">
                  <SelectValue placeholder={t("Select target year", "نیا سال منتخب کریں")} />
                </SelectTrigger>
                <SelectContent>
                  {systemYears
                    .filter((yr) => yr.id !== sourceYearId)
                    .map((yr) => (
                      <SelectItem key={yr.id} value={yr.id}>
                        {yr.name} {yr.hijriName ? `(${yr.hijriName})` : ""}{" "}
                        <span className="text-xs text-muted-foreground">
                          [{yr.status === "active" ? t("Active", "فعال") : yr.status === "upcoming" ? t("Upcoming", "آنے والا") : yr.status}]
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={carryForwardFees}
                  onCheckedChange={(checked) => setCarryForwardFees(Boolean(checked))}
                />
                <div className="text-xs">
                  <span className="font-semibold block">
                    {t("Carry Forward Fee Dues", "بقایا جات نئے سال میں منتقل کریں")}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {t("Unpaid balances become opening charges", "غیر ادا شدہ فیس اوپننگ بیلنس بنے گی")}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Roster Loading or Error */}
      {rosterQuery.isLoading && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-urdu font-medium text-muted-foreground">
            {t("Loading classes and student rosters...", "جماعتوں اور طلباء کی فہرست لوڈ ہو رہی ہے...")}
          </p>
        </div>
      )}

      {rosterQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("Could not load roster", "فہرست لوڈ نہیں ہو سکی")}</AlertTitle>
          <AlertDescription>
            {rosterQuery.error instanceof Error ? rosterQuery.error.message : "Error"}
          </AlertDescription>
        </Alert>
      )}

      {/* Class List & Promotion Workspace */}
      {roster && (
        <div className="space-y-4">
          {/* Search & Class Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("Search student by name or roll #...", "طالب علم کا نام یا رول نمبر تلاش کریں...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 font-urdu text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="gap-1.5 py-1 px-2.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>{roster.classes.length} {t("Classes", "جماعتیں")}</span>
              </Badge>
              <Badge variant="outline" className="gap-1.5 py-1 px-2.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>{roster.totalStudents} {t("Students", "طلبہ")}</span>
              </Badge>
              {roster.totalBalancePaisa > 0 && (
                <Badge variant="outline" className="gap-1.5 py-1 px-2.5 border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Rs. {(roster.totalBalancePaisa / 100).toLocaleString()} {t("Dues", "بقایا فیس")}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Classes Cards */}
          <div className="space-y-4">
            {roster.classes.map((cls) => {
              const filteredStudents = cls.students.filter(
                (st) =>
                  !searchQuery.trim() ||
                  st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  st.nameUrdu.includes(searchQuery) ||
                  st.rollNo.includes(searchQuery) ||
                  st.admissionNo.includes(searchQuery),
              );

              if (searchQuery.trim() && filteredStudents.length === 0) return null;

              const isExpanded = expandedClasses[cls.id] ?? true;
              const batchTarget = classBatchTargets[cls.id] || "";

              return (
                <Card key={cls.id} className="overflow-hidden border shadow-sm">
                  {/* Class Card Header */}
                  <div className="bg-muted/40 p-4 border-b flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleClassExpand(cls.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-urdu font-bold text-lg">{cls.nameUrdu || cls.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {cls.students.length} {t("Students", "طلبہ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{cls.name}</p>
                      </div>
                    </div>

                    {/* Batch Promote Bar for this Class */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground font-urdu">
                        {t("Promote whole class to:", "تمام طلبہ کی اگلی جماعت:")}
                      </span>
                      <Select
                        value={batchTarget}
                        onValueChange={(val) => setClassBatchTargets((prev) => ({ ...prev, [cls.id]: val }))}
                      >
                        <SelectTrigger className="h-8 w-44 text-xs font-urdu">
                          <SelectValue placeholder={t("Select target class", "اگلی جماعت منتخب کریں")} />
                        </SelectTrigger>
                        <SelectContent>
                          {roster.availableTargetClasses.map((tc) => (
                            <SelectItem key={tc.id} value={tc.id} className="text-xs font-urdu">
                              {tc.nameUrdu || tc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs font-urdu"
                        disabled={!batchTarget}
                        onClick={() => applyBatchClassTarget(cls, batchTarget)}
                      >
                        {t("Apply to All", "تمام پر لاگو کریں")}
                      </Button>
                    </div>
                  </div>

                  {/* Class Student Table */}
                  {isExpanded && (
                    <div className="p-0 overflow-x-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground font-urdu">
                          {t("No students enrolled in this class", "اس جماعت میں کوئی طالب علم زیر تعلیم نہیں ہے")}
                        </div>
                      ) : (
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                              <th className="p-3 text-right font-semibold font-urdu">#</th>
                              <th className="p-3 text-right font-semibold font-urdu">{t("Roll / Adm", "رول / داخلہ")}</th>
                              <th className="p-3 text-right font-semibold font-urdu">{t("Student & Father", "طالب علم و والد")}</th>
                              <th className="p-3 text-right font-semibold font-urdu">{t("Fee Dues", "بقایا فیس")}</th>
                              <th className="p-3 text-right font-semibold font-urdu">{t("Decision", "ترقی کا فیصلہ")}</th>
                              <th className="p-3 text-right font-semibold font-urdu">{t("Target Class", "منتقل شدہ جماعت")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredStudents.map((st, sIdx) => {
                              const decision = decisions[st.studentId] || {
                                outcome: "promote",
                                targetClassId: cls.suggestedTargetClassId,
                              };
                              const outcome = decision.outcome;

                              return (
                                <tr key={st.studentId} className="hover:bg-muted/15 transition-colors">
                                  <td className="p-3 text-xs text-muted-foreground">{sIdx + 1}</td>
                                  <td className="p-3 text-xs font-mono">
                                    <div>{st.rollNo || "-"}</div>
                                    <div className="text-muted-foreground text-[11px]">{st.admissionNo}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-urdu font-semibold text-sm">
                                      {st.nameUrdu || st.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-urdu">
                                      {t("Father: ", "والد: ")}{st.fatherName || "-"}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {st.outstandingBalancePaisa > 0 ? (
                                      <Badge variant="outline" className="text-amber-700 bg-amber-500/10 border-amber-300 text-xs">
                                        Rs. {(st.outstandingBalancePaisa / 100).toLocaleString()}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground font-urdu">{t("None", "کوئی نہیں")}</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <Select
                                      value={outcome}
                                      onValueChange={(val: any) =>
                                        setStudentOutcome(
                                          st.studentId,
                                          st.enrollmentId,
                                          cls.id,
                                          val,
                                          cls.suggestedTargetClassId,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="h-8 w-36 text-xs font-urdu">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="promote" className="text-xs font-urdu">
                                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {t("Promote", "اگلی جماعت میں ترقی")}
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="repeat" className="text-xs font-urdu">
                                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            {t("Repeat", "اسی جماعت میں تکرار")}
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="graduate" className="text-xs font-urdu">
                                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            {t("Graduate", "فارغ التحصیل")}
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="dropout" className="text-xs font-urdu">
                                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                            <UserMinus className="h-3.5 w-3.5" />
                                            {t("Left / Dropout", "اخراج / خارج")}
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-3">
                                    {outcome === "promote" && (
                                      <Select
                                        value={decision.targetClassId || ""}
                                        onValueChange={(val) =>
                                          setStudentTargetClass(st.studentId, st.enrollmentId, val)
                                        }
                                      >
                                        <SelectTrigger className="h-8 w-44 text-xs font-urdu">
                                          <SelectValue placeholder={t("Select target class", "ہدف جماعت")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {roster.availableTargetClasses.map((tc) => (
                                            <SelectItem key={tc.id} value={tc.id} className="text-xs font-urdu">
                                              {tc.nameUrdu || tc.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                    {outcome === "repeat" && (
                                      <span className="text-xs text-muted-foreground font-urdu">
                                        {cls.nameUrdu || cls.name} {t("(Same Class)", "(اسی جماعت میں)")}
                                      </span>
                                    )}
                                    {outcome === "graduate" && (
                                      <span className="text-xs text-blue-600 font-urdu">
                                        {t("Graduating from institution", "ادارے سے فراغت")}
                                      </span>
                                    )}
                                    {outcome === "dropout" && (
                                      <span className="text-xs text-rose-600 font-urdu">
                                        {t("Marked as inactive", "خارج شدہ")}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Bottom Floating / Sticky Action Summary Bar */}
          <Card className="sticky bottom-4 z-20 p-4 border-primary/30 shadow-xl bg-card/95 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-urdu font-bold text-sm text-foreground">
                  {t("Promotion Summary:", "ترقی کا خلاصہ:")}
                </span>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-urdu">
                  {summaryCounters.promote} {t("Promoting", "ترقی پانے والے")}
                </Badge>
                {summaryCounters.repeat > 0 && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-urdu">
                    {summaryCounters.repeat} {t("Repeating", "تکرار")}
                  </Badge>
                )}
                {summaryCounters.graduate > 0 && (
                  <Badge variant="outline" className="border-blue-300 bg-blue-500/10 text-blue-800 dark:text-blue-300 font-urdu">
                    {summaryCounters.graduate} {t("Graduating", "فارغ التحصیل")}
                  </Badge>
                )}
                {carryForwardFees && summaryCounters.totalDuesPaisa > 0 && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-urdu">
                    {t("Carrying Rs.", "منتقل شدہ بقایا جات:")} {(summaryCounters.totalDuesPaisa / 100).toLocaleString()}
                  </Badge>
                )}
              </div>

              <Button
                size="default"
                className="gap-2 font-urdu font-bold px-6 shadow-md"
                disabled={summaryCounters.totalStudents === 0 || !targetYearId || promoteMutation.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                {promoteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {t("Review & Apply Annual Promotion", "سالانہ ترقی کا جائزہ لیں اور لاگو کریں")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation & Final Execution Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-lg font-urdu">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("Confirm Annual Student Promotion", "طلباء کی سالانہ ترقی کی حتمی تصدیق")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground/80 space-y-3 pt-2">
              <p>
                {t(
                  `Are you sure you want to promote students from ${sourceYearObj?.name ?? ""} to ${targetYearObj?.name ?? ""}?`,
                  `کیا آپ تعلیمی سال ${sourceYearObj?.name ?? ""} کے طلباء کو نئے تعلیمی سال ${targetYearObj?.name ?? ""} میں منتقل کرنا چاہتے ہیں؟`,
                )}
              </p>

              <div className="bg-muted/40 p-3 rounded-lg border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Total Students:", "کل طلبہ:")}</span>
                  <span className="font-bold">{summaryCounters.totalStudents}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>{t("Promoting to Next Class:", "اگلی جماعت میں ترقی:")}</span>
                  <span className="font-bold">{summaryCounters.promote}</span>
                </div>
                {summaryCounters.repeat > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>{t("Repeating Current Class:", "اسی جماعت میں تکرار:")}</span>
                    <span className="font-bold">{summaryCounters.repeat}</span>
                  </div>
                )}
                {summaryCounters.graduate > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>{t("Graduating:", "فارغ التحصیل:")}</span>
                    <span className="font-bold">{summaryCounters.graduate}</span>
                  </div>
                )}
                {carryForwardFees && summaryCounters.totalDuesPaisa > 0 && (
                  <div className="flex justify-between border-t pt-1 font-semibold text-primary">
                    <span>{t("Total Fees Carried Forward:", "منتقل شدہ بقایا فیس:")}</span>
                    <span>Rs. {(summaryCounters.totalDuesPaisa / 100).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {t(
                  "New enrollments with fresh roll numbers will be generated for the target academic year.",
                  "نئے تعلیمی سال میں تمام طلباء کے لیے نئے رول نمبرز اور داخلہ ریکارڈز خودکار طور پر تیار کیے جائیں گے۔",
                )}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={promoteMutation.isPending}>
              {t("Cancel", "منسوخ کریں")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={promoteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                promoteMutation.mutate();
              }}
              className="gap-2 bg-primary text-primary-foreground font-bold"
            >
              {promoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Applying Promotion...", "ترقی نافذ کی جا رہی ہے...")}
                </>
              ) : (
                t("Confirm & Apply Promotion", "ترقی کی تصدیق کریں اور نافذ کریں")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

