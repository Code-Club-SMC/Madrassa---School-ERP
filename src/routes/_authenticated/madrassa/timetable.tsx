import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/madrassa/timetable")({
  component: TimetablePage,
});

const slots = [
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
  return (
    <div>
      <PageHeader title="Dars Timetable" titleUrdu="نظامِ اوقات (درس)" description="Weekly schedule. Fridays are reserved for Jumu'ah." />
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
                  <p className="font-mono text-xs">{row.time}</p>
                  <p className="font-urdu text-sm text-muted-foreground">{row.urdu}</p>
                </td>
                {row.subjects.map((subj, j) => (
                  <td key={j} className="p-2 text-center">
                    <div className={cn("rounded-md px-2 py-1.5 text-xs", subj === "Break" ? "bg-muted/50 text-muted-foreground" : "bg-primary/10 text-primary font-medium")}>{subj}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}