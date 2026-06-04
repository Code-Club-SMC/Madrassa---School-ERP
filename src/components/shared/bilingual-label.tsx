import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type Props = {
  urdu: string;
  english: string;
  htmlFor?: string;
  required?: boolean;
  children?: ReactNode;
};

export function BilingualLabel({ urdu, english, htmlFor, required, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} dir="rtl" lang="ur" className="font-urdu text-base text-foreground leading-tight">
        {urdu}
        {required && <span className="text-destructive ms-1">*</span>}
      </Label>
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground font-medium -mt-1">{english}</span>
      {children}
    </div>
  );
}