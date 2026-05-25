import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookMarked, Save, TrendingUp, Award, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { students } from "@/mock/students";
import { institution } from "@/mock";

export const Route = createFileRoute("/_authenticated/madrassa/hifz")({
  component: HifzTracker,
});

function HifzTracker() {
  const hifzStudents = students.filter((s) => s.system === "madrassa" && s.categoryId === "hifz");
  const [progress, setProgress] = useState<Record<string, { sabaq: string; sabqi: string; manzil: string; juz: number }>>(() => Object.fromEntries(hifzStudents.map((s) => [s.id, {
    sabaq: "نیا سبق درج کریں",
    sabqi: `پارہ ${(s.hifzJuzCompleted ?? 1) - 1} مکمل`,
    manzil: `پارہ ۱ تا ${Math.max(1, (s.hifzJuzCompleted ?? 1) - 2)}`,
    juz: s.hifzJuzCompleted ?? 0,
  }])));

  return (
    <div>
      <PageHeader
        title="Hifz Tracker"
        titleUrdu="حفظ ٹریکر"
        description="Daily Sabaq, Sabqi and Manzil log per memorization student. Aligned with Wifaq tradition."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Huffaz · حافظ طلبہ</p><p className="font-heading text-2xl font-bold mt-1">{hifzStudents.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Completed Hifz · مکمل حفظ</p><p className="font-heading text-2xl font-bold mt-1 text-chart-5 dark:text-chart-1">{hifzStudents.filter((s) => (s.hifzJuzCompleted ?? 0) >= 30).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Avg Juz · اوسط پارہ</p><p className="font-heading text-2xl font-bold mt-1">{Math.round(hifzStudents.reduce((a, s) => a + (s.hifzJuzCompleted ?? 0), 0) / Math.max(hifzStudents.length, 1))}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Daily Sabaq Logged</p><p className="font-heading text-2xl font-bold mt-1">{Object.keys(progress).length}</p></Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Student</TableHead>
              <TableHead>Juz · پارے</TableHead>
              <TableHead>Today's Sabaq · سبق</TableHead>
              <TableHead>Sabqi · سبقی</TableHead>
              <TableHead>Manzil · منزل</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hifzStudents.map((s) => {
              const p = progress[s.id];
              const isKhatm = p.juz >= 30;
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="font-urdu text-sm text-muted-foreground">{s.nameUrdu}</p>
                      </div>
                      {isKhatm && <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1"><Award className="h-3 w-3" />Hafiz</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress value={(p.juz / 30) * 100} className="h-2" />
                      <p className="font-mono text-[10px] mt-1 text-muted-foreground">{p.juz}/30</p>
                    </div>
                  </TableCell>
                  <TableCell><p className="font-urdu text-sm">{p.sabaq}</p></TableCell>
                  <TableCell><p className="font-urdu text-sm">{p.sabqi}</p></TableCell>
                  <TableCell><p className="font-urdu text-sm">{p.manzil}</p></TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      {isKhatm && <KhatmDialog student={s} />}
                      <UpdateDialog student={s.name} initial={p} onSave={(d) => { setProgress((prev) => ({ ...prev, [s.id]: d })); toast.success("Hifz log updated for " + s.name); }} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function KhatmDialog({ student }: { student: { id: string; name: string; nameUrdu: string; guardianNameUrdu: string; rollNo: string } }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [chiefGuest, setChiefGuest] = useState("مفتی محمد صاحب");
  const [venue, setVenue] = useState("جامع مسجد، مدرسہ ہال");
  const [duaImam, setDuaImam] = useState("شیخ الحدیث صاحب");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"><Award className="h-3.5 w-3.5" />Khatm</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle className="font-urdu">تقریبِ ختمِ قرآن · Khatm-ul-Quran Ceremony</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><label className="text-xs text-muted-foreground">Ceremony Date · تاریخ</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Venue · مقام</label><Input className="font-urdu" value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Chief Guest · مہمانِ خصوصی</label><Input className="font-urdu" value={chiefGuest} onChange={(e) => setChiefGuest(e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Dua Imam · امامِ دعا</label><Input className="font-urdu" value={duaImam} onChange={(e) => setDuaImam(e.target.value)} /></div>
        </div>

        <div className="khatm-cert print-target border-2 border-amber-600/40 rounded-lg p-8 bg-amber-50/30 dark:bg-amber-950/10">
          <div className="text-center">
            <p className="font-urdu text-2xl text-amber-700 dark:text-amber-400">بسم اللہ الرحمٰن الرحیم</p>
            <p className="font-urdu text-3xl font-bold mt-2">{institution.nameUrdu}</p>
            <p className="font-heading text-sm text-muted-foreground">{institution.nameEnglish}</p>
            <div className="my-6 inline-block border-y-2 border-amber-600/40 py-2 px-8">
              <p className="font-urdu text-2xl font-bold">سندِ ختمِ قرآنِ کریم</p>
              <p className="text-xs text-muted-foreground">Certificate of Hifz Completion</p>
            </div>
            <p className="font-urdu text-base leading-loose">
              یہ سند بنام <span className="font-bold text-lg underline">{student.nameUrdu}</span>{" "}
              ولد <span className="font-bold">{student.guardianNameUrdu}</span> (رول نمبر {student.rollNo})
              عطا کی جاتی ہے کہ موصوف نے بحمدہٖ تعالیٰ قرآنِ مجید کے تیسوں (۳۰) پاروں کا حفظ مکمل کر لیا ہے۔
            </p>
            <p className="font-urdu text-base leading-loose mt-3">
              تقریبِ ختم بتاریخ <span className="font-mono">{date}</span> بمقام <span className="font-bold">{venue}</span>{" "}
              زیرِ صدارت <span className="font-bold">{chiefGuest}</span> منعقد ہوئی، اور دعا{" "}
              <span className="font-bold">{duaImam}</span> نے فرمائی۔
            </p>
            <p className="font-urdu text-sm mt-4 text-amber-700 dark:text-amber-400">جزاہ اللہ خیراً · اللہ تعالیٰ قبول فرمائے</p>
          </div>
          <div className="grid grid-cols-3 gap-12 mt-12 text-xs">
            <div className="text-center border-t-2 border-amber-700/40 pt-1 font-urdu">استادِ حفظ</div>
            <div className="text-center border-t-2 border-amber-700/40 pt-1 font-urdu">شیخ الحدیث</div>
            <div className="text-center border-t-2 border-amber-700/40 pt-1 font-urdu">مہتمم صاحب</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print Certificate</Button>
          <Button className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { toast.success(`Khatm ceremony recorded for ${student.name}`); setOpen(false); }}><Award className="h-3.5 w-3.5" />Record Ceremony</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdateDialog({ student, initial, onSave }: { student: string; initial: { sabaq: string; sabqi: string; manzil: string; juz: number }; onSave: (d: typeof initial) => void }) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(initial);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1.5"><Save className="h-3.5 w-3.5" />Log</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Hifz Progress — {student}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground">Juz Completed · پارے مکمل</label>
            <Select value={String(d.juz)} onValueChange={(v) => setD({ ...d, juz: +v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 31 }).map((_, i) => <SelectItem key={i} value={String(i)}>{i} / 30</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sabaq · سبق</label>
            <Textarea className="font-urdu" value={d.sabaq} onChange={(e) => setD({ ...d, sabaq: e.target.value })} rows={2} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sabqi · سبقی</label>
            <Input className="font-urdu" value={d.sabqi} onChange={(e) => setD({ ...d, sabqi: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Manzil · منزل</label>
            <Input className="font-urdu" value={d.manzil} onChange={(e) => setD({ ...d, manzil: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { onSave(d); setOpen(false); }} className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Save Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { BookMarked };