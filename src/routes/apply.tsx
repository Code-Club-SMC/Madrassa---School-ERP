import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ChevronLeft, School } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PdfFormRenderer } from "@/components/admission/pdf-form-renderer";
import {
  ADMISSION_CATEGORIES,
  ADMISSION_VARIANTS,
  getVariant,
  type AdmissionCategoryKey,
} from "@/lib/admission-variants";
import { institution } from "@/mock";

const searchSchema = z.object({ variant: z.string().optional() });

export const Route = createFileRoute("/apply")({
  validateSearch: searchSchema,
  component: PublicApply,
});

function PublicApply() {
  const { variant: variantKey } = Route.useSearch();
  const navigate = Route.useNavigate();
  const variant = getVariant(variantKey);
  const [category, setCategory] = useState<AdmissionCategoryKey | null>(null);
  const variants = category ? ADMISSION_VARIANTS.filter((v) => v.category === category) : [];

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <School className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-urdu text-sm leading-none">{institution.nameUrdu}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Online Admission · آن لائن داخلہ</p>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        {variant ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-urdu text-xl leading-loose" dir="rtl" lang="ur">{variant.titleUrdu}</p>
                {variant.subtitleUrdu && (
                  <p className="font-urdu text-sm text-muted-foreground" dir="rtl" lang="ur">{variant.subtitleUrdu}</p>
                )}
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{variant.titleEnglish}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate({ search: {} })}>
                <span className="font-urdu">فارم تبدیل کریں</span>
              </Button>
            </div>
            <PdfFormRenderer variant={variant} isPublic />
          </>
        ) : !category ? (
          <Card className="p-6">
            <h2 className="font-urdu text-2xl font-semibold text-end leading-loose mb-1" dir="rtl" lang="ur">
              شعبہ منتخب کریں
            </h2>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground text-end mb-6">
              Choose Department
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ADMISSION_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "rounded-2xl border-2 border-border p-5 text-center transition-all",
                    "hover:border-primary/60 hover:bg-primary/5",
                  )}
                >
                  <div className="text-4xl mb-3">{c.icon}</div>
                  <p className="font-urdu text-lg font-semibold leading-loose" dir="rtl" lang="ur">{c.labelUrdu}</p>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{c.labelEnglish}</p>
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-urdu text-2xl font-semibold text-end leading-loose" dir="rtl" lang="ur">
                فارم منتخب کریں
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setCategory(null)}>
                <span className="font-urdu">واپس</span>
              </Button>
            </div>
            <div className="space-y-2">
              {variants.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => navigate({ search: { variant: v.key } })}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-end hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                  <div className="min-w-0 flex-1">
                    <p className="font-urdu text-base font-semibold leading-loose" dir="rtl" lang="ur">{v.titleUrdu}</p>
                    {v.subtitleUrdu && (
                      <p className="font-urdu text-sm text-muted-foreground leading-loose" dir="rtl" lang="ur">{v.subtitleUrdu}</p>
                    )}
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{v.titleEnglish}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {institution.nameEnglish} · <span className="font-urdu">{institution.nameUrdu}</span> · Powered by MSMIS
        </p>
      </main>
    </div>
  );
}