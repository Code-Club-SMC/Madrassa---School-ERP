import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Shuffle, RefreshCw, AlertTriangle, CheckCircle2, Settings2, Plus, Pencil, Trash2, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  buildHallSeating,
  countViolations,
  isViolation,
  type HallSeating,
  type SeatingConfig,
} from "@/lib/seating";
import { mockGrades } from "@/lib/mock/seating";
import { loadHalls, saveHalls, studentsForHalls, makeHallId, type Hall } from "@/lib/halls-storage";

const GRADE_TONES: { bg: string; border: string; text: string }[] = [
  { bg: "bg-sky-100 dark:bg-sky-950/60", border: "border-sky-300 dark:border-sky-700", text: "text-sky-900 dark:text-sky-100" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/60", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-900 dark:text-emerald-100" },
  { bg: "bg-amber-100 dark:bg-amber-950/60", border: "border-amber-300 dark:border-amber-700", text: "text-amber-900 dark:text-amber-100" },
  { bg: "bg-pink-100 dark:bg-pink-950/60", border: "border-pink-300 dark:border-pink-700", text: "text-pink-900 dark:text-pink-100" },
  { bg: "bg-violet-100 dark:bg-violet-950/60", border: "border-violet-300 dark:border-violet-700", text: "text-violet-900 dark:text-violet-100" },
];

function toneFor(gradeId: number) {
  const idx = mockGrades.findIndex((g) => g.id === gradeId);
  return GRADE_TONES[(idx < 0 ? 0 : idx) % GRADE_TONES.length];
}

type Props = {
  examId: string;
  module: "school" | "madrassa";
};

