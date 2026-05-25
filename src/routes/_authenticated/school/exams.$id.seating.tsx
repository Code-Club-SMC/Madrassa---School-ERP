import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Printer, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/exams/$id/seating")({
  component: SeatingPage,
});

const HALLS = ["Hall A", "Hall B", "Hall C", "Room 1", "Room 2"];
const CLASS_TONES = ["bg-blue-500/15 text-blue-700 dark:text-blue-300", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", "bg-amber-500/15 text-amber-700 dark:text-amber-300", "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300", "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"];

function SeatingPage() {
  const { id } = useParams({ from: "/_authenticated/school/exams/$id/seating" });
  const [hall, setHall] = useState(HALLS[0]);
  const [version, setVersion] = useState(0);

  // deterministic-ish layout per version
  const seats = Array.from({ length: 40 }).map((_, i) => ({
    seat: i + 1,
    rollNo: `SCH-${2024000 + ((i * 7 + version * 11) % 312)}`,
    classIdx: (i + version) % 5,
  }));

  return (
    <div>
      <Link to="/school/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exam</Link>
      <PageHeader
        title="Seating Arrangement"
        titleUrdu="نشست بندی"
        description="Hall-wise seat assignment. Classes are colour-coded to prevent adjacent same-class seats."
        actions={
          <div className="flex gap-2 items-center">
            <Select value={hall} onValueChange={setHall}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>{HALLS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setVersion((v) => v + 1); toast.success("Seating shuffled"); }}><Shuffle className="h-3.5 w-3.5" />Shuffle</Button>
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>
          </div>
        }
      />

      <Card className="p-3 mb-3 flex flex-wrap items-center gap-3">
        {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c, i) => (
          <Badge key={c} variant="outline" className={CLASS_TONES[i]}>{c}</Badge>
        ))}
      </Card>

      <Card className="p-5 print-target">
        <div className="text-center mb-4">
          <p className="font-heading text-lg font-bold">{hall} · Seating Plan</p>
          <p className="font-urdu text-base text-muted-foreground">نشست بندی · {hall}</p>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {seats.map((s) => (
            <div key={s.seat} className={`rounded-lg border border-border p-2 text-center text-[10px] ${CLASS_TONES[s.classIdx]}`}>
              <p className="font-mono font-bold text-xs">#{s.seat}</p>
              <p className="font-mono text-[9px] truncate">{s.rollNo}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">40 seats · 8 columns · invigilator desk at front</p>
      </Card>
    </div>
  );
}