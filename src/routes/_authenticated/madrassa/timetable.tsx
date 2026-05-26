import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/madrassa/timetable")({
  component: TimetablePage,
});

const initialSlots = [
  { time: "Fajr → 7:00", urdu: "نمازِ فجر و تلاوت", subjects: ["Tilawat", "Tilawat", "Tilawat", "Tilawat", "Tilawat", "Tilawat"] },
  { time: "7:00 → 8:30", urdu: "حفظ", subjects: ["Hifz", "Hifz", "Hifz", "Hifz", "Hifz", "Hifz"] },
  { time: "8:30 → 9:30", urdu: "ناشتہ و وقفہ", subjects: ["Break", "Break", "Break", "Break", "Break", "Break"] },
  { time: "9:30 → 10:30", urdu: "نحو / صرف", subjects: ["Nahw", "Sarf", "Nahw", "Sarf", "Nahw", "Mantiq"] },
  { time: "10:30 → 11:30", urdu: "فقہ", subjects: ["Fiqh", "Fiqh", "Usul-Fiqh", "Fiqh", "Mirath", "Fiqh"] },
  { time: "11:30 → 12:30", urdu: "حدیث", subjects: ["Hadith", "Usul-Hadith", "Hadith", "Hadith", "Hadith", "Hadith"] },
  { time: "Zuhr → 14:00", urdu: "نمازِ ظہر و وقفہ", subjects: ["Break", "Break", "Break", "Break", "Break", "Break"] },
  { time: "14:00 → 15:30", urdu: "تفسیر / عقیدہ", subjects: ["Tafsir", "Aqeedah", "Tafsir", "Tafsir", "Aqeedah", "Tafsir"] },
];
const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const daysEn = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];

function TimetablePage() {
  const [slots, setSlots] = useState(initialSlots);
  const [edit, setEdit] = useState<{ row: number; col: number; value: string } | null>(null);
  const [timeEdit, setTimeEdit] = useState<{ row: number; time: string; urdu: string } | null>(null);
  return (
    <div>
      <PageHeader
        title="Dars Timetable"
        titleUrdu="نظامِ اوقات (درس)"
        description="Weekly schedule. Fridays are reserved for Jumu'ah. Click a slot to edit."
        actions={<Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-start p-3 w-[160px] font-medium">Time</th>
              {daysEn.map((d, i) => (
                <th key={d} className="text-center p-3 font-medium">
                  <p className="font-urdu text-base leading-tight">{days[i]}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{d}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="p-3 align-top">
                  <button
                    type="button"
                    onClick={() => setTimeEdit({ row: i, time: row.time, urdu: row.urdu })}
                    className="text-start hover:bg-accent/40 rounded-md px-1 py-0.5 -mx-1 transition-colors w-full"
                    aria-label="Edit time slot"
                  >
                    <p className="font-mono text-xs">{row.time}</p>
                    <p className="font-urdu text-sm text-muted-foreground">{row.urdu}</p>
                  </button>
                </td>
                {row.subjects.map((subj, j) => (
                  <td key={j} className="p-2 text-center">
                    <button
                      type="button"
                      disabled={subj === "Break"}
                      onClick={() => setEdit({ row: i, col: j, value: subj })}
                      className={cn(
                        "w-full rounded-md px-2 py-1.5 text-xs transition-colors",
                        subj === "Break" ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : "bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer",
                      )}
                    >{subj}</button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Subject · سبق ترمیم</DialogTitle></DialogHeader>
          <div><Label>Subject</Label><Input value={edit?.value ?? ""} onChange={(e) => setEdit((p) => p ? { ...p, value: e.target.value } : p)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!edit) return;
              setSlots((p) => p.map((r, i) => i === edit.row ? { ...r, subjects: r.subjects.map((s, j) => j === edit.col ? (edit.value || "—") : s) } : r));
              toast.success("Slot updated"); setEdit(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!timeEdit} onOpenChange={(v) => !v && setTimeEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Time Slot · وقت ترمیم</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Time</Label><Input value={timeEdit?.time ?? ""} onChange={(e) => setTimeEdit((p) => p ? { ...p, time: e.target.value } : p)} placeholder="e.g. 7:00 → 8:30" /></div>
            <div><Label className="font-urdu">اردو لیبل</Label><Input dir="rtl" className="font-urdu" value={timeEdit?.urdu ?? ""} onChange={(e) => setTimeEdit((p) => p ? { ...p, urdu: e.target.value } : p)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeEdit(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!timeEdit) return;
              setSlots((p) => p.map((r, i) => i === timeEdit.row ? { ...r, time: timeEdit.time || r.time, urdu: timeEdit.urdu || r.urdu } : r));
              toast.success("Time updated"); setTimeEdit(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}