import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { DmcPayload } from "./exam-types";

type Props = {
  data: DmcPayload;
};

export function DmcView({ data }: Props) {
  return (
    <div className="space-y-4">
      <div className="print-target border border-border bg-card p-5">
        <div className="border-b border-border pb-4 text-center">
          <p className="font-urdu text-2xl font-bold">{data.exam.institutionNameUrdu}</p>
          <p className="font-heading text-lg font-semibold">{data.exam.institutionName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Detailed Marks Certificate
          </p>
        </div>

        <div className="grid gap-3 py-4 text-sm sm:grid-cols-2">
          <Info label="Student" value={data.student.name} sub={data.student.nameUrdu} />
          <Info label="Father" value={data.student.fatherName} />
          <Info label="Roll No" value={data.student.rollNo} mono />
          <Info label="Admission No" value={data.student.admissionNo} mono />
          <Info label="Exam" value={data.exam.name} sub={data.exam.nameUrdu} />
          <Info label="Class / Darja" value={data.student.groupLabel} />
          <Info label="Academic Year" value={data.exam.academicYear} />
          <Info label="Dates" value={`${formatDate(data.exam.startDate)} - ${formatDate(data.exam.endDate)}`} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead className="text-end">Total</TableHead>
              <TableHead className="text-end">Pass</TableHead>
              <TableHead className="text-end">Obtained</TableHead>
              <TableHead className="text-end">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.subjects.map((subject) => (
              <TableRow key={subject.code}>
                <TableCell>
                  <p className="text-sm font-medium">{subject.name}</p>
                  <p className="font-urdu text-sm text-muted-foreground">{subject.nameUrdu}</p>
                </TableCell>
                <TableCell className="text-end font-mono">{subject.totalMarks}</TableCell>
                <TableCell className="text-end font-mono">{subject.passingMarks}</TableCell>
                <TableCell className="text-end font-mono">
                  {subject.attendanceStatus === "present" ? subject.obtainedMarks ?? 0 : subject.attendanceStatus}
                </TableCell>
                <TableCell className="text-end">
                  <Badge variant={isSubjectPass(subject) ? "secondary" : "destructive"}>
                    {isSubjectPass(subject) ? "Pass" : "Fail"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/40 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-end font-mono">{data.result.totalMarks}</TableCell>
              <TableCell />
              <TableCell className="text-end font-mono">{data.result.obtainedMarks}</TableCell>
              <TableCell className="text-end">{data.result.percentage.toFixed(2)}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="mt-4 grid gap-3 text-center text-sm sm:grid-cols-4">
          <Summary label="Percentage" value={`${data.result.percentage.toFixed(2)}%`} />
          <Summary label="Grade" value={data.result.grade} />
          <Summary label="Position" value={data.result.position ? String(data.result.position) : "-"} />
          <Summary label="Result" value={data.result.status.toUpperCase()} tone={data.result.status} />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-12 text-center text-xs text-muted-foreground">
          <div className="border-t border-border pt-2">Class Teacher</div>
          <div className="border-t border-border pt-2">Principal / Nazim</div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => window.print()}>
          Print DMC
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-sm" : "text-sm font-medium"}>{value || "-"}</p>
      {sub && <p className="font-urdu text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "pass" | "fail" }) {
  return (
    <div className="border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={tone === "fail" ? "font-mono text-base font-bold text-destructive" : "font-mono text-base font-bold"}>
        {value}
      </p>
    </div>
  );
}

function isSubjectPass(subject: DmcPayload["subjects"][number]) {
  return subject.attendanceStatus === "present" && (subject.obtainedMarks ?? 0) >= subject.passingMarks;
}
