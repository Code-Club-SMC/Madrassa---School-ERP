import { createFileRoute } from "@tanstack/react-router";
import { School } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdmissionWizard } from "@/components/admission/admission-wizard";
import { institution } from "@/mock";

export const Route = createFileRoute("/apply")({
  component: PublicApply,
});

function PublicApply() {
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <School className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-urdu text-sm leading-none">{institution.nameUrdu}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Online Admission · آن لائن داخلہ</p>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <AdmissionWizard isPublic />
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          {institution.nameEnglish} · <span className="font-urdu">{institution.nameUrdu}</span> · Powered by MSMIS
        </p>
      </main>
    </div>
  );
}