import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/teachers/salary")({
  component: TeacherSalaryBoundaryPage,
});

function TeacherSalaryBoundaryPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Teacher Salary"
        titleUrdu="اساتذہ کی تنخواہ"
        description="Teacher V1 stores salary input fields on the teacher profile. Payroll, payments, and payslips are not active in this version."
      />

      <Card className="p-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Payroll workflow is not included in Teacher V1</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use each teacher profile&apos;s Salary Info tab for base salary, bank account,
              payment method, effective date, and notes. Salary disbursement, deductions,
              payslips, and payroll reports will belong to the future HR/payroll module.
            </p>
          </div>
          <div>
            <Button asChild>
              <Link to="/teachers">
                <GraduationCap className="h-4 w-4" />
                Open Teachers
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
