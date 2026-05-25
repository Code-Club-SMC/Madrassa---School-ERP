import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ArrowLeft, Printer, Shuffle, Eraser, Minus, Plus, UserCircle2, Clock, BookMarked, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { madrassaCategories, students, teachers, institution } from "@/mock";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id/seating")({
  component: HalqaPage,
});

// Madrassa exams are oral (viva): each student recites to a Qari at a halqa station.
// So we don't lay out a row/col hall — we provide HALQA (circle) stations, each with
// an examiner, a slot duration, and an ordered queue of students with time tokens.

const VIVA_TYPES = [
  { id: "hifz", label: "Hifz Viva · سماعت", urdu: "حفظ", subject: "Hifz" },
  { id: "nazira", label: "Nazira · ناظرہ", urdu: "ناظرہ", subject: "Nazira" },
  { id: "tajweed", label: "Tajweed · تجوید", urdu: "تجوید", subject: "Tajweed" },
  { id: "fiqh", label: "Fiqh Oral · فقہ", urdu: "فقہ", subject: "Fiqh" },
];

const HALQA_TONES = [
  "bg-[oklch(0.94_0.05_150)] dark:bg-[oklch(0.28_0.07_150)] border-[oklch(0.72_0.10_150)]",
  "bg-[oklch(0.94_0.05_80)] dark:bg-[oklch(0.28_0.07_80)] border-[oklch(0.74_0.11_80)]",
  "bg-[oklch(0.94_0.05_240)] dark:bg-[oklch(0.28_0.07_240)] border-[oklch(0.72_0.10_240)]",
  "bg-[oklch(0.94_0.05_330)] dark:bg-[oklch(0.28_0.07_330)] border-[oklch(0.74_0.11_330)]",
  "bg-[oklch(0.94_0.05_25)] dark:bg-[oklch(0.28_0.07_25)] border-[oklch(0.74_0.11_25)]",
  "bg-[oklch(0.94_0.05_200)] dark:bg-[oklch(0.28_0.07_200)] border-[oklch(0.72_0.10_200)]",
];

type Token = { studentId: string; rollNo: string; nameUrdu: string; parahFrom: number; parahTo: number; subcatId: string };
type Halqa = { id: string; qariId: string; queue: Token[] };

function buildPool(selectedSubcats: string[]): Token[] {
  const real = students.filter(
    (s) => s.system === "madrassa" && s.subcategoryId && selectedSubcats.includes(s.subcategoryId)
  );
  const list: Token[] = real.map((s, i) => ({
    studentId: s.id,
    rollNo: s.rollNo,
    nameUrdu: s.nameUrdu,
    subcatId: s.subcategoryId!,
    parahFrom: 1 + (i % 25),
    parahTo: Math.min(30, 1 + (i % 25) + 4),
  }));
  // Top up so a halqa always has students for the preview.
  let counter = list.length;
  while (list.length < Math.max(20, selectedSubcats.length * 8)) {
    const sc = selectedSubcats[counter % Math.max(1, selectedSubcats.length)] ?? selectedSubcats[0];
    counter++;
    list.push({
      studentId: `synth-${counter}`,
      rollNo: `MDR-${counter.toString().padStart(3, "0")}`,
      nameUrdu: ["محمد بلال", "احمد رضا", "زید کریم", "حسن علی", "عمر فاروق", "یوسف خان"][counter % 6],
      subcatId: sc,
      parahFrom: 1 + (counter % 25),
      parahTo: Math.min(30, 1 + (counter % 25) + 4),
    });
  }
  return list;
}

function distribute(pool: Token[], halqaCount: number, qariIds: string[]): Halqa[] {
  const halqas: Halqa[] = Array.from({ length: halqaCount }).map((_, i) => ({
    id: `H${i + 1}`,
    qariId: qariIds[i % Math.max(1, qariIds.length)] ?? "—",
    queue: [],
  }));
  // Round-robin so each halqa mixes darjas instead of clumping one subcategory.
  // Sort pool by subcategory so consecutive picks rotate.
  const bySub: Record<string, Token[]> = {};
  pool.forEach((t) => {
    (bySub[t.subcatId] ||= []).push(t);
  });
  const interleaved: Token[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const k of Object.keys(bySub)) {
      const next = bySub[k].shift();
      if (next) {
        interleaved.push(next);
        added = true;
      }
    }
  }
  interleaved.forEach((t, i) => halqas[i % halqaCount].queue.push(t));
  return halqas;
}

