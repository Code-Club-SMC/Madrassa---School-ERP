import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ArrowLeft, Printer, Shuffle, AlertTriangle, Eraser, Minus, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { schoolClasses, students, institution } from "@/mock";

export const Route = createFileRoute("/_authenticated/school/exams/$id/seating")({
  component: SeatingPage,
});

const HALLS = ["Hall A — Ground Floor", "Hall B — First Floor", "Hall C — Library Wing", "Room 1", "Room 2"];

// chart palette tones (light + dark friendly)
const CLASS_TONES = [
  "bg-[oklch(0.92_0.06_240)] dark:bg-[oklch(0.32_0.08_240)] text-[oklch(0.30_0.12_240)] dark:text-[oklch(0.88_0.06_240)] border-[oklch(0.78_0.10_240)]",
  "bg-[oklch(0.92_0.07_150)] dark:bg-[oklch(0.30_0.08_150)] text-[oklch(0.30_0.12_150)] dark:text-[oklch(0.88_0.06_150)] border-[oklch(0.76_0.11_150)]",
  "bg-[oklch(0.93_0.08_80)] dark:bg-[oklch(0.32_0.08_80)] text-[oklch(0.34_0.12_80)] dark:text-[oklch(0.90_0.07_80)] border-[oklch(0.80_0.12_80)]",
  "bg-[oklch(0.92_0.07_330)] dark:bg-[oklch(0.32_0.08_330)] text-[oklch(0.32_0.14_330)] dark:text-[oklch(0.88_0.07_330)] border-[oklch(0.80_0.12_330)]",
  "bg-[oklch(0.92_0.07_200)] dark:bg-[oklch(0.32_0.08_200)] text-[oklch(0.30_0.12_200)] dark:text-[oklch(0.88_0.06_200)] border-[oklch(0.78_0.10_200)]",
  "bg-[oklch(0.92_0.07_25)] dark:bg-[oklch(0.32_0.08_25)] text-[oklch(0.32_0.14_25)] dark:text-[oklch(0.88_0.07_25)] border-[oklch(0.80_0.12_25)]",
];

type Cell = { seat: number; classId: string | null; studentId: string | null; rollNo: string | null; nameUrdu: string | null };

// Build a pool of students per class. Falls back to synthetic rolls when the
// mock data set is small.
function buildPools(selected: string[]) {
  const pools: Record<string, { rollNo: string; id: string; nameUrdu: string }[]> = {};
  for (const cid of selected) {
    const klass = schoolClasses.find((c) => c.id === cid);
    const real = students.filter((s) => s.system === "school" && s.classId === cid);
    const list = real.map((s) => ({ rollNo: s.rollNo, id: s.id, nameUrdu: s.nameUrdu }));
    // top up to ~24 rolls per class so we always have enough to fill the hall
    while (list.length < 24) {
      const idx = list.length + 1;
      list.push({
        id: `${cid}-synth-${idx}`,
        rollNo: `SCH-${(klass?.name ?? cid).replace(/\s+/g, "").toUpperCase()}-${idx.toString().padStart(3, "0")}`,
        nameUrdu: ["محمد", "احمد", "علی", "بلال", "زید", "حسن", "عمر"][idx % 7] + " طالبعلم",
      });
    }
    pools[cid] = list;
  }
  return pools;
}

function neighborsOf(i: number, rows: number, cols: number): number[] {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out: number[] = [];
  if (c > 0) out.push(i - 1);
  if (c < cols - 1) out.push(i + 1);
  if (r > 0) out.push(i - cols);
  if (r < rows - 1) out.push(i + cols);
  return out;
}

