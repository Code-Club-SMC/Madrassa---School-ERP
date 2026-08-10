import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Inbox, ChevronLeft, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { applications } from "@/mock";
import { AdmissionFormSelectorDialog } from "@/components/admission/form-selector-dialog";
import { useLanguage } from "@/components/language-context";

export const Route = createFileRoute("/_authenticated/admission/")({
  component: AdmissionHub,
});

function AdmissionHub() {
  const { lang } = useLanguage();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const pendingCount = applications.filter((a) => a.status === "pending").length;
  return (
    <div>
      <PageHeader
        title="Admission Hub"
        titleUrdu="داخلہ مرکز"
        description={lang === "ur" ? "نیا داخلہ شروع کریں، یا آن لائن درخواستوں کا جائزہ لیں" : "Start a new admission, or review pending online applications."}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-8 hover:border-primary/40 transition-colors group">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-semibold">{lang === "ur" ? "نیا داخلہ" : "New Admission"}</h2>
              <p className={`text-base text-muted-foreground ${lang === "ur" ? "font-urdu" : ""}`}>{lang === "ur" ? "پانچ مرحلوں کے عمل سے نیا داخلہ کریں" : "Manually enroll a new student through the five-step admission flow"}</p>
            </div>
          </div>
          <p className={`text-sm text-muted-foreground leading-relaxed mb-6 ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "وائل ان ادمن۔ Suitable for walk-in admissions and admin-led intake." : "Manually enroll a new student through the five-step admission flow. Suitable for walk-in admissions and admin-led intake."}
          </p>
          <Button className="w-full" onClick={() => setSelectorOpen(true)}>
            {lang === "ur" && <span className="font-urdu">داخلہ شروع کریں</span>}
            {lang === "en" && "Start Admission"}
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Card>

        <Card className="p-8 hover:border-primary/40 transition-colors group">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Inbox className="h-6 w-6 text-primary" />
              {pendingCount > 0 && (
                <Badge className="absolute -top-2 -end-2 bg-amber-500 text-white border-0 h-5 min-w-5 px-1 text-[10px]">
                  {pendingCount}
                </Badge>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-semibold">{lang === "ur" ? "آن لائن درخواستیں" : "Application Queue"}</h2>
              <p className={`text-base text-muted-foreground ${lang === "ur" ? "font-urdu" : ""}`}>{lang === "ur" ? "آن لائن درخواستیں" : "Review online admission applications"}</p>
            </div>
          </div>
          <p className={`text-sm text-muted-foreground leading-relaxed mb-6 ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "آن لائن داخلہ درخواستیں کا جائزہ لیں، قبول یا مسترد کریں" : "Review online admission applications submitted through the public form. Accept to generate a roll number, or reject with reason."}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/admission/queue">
              {lang === "ur" && <span className="font-urdu">قطار دیکھیں</span>}
              {lang === "en" && "View Queue"}
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Card>

        <Card className="p-8 hover:border-primary/40 transition-colors group md:col-span-2">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"><CalendarClock className="h-6 w-6 text-primary" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-semibold">{lang === "ur" ? "انٹرویو، دستاویزات اور انتظار" : "Interviews, Documents & Waitlist"}</h2>
              <p className={`text-base text-muted-foreground ${lang === "ur" ? "font-urdu" : ""}`}>{lang === "ur" ? "انٹرویو، دستاویزات اور انتظار کی فہرست" : "Schedule interviews and manage waitlist"}</p>
            </div>
          </div>
          <p className={`text-sm text-muted-foreground leading-relaxed mb-6 ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "امیدواروں کے انٹرویو۔" : "Schedule applicant interviews, run through the required document checklist, and manage the waitlist when classes are full."}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/admission/interviews">
              {lang === "ur" && <span className="font-urdu">مرحلے کا انتظام</span>}
              {lang === "en" && "Manage Stages"}
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Card>
      </div>
      <AdmissionFormSelectorDialog open={selectorOpen} onOpenChange={setSelectorOpen} />
    </div>
  );
}