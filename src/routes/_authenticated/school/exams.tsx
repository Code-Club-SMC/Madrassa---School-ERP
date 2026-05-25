import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Plus, Calendar, Grid3x3, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/school/exams")({
  component: ExamsPage,
});

type Series = {
  id: string; name: string; nameUrdu: string;
  type: "monthly" | "quarterly" | "halfyearly" | "annual" | "board";
  status: "Upcoming" | "Active" | "Completed";
  startDate: string; endDate: string;
  classes: string[];
  subjects: number;
};

const SERIES: Series[] = [
  { id: "ex-q1", name: "First Quarterly 2025", nameUrdu: "پہلا سہ ماہی امتحان", type: "quarterly", status: "Completed", startDate: "2025-06-10", endDate: "2025-06-20", classes: ["Grade 1–5"], subjects: 6 },
  { id: "ex-mid", name: "Mid-Term / Half-Yearly 2025", nameUrdu: "نصف سالہ امتحان", type: "halfyearly", status: "Completed", startDate: "2025-09-15", endDate: "2025-09-28", classes: ["Grade 1–10"], subjects: 8 },
  { id: "ex-q3", name: "Third Quarterly 2025", nameUrdu: "تیسرا سہ ماہی امتحان", type: "quarterly", status: "Active", startDate: "2025-12-05", endDate: "2025-12-15", classes: ["Grade 1–8"], subjects: 6 },
  { id: "ex-ann", name: "Annual Examination 2026", nameUrdu: "سالانہ امتحان", type: "annual", status: "Upcoming", startDate: "2026-03-01", endDate: "2026-03-25", classes: ["All Classes"], subjects: 10 },
  { id: "ex-ssc1", name: "SSC Part I (BISE Prep)", nameUrdu: "میٹرک حصہ اول — بورڈ تیاری", type: "board", status: "Upcoming", startDate: "2026-02-10", endDate: "2026-02-22", classes: ["Grade 9 — Science", "Grade 9 — Arts"], subjects: 8 },
];

const STATUS_TONE: Record<Series["status"], string> = {
  Upcoming: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-300",
  Active: "bg-chart-1/15 text-chart-5 border-chart-2/30 dark:text-chart-1",
  Completed: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABEL: Record<Series["type"], string> = {
  monthly: "ماہانہ ٹیسٹ",
  quarterly: "سہ ماہی",
  halfyearly: "نصف سالہ",
  annual: "سالانہ",
  board: "BISE بورڈ",
};

function ExamsPage() {
  return (
    <div>
      <PageHeader
        title="School Examinations"
        titleUrdu="امتحانات — اسکول"
        description="Pakistani exam cycle — Monthly, Quarterly, Half-Yearly, Annual + BISE board preparatory exams for Grade 9–12."
        actions={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />New Exam Series</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERIES.map((s) => (
          <Card key={s.id} className="p-5 flex flex-col hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{s.name}</p>
                <p className="font-urdu text-base text-muted-foreground mt-0.5">{s.nameUrdu}</p>
              </div>
              <Badge variant="outline" className={STATUS_TONE[s.status]}>{s.status}</Badge>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <Row icon={<FileText className="h-3.5 w-3.5" />} label="Type" value={<span className="font-urdu">{TYPE_LABEL[s.type]}</span>} />
              <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Dates" value={`${formatDate(s.startDate)} → ${formatDate(s.endDate)}`} />
              <Row icon={<Grid3x3 className="h-3.5 w-3.5" />} label="Subjects" value={`${s.subjects} subjects`} />
              <div className="flex flex-wrap gap-1 pt-1">
                {s.classes.map((c) => (
                  <span key={c} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{c}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
              <Button size="sm" variant="outline" className="text-xs">Schedule</Button>
              <Button size="sm" variant="outline" className="text-xs">Seating</Button>
              <Button size="sm" variant="outline" className="text-xs">Results</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 mt-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Pakistani Grading Scale (BISE)</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-mono">A1 (80%+)</span> ممتاز · <span className="font-mono">A (70–79%)</span> بہت اچھا · <span className="font-mono">B (60–69%)</span> اچھا · <span className="font-mono">C (50–59%)</span> اوسط · <span className="font-mono">D (40–49%)</span> کم اوسط · <span className="font-mono">F (&lt;33%)</span> ناکام
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
