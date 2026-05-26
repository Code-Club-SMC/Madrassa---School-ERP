import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, IdCard, Eye, CalendarCheck, Phone, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { teachers as seedTeachers } from "@/mock/teachers";
import type { Teacher } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatPKR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/teachers")({
  component: TeachersPage,
});

const designationUrdu: Record<string, string> = {
  qari: "قاری", hafiz: "حافظ", mudarris: "مدرس", ustaad: "استاد",
  principal: "پرنسپل", subject_teacher: "مضمون استاد", sports: "کھیل", assistant: "معاون",
};

function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(seedTeachers);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "madrassa" | "school">("all");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", nameUrdu: "", designation: "subject_teacher" as Teacher["designation"], system: "school" as Teacher["system"], phone: "", qualification: "", salary: 50000 });

  const filtered = useMemo(() => teachers.filter((t) => {
    if (tab !== "all" && t.system !== tab) return false;
    if (q && !t.nameUrdu.includes(q) && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, tab, teachers]);

  const initials = (n: string) => n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div>
      <PageHeader
        title="Teachers"
        titleUrdu="اساتذہ"
        description={`${teachers.filter((t) => t.active).length} active staff across madrassa and school.`}
        actions={<Button className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Teacher</Button>}
      />

      <Card className="p-3 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="madrassa">Madrassa · مدرسہ</TabsTrigger>
            <TabsTrigger value="school">School · اسکول</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name…" className="pe-9" />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-0"><EmptyState icon={GraduationCap} heading="No teachers found" headingUrdu="کوئی استاد نہیں" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-heading font-bold flex items-center justify-center text-sm">{initials(t.name)}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-urdu text-base font-semibold leading-tight truncate">{t.nameUrdu}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-urdu">{designationUrdu[t.designation]}</span> · {t.designation.replace("_", " ")}
                  </p>
                </div>
                <StatusBadge status={t.active ? "active" : "inactive"} showUrdu={false} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{t.qualification}</p>
              <div className="flex flex-wrap gap-1.5">
                {t.subjects.slice(0, 4).map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px] font-mono">{s.replace("sub-", "")}</Badge>
                ))}
                {t.subjects.length === 0 && <Badge variant="outline" className="text-[10px]">No subjects</Badge>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-xs">
                  <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /><span className="font-mono">{t.phone}</span></p>
                  <p className="font-mono text-[11px] mt-0.5">{formatPKR(t.monthlySalaryPaisa / 100)}/mo</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild title="View profile" aria-label="View profile">
                    <Link to="/teachers/$id" params={{ id: t.id }}><Eye className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild title="ID card" aria-label="ID card">
                    <Link to="/id-cards"><IdCard className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="Mark attendance" aria-label="Mark attendance"><CalendarCheck className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Teacher · نیا استاد</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Name (English)</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label className="font-urdu">اردو نام</Label><Input dir="rtl" className="font-urdu" value={f.nameUrdu} onChange={(e) => setF({ ...f, nameUrdu: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>System</Label>
                <Select value={f.system} onValueChange={(v) => setF({ ...f, system: v as Teacher["system"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="madrassa">Madrassa · مدرسہ</SelectItem>
                    <SelectItem value="school">School · اسکول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Designation</Label>
                <Select value={f.designation} onValueChange={(v) => setF({ ...f, designation: v as Teacher["designation"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["qari","hafiz","mudarris","ustaad","principal","subject_teacher","sports","assistant"] as const).map((d) => (
                      <SelectItem key={d} value={d}>{d.replace("_"," ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0300-1234567" /></div>
              <div><Label>Monthly Salary (PKR)</Label><Input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: +e.target.value })} /></div>
            </div>
            <div><Label>Qualification</Label><Input value={f.qualification} onChange={(e) => setF({ ...f, qualification: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.name.trim()) { toast.error("Name required"); return; }
              const id = `T${Date.now()}`;
              setTeachers((p) => [{
                id, name: f.name, nameUrdu: f.nameUrdu || f.name,
                designation: f.designation, qualification: f.qualification || "—",
                qualificationUrdu: "—",
                subjects: [], system: f.system, phone: f.phone || "—",
                cnic: "—", address: "—",
                joinedAt: new Date().toISOString().slice(0,10),
                monthlySalaryPaisa: f.salary * 100,
                bankName: "—", bankAccount: "—", active: true,
              }, ...p]);
              toast.success("Teacher added");
              setF({ name: "", nameUrdu: "", designation: "subject_teacher", system: "school", phone: "", qualification: "", salary: 50000 });
              setOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
