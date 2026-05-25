import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookMarked, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { students } from "@/mock";

export const Route = createFileRoute("/_authenticated/madrassa/exams/board")({
  component: WifaqBoardPage,
});

const BOARDS = ["Wifaq ul Madaris Al-Arabia Pakistan", "Tanzeem ul Madaris Ahle Sunnat", "Wifaq ul Madaris Al-Salafiyya", "Rabita ul Madaris", "Nizam ul Madaris"];

function WifaqBoardPage() {
  const [tab, setTab] = useState<"register" | "zimni">("register");
  const eligible = students.filter((s) => s.system === "madrassa").slice(0, 14);

  return (
    <div>
      <Link to="/madrassa/exams" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exams</Link>
      <PageHeader
        title="Wifaq Board Examination"
        titleUrdu="وفاقی بورڈ امتحان"
        description="External Wifaq registration & tracking. Baneen and Banat appear under the same date sheet."
      />

      <Card className="p-3 mb-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Wifaq:</span>
        <Select defaultValue={BOARDS[0]}><SelectTrigger className="w-[320px]"><SelectValue /></SelectTrigger><SelectContent>{BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
        <span className="text-xs text-muted-foreground ms-2">Hijri Year:</span>
        <Input defaultValue="1447" className="w-24" />
        <Button variant="outline" size="sm" className="gap-1.5 ms-auto"><Upload className="h-3.5 w-3.5" />Bulk Upload</Button>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="register">Registration · اندراج</TabsTrigger>
          <TabsTrigger value="zimni">Zimni Supplementary · ضمنی</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card className="overflow-x-auto mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Roll No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Darja</TableHead>
                  <TableHead>Wifaq Roll</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligible.map((s, i) => {
                  const registered = i % 2 === 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                      <TableCell><p className="font-medium text-sm">{s.name}</p><p className="font-urdu text-sm text-muted-foreground">{s.nameUrdu}</p></TableCell>
                      <TableCell><Badge variant="secondary" className="font-urdu text-xs">{s.gender === "male" ? "بنین" : "بنات"}</Badge></TableCell>
                      <TableCell><span className="font-urdu text-sm">{["ثانویہ عامہ", "عالمیہ", "ثانویہ خاصہ"][i % 3]}</span></TableCell>
                      <TableCell className="font-mono text-[10px]">{registered ? `WMA-1447-${4400 + i}` : "—"}</TableCell>
                      <TableCell>{registered ? <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Registered</Badge> : <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-300">Eligible</Badge>}</TableCell>
                      <TableCell className="text-end"><Button size="sm" variant="outline" onClick={() => toast.success(`${s.name} ${registered ? "withdrawn" : "registered with Wifaq"}`)}>{registered ? "Withdraw" : <><BookMarked className="h-3.5 w-3.5 me-1.5" />Register</>}</Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="zimni">
          <Card className="p-4 mt-3">
            <p className="text-sm">Students who failed the annual Wifaq exam appear here automatically. Update their Zimni result once announced.</p>
            <p className="font-urdu text-sm text-muted-foreground mt-1">ضمنی امتحان — سالانہ میں ناکام طلبہ کے لیے سپلیمنٹری</p>
            <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No students currently in Zimni list · فی الحال کوئی طالب علم درج نہیں
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}