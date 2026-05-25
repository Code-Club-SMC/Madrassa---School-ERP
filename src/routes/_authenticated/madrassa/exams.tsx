import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Plus, Calendar, BookOpen, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusKey } from "@/components/shared/status-badge";
import { examSeries, type ExamStatus } from "@/mock";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/madrassa/exams")({
  component: ExamsPage,
});

const examStatusMap: Record<ExamStatus, StatusKey> = { upcoming: "pending", active: "active", completed: "accepted" };
const TYPES = [
  { key: "sahmahi", urdu: "سہ ماہی", english: "Sah Mahi (Quarterly)" },
  { key: "nisfussana", urdu: "نصف السنہ", english: "Nisfus Sana (Mid-Year)" },
  { key: "salanah", urdu: "سالانہ", english: "Salanah (Annual)" },
  { key: "wifaqi", urdu: "وفاقی سالانہ", english: "Wifaqi Salanah (Board)" },
];

function ExamsPage() {
  return (
    <div>
      <PageHeader
        title="Madrassa Exams"
        titleUrdu="مدرسہ کے امتحانات"
        description="Internal: Sah Mahi · Nisfus Sana · Salanah. External: Wifaqi Salanah & Zimni board exams."
        actions={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />New Exam</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {TYPES.map((t) => (
          <Card key={t.key} className="p-4">
            <p className="font-urdu text-base font-semibold">{t.urdu}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t.english}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {examSeries.map((e) => (
          <Card key={e.id} className={cn("p-5 transition-colors hover:border-primary/40", e.status === "active" && "border-primary/40 bg-primary/[0.02]")}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-start gap-4 min-w-0">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-lg font-semibold">{e.name}</h3>
                    <StatusBadge status={examStatusMap[e.status]} />
                  </div>
                  <p className="font-urdu text-base text-muted-foreground">{e.nameUrdu}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(e.startDate)} – {formatDate(e.endDate)}</span>
                    <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{e.subjects.length} subjects</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {e.subjects.slice(0, 4).map((s) => (
                  <Badge key={s.id} variant="outline" className="font-urdu text-xs">{s.nameUrdu}</Badge>
                ))}
                {e.subjects.length > 4 && <Badge variant="outline">+{e.subjects.length - 4}</Badge>}
                <Button variant="outline" size="sm" className="ms-2">View <ArrowLeft className="h-3.5 w-3.5 ms-1.5 rtl:rotate-180" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}