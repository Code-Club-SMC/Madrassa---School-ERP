import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Grid3x3, Lock, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  createExamHall,
  generateSeatingPlan,
  getSeatingPlan,
  listExamHalls,
  lockSeatingPlan,
} from "@/components/exams/exam-api";
import type { ExamHall, ExamSystem, SeatingPlanPayload } from "@/components/exams/exam-types";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Props = {
  examId: string;
  system: ExamSystem;
};

export function ExamSeatingWorkspace({ examId, system }: Props) {
  const [payload, setPayload] = useState<SeatingPlanPayload | null>(null);
  const [halls, setHalls] = useState<ExamHall[]>([]);
  const [activeHallId, setActiveHallId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [hallOpen, setHallOpen] = useState(false);
  const [config, setConfig] = useState({ gap: 1, seed: "", allowUnseated: false, mode: "alam" as "alam" | "mixed" });
  const [hallForm, setHallForm] = useState({ name: "", nameUrdu: "", rows: 5, cols: 6 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planPayload, hallPayload] = await Promise.all([getSeatingPlan(examId), listExamHalls(system)]);
      setPayload(planPayload);
      setHalls(hallPayload.halls);
      setActiveHallId((current) => current || planPayload.plan?.halls[0]?.id || hallPayload.halls[0]?.id || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load seating");
    } finally {
      setLoading(false);
    }
  }, [examId, system]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeHall = useMemo(
    () => payload?.plan?.halls.find((hall) => hall.id === activeHallId) ?? payload?.plan?.halls[0] ?? null,
    [activeHallId, payload?.plan?.halls],
  );

  async function handleGenerate() {
    setGenerating(true);
    try {
      const next = await generateSeatingPlan(examId, {
        mode: config.mode,
        gap: config.gap,
        seed: config.seed || undefined,
        allowUnseated: config.allowUnseated,
      });
      setPayload(next);
      setActiveHallId(next.plan?.halls[0]?.id ?? "");
      setConfirmGenerate(false);
      toast.success("Seating plan generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate seating");
    } finally {
      setGenerating(false);
    }
  }

  async function handleLock() {
    if (!payload?.plan) return;
    try {
      const next = await lockSeatingPlan(examId, payload.plan.id);
      setPayload(next);
      setConfirmLock(false);
      toast.success("Seating plan locked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not lock seating plan");
    }
  }

  async function handleCreateHall() {
    if (!hallForm.name.trim()) {
      toast.error("Hall name is required");
      return;
    }
    try {
      await createExamHall({
        system,
        name: hallForm.name,
        nameUrdu: hallForm.nameUrdu || undefined,
        rows: hallForm.rows,
        cols: hallForm.cols,
        aisleEveryRow: 0,
        aisleEveryCol: 0,
      });
      toast.success("Hall created");
      setHallOpen(false);
      setHallForm({ name: "", nameUrdu: "", rows: 5, cols: 6 });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create hall");
    }
  }

  const capacity = halls.reduce((sum, hall) => sum + hall.capacity, 0);
  const seated = payload?.plan?.halls.reduce((sum, hall) => sum + hall.assignments.length, 0) ?? 0;

  return (
    <div>
      <BackLink system={system} examId={examId} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-urdu text-[28px] font-bold leading-tight">نشست بندی</h1>
          <p className="font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground">Exam Seating Plan</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {payload?.exam.name ?? "Exam"} · {payload?.exam.groupLabel ?? ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHallOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Hall
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={halls.length === 0} onClick={() => setConfirmGenerate(true)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Generate
          </Button>
          <Button size="sm" className="gap-1.5" disabled={!payload?.plan || payload.plan.status === "locked"} onClick={() => setConfirmLock(true)}>
            <Lock className="h-3.5 w-3.5" />
            Lock
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Hall Capacity" value={String(capacity)} />
        <Stat label="Seated" value={String(seated)} />
        <Stat label="Unseated" value={String(payload?.plan?.unseatedStudents.length ?? 0)} />
        <Stat label="Violations" value={String(payload?.plan?.violationCount ?? 0)} tone={(payload?.plan?.violationCount ?? 0) > 0 ? "bad" : "good"} />
      </div>

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Gap</Label>
            <Input type="number" min={1} value={config.gap} onChange={(event) => setConfig({ ...config, gap: Number(event.target.value) })} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Seed</Label>
            <Input value={config.seed} onChange={(event) => setConfig({ ...config, seed: event.target.value })} placeholder="Optional deterministic seed" />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={config.allowUnseated}
              onChange={(event) => setConfig({ ...config, allowUnseated: event.target.checked })}
            />
            Allow unseated
          </label>
        </div>
        <div className="mt-3">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Seating Mode</Label>
          <RadioGroup value={config.mode} onValueChange={(value) => setConfig({ ...config, mode: value as "alam" | "mixed" })} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="alam" id="mode-alam" />
              <Label htmlFor="mode-alam" className="text-sm font-normal">Alam</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="mixed" id="mode-mixed" />
              <Label htmlFor="mode-mixed" className="text-sm font-normal">Mixed</Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Loading seating plan...</Card>
      ) : !payload?.plan ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No seating plan generated yet. Create halls, then generate a plan.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tabs value={activeHall?.id ?? ""} onValueChange={setActiveHallId}>
                <TabsList className="h-auto flex-wrap">
                  {payload.plan.halls.map((hall) => (
                    <TabsTrigger key={hall.id} value={hall.id}>
                      {hall.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Badge variant={payload.plan.status === "locked" ? "secondary" : "outline"}>
                Version {payload.plan.version} · {payload.plan.status}
              </Badge>
            </div>
          </div>

          {activeHall && (
            <div className="overflow-auto p-4">
              <div
                className="grid min-w-[560px] gap-1"
                style={{ gridTemplateColumns: `repeat(${activeHall.cols}, minmax(92px, 1fr))` }}
              >
                {Array.from({ length: activeHall.rows * activeHall.cols }, (_, index) => {
                  const rowNo = Math.floor(index / activeHall.cols) + 1;
                  const colNo = (index % activeHall.cols) + 1;
                  const assignment = activeHall.assignments.find((item) => item.rowNo === rowNo && item.colNo === colNo);
                  return (
                    <div
                      key={`${rowNo}:${colNo}`}
                      className={cn(
                        "min-h-[74px] border border-border p-2 text-xs",
                        assignment ? "bg-background" : "bg-muted/40 text-muted-foreground",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{rowNo}-{colNo}</span>
                        {assignment && <span className="font-mono text-[10px]">{assignment.rollNo}</span>}
                      </div>
                      {assignment ? (
                        <>
                          <p className="truncate font-medium">{assignment.studentName}</p>
                          <p className="truncate font-urdu text-muted-foreground">{assignment.studentNameUrdu}</p>
                          <p className="mt-1 truncate text-[10px] text-muted-foreground">{assignment.placementLabel}</p>
                        </>
                      ) : (
                        <p className="pt-5 text-center">Empty</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      <ResponsiveDialog
        title="Add Hall"
        description="Create a reusable exam hall for this system."
        open={hallOpen}
        onOpenChange={setHallOpen}
        icon={Grid3x3}
      >
        <div className="grid gap-4 p-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={hallForm.name} onChange={(event) => setHallForm({ ...hallForm, name: event.target.value })} />
            </Field>
            <Field label="Urdu Name">
              <Input dir="rtl" className="font-urdu" value={hallForm.nameUrdu} onChange={(event) => setHallForm({ ...hallForm, nameUrdu: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rows">
              <Input type="number" min={1} value={hallForm.rows} onChange={(event) => setHallForm({ ...hallForm, rows: Number(event.target.value) })} />
            </Field>
            <Field label="Columns">
              <Input type="number" min={1} value={hallForm.cols} onChange={(event) => setHallForm({ ...hallForm, cols: Number(event.target.value) })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setHallOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreateHall()}>Create Hall</Button>
          </div>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={confirmGenerate} onOpenChange={setConfirmGenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate seating plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates a new seating version from the current roster and active halls. Existing versions remain in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={generating} onClick={() => void handleGenerate()}>
              Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmLock} onOpenChange={setConfirmLock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock seating plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Locked seating plans are treated as finalized for printing and exam operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleLock()}>Lock Plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BackLink({ system, examId }: { system: ExamSystem; examId: string }) {
  if (system === "school") {
    return (
      <Link to="/school/exams/$id" params={{ id: examId }} className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        Back to exam
      </Link>
    );
  }
  return (
    <Link to="/madrassa/exams/$id" params={{ id: examId }} className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
      Back to exam
    </Link>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-heading text-lg font-bold", tone === "good" && "text-emerald-600", tone === "bad" && "text-destructive")}>
        {value}
      </p>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