// Greedy placement that avoids same-class neighbors (left/right + up/down).
// Falls back to whatever class still has capacity when impossible.
function generateSeating(rows: number, cols: number, selected: string[]): { cells: Cell[]; conflicts: number } {
  const total = rows * cols;
  const pools = buildPools(selected);

  // distribute seats per class proportionally to pool sizes
  const totalPool = selected.reduce((sum, c) => sum + pools[c].length, 0) || 1;
  const quota: Record<string, number> = {};
  let assigned = 0;
  selected.forEach((c, idx) => {
    if (idx === selected.length - 1) quota[c] = total - assigned;
    else {
      const q = Math.round((pools[c].length / totalPool) * total);
      quota[c] = q;
      assigned += q;
    }
  });
  // clamp negative / overflow
  selected.forEach((c) => { if (quota[c] < 0) quota[c] = 0; });

  // Visiting order: checkerboard pass A then B reduces clustering vs row-major.
  const order: number[] = [];
  for (let parity = 0; parity < 2; parity++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (((r + c) % 2) === parity) order.push(r * cols + c);
      }
    }
  }
  // shuffle within parity for randomness
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const assignment: (string | null)[] = Array(total).fill(null);
  let conflicts = 0;

  for (const i of order) {
    const used = new Set(neighborsOf(i, rows, cols).map((n) => assignment[n]).filter(Boolean) as string[]);
    const candidates = selected
      .filter((c) => (quota[c] ?? 0) > 0 && !used.has(c))
      .sort((a, b) => (quota[b] ?? 0) - (quota[a] ?? 0));
    let pick = candidates[0];
    if (!pick) {
      // conflict — pick highest remaining capacity regardless
      pick = selected.filter((c) => (quota[c] ?? 0) > 0).sort((a, b) => (quota[b] ?? 0) - (quota[a] ?? 0))[0];
      if (pick) conflicts++;
    }
    if (pick) {
      assignment[i] = pick;
      quota[pick]--;
    }
  }

  // Local repair pass: try swapping conflicting cells with non-adjacent cells of another class
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < total; i++) {
      const cls = assignment[i];
      if (!cls) continue;
      const neigh = neighborsOf(i, rows, cols);
      const clash = neigh.some((n) => assignment[n] === cls);
      if (!clash) continue;
      // find a swap partner j whose class isn't shared with i's neighbors and vice versa
      for (let j = 0; j < total; j++) {
        if (j === i) continue;
        const cj = assignment[j];
        if (!cj || cj === cls) continue;
        const ni = neigh.filter((n) => n !== j).map((n) => assignment[n]);
        const nj = neighborsOf(j, rows, cols).filter((n) => n !== i).map((n) => assignment[n]);
        if (!ni.includes(cj) && !nj.includes(cls)) {
          assignment[i] = cj;
          assignment[j] = cls;
          break;
        }
      }
    }
  }

  // recompute conflicts post-repair
  conflicts = 0;
  for (let i = 0; i < total; i++) {
    const cls = assignment[i];
    if (!cls) continue;
    if (neighborsOf(i, rows, cols).some((n) => assignment[n] === cls)) conflicts++;
  }

  // Bind students from pools per class
  const cursors: Record<string, number> = {};
  const cells: Cell[] = assignment.map((cls, i) => {
    if (!cls) return { seat: i + 1, classId: null, studentId: null, rollNo: null, nameUrdu: null };
    const cur = cursors[cls] ?? 0;
    const pool = pools[cls];
    const stu = pool[cur % pool.length];
    cursors[cls] = cur + 1;
    return { seat: i + 1, classId: cls, studentId: stu.id, rollNo: stu.rollNo, nameUrdu: stu.nameUrdu };
  });

  return { cells, conflicts };
}

