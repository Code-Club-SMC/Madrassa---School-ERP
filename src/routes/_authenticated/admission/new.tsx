import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PdfFormRenderer } from "@/components/admission/pdf-form-renderer";
import {
  ADMISSION_CATEGORIES,
  ADMISSION_VARIANTS,
  getVariant,
} from "@/lib/admission-variants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ variant: z.string().optional() });

export const Route = createFileRoute("/_authenticated/admission/new")({
  validateSearch: searchSchema,
  component: NewAdmissionRoute,
});

function NewAdmissionRoute() {
  const { variant: variantKey } = Route.useSearch();
  const variant = getVariant(variantKey);

  if (variant) {
    return (
      <>
        <PageHeader
          title="New Admission"
          titleUrdu="نیا داخلہ"
          description={variant.titleEnglish}
        />
        <PdfFormRenderer variant={variant} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Choose Admission Form"
        titleUrdu="داخلہ فارم منتخب کریں"
        description="Select the department and exact official form before entering admission details."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ADMISSION_CATEGORIES.map((category) => {
          const variants = ADMISSION_VARIANTS.filter((variant) => variant.category === category.key);
          return (
            <Card key={category.key} className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                  {category.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="font-urdu text-lg font-semibold leading-loose" dir="rtl" lang="ur">
                    {category.labelUrdu}
                  </h2>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{category.labelEnglish}</p>
                </div>
              </div>
              <div className="space-y-2">
                {variants.map((variant) => (
                  <Button key={variant.key} asChild variant="outline" className="h-auto w-full justify-between gap-3 py-3 text-end">
                    <Link to="/admission/new" search={{ variant: variant.key }}>
                      <ChevronLeft className="h-4 w-4 shrink-0 rtl:rotate-180" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-urdu text-sm leading-loose" dir="rtl" lang="ur">
                          {variant.titleUrdu}
                        </span>
                        {variant.subtitleUrdu && (
                          <span className="block font-urdu text-xs text-muted-foreground" dir="rtl" lang="ur">
                            {variant.subtitleUrdu}
                          </span>
                        )}
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
