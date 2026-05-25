import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus, Inbox, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { applications } from "@/mock";

export const Route = createFileRoute("/_authenticated/admission")({
  component: AdmissionHub,
});

function AdmissionHub() {
  const pendingCount = applications.filter((a) => a.status === "pending").length;
  return (
    <div>
      <PageHeader
        title="Admission Hub"
        titleUrdu="داخلہ مرکز"
        description="Start a new admission, or review pending online applications."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-8 hover:border-primary/40 transition-colors group">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-semibold">New Admission</h2>
              <p className="font-urdu text-base text-muted-foreground">نیا داخلہ</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Manually enroll a new student through the five-step admission flow. Suitable for walk-in admissions and admin-led intake.
          </p>
          <Button asChild className="w-full">
            <Link to="/admission/new">
              <span className="font-urdu">داخلہ شروع کریں</span>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
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
              <h2 className="font-heading text-xl font-semibold">Application Queue</h2>
              <p className="font-urdu text-base text-muted-foreground">آن لائن درخواستیں</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Review online admission applications submitted through the public form. Accept to generate a roll number, or reject with reason.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/admission/queue">
              <span className="font-urdu">قطار دیکھیں</span>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}