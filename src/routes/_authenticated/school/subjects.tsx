import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookMarked, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/subjects")({
  component: SubjectsPage,
});

type Subject = { ur: string; en: string; marks: number; pass: number; group: string; levels: string[] };

const SEED: Subject[] = [
  { ur: "اردو", en: "Urdu", marks: 100, pass: 33, group: "Compulsory", levels: ["Primary", "Middle", "Secondary"] },
  { ur: "انگریزی", en: "English", marks: 100, pass: 33, group: "Compulsory", levels: ["Primary", "Middle", "Secondary"] },
  { ur: "ریاضی", en: "Mathematics", marks: 100, pass: 33, group: "Compulsory", levels: ["Primary", "Middle", "Secondary"] },
  { ur: "اسلامیات", en: "Islamiyat", marks: 50, pass: 17, group: "Compulsory", levels: ["Primary", "Middle", "Secondary"] },
  { ur: "ناظرہ قرآن", en: "Nazira Quran (SNC)", marks: 50, pass: 17, group: "Compulsory", levels: ["Primary"] },
  { ur: "عمومی سائنس", en: "General Science", marks: 75, pass: 25, group: "Compulsory", levels: ["Middle"] },
  { ur: "معاشرتی علوم", en: "Social Studies", marks: 75, pass: 25, group: "Compulsory", levels: ["Middle"] },
  { ur: "طبیعیات", en: "Physics", marks: 75, pass: 26, group: "Elective", levels: ["Secondary"] },
  { ur: "کیمیا", en: "Chemistry", marks: 75, pass: 26, group: "Elective", levels: ["Secondary"] },
  { ur: "حیاتیات", en: "Biology", marks: 75, pass: 26, group: "Elective", levels: ["Secondary"] },
  { ur: "مطالعہ پاکستان", en: "Pakistan Studies", marks: 50, pass: 17, group: "Compulsory", levels: ["Middle", "Secondary"] },
  { ur: "کمپیوٹر سائنس", en: "Computer Science", marks: 75, pass: 25, group: "Elective", levels: ["Middle", "Secondary"] },
];

function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(SEED);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ur: "", en: "", marks: 100, pass: 33, group: "Compulsory", levels: "Primary,Middle,Secondary" });
  return (
    <div>
      <PageHeader
        title="School Subjects"
        titleUrdu="مضامین"
        description="National Curriculum (SNC 2021–2024) — compulsory and elective subjects across Primary, Middle, and Secondary levels."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><BookMarked className="h-4 w-4" /><Plus className="h-3.5 w-3.5" />Add Subject</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((s) => (
          <Card key={s.en} className="p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-urdu text-xl">{s.ur}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{s.en}</p>
              </div>
              <Badge variant={s.group === "Compulsory" ? "default" : "outline"} className="text-[10px]">{s.group}</Badge>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-border text-xs">
              <span className="text-muted-foreground">Total: <span className="font-mono text-foreground">{s.marks}</span></span>
              <span className="text-muted-foreground">Pass: <span className="font-mono text-foreground">{s.pass}</span></span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {s.levels.map((l) => <span key={l} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{l}</span>)}
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Subject · نیا مضمون</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="font-urdu">اردو نام</Label><Input dir="rtl" className="font-urdu" value={f.ur} onChange={(e) => setF({ ...f, ur: e.target.value })} /></div>
              <div><Label>English Name</Label><Input value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Total Marks</Label><Input type="number" value={f.marks} onChange={(e) => setF({ ...f, marks: +e.target.value })} /></div>
              <div><Label>Pass Marks</Label><Input type="number" value={f.pass} onChange={(e) => setF({ ...f, pass: +e.target.value })} /></div>
            </div>
            <div><Label>Group</Label>
              <Select value={f.group} onValueChange={(v) => setF({ ...f, group: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Compulsory">Compulsory</SelectItem><SelectItem value="Elective">Elective</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Levels (comma-separated)</Label><Input value={f.levels} onChange={(e) => setF({ ...f, levels: e.target.value })} placeholder="Primary,Middle,Secondary" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.en.trim()) { toast.error("English name required"); return; }
              setSubjects((p) => [{ ur: f.ur || f.en, en: f.en, marks: f.marks, pass: f.pass, group: f.group, levels: f.levels.split(",").map((s) => s.trim()).filter(Boolean) }, ...p]);
              toast.success("Subject added"); setF({ ur: "", en: "", marks: 100, pass: 33, group: "Compulsory", levels: "Primary,Middle,Secondary" }); setOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