export function ExamSeating({ examId, module }: Props) {
  const [hallDefs, setHallDefs] = useState<Hall[]>(() => loadHalls(module));
  const [config, setConfig] = useState<Pick<SeatingConfig, "gap" | "cellSizePx">>({
    gap: 1,
    cellSizePx: 72,
  });
  const [activeHallId, setActiveHallId] = useState(() => hallDefs[0]?.id ?? "");
  const [showViolations, setShowViolations] = useState(true);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [hallDialogOpen, setHallDialogOpen] = useState(false);

  // persist on every change
  useEffect(() => {
    saveHalls(module, hallDefs);
    if (!hallDefs.find((h) => h.id === activeHallId) && hallDefs[0]) {
      setActiveHallId(hallDefs[0].id);
    }
  }, [hallDefs, module, activeHallId]);

  const studentsPerHall = useMemo(() => studentsForHalls(hallDefs), [hallDefs]);

  const halls: HallSeating[] = useMemo(() => {
    void shuffleKey;
    return hallDefs.map((h) =>
      buildHallSeating(h.id, h.name, h.rows, h.cols, studentsPerHall[h.id] ?? [], config.gap),
    );
  }, [hallDefs, studentsPerHall, config.gap, shuffleKey]);

  const active = halls.find((h) => h.hallId === activeHallId) ?? halls[0];
  const activeDef = hallDefs.find((h) => h.id === (active?.hallId ?? "")) ?? hallDefs[0];
  const totalViolations = halls.reduce((sum, h) => sum + countViolations(h.grid, h.rows, h.cols, config.gap), 0);
  const numGrades = mockGrades.length;
  const feasible = config.gap < numGrades;

  const regenerate = useCallback(() => setShuffleKey((k) => k + 1), []);

  // tooltip
  const [tip, setTip] = useState<{ x: number; y: number; text: string; gradeId: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function patchActiveHall(patch: Partial<Hall>) {
    if (!activeDef) return;
    setHallDefs((prev) => prev.map((h) => (h.id === activeDef.id ? { ...h, ...patch } : h)));
  }

  function addHall(input: Omit<Hall, "id">) {
    const id = makeHallId(input.name);
    setHallDefs((prev) => [...prev, { ...input, id }]);
    setActiveHallId(id);
    toast.success(`Hall "${input.name}" added`);
  }

  function updateHall(id: string, patch: Partial<Hall>) {
    setHallDefs((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
    toast.success("Hall updated");
  }

  function deleteHall(id: string) {
    setHallDefs((prev) => (prev.length <= 1 ? prev : prev.filter((h) => h.id !== id)));
    toast.success("Hall removed");
  }

  return (
    <div>
      <PageHeader
        title="Exam Seating Plan"
        titleUrdu="نشست بندی"
        description={`Exam ${examId} · ${module === "school" ? "School" : "Madrassa"} module · auto-arranged so neighbouring seats never share a grade.`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {totalViolations === 0 ? (
              <Badge className="gap-1.5 bg-emerald-600 hover:bg-emerald-600 text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> All Constraints Met
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> {totalViolations} Violation{totalViolations > 1 ? "s" : ""}
              </Badge>
            )}
            <Dialog open={hallDialogOpen} onOpenChange={setHallDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" /> Manage Halls
                </Button>
              </DialogTrigger>
              <HallManagerDialog
                halls={hallDefs}
                onAdd={addHall}
                onUpdate={updateHall}
                onDelete={deleteHall}
              />
            </Dialog>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={regenerate}>
              <Shuffle className="h-3.5 w-3.5" /> Shuffle
            </Button>
            <Button size="sm" className="gap-1.5" onClick={regenerate}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        }
      />

      {!feasible && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>
            <p className="font-medium">Constraint may be infeasible</p>
            <p className="text-xs opacity-90">Gap ({config.gap}) is ≥ number of grades ({numGrades}). Some adjacency violations are unavoidable; using best-effort placement.</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <NumberCtl label="Gap" value={config.gap} min={1} max={4} onChange={(v) => setConfig((c) => ({ ...c, gap: v }))} />
          <NumberCtl label="Rows" value={activeDef?.rows ?? 0} min={2} max={24} onChange={(v) => patchActiveHall({ rows: v })} />
          <NumberCtl label="Cols" value={activeDef?.cols ?? 0} min={2} max={24} onChange={(v) => patchActiveHall({ cols: v })} />
          <NumberCtl label="Aisle/Row" value={activeDef?.aisleEveryRow ?? 3} min={0} max={10} onChange={(v) => patchActiveHall({ aisleEveryRow: v })} />
          <NumberCtl label="Aisle/Col" value={activeDef?.aisleEveryCol ?? 4} min={0} max={10} onChange={(v) => patchActiveHall({ aisleEveryCol: v })} />
          <NumberCtl label="Cell px" value={config.cellSizePx} min={48} max={120} step={4} onChange={(v) => setConfig((c) => ({ ...c, cellSizePx: v }))} />
          <label className="flex items-end gap-2 pb-1">
            <Checkbox checked={showViolations} onCheckedChange={(v) => setShowViolations(Boolean(v))} />
            <span className="text-xs">Highlight violations</span>
          </label>
        </div>
      </Card>

      {/* Hall tabs */}
      <Tabs value={activeHallId} onValueChange={setActiveHallId} className="mb-4">
        <TabsList className="flex flex-wrap h-auto">
          {halls.map((h) => (
            <TabsTrigger key={h.hallId} value={h.hallId} className="gap-2">
              {h.hallName}
              <Badge variant="secondary" className="ml-1">{h.students.length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Grid */}
        <Card className="p-5 overflow-auto" ref={wrapRef}>
          <div className="text-center mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground bg-muted/50 border border-dashed border-border rounded-md py-1">
            Invigilator Desk · نگراں
          </div>
          {active && activeDef && (
            <SeatingGrid
              hall={active}
              config={{
                ...config,
                rows: activeDef.rows,
                cols: activeDef.cols,
                aisleEveryRow: activeDef.aisleEveryRow,
                aisleEveryCol: activeDef.aisleEveryCol,
              }}
              showViolations={showViolations}
              onTip={setTip}
            />
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Grade Legend</p>
            <div className="space-y-1.5">
              {mockGrades.map((g) => {
                const count = active?.students.filter((s) => s.gradeId === g.id).length ?? 0;
                const tone = toneFor(g.id);
                return (
                  <div key={g.id} className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded border ${tone.bg} ${tone.border} ${tone.text}`}>{g.label}</span>
                    <span className="font-mono text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Hall Stats</p>
            {active && <HallStats hall={active} />}
          </Card>

          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Constraints</p>
            <ul className="text-xs space-y-1">
              <li className="flex justify-between"><span className="text-muted-foreground">Gap</span><span className="font-mono">{config.gap}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Row step</span><span className="font-mono">{active?.rowStep}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Col period</span><span className="font-mono">{active?.colPeriod}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Hall violations</span><span className={`font-mono ${active && countViolations(active.grid, active.rows, active.cols, config.gap) === 0 ? "text-emerald-600" : "text-destructive"}`}>{active ? countViolations(active.grid, active.rows, active.cols, config.gap) : 0}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Total violations</span><span className={`font-mono ${totalViolations === 0 ? "text-emerald-600" : "text-destructive"}`}>{totalViolations}</span></li>
            </ul>
            <p className="mt-3 text-[10px] text-muted-foreground leading-snug">Algorithm: slot = (row × rowStep + col) % numGrades. Row step chosen so colPeriod &gt; gap, guaranteeing horizontal &amp; vertical separation.</p>
          </Card>
        </div>
      </div>

      {tip && (
        <div
          className={`fixed z-50 pointer-events-none rounded-md border ${toneFor(tip.gradeId).border} ${toneFor(tip.gradeId).bg} ${toneFor(tip.gradeId).text} px-2.5 py-1.5 text-xs shadow-lg`}
          style={{ left: tip.x + 14, top: tip.y + 14 }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}

function HallStats({ hall }: { hall: HallSeating }) {
  const capacity = hall.rows * hall.cols;
  const seated = hall.grid.flat().filter(Boolean).length;
  const empty = capacity - seated;
  const pct = Math.round((seated / capacity) * 100);
  return (
    <ul className="text-xs space-y-1">
      <li className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span className="font-mono">{capacity}</span></li>
      <li className="flex justify-between"><span className="text-muted-foreground">Seated</span><span className="font-mono">{seated}</span></li>
      <li className="flex justify-between"><span className="text-muted-foreground">Empty</span><span className="font-mono">{empty}</span></li>
      <li className="mt-2">
        <div className="flex justify-between mb-1"><span className="text-muted-foreground">Fill</span><span className="font-mono">{pct}%</span></div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
      </li>
    </ul>
  );
}

function SeatingGrid({
  hall,
  config,
  showViolations,
  onTip,
}: {
  hall: HallSeating;
  config: SeatingConfig;
  showViolations: boolean;
  onTip: (t: { x: number; y: number; text: string; gradeId: number } | null) => void;
}) {
  const { rows, cols, grid } = hall;
  return (
    <div className="inline-block">
      {/* Column axis labels */}
      <div className="flex gap-1.5 pl-7 mb-1.5">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="text-[10px] text-muted-foreground font-mono text-center" style={{ width: config.cellSizePx }}>
            {c + 1}
            {config.aisleEveryCol > 0 && (c + 1) % config.aisleEveryCol === 0 && c < cols - 1 ? <span className="inline-block w-2" /> : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r}>
            <div className="flex gap-1.5 items-center">
              <div className="w-5 text-[10px] text-muted-foreground font-mono text-end">{r + 1}</div>
              <div className="flex gap-1.5">
                {Array.from({ length: cols }).map((_, c) => {
                  const s = grid[r][c];
                  const violation = showViolations && isViolation(grid, r, c, config.gap);
                  const tone = s ? toneFor(s.gradeId) : null;
                  return (
                    <div key={c} className="flex">
                      <button
                        type="button"
                        onMouseEnter={(e) => {
                          if (!s) return;
                          onTip({ x: e.clientX, y: e.clientY, text: `${s.name} · ${s.gradeLabel} · Roll ${s.rollNo} · ${hall.hallName} · Row ${r + 1} / Col ${c + 1}`, gradeId: s.gradeId });
                        }}
                        onMouseMove={(e) => {
                          if (!s) return;
                          onTip({ x: e.clientX, y: e.clientY, text: `${s.name} · ${s.gradeLabel} · Roll ${s.rollNo} · ${hall.hallName} · Row ${r + 1} / Col ${c + 1}`, gradeId: s.gradeId });
                        }}
                        onMouseLeave={() => onTip(null)}
                        className={`rounded-md flex flex-col items-center justify-center transition-all hover:z-20 hover:shadow-lg hover:scale-[1.08] focus:outline-none ${
                          s
                            ? `${tone!.bg} ${tone!.border} ${tone!.text} border`
                            : "border border-dashed border-border bg-muted/30"
                        } ${violation ? "outline outline-2 outline-destructive" : ""}`}
                        style={{ width: config.cellSizePx, height: config.cellSizePx }}
                        aria-label={s ? `${s.name}, Roll ${s.rollNo}, ${s.gradeLabel}` : `Empty seat row ${r + 1} column ${c + 1}`}
                      >
                        {s ? (
                          <>
                            <span className="font-mono font-bold text-[11px]">{s.rollNo}</span>
                            <span className="text-[9px] opacity-80 mt-0.5">{s.gradeLabel}</span>
                          </>
                        ) : null}
                      </button>
                      {config.aisleEveryCol > 0 && (c + 1) % config.aisleEveryCol === 0 && c < cols - 1 && (
                        <div className="w-2 self-stretch" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {config.aisleEveryRow > 0 && (r + 1) % config.aisleEveryRow === 0 && r < rows - 1 && (
              <div className="h-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberCtl({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => {
          const v = parseInt(e.target.value || "0", 10);
          if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="mt-1 h-8 text-sm font-mono"
      />
    </div>
  );
}

function HallManagerDialog({
  halls,
  onAdd,
  onUpdate,
  onDelete,
}: {
  halls: Hall[];
  onAdd: (h: Omit<Hall, "id">) => void;
  onUpdate: (id: string, patch: Partial<Hall>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Hall, "id">>({
    name: "",
    nameUrdu: "",
    rows: 6,
    cols: 8,
    aisleEveryRow: 3,
    aisleEveryCol: 4,
  });

  function reset() {
    setEditing(null);
    setDraft({ name: "", nameUrdu: "", rows: 6, cols: 8, aisleEveryRow: 3, aisleEveryCol: 4 });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    if (editing) onUpdate(editing, draft);
    else onAdd(draft);
    reset();
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex flex-col gap-0.5">
          <span dir="rtl" lang="ur" className="font-urdu text-lg">ہالز کا انتظام</span>
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-normal">Manage Examination Halls</span>
        </DialogTitle>
        <DialogDescription className="text-xs">
          Add, edit or remove halls. Configure rows, columns and aisle spacing per hall.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-md border divide-y max-h-64 overflow-auto">
        {halls.map((h) => (
          <div key={h.id} className="flex items-center gap-3 p-2.5 text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{h.name}</div>
              {h.nameUrdu && <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground truncate">{h.nameUrdu}</div>}
              <div className="text-[11px] text-muted-foreground font-mono">
                {h.rows}×{h.cols} · aisle r/{h.aisleEveryRow} c/{h.aisleEveryCol} · cap {h.rows * h.cols}
              </div>
            </div>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(h.id); setDraft({ name: h.name, nameUrdu: h.nameUrdu, rows: h.rows, cols: h.cols, aisleEveryRow: h.aisleEveryRow, aisleEveryCol: h.aisleEveryCol }); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={halls.length <= 1} onClick={() => onDelete(h.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3 border-t pt-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {editing ? "Edit Hall" : "Add New Hall"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Name (English)</Label>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Hall E — Mosque Wing" className="h-8 mt-1" required />
          </div>
          <div>
            <Label className="text-xs">نام (اردو)</Label>
            <Input dir="rtl" lang="ur" value={draft.nameUrdu ?? ""} onChange={(e) => setDraft((d) => ({ ...d, nameUrdu: e.target.value }))} placeholder="ہال ای" className="font-urdu h-8 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <NumberCtl label="Rows" value={draft.rows} min={2} max={24} onChange={(v) => setDraft((d) => ({ ...d, rows: v }))} />
          <NumberCtl label="Cols" value={draft.cols} min={2} max={24} onChange={(v) => setDraft((d) => ({ ...d, cols: v }))} />
          <NumberCtl label="Aisle/Row" value={draft.aisleEveryRow} min={0} max={10} onChange={(v) => setDraft((d) => ({ ...d, aisleEveryRow: v }))} />
          <NumberCtl label="Aisle/Col" value={draft.aisleEveryCol} min={0} max={10} onChange={(v) => setDraft((d) => ({ ...d, aisleEveryCol: v }))} />
        </div>
        <DialogFooter className="gap-2">
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={reset}>Cancel</Button>
          )}
          <Button type="submit" size="sm" className="gap-1.5">
            {editing ? <><Pencil className="h-3.5 w-3.5" /> Save Changes</> : <><Plus className="h-3.5 w-3.5" /> Add Hall</>}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}