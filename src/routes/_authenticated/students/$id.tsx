import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowRightLeft, BookOpen, Calendar, ClipboardList, FileText, IdCard, MapPin, Phone, Printer, User, Users2 } from "lucide-react";
import { getTranscript } from "@/components/exams/exam-api";
import { TranscriptView } from "@/components/exams/transcript-view";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoveEnrollmentDialog } from "@/components/students/move-enrollment-dialog";
import { StudentGuardianManager } from "@/components/students/student-guardian-manager";
import { StudentSiblingManager } from "@/components/students/student-sibling-manager";
import { StudentTimeline } from "@/components/students/student-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CredentialsOverlay } from "@/features/users/credentials-display";
import { formatDate } from "@/lib/format";
import type { ParentCreds, StudentProfilePayload } from "@/components/students/student-types";

export const Route = createFileRoute("/_authenticated/students/$id")({
  component: StudentProfile,
});

function StudentProfile() {
  const { id } = useParams({ from: "/_authenticated/students/$id" });
  const [profile, setProfile] = useState<StudentProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"personal" | "academic" | "guardians" | "siblings" | "activity">("personal");
  const [moveOpen, setMoveOpen] = useState(false);
  const [creds, setCreds] = useState<ParentCreds | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcript, setTranscript] = useState<Awaited<ReturnType<typeof getTranscript>> | null>(null);

  const loadProfile = useCallback(
    async ({ keepContent = false, signal }: { keepContent?: boolean; signal?: AbortSignal } = {}) => {
      if (!keepContent) setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/students/${id}`, { credentials: "include", signal });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load student profile");
        if (!signal?.aborted) setProfile(payload as StudentProfilePayload);
      } catch (loadError) {
        if (!signal?.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load student profile");
        }
      } finally {
        if (!signal?.aborted && !keepContent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadProfile({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [loadProfile]);

  const student = profile?.student;
  const isMadrassa = student?.system === "madrassa";
  const backTo = isMadrassa ? "/madrassa/students" : "/school/students";
  const initials = useMemo(() => (student ? student.name.split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase() : ""), [student]);

  async function openTranscript() {
    setTranscriptOpen(true);
    try {
      setTranscript(await getTranscript(id));
    } catch (loadError) {
      setTranscriptOpen(false);
      setTranscript(null);
      setError(loadError instanceof Error ? loadError.message : "Could not load transcript");
    }
  }

  if (loading) {
    return <Card className="p-8 text-sm text-muted-foreground">Loading student profile...</Card>;
  }

  if (error || !profile || !student) {
    return (
      <Card className="p-8">
        <p className="text-sm text-destructive">{error ?? "Student not found"}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/school/students">Back to students</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        Back
      </Link>
      <PageHeader
        title={student.name}
        titleUrdu={student.nameUrdu}
        description={`Roll ${student.rollNo} · ${student.groupEnglish}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMoveOpen(true)}>
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Move Enrollment
            </Button>
            <Link to="/id-cards">
              <Button variant="outline" size="sm" className="gap-1.5">
                <IdCard className="h-3.5 w-3.5" />
                ID Card
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void openTranscript()}>
              <FileText className="h-3.5 w-3.5" />
              Transcript
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        }
      />

      <Card className="p-5 mb-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary font-heading font-bold flex items-center justify-center text-2xl">{initials}</div>
        <div className="flex-1">
          <p className="font-urdu text-2xl font-bold leading-tight">{student.nameUrdu}</p>
          <p className="text-sm text-muted-foreground">{student.name}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="font-mono">
              {student.rollNo}
            </Badge>
            <Badge variant="secondary" className="font-urdu">
              {student.institutionSection === "banat" ? "بنات" : "بنین"}
            </Badge>
            <StatusBadge status={student.status} />
          </div>
        </div>
        <div className="text-start sm:text-end text-xs space-y-1">
          <p className="flex items-center sm:justify-end gap-1.5">
            <Phone className="h-3 w-3" />
            <span className="font-mono">{student.guardianPhone || "—"}</span>
          </p>
          <p className="flex items-center sm:justify-end gap-1.5">
            <MapPin className="h-3 w-3" />
            {student.guardianAddress || "—"}
          </p>
          <p className="font-mono">B-Form: {student.cnicBForm ?? "—"}</p>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="siblings">Siblings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-5 mt-3 grid sm:grid-cols-2 gap-4 text-sm">
            <Info label="Father" labelUrdu="والد" value={student.fatherName} valueUrdu={student.fatherNameUrdu ?? undefined} />
            <Info label="Date of Birth" labelUrdu="تاریخ پیدائش" value={formatMaybeDate(student.dob)} />
            <Info label="Gender" labelUrdu="جنس" value={student.gender} />
            <Info label="Guardian Address" labelUrdu="پتہ" value={student.guardianAddress || "—"} />
            <Info label="Guardian CNIC" labelUrdu="ولی شناختی کارڈ" value={student.guardianCnic || "—"} mono />
            <Info label="Admission Date" labelUrdu="تاریخ داخلہ" value={formatMaybeDate(student.admissionDate)} />
            <Info label="Institution" labelUrdu="ادارہ" value={student.institutionName} valueUrdu={student.institutionNameUrdu} />
            <Info label="Program" labelUrdu="شعبہ" value={student.programName} valueUrdu={student.programNameUrdu} />
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card className="overflow-hidden mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>{isMadrassa ? "Darja" : "Class"}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ended</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span className="font-mono text-xs">{enrollment.rollNo}</span>
                        <span className="text-[11px] text-muted-foreground">{enrollment.admissionNo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm">{enrollment.institutionName}</span>
                        <span className="font-urdu text-[11px] text-muted-foreground">{enrollment.institutionNameUrdu}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span className="font-urdu text-sm">{enrollment.schoolClassNameUrdu ?? enrollment.madrassaSubcategoryNameUrdu ?? "—"}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {enrollment.schoolClassName ?? enrollment.madrassaSubcategoryName ?? "—"}
                          {enrollment.schoolSectionName ? ` · ${enrollment.schoolSectionName}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={enrollment.status} />
                    </TableCell>
                    <TableCell className="text-xs">{formatMaybeDate(enrollment.startedAt)}</TableCell>
                    <TableCell className="text-xs">{formatMaybeDate(enrollment.endedAt ?? "")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="guardians">
          <StudentGuardianManager
            profile={profile}
            onChanged={loadProfile}
            onParentCredentials={setCreds}
          />
        </TabsContent>

        <TabsContent value="siblings">
          <StudentSiblingManager profile={profile} onChanged={loadProfile} />
        </TabsContent>

        <TabsContent value="activity">
          <StudentTimeline profile={profile} onParentCredentials={setCreds} />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        <Quick icon={ClipboardList} label="Activity" />
        <Quick icon={BookOpen} label="Enrollments" />
        <Quick icon={Users2} label="Guardians" />
        <Quick icon={IdCard} label="ID Card" />
      </div>

      <MoveEnrollmentDialog
        profile={profile}
        open={moveOpen}
        onOpenChange={setMoveOpen}
        onMoved={() => loadProfile({ keepContent: true })}
      />
      <ResponsiveDialog
        title="Annual Transcript"
        description="Published exam results across academic years."
        open={transcriptOpen}
        onOpenChange={setTranscriptOpen}
        icon={FileText}
        className="sm:max-w-4xl"
      >
        {transcript ? (
          <TranscriptView data={transcript} />
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">Loading transcript...</Card>
        )}
      </ResponsiveDialog>
      <CredentialsOverlay creds={creds} onClose={() => setCreds(null)} />
    </div>
  );
}

function Info({
  label,
  labelUrdu,
  value,
  valueUrdu,
  mono,
}: {
  label: string;
  labelUrdu: string;
  value: string;
  valueUrdu?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label} · <span className="font-urdu">{labelUrdu}</span>
      </p>
      <p className={`text-sm mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
      {valueUrdu && <p className="font-urdu text-sm text-muted-foreground">{valueUrdu}</p>}
    </div>
  );
}

function Quick({ icon: Icon, label }: { icon: typeof IdCard; label: string }) {
  return (
    <Card className="p-3 flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors">
      <Icon className="h-5 w-5 text-primary" />
      <p className="text-xs">{label}</p>
    </Card>
  );
}

function formatMaybeDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date);
}
