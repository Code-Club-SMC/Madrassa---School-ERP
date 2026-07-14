import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMISSION_CATEGORIES,
  ADMISSION_VARIANTS,
  type AdmissionCategoryKey,
} from "@/lib/admission-variants";

export function AdmissionFormSelectorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [category, setCategory] = useState<AdmissionCategoryKey | null>(null);

  const reset = () => setCategory(null);
  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  };

  const variants = category ? ADMISSION_VARIANTS.filter((v) => v.category === category) : [];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-urdu text-2xl leading-loose text-end" dir="rtl" lang="ur">
            {category ? "فارم منتخب کریں" : "شعبہ منتخب کریں"}
          </DialogTitle>
          <DialogDescription className="text-end">
            {category ? "Choose the specific admission form" : "Choose the department for this admission"}
          </DialogDescription>
        </DialogHeader>

        {!category ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {ADMISSION_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={cn(
                  "group rounded-2xl border-2 border-border p-5 text-center transition-all",
                  "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                )}
              >
                <div className="text-4xl mb-3">{c.icon}</div>
                <p className="font-urdu text-lg font-semibold leading-loose" dir="rtl" lang="ur">
                  {c.labelUrdu}
                </p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                  {c.labelEnglish}
                </p>
                <p className="font-urdu text-xs text-muted-foreground mt-2 leading-loose" dir="rtl" lang="ur">
                  {c.descriptionUrdu}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {variants.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate({ to: "/admission/new", search: { variant: v.key } as never });
                }}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-end hover:border-primary/60 hover:bg-primary/5 transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                <div className="min-w-0 flex-1">
                  <p className="font-urdu text-base font-semibold leading-loose" dir="rtl" lang="ur">
                    {v.titleUrdu}
                  </p>
                  {v.subtitleUrdu && (
                    <p className="font-urdu text-sm text-muted-foreground leading-loose" dir="rtl" lang="ur">
                      {v.subtitleUrdu}
                    </p>
                  )}
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                    {v.titleEnglish}
                  </p>
                </div>
              </button>
            ))}
            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="font-urdu">واپس</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}