import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { schoolClasses } from "@/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/school/timetable")({
  component: SchoolTimetablePage,
});

const periods = [
  { time: "08:00 → 08:40", label: "Assembly", urdu: "اسمبلی", subjects: ["Assembly", "Assembly", "Assembly", "Assembly", "Assembly", "Assembly"] },
  { time: "08:40 → 09:20", label: "Period 1", urdu: "پہلا پیریڈ", subjects: ["Urdu", "English", "Math", "Science", "Islamiat", "Urdu"] },
  { time: "09:20 → 10:00", label: "Period 2", urdu: "دوسرا پیریڈ", subjects: ["English", "Math", "Urdu", "S.Studies", "Math", "English"] },
  { time: "10:00 → 10:40", label: "Period 3", urdu: "تیسرا پیریڈ", subjects: ["Math", "Science", "Islamiat", "English", "Urdu", "Math"] },
  { time: "10:40 → 11:00", label: "Break", urdu: "وقفہ", subjects: ["Break", "Break", "Break", "Break", "Break", "Break"] },
  { time: "11:00 → 11:40", label: "Period 4", urdu: "چوتھا پیریڈ", subjects: ["Science", "Urdu", "English", "Math", "Computer", "Science"] },
  { time: "11:40 → 12:20", label: "Period 5", urdu: "پانچواں پیریڈ", subjects: ["S.Studies", "Computer", "Science", "Islamiat", "English", "Arts"] },
  { time: "12:20 → 13:00", label: "Period 6", urdu: "چھٹا پیریڈ", subjects: ["Islamiat", "Arts", "PE", "Urdu", "Science", "S.Studies"] },
  { time: "13:00 → 13:30", label: "Zuhr · Dhuhr", urdu: "نمازِ ظہر", subjects: ["Prayer", "Prayer", "Prayer", "Prayer", "Prayer", "Prayer"] },
];
const daysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const daysUr = ["پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

function SchoolTimetablePage() {
  const [cls, setCls] = useState(schoolClasses[0]?.id ?? "");
  const current = schoolClasses.find((c) => c.id === cls);

  return (
    <div>
      <PageHeader
        title="School Timetable"
        titleUrdu="نظامِ اوقات"
        description="Weekly class schedule. Sunday is closed."
        actions={
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {schoolClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} · <span className="font-urdu ms-1">{c.nameUrdu}</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {current && (
        <Card className="p-4 mb-4 flex items-center justify-between bg-primary/5 border-primary/20">
          <div>
            <p className="font-urdu text-lg">{current.nameUrdu}</p>
            <p className="text-xs text-muted-foreground">{current.name} · 6 working days</p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">{periods.filter((p) => !["Break", "Prayer", "Assembly"].includes(p.subjects[0])).length} academic periods/day</p>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-start p-3 w-[170px] font-medium">Period</th>
              {daysEn.map((d, i) => (
                <th key={d} className="text-center p-3 font-medium">
                  <p className="font-urdu text-base leading-tight">{daysUr[i]}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{d}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="p-3 align-top">
                  <p className="font-mono text-xs">{row.time}</p>
                  <p className="font-urdu text-sm text-muted-foreground">{row.urdu}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{row.label}</p>
                </td>
                {row.subjects.map((subj, j) => {
                  const muted = ["Break", "Prayer", "Assembly"].includes(subj);
                  return (
                    <td key={j} className="p-2 text-center">
                      <div className={cn("rounded-md px-2 py-1.5 text-xs", muted ? "bg-muted/50 text-muted-foreground" : "bg-primary/10 text-primary font-medium")}>{subj}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}