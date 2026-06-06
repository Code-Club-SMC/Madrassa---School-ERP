import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/madrassa/subjects")({
  component: SubjectsPage,
});

const seedSubjects = [
  { id: "s1", urdu: "تفسیر", english: "Tafsir", darja: "Aamma → Saamina", teachers: 4 },
  { id: "s2", urdu: "حدیث", english: "Hadith", darja: "Saalisa → Saamina", teachers: 5 },
  { id: "s3", urdu: "فقہ", english: "Fiqh", darja: "All Darjat", teachers: 6 },
  { id: "s4", urdu: "اصول الفقہ", english: "Usul al-Fiqh", darja: "Khamisa → Saamina", teachers: 3 },
  { id: "s5", urdu: "صرف", english: "Sarf (Morphology)", darja: "Aamma · Saaniya", teachers: 2 },
  { id: "s6", urdu: "نحو", english: "Nahw (Syntax)", darja: "Aamma → Saalisa", teachers: 3 },
  { id: "s7", urdu: "منطق", english: "Mantiq (Logic)", darja: "Saalisa · Raabia", teachers: 2 },
  { id: "s8", urdu: "بلاغت", english: "Balaghah", darja: "Khamisa", teachers: 1 },
  { id: "s9", urdu: "اصول الحدیث", english: "Usul al-Hadith", darja: "Saabia", teachers: 2 },
  { id: "s10", urdu: "میراث", english: "Mirath (Inheritance)", darja: "Saadisa", teachers: 1 },
  { id: "s11", urdu: "عقیدہ", english: "Aqeedah", darja: "All Darjat", teachers: 4 },
  { id: "s12", urdu: "تجوید", english: "Tajweed", darja: "Hifz · Nazira", teachers: 3 },
];

function SubjectsPage() {
  const [subjects, setSubjects] = useState(seedSubjects);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ urdu: "", english: "", darja: "", teachers: 0 });
  return (
    <div>
      <PageHeader
        title="Madrassa Subjects"
        titleUrdu="مدرسہ کے مضامین"
        description="Subjects taught across Hifz, Nazira, and Dars-e-Nizami stages."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Subject</Button>}
      />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Subject — مضمون</TableHead>
              <TableHead>Darja</TableHead>
              <TableHead className="text-end">Teachers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((s) => (
              <TableRow key={s.id}>
                <TableCell><p className="font-urdu text-base">{s.urdu}</p><p className="text-xs text-muted-foreground">{s.english}</p></TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-[11px]">{s.darja}</Badge></TableCell>
                <TableCell className="text-end font-mono">{s.teachers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle dir="rtl" lang="ur" className="font-urdu text-xl">نیا مضمون</DialogTitle>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Add Subject</p>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <BilingualLabel urdu="مضمون کا نام" english="Name (Urdu)" required>
                <Input dir="rtl" className="font-urdu text-base" value={f.urdu} onChange={(e) => setF({ ...f, urdu: e.target.value })} placeholder="مثال: تفسیر" />
              </BilingualLabel>
              <BilingualLabel urdu="انگریزی نام" english="English Name">
                <Input value={f.english} onChange={(e) => setF({ ...f, english: e.target.value })} placeholder="Tafsir" />
              </BilingualLabel>
            </div>
            <BilingualLabel urdu="درجات کا احاطہ" english="Darja Coverage">
              <Input value={f.darja} onChange={(e) => setF({ ...f, darja: e.target.value })} placeholder="Aamma → Saalisa" />
            </BilingualLabel>
            <BilingualLabel urdu="اساتذہ کی تعداد" english="Teachers Count">
              <Input type="number" value={f.teachers} onChange={(e) => setF({ ...f, teachers: +e.target.value })} />
            </BilingualLabel>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.urdu.trim() && !f.english.trim()) { toast.error("Name required · نام درکار ہے"); return; }
              setSubjects((p) => [{ id: `s-${Date.now()}`, urdu: f.urdu || f.english, english: f.english || f.urdu, darja: f.darja || "—", teachers: f.teachers }, ...p]);
              toast.success("Subject added"); setF({ urdu: "", english: "", darja: "", teachers: 0 }); setOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}