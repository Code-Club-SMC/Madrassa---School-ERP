import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, MapPin, Printer, IdCard, BookOpen, Wallet, ClipboardList, BookMarked } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { studentsById, studentMadrassaPath, studentSchoolPath } from "@/mock/students";
import { feeRecords } from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/students/$id")({
  component: StudentProfile,
});

function StudentProfile() {
  const { id } = useParams({ from: "/_authenticated/students/$id" });
  const s = studentsById[id];
  if (!s) throw notFound();
  const fees = feeRecords.filter((f) => f.studentId === id);
  const isMadrassa = s.system === "madrassa";
  const madPath = studentMadrassaPath(s);
  const schPath = studentSchoolPath(s);
  const [tab, setTab] = useState<"personal" | "academic" | "fees" | "attendance" | "hifz">("personal");

  const initials = s.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div>
      <Link to={isMadrassa ? "/madrassa/students" : "/school/students"} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back</Link>
      <PageHeader
        title={s.name}
        titleUrdu={s.nameUrdu}
        description={`Roll ${s.rollNo} · ${isMadrassa ? madPath?.cat.name : schPath?.cls.name ?? "—"}`}
        actions={
          <div className="flex gap-2">
            <Link to="/id-cards"><Button variant="outline" size="sm" className="gap-1.5"><IdCard className="h-3.5 w-3.5" />ID Card</Button></Link>
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>
          </div>
        }
      />

      <Card className="p-5 mb-4 flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary font-heading font-bold flex items-center justify-center text-2xl">{initials}</div>
        <div className="flex-1">
          <p className="font-urdu text-2xl font-bold leading-tight">{s.nameUrdu}</p>
          <p className="text-sm text-muted-foreground">{s.name}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="font-mono">{s.rollNo}</Badge>
            <Badge variant="secondary" className="font-urdu">{s.institutionSection === "baneen" ? "بنین" : "بنات"}</Badge>
            <Badge variant={s.status === "active" ? "default" : "destructive"}>{s.status}</Badge>
            {s.wifaqRollNumber && <Badge variant="outline" className="font-mono text-[10px]">Wifaq: {s.wifaqRollNumber}</Badge>}
          </div>
        </div>
        <div className="text-end text-xs space-y-1">
          <p className="flex items-center justify-end gap-1.5"><Phone className="h-3 w-3" /><span className="font-mono">{s.guardianPhone}</span></p>
          <p className="flex items-center justify-end gap-1.5"><MapPin className="h-3 w-3" />{s.city}</p>
          <p className="font-mono">B-Form: {s.cnicBForm ?? "—"}</p>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          {isMadrassa && s.categoryId === "hifz" && <TabsTrigger value="hifz">Hifz · حفظ</TabsTrigger>}
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-5 mt-3 grid sm:grid-cols-2 gap-4 text-sm">
            <Info label="Father" labelUrdu="والد" value={s.guardianName} valueUrdu={s.guardianNameUrdu} />
            <Info label="Date of Birth" labelUrdu="تاریخ پیدائش" value={formatDate(s.dob)} />
            <Info label="Gender" labelUrdu="جنس" value={s.gender} />
            <Info label="Address" labelUrdu="پتہ" value={s.address} />
            <Info label="Guardian CNIC" labelUrdu="ولی شناختی کارڈ" value={s.guardianCnic} mono />
            <Info label="Admission Date" labelUrdu="تاریخ داخلہ" value={formatDate(s.admissionDate)} />
            <Info label="Monthly Fee" labelUrdu="ماہانہ فیس" value={formatPKR(s.monthlyFeePaisa / 100)} mono />
            <Info label="Relation" labelUrdu="رشتہ" value={s.guardianRelation} />
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card className="p-5 mt-3 space-y-3 text-sm">
            {isMadrassa ? (
              <>
                <Info label="Category" labelUrdu="زمرہ" value={madPath?.cat.name ?? "—"} valueUrdu={madPath?.cat.nameUrdu} />
                <Info label="Subcategory" labelUrdu="ذیلی زمرہ" value={madPath?.sub.name ?? "—"} valueUrdu={madPath?.sub.nameUrdu} />
                {s.darja && <Info label="Darja" labelUrdu="درجہ" value={s.darja} />}
                {s.ilhaqNumber && <Info label="Ilhaq #" labelUrdu="نمبر الحاق" value={s.ilhaqNumber} mono />}
              </>
            ) : (
              <>
                <Info label="Class" labelUrdu="جماعت" value={schPath?.cls.name ?? "—"} />
                <Info label="Section" labelUrdu="سیکشن" value={s.section ?? "—"} />
                {s.group && <Info label="Group" labelUrdu="گروپ" value={s.group} />}
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card className="overflow-hidden mt-3">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Paid On</TableHead></TableRow></TableHeader>
              <TableBody>
                {fees.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No fee records yet</TableCell></TableRow>}
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.month}</TableCell>
                    <TableCell className="font-mono text-sm">{formatPKR(f.amountPaisa / 100)}</TableCell>
                    <TableCell><Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "secondary"}>{f.status}</Badge></TableCell>
                    <TableCell className="text-xs">{f.paidOn ? formatDate(f.paidOn) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="p-4 mt-3">
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-md text-[10px] flex items-center justify-center font-mono ${i % 13 === 0 ? "bg-destructive/20 text-destructive" : i % 7 === 0 ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"}`}>{i + 1}</div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Last 30 working days. Green = present, amber = late, red = absent.</p>
          </Card>
        </TabsContent>

        {isMadrassa && s.categoryId === "hifz" && (
          <TabsContent value="hifz">
            <Card className="p-5 mt-3 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-heading font-semibold">Juz Progress · پارہ کی پیش رفت</p>
                  <span className="font-mono text-sm">{s.hifzJuzCompleted ?? 0} / 30</span>
                </div>
                <Progress value={((s.hifzJuzCompleted ?? 0) / 30) * 100} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Card className="p-3"><p className="text-xs text-muted-foreground">Today's Sabaq · سبق</p><p className="font-urdu text-lg mt-1">آلِ عمران آیت ۱۲۰</p></Card>
                <Card className="p-3"><p className="text-xs text-muted-foreground">Sabqi · سبقی</p><p className="font-urdu text-lg mt-1">پارہ ۳ مکمل</p></Card>
                <Card className="p-3"><p className="text-xs text-muted-foreground">Manzil · منزل</p><p className="font-urdu text-lg mt-1">پارہ ۱ تا ۲</p></Card>
              </div>
              <Link to="/madrassa/hifz"><Button variant="outline" size="sm" className="gap-1.5"><BookMarked className="h-3.5 w-3.5" />Open Hifz Tracker</Button></Link>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        <Quick icon={ClipboardList} label="Attendance" />
        <Quick icon={BookOpen} label="Results" />
        <Quick icon={Wallet} label="Pay Fee" />
        <Quick icon={IdCard} label="ID Card" />
      </div>
    </div>
  );
}

function Info({ label, labelUrdu, value, valueUrdu, mono }: { label: string; labelUrdu: string; value: string; valueUrdu?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label} · <span className="font-urdu">{labelUrdu}</span></p>
      <p className={`text-sm mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
      {valueUrdu && <p className="font-urdu text-sm text-muted-foreground">{valueUrdu}</p>}
    </div>
  );
}

function Quick({ icon: Icon, label }: { icon: typeof IdCard; label: string }) {
  return (
    <Card className="p-3 flex flex-col items-center justify-center gap-2 hover:border-primary/40 cursor-pointer transition-colors">
      <Icon className="h-5 w-5 text-primary" />
      <p className="text-xs">{label}</p>
    </Card>
  );
}