function timeFor(start: string, idx: number, slotMin: number) {
  const [h, m] = start.split(":").map((x) => parseInt(x, 10));
  const total = h * 60 + m + idx * slotMin;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

function HalqaPage() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id/seating" });
  const allSubcats = useMemo(
    () => madrassaCategories.flatMap((c) => c.subcategories.map((s) => ({ ...s, parent: c.name }))),
    []
  );
  const qaris = useMemo(() => teachers.filter((t) => t.system === "madrassa"), []);

  const [vivaType, setVivaType] = useState(VIVA_TYPES[0].id);
  const [halqaCount, setHalqaCount] = useState(4);
  const [slotMin, setSlotMin] = useState(8);
  const [startTime, setStartTime] = useState("08:30");
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>(allSubcats.slice(0, 4).map((s) => s.id));
  const [selectedQaris, setSelectedQaris] = useState<string[]>(qaris.slice(0, 4).map((q) => q.id));
  const [halqas, setHalqas] = useState<Halqa[]>([]);
  const [moveSel, setMoveSel] = useState<{ halqaIdx: number; tokenIdx: number } | null>(null);

  const subcatColor = useMemo(() => {
    const m: Record<string, string> = {};
    selectedSubcats.forEach((s, i) => (m[s] = HALQA_TONES[i % HALQA_TONES.length]));
    return m;
  }, [selectedSubcats]);

  const regenerate = useCallback(() => {
    if (selectedSubcats.length === 0) return toast.error("Select at least one darja");
    if (selectedQaris.length === 0) return toast.error("Select at least one Qari examiner");
    const pool = buildPool(selectedSubcats);
    const next = distribute(pool, halqaCount, selectedQaris);
    setHalqas(next);
    setMoveSel(null);
    toast.success(`Halqa schedule created · ${next.length} stations · ${pool.length} students`);
  }, [halqaCount, selectedSubcats, selectedQaris]);

  useEffect(() => {
    if (halqas.length === 0) regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSubcat(sid: string) {
    setSelectedSubcats((p) => (p.includes(sid) ? p.filter((x) => x !== sid) : [...p, sid]));
  }
  function toggleQari(qid: string) {
    setSelectedQaris((p) => (p.includes(qid) ? p.filter((x) => x !== qid) : [...p, qid]));
  }

  function moveStudent(targetHalqa: number, targetIdx: number) {
    if (!moveSel) {
      setMoveSel({ halqaIdx: targetHalqa, tokenIdx: targetIdx });
      return;
    }
    if (moveSel.halqaIdx === targetHalqa && moveSel.tokenIdx === targetIdx) {
      setMoveSel(null);
      return;
    }
    setHalqas((prev) => {
      const next = prev.map((h) => ({ ...h, queue: [...h.queue] }));
      const token = next[moveSel.halqaIdx].queue.splice(moveSel.tokenIdx, 1)[0];
      next[targetHalqa].queue.splice(targetIdx, 0, token);
      return next;
    });
    setMoveSel(null);
    toast.success("Student moved");
  }

  function clearAll() {
    setHalqas([]);
    setMoveSel(null);
  }

  const totalStudents = halqas.reduce((s, h) => s + h.queue.length, 0);
  const longestQueue = halqas.reduce((m, h) => Math.max(m, h.queue.length), 0);
  const lastTime = timeFor(startTime, longestQueue, slotMin);

  return (
    <div>
      <Link to="/madrassa/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 print:hidden">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exam
      </Link>
      <div className="print:hidden">
        <PageHeader
          title="Halqa Viva Scheduling"
          titleUrdu="حلقہ بندی و سماعت"
          description="Madrassa oral examinations are conducted in halqas (circles) — each station has a Qari examiner and a queued roster of students reciting Hifz/Nazira/Tajweed. Configure stations, assign Qaris, auto-distribute students across halqas (so the same darja doesn't queue back-to-back), and print the viva schedule with time tokens."
          actions={
            <div className="flex gap-2 items-center flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={clearAll} aria-label="Clear halqa schedule">
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />Clear
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={regenerate} aria-label="Auto-distribute students across halqas">
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />Auto-distribute
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => window.print()} aria-label="Print viva schedule">
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />Print Schedule
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 print:block">
        {/* Controls */}
        <Card className="p-4 space-y-4 print:hidden h-fit lg:sticky lg:top-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Viva Type · قسم</Label>
            <Select value={vivaType} onValueChange={setVivaType}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{VIVA_TYPES.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Halqas · حلقے" value={halqaCount} min={1} max={12} setValue={setHalqaCount} />
            <Stepper label="Slot (min) · وقفہ" value={slotMin} min={3} max={30} setValue={setSlotMin} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Start Time · آغاز</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5 font-mono" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Darjas · درجات</Label>
            <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
              {allSubcats.map((s, i) => {
                const checked = selectedSubcats.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-2 p-1.5 rounded-md border border-border hover:bg-accent cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggleSubcat(s.id)} aria-label={`Toggle ${s.name}`} />
                    <span className={`inline-block h-3 w-3 rounded-sm border ${HALQA_TONES[i % HALQA_TONES.length]}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-none truncate">{s.name}</p>
                      <p className="font-urdu text-[11px] text-muted-foreground truncate">{s.nameUrdu}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Qari Examiners · قاری</Label>
            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
              {qaris.map((q) => {
                const checked = selectedQaris.includes(q.id);
                return (
                  <label key={q.id} className="flex items-center gap-2 p-1.5 rounded-md border border-border hover:bg-accent cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggleQari(q.id)} aria-label={`Toggle examiner ${q.name}`} />
                    <UserCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-none truncate">{q.name}</p>
                      <p className="font-urdu text-[11px] text-muted-foreground truncate">{q.nameUrdu} · {q.subject}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Halqas</span><span className="font-mono font-medium">{halqas.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Students</span><span className="font-mono font-medium">{totalStudents}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Slot</span><span className="font-mono font-medium">{slotMin} min</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ends ~</span><span className="font-mono font-medium">{lastTime}</span></div>
          </div>
        </Card>

        {/* Halqas */}
        <Card className="p-5 print-target overflow-hidden">
          <div className="text-center mb-4">
            <p className="font-heading text-lg font-bold">{institution.nameEnglish} · Halqa Viva</p>
            <p className="font-urdu text-base text-muted-foreground" dir="rtl">{institution.nameUrdu} · {VIVA_TYPES.find((v) => v.id === vivaType)?.urdu}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Exam Ref: {id} · Start {startTime} · {slotMin}-min slots · {halqas.length} halqas
            </p>
          </div>

          {halqas.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
              No halqa schedule yet. Configure stations and click <span className="font-medium">Auto-distribute</span>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {halqas.map((h, hi) => {
                const qari = qaris.find((q) => q.id === h.qariId);
                return (
                  <Card key={h.id} className="p-4 bg-muted/20 border-border/60">
                    {/* Halqa header — examiner at center of circle metaphor */}
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
                      <div className="h-11 w-11 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center shrink-0" aria-hidden="true">
                        <BookMarked className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Halqa {h.id} · Qari</p>
                        <p className="font-semibold text-sm truncate">{qari?.name ?? "—"}</p>
                        <p className="font-urdu text-xs text-muted-foreground truncate" dir="rtl">{qari?.nameUrdu}</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">{h.queue.length} طلبہ</Badge>
                    </div>

                    {/* Queue: each token shows time slot, roll, parah range */}
                    <ol className="space-y-1.5" aria-label={`Queue for Halqa ${h.id}`}>
                      {h.queue.map((t, ti) => {
                        const isSel = moveSel?.halqaIdx === hi && moveSel.tokenIdx === ti;
                        const tone = subcatColor[t.subcatId] ?? "bg-muted";
                        return (
                          <li key={`${t.studentId}-${ti}`}>
                            <button
                              type="button"
                              onClick={() => moveStudent(hi, ti)}
                              className={`w-full text-start rounded-md border px-2.5 py-1.5 transition-all hover:translate-x-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background ${tone} ${isSel ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                              aria-label={`Slot ${ti + 1}, ${timeFor(startTime, ti, slotMin)}, roll ${t.rollNo}, parah ${t.parahFrom} to ${t.parahTo}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] tabular-nums bg-background/70 border border-border rounded px-1.5 py-0.5 shrink-0 inline-flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                                  {timeFor(startTime, ti, slotMin)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-urdu text-sm leading-tight truncate" dir="rtl">{t.nameUrdu}</p>
                                  <p className="font-mono text-[10px] opacity-80 truncate">{t.rollNo} · پارہ {t.parahFrom}–{t.parahTo}</p>
                                </div>
                                <ArrowRight className="h-3 w-3 opacity-50 rtl:rotate-180" aria-hidden="true" />
                              </div>
                            </button>
                          </li>
                        );
                      })}
                      {h.queue.length === 0 && (
                        <li className="text-center text-xs text-muted-foreground py-4 border border-dashed rounded-md">Empty halqa — click a student in another halqa, then click here to move.</li>
                      )}
                    </ol>
                  </Card>
                );
              })}
            </div>
          )}

          {halqas.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-2 justify-center">
              {selectedSubcats.map((sid, i) => {
                const sc = allSubcats.find((s) => s.id === sid);
                const used = halqas.reduce((n, h) => n + h.queue.filter((t) => t.subcatId === sid).length, 0);
                return (
                  <Badge key={sid} variant="outline" className={`gap-1.5 ${HALQA_TONES[i % HALQA_TONES.length]}`}>
                    <span className="font-medium text-[11px]">{sc?.name}</span>
                    <span className="font-urdu text-[11px]" dir="rtl">{sc?.nameUrdu}</span>
                    <span className="font-mono text-[10px] opacity-80">· {used}</span>
                  </Badge>
                );
              })}
            </div>
          )}

          <p className="text-center text-[10px] text-muted-foreground mt-3 print:hidden">
            {moveSel ? "Click any slot (or empty halqa) to move the selected student." : "Tip: click a student token to pick up, click another slot to drop. Same-darja tokens are colour-coded."}
          </p>
        </Card>
      </div>
    </div>
  );
}

function Stepper({ label, value, min = 1, max = 99, setValue }: { label: string; value: number; min?: number; max?: number; setValue: (v: number) => void }) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1.5 flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setValue(clamp(value - 1))} aria-label={`Decrease ${label}`}>
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Input type="number" value={value} min={min} max={max} onChange={(e) => setValue(clamp(parseInt(e.target.value || "0", 10) || 0))} className="text-center font-mono" aria-label={label} />
        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setValue(clamp(value + 1))} aria-label={`Increase ${label}`}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}