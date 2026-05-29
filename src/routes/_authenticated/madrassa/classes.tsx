import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Users2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/madrassa/classes")({
  component: ClassesPage,
});

const seedDarajat = [
  { id: "d1", urdu: "درجہ اولیٰ", english: "Aamma", year: "Year 1", students: 18, teacher: "Maulana Imran" },
  { id: "d2", urdu: "درجہ ثانیہ", english: "Saaniya", year: "Year 2", students: 14, teacher: "Mufti Adeel" },
  { id: "d3", urdu: "درجہ ثالثہ", english: "Saalisa", year: "Year 3", students: 12, teacher: "Mufti Adeel" },
  { id: "d4", urdu: "درجہ رابعہ", english: "Raabia", year: "Year 4", students: 10, teacher: "Mufti Anwar" },
  { id: "d5", urdu: "درجہ خامسہ", english: "Khamisa", year: "Year 5", students: 9, teacher: "Mufti Anwar" },
  { id: "d6", urdu: "درجہ سادسہ", english: "Saadisa", year: "Year 6", students: 8, teacher: "Mufti Khalid" },
  { id: "d7", urdu: "درجہ سابعہ", english: "Saabia", year: "Year 7", students: 7, teacher: "Mufti Khalid" },
  { id: "d8", urdu: "درجہ ثامنہ (دورہ حدیث)", english: "Saamina · Daura-e-Hadith", year: "Year 8", students: 6, teacher: "Sheikh-ul-Hadith" },
];

function ClassesPage() {
  const [darajat, setDarajat] = useState(seedDarajat);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ urdu: "", english: "", year: "", teacher: "" });
  return (
    <div>
      <PageHeader
        title="Dars-e-Nizami Darjat"
        titleUrdu="درس نظامی کے درجات"
        description="The eight-year Dars-e-Nizami curriculum, from Aamma to Daura-e-Hadith."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Darja</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {darajat.map((d) => (
          <Card key={d.id} className="p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="h-5 w-5 text-primary" /></div>
              <Badge variant="outline" className="text-[10px]">{d.year}</Badge>
            </div>
            <p className="font-urdu text-xl font-semibold">{d.urdu}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{d.english}</p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{d.teacher}</span>
              <span className="inline-flex items-center gap-1 font-mono text-foreground"><Users2 className="h-3 w-3" />{d.students}</span>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Darja · نیا درجہ</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="font-urdu">اردو نام</Label><Input dir="rtl" className="font-urdu" value={f.urdu} onChange={(e) => setF({ ...f, urdu: e.target.value })} /></div>
              <div><Label>English Name</Label><Input value={f.english} onChange={(e) => setF({ ...f, english: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Year</Label><Input value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} placeholder="Year 9" /></div>
              <div><Label>Teacher</Label><Input value={f.teacher} onChange={(e) => setF({ ...f, teacher: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.english.trim()) { toast.error("English name required"); return; }
              setDarajat((p) => [...p, { id: `d-${Date.now()}`, urdu: f.urdu || f.english, english: f.english, year: f.year || "—", students: 0, teacher: f.teacher || "—" }]);
              toast.success("Darja added"); setF({ urdu: "", english: "", year: "", teacher: "" }); setOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}