function SeatingPage() {
  const { id } = useParams({ from: "/_authenticated/school/exams/$id/seating" });
  const [hall, setHall] = useState(HALLS[0]);
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(7);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(schoolClasses.slice(0, 5).map((c) => c.id));
  const [cells, setCells] = useState<Cell[]>([]);
  const [conflicts, setConflicts] = useState(0);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);

  const classColor = useMemo(() => {
    const map: Record<string, string> = {};
    selectedClasses.forEach((c, i) => { map[c] = CLASS_TONES[i % CLASS_TONES.length]; });
    return map;
  }, [selectedClasses]);

  const regenerate = useCallback(() => {
    if (selectedClasses.length === 0) {
      toast.error("Select at least one class first");
      return;
    }
    const { cells: c, conflicts: k } = generateSeating(rows, cols, selectedClasses);
    setCells(c);
    setConflicts(k);
    setSwapIdx(null);
    if (k === 0) toast.success(`Seating generated · ${rows * cols} seats · 0 conflicts`);
    else toast.warning(`Seating generated with ${k} unavoidable adjacency conflict${k > 1 ? "s" : ""}`);
  }, [rows, cols, selectedClasses]);

  // initial generation
  useEffect(() => {
    if (cells.length === 0) regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleClass(cid: string) {
    setSelectedClasses((prev) => prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]);
  }

  function onSeatClick(i: number) {
    if (swapIdx === null) { setSwapIdx(i); return; }
    if (swapIdx === i) { setSwapIdx(null); return; }
    setCells((prev) => {
      const next = [...prev];
      const a = { ...next[swapIdx] };
      const b = { ...next[i] };
      // swap occupants, keep seat numbers
      [a.classId, b.classId] = [b.classId, a.classId];
      [a.studentId, b.studentId] = [b.studentId, a.studentId];
      [a.rollNo, b.rollNo] = [b.rollNo, a.rollNo];
      [a.nameUrdu, b.nameUrdu] = [b.nameUrdu, a.nameUrdu];
      next[swapIdx] = a;
      next[i] = b;
      // recompute conflicts
      let k = 0;
      for (let idx = 0; idx < next.length; idx++) {
        const cls = next[idx].classId;
        if (!cls) continue;
        if (neighborsOf(idx, rows, cols).some((n) => next[n].classId === cls)) k++;
      }
      setConflicts(k);
      return next;
    });
    setSwapIdx(null);
    toast.success("Seats swapped");
  }

  function clearSeats() {
    setCells([]);
    setConflicts(0);
    setSwapIdx(null);
  }

  return (
    <div>
      <Link to="/school/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 print:hidden"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exam</Link>
      <div className="print:hidden">
        <PageHeader
          title="Seating Arrangement"
          titleUrdu="نشست بندی"
          description="Configure hall layout, pick classes, then auto-arrange so no two same-class students sit next to each other (left, right, above or below). Click any two seats to swap them manually."
          actions={
            <div className="flex gap-2 items-center flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={clearSeats}><Eraser className="h-3.5 w-3.5" />Clear</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={regenerate}><Shuffle className="h-3.5 w-3.5" />Auto-arrange</Button>
              <Button size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 print:block">
        {/* Controls panel */}
        <Card className="p-4 space-y-4 print:hidden h-fit lg:sticky lg:top-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Hall · ہال</Label>
            <Select value={hall} onValueChange={setHall}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{HALLS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Rows · قطاریں" value={rows} setValue={(v) => setRows(Math.max(2, Math.min(20, v)))} />
            <Stepper label="Columns · کالم" value={cols} setValue={(v) => setCols(Math.max(2, Math.min(20, v)))} />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Classes · جماعتیں</Label>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {schoolClasses.map((c, i) => {
                const checked = selectedClasses.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-accent cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggleClass(c.id)} />
                    <span className={`inline-block h-3 w-3 rounded-sm border ${CLASS_TONES[i % CLASS_TONES.length]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">{c.name}</p>
                      <p className="font-urdu text-xs text-muted-foreground">{c.nameUrdu}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Total seats</span><span className="font-mono font-medium">{rows * cols}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Classes</span><span className="font-mono font-medium">{selectedClasses.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Adjacency conflicts</span><span className={`font-mono font-medium ${conflicts === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{conflicts}</span></div>
          </div>
          {conflicts > 0 && (
            <div className="flex gap-2 items-start text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md p-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Conflicts highlighted in red. Try auto-arrange again, fewer students from one class, or swap manually.</span>
            </div>
          )}
        </Card>

        {/* Plan */}
        <Card className="p-5 print-target overflow-hidden">
          <div className="text-center mb-4">
            <p className="font-heading text-lg font-bold">{institution.nameEnglish} · {hall}</p>
            <p className="font-urdu text-base text-muted-foreground" dir="rtl">{institution.nameUrdu} · نشست بندی</p>
            <p className="text-xs text-muted-foreground mt-1">Exam Ref: {id} · {rows} × {cols} = {rows * cols} seats</p>
          </div>

          {/* Front-of-hall marker */}
          <div className="mx-auto mb-3 w-3/5 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/60 border border-dashed border-border rounded-md py-1">
            Invigilator Desk · نگراں
          </div>

          {cells.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
              No seating plan yet. Configure the hall and click <span className="font-medium">Auto-arrange</span>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="seating-grid-print grid gap-2 mx-auto"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, minWidth: cols * 80 }}
              >
                {cells.map((cell, i) => {
                  const neigh = neighborsOf(i, rows, cols);
                  const isConflict = cell.classId && neigh.some((n) => cells[n]?.classId === cell.classId);
                  const isSwapTarget = swapIdx === i;
                  const tone = cell.classId ? classColor[cell.classId] : "bg-muted/30 border-dashed";
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => onSeatClick(i)}
                      className={`rounded-lg border p-2 text-center transition-all hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary ${tone} ${isConflict ? "ring-2 ring-destructive ring-offset-1 ring-offset-background" : ""} ${isSwapTarget ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                      aria-label={`Seat ${cell.seat}${cell.rollNo ? `, ${cell.rollNo}` : ", empty"}`}
                    >
                      <p className="font-mono font-bold text-[11px] opacity-70">#{cell.seat}</p>
                      {cell.rollNo ? (
                        <>
                          <p className="font-urdu text-xs mt-0.5 truncate" dir="rtl">{cell.nameUrdu}</p>
                          <p className="font-mono text-[9px] mt-0.5 truncate opacity-80">{cell.rollNo}</p>
                        </>
                      ) : (
                        <p className="text-[10px] mt-1 opacity-60">empty</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          {cells.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-2 justify-center">
              {selectedClasses.map((cid, i) => {
                const cls = schoolClasses.find((c) => c.id === cid);
                const used = cells.filter((c) => c.classId === cid).length;
                return (
                  <Badge key={cid} variant="outline" className={`gap-1.5 ${CLASS_TONES[i % CLASS_TONES.length]}`}>
                    <span className="font-medium">{cls?.name}</span>
                    <span className="font-urdu text-[11px]" dir="rtl">{cls?.nameUrdu}</span>
                    <span className="font-mono text-[10px] opacity-80">· {used}</span>
                  </Badge>
                );
              })}
            </div>
          )}

          <p className="text-center text-[10px] text-muted-foreground mt-3">
            {swapIdx !== null ? "Click another seat to swap, or click the same seat to cancel." : "Tip: click any two seats to swap them manually."}
          </p>
        </Card>
      </div>
    </div>
  );
}

function Stepper({ label, value, setValue }: { label: string; value: number; setValue: (v: number) => void }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1.5 flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setValue(value - 1)}><Minus className="h-3.5 w-3.5" /></Button>
        <Input
          type="number"
          value={value}
          min={2}
          max={20}
          onChange={(e) => setValue(parseInt(e.target.value || "0", 10) || 0)}
          className="text-center font-mono"
        />
        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setValue(value + 1)}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}