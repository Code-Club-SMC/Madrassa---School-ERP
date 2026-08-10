import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMISSION_STEPS = [
  { id: 1, urdu: "ذاتی معلومات", english: "Personal" },
  { id: 2, urdu: "نظام", english: "System" },
  { id: 3, urdu: "تفصیلات", english: "Details" },
  { id: 4, urdu: "ولی", english: "Guardian" },
  { id: 5, urdu: "جائزہ", english: "Review" },
] as const;

type Props = { current: number; lang?: "ur" | "en" };

export function AdmissionStepper({ current, lang = "ur" }: Props) {
  const isUrdu = lang === "ur";
  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border py-4 px-2 sm:px-6">
      <ol className="flex items-center gap-2">
        {ADMISSION_STEPS.map((step, idx) => {
          const done = step.id < current;
          const active = step.id === current;
          return (
            <li key={step.id} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !done && !active && "border-2 border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-[11px] sm:text-xs whitespace-nowrap",
                    done || active ? "text-primary" : "text-muted-foreground",
                    isUrdu ? "font-urdu" : "font-heading",
                  )}
                >
                  {isUrdu ? step.urdu : step.english}
                </span>
              </div>
              {idx < ADMISSION_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] -mt-5 rounded-full",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}