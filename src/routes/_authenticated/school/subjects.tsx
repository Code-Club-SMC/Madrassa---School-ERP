import { createFileRoute } from "@tanstack/react-router";
import { BookMarked, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/school/subjects")({
  component: SubjectsPage,
});

const SUBJECTS = [
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
  return (
    <div>
      <PageHeader
        title="School Subjects"
        titleUrdu="مضامین"
        description="National Curriculum (SNC 2021–2024) — compulsory and elective subjects across Primary, Middle, and Secondary levels."
        actions={<Button size="sm" className="gap-1.5"><BookMarked className="h-4 w-4" /><Plus className="h-3.5 w-3.5" />Add Subject</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUBJECTS.map((s) => (
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
    </div>
  );
}
