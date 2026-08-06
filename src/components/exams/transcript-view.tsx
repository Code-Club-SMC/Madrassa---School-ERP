import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TranscriptPayload } from "./exam-types";

type Props = {
  data: TranscriptPayload;
};

export function TranscriptView({ data }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-urdu text-xl font-semibold">{data.student.nameUrdu}</p>
        <p className="text-sm text-muted-foreground">
          {data.student.name} · {data.student.fatherName}
        </p>
      </div>

      {data.years.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No published exam results are available.</Card>
      ) : (
        data.years.map((year) => (
          <Card key={year.academicYear} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <p className="font-semibold">{year.academicYear}</p>
                <p className="text-sm text-muted-foreground">{year.classLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={year.finalStatus === "pass" ? "secondary" : "destructive"}>
                  {year.finalStatus.toUpperCase()}
                </Badge>
                <Badge variant="outline">{year.averagePercentage}% avg</Badge>
                {year.annualResult && <Badge variant="outline">Annual: {year.annualResult.grade}</Badge>}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-end">Marks</TableHead>
                  <TableHead className="text-end">%</TableHead>
                  <TableHead className="text-end">Grade</TableHead>
                  <TableHead className="text-end">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {year.exams.map((exam) => (
                  <TableRow key={`${year.academicYear}:${exam.examName}:${exam.examType}`}>
                    <TableCell className="font-medium">{exam.examName}</TableCell>
                    <TableCell>{exam.examType}</TableCell>
                    <TableCell className="text-end font-mono">
                      {exam.obtainedMarks}/{exam.totalMarks}
                    </TableCell>
                    <TableCell className="text-end font-mono">{(exam.percentageTimes100 / 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-end font-mono">{exam.grade}</TableCell>
                    <TableCell className="text-end">
                      <Badge variant={exam.status === "pass" ? "secondary" : "destructive"}>
                        {exam.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ))
      )}
    </div>
  );
}
