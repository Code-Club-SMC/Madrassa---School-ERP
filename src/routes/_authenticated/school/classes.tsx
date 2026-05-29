import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Users2, ChevronRight, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/classes")({
  component: ClassesPage,
});

type Klass = {
  id: string; name: string; nameUrdu: string;
  level: "pre_primary" | "primary" | "middle" | "secondary";
  rollPrefix: string;
  sections: { id: string; name: string; students: number; group?: "science" | "arts" }[];
};

const SEED_CLASSES: Klass[] = [
  { id: "kg", name: "KG / Prep", nameUrdu: "کے جی / پری", level: "pre_primary", rollPrefix: "KG", sections: [{ id: "kg-a", name: "A", students: 22 }] },
  { id: "g1", name: "Grade 1", nameUrdu: "پہلی جماعت", level: "primary", rollPrefix: "G1", sections: [{ id: "g1-a", name: "A", students: 28 }, { id: "g1-b", name: "B", students: 26 }] },
  { id: "g2", name: "Grade 2", nameUrdu: "دوسری جماعت", level: "primary", rollPrefix: "G2", sections: [{ id: "g2-a", name: "A", students: 30 }] },
  { id: "g3", name: "Grade 3", nameUrdu: "تیسری جماعت", level: "primary", rollPrefix: "G3", sections: [{ id: "g3-a", name: "A", students: 27 }, { id: "g3-b", name: "B", students: 24 }] },
  { id: "g4", name: "Grade 4", nameUrdu: "چوتھی جماعت", level: "primary", rollPrefix: "G4", sections: [{ id: "g4-a", name: "A", students: 25 }] },
  { id: "g5", name: "Grade 5", nameUrdu: "پانچویں جماعت", level: "primary", rollPrefix: "G5", sections: [{ id: "g5-a", name: "A", students: 23 }] },
  { id: "g6", name: "Grade 6", nameUrdu: "چھٹی جماعت", level: "middle", rollPrefix: "G6", sections: [{ id: "g6-a", name: "A", students: 21 }] },
  { id: "g7", name: "Grade 7", nameUrdu: "ساتویں جماعت", level: "middle", rollPrefix: "G7", sections: [{ id: "g7-a", name: "A", students: 20 }] },
  { id: "g8", name: "Grade 8", nameUrdu: "آٹھویں جماعت", level: "middle", rollPrefix: "G8", sections: [{ id: "g8-a", name: "A", students: 19 }] },
  { id: "g9", name: "Grade 9 (Matric I)", nameUrdu: "نویں جماعت (میٹرک اول)", level: "secondary", rollPrefix: "M1", sections: [{ id: "g9-s", name: "A", students: 16, group: "science" }, { id: "g9-r", name: "B", students: 14, group: "arts" }] },
  { id: "g10", name: "Grade 10 (Matric II)", nameUrdu: "دسویں جماعت (میٹرک دوم)", level: "secondary", rollPrefix: "M2", sections: [{ id: "g10-s", name: "A", students: 15, group: "science" }, { id: "g10-r", name: "B", students: 12, group: "arts" }] },
];

const LEVEL_TONE: Record<Klass["level"], string> = {
  pre_primary: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  primary: "bg-chart-1/15 text-chart-5 dark:text-chart-1 border-chart-2/30",
  middle: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  secondary: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
};

function subjectsForLevel(level: Klass["level"]) {
  const base = [
    { ur: "اردو", en: "Urdu", marks: 100 },
    { ur: "انگریزی", en: "English", marks: 100 },
    { ur: "ریاضی", en: "Mathematics", marks: 100 },
    { ur: "اسلامیات", en: "Islamiyat", marks: 50 },
    { ur: "ناظرہ قرآن", en: "Nazira Quran", marks: 50 },
  ];
  if (level === "primary") return [...base, { ur: "سائنس", en: "General Science", marks: 75 }];
  if (level === "middle") return [...base, { ur: "عمومی سائنس", en: "General Science", marks: 75 }, { ur: "معاشرتی علوم", en: "Social Studies", marks: 75 }, { ur: "مطالعہ پاکستان", en: "Pakistan Studies", marks: 50 }];
  if (level === "secondary") return [...base, { ur: "طبیعیات", en: "Physics", marks: 75 }, { ur: "کیمیا", en: "Chemistry", marks: 75 }, { ur: "حیاتیات", en: "Biology", marks: 75 }, { ur: "مطالعہ پاکستان", en: "Pakistan Studies", marks: 50 }];
  return base.slice(0, 4);
}

function ClassesPage() {
  const [classes, setClasses] = useState<Klass[]>(SEED_CLASSES);
  const [selected, setSelected] = useState<Klass>(SEED_CLASSES[1]);
  const [classOpen, setClassOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [cf, setCf] = useState({ name: "", nameUrdu: "", level: "primary" as Klass["level"], rollPrefix: "" });
  const [sf, setSf] = useState({ name: "", students: 0, group: "" as "" | "science" | "arts" });

  function updateClass(updated: Klass) {
    setClasses((p) => p.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
  }

  return (
    <div>
      <PageHeader
        title="Class & Section Manager"
        titleUrdu="جماعتیں و سیکشن"
        description="Pakistani grade structure — Pre-primary through Matric. Manage sections, group assignment (Science/Arts), and subjects per class."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setClassOpen(true)}><Plus className="h-4 w-4" />Add Class</Button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="p-2 max-h-[70vh] overflow-y-auto">
          {classes.map((c) => {
            const total = c.sections.reduce((a, s) => a + s.students, 0);
            const active = c.id === selected.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "w-full text-start flex items-center gap-3 rounded-lg p-2.5 transition-colors",
                  active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60",
                )}
              >
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border", LEVEL_TONE[c.level])}>
                  {c.rollPrefix}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-urdu text-sm leading-tight truncate">{c.nameUrdu}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.name}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{total}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            );
          })}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-urdu text-2xl font-semibold">{selected.nameUrdu}</p>
                <p className="text-sm text-muted-foreground">{selected.name}</p>
              </div>
              <Badge variant="outline" className={cn("border", LEVEL_TONE[selected.level])}>{selected.level.replace("_", " ")}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Sections</p>
                <p className="text-2xl font-bold font-mono mt-1">{selected.sections.length}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Roll Prefix</p>
                <p className="text-2xl font-bold font-mono mt-1">{selected.rollPrefix}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Students</p>
                <p className="text-2xl font-bold font-mono mt-1">{selected.sections.reduce((a, s) => a + s.students, 0)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><Users2 className="h-4 w-4 text-primary" />Sections</h3>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSectionOpen(true)}><Plus className="h-3.5 w-3.5" />Add Section</Button>
            </div>
            <div className="space-y-2">
              {selected.sections.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">{s.name}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Section {s.name}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-mono">{s.students}</span> students enrolled</p>
                  </div>
                  {s.group && (
                    <Badge variant="outline" className={s.group === "science" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}>
                      {s.group === "science" ? "Science · سائنس" : "Arts · آرٹس"}
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost">Manage</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" />Subjects · مضامین</h3>
              <Button size="sm" variant="outline" className="gap-1.5" asChild><a href="/school/subjects"><Plus className="h-3.5 w-3.5" />Manage Subjects</a></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subjectsForLevel(selected.level).map((s) => (
                <div key={s.en} className="flex items-center justify-between rounded-md border border-border p-2.5">
                  <div>
                    <p className="font-urdu text-sm">{s.ur}</p>
                    <p className="text-[11px] text-muted-foreground">{s.en}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{s.marks}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={classOpen} onOpenChange={setClassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Class · نئی جماعت</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Name</Label><Input value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} placeholder="Grade 11" /></div>
              <div><Label className="font-urdu">اردو نام</Label><Input dir="rtl" className="font-urdu" value={cf.nameUrdu} onChange={(e) => setCf({ ...cf, nameUrdu: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Level</Label>
                <Select value={cf.level} onValueChange={(v) => setCf({ ...cf, level: v as Klass["level"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_primary">Pre-Primary</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Roll Prefix</Label><Input value={cf.rollPrefix} onChange={(e) => setCf({ ...cf, rollPrefix: e.target.value })} placeholder="G11" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!cf.name.trim()) { toast.error("Name required"); return; }
              const id = `cls-${Date.now()}`;
              const k: Klass = { id, name: cf.name, nameUrdu: cf.nameUrdu || cf.name, level: cf.level, rollPrefix: cf.rollPrefix || cf.name.slice(0, 2).toUpperCase(), sections: [] };
              setClasses((p) => [...p, k]); setSelected(k);
              toast.success("Class added"); setCf({ name: "", nameUrdu: "", level: "primary", rollPrefix: "" }); setClassOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionOpen} onOpenChange={setSectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Section to {selected.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Section Name</Label><Input value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} placeholder="C" /></div>
            <div><Label>Students Enrolled</Label><Input type="number" value={sf.students} onChange={(e) => setSf({ ...sf, students: +e.target.value })} /></div>
            {selected.level === "secondary" && (
              <div><Label>Group</Label>
                <Select value={sf.group || "none"} onValueChange={(v) => setSf({ ...sf, group: v === "none" ? "" : v as "science" | "arts" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!sf.name.trim()) { toast.error("Section name required"); return; }
              const sid = `${selected.id}-${sf.name.toLowerCase()}`;
              updateClass({ ...selected, sections: [...selected.sections, { id: sid, name: sf.name, students: sf.students, ...(sf.group ? { group: sf.group } : {}) }] });
              toast.success("Section added"); setSf({ name: "", students: 0, group: "" }); setSectionOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
