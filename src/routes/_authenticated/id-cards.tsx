import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Printer, IdCard as IdCardIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { students, madrassaCategories, schoolClasses, institution } from "@/mock";
import { teachers } from "@/mock/teachers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/id-cards")({
  component: IdCardsPage,
});

type Subject = { type: "student" | "teacher"; id: string; name: string; nameUrdu: string; sub: string; subUrdu: string; roll: string };

function IdCardsPage() {
  const [tab, setTab] = useState<"student" | "teacher">("student");
  const [target, setTarget] = useState<string>("all");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const subjects: Subject[] = useMemo(() => {
    if (tab === "student") {
      const list = target === "all"
        ? students.slice(0, 8)
        : students.filter((s) => s.categoryId === target || s.classId === target).slice(0, 8);
      return list.map((s) => {
        const cat = madrassaCategories.find((c) => c.id === s.categoryId);
        const cls = schoolClasses.find((c) => c.id === s.classId);
        return {
          type: "student" as const, id: s.id, name: s.name, nameUrdu: s.nameUrdu,
          sub: cat?.name ?? cls?.name ?? "—", subUrdu: cat?.nameUrdu ?? cls?.nameUrdu ?? "—", roll: s.rollNo,
        };
      });
    }
    const list = target === "all" ? teachers.slice(0, 8) : teachers.filter((t) => t.id === target);
    return list.map((t) => ({
      type: "teacher" as const, id: t.id, name: t.name, nameUrdu: t.nameUrdu,
      sub: t.designation.replace("_", " "), subUrdu: t.qualificationUrdu, roll: t.cnic,
    }));
  }, [tab, target]);

  return (
    <div>
      <PageHeader
        title="ID Card Generator"
        titleUrdu="شناختی کارڈ ساز"
        description="Print-ready CR80 cards for students and teachers."
        actions={<Button className="gap-1.5" onClick={() => window.print()}><Printer className="h-4 w-4" />Print All Cards</Button>}
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setTarget("all"); }} className="mb-4">
        <TabsList>
          <TabsTrigger value="student">Student Cards · طلبہ</TabsTrigger>
          <TabsTrigger value="teacher">Teacher Cards · اساتذہ</TabsTrigger>
        </TabsList>
        <TabsContent value="student" />
        <TabsContent value="teacher" />
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card className="p-4 space-y-4 h-fit print:hidden">
          <div>
            <label className="text-xs text-muted-foreground">Target · ہدف</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {tab === "student" ? "students" : "teachers"}</SelectItem>
                {tab === "student" ? (
                  <>
                    {madrassaCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    {schoolClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </>
                ) : (
                  teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Orientation</label>
            <ToggleGroup type="single" value={orientation} onValueChange={(v) => v && setOrientation(v as typeof orientation)} className="mt-1.5 justify-start">
              <ToggleGroupItem value="portrait" className="text-xs">Portrait</ToggleGroupItem>
              <ToggleGroupItem value="landscape" className="text-xs">Landscape</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
            <p>Showing <span className="font-mono text-foreground">{subjects.length}</span> cards</p>
            <p>Size: CR80 (85.6 × 54 mm)</p>
          </div>
          <Button className="w-full gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print Preview</Button>
        </Card>

        <Card className="p-4">
          <div className={cn("grid gap-4", orientation === "portrait" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 lg:grid-cols-2")}>
            {subjects.map((s) => (
              <div key={s.id} className={cn("id-card-print rounded-2xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden", orientation === "landscape" && "aspect-[1.586/1]")}>
                <div className="bg-primary text-primary-foreground px-3 py-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary-foreground/15 flex items-center justify-center"><IdCardIcon className="h-3.5 w-3.5" /></div>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-[11px] uppercase tracking-wide truncate">{institution.nameEnglish}</p>
                    <p className="font-urdu text-[10px] truncate">{institution.nameUrdu}</p>
                  </div>
                </div>
                <div className="p-3 flex gap-3">
                  <div className="w-16 h-20 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground text-center shrink-0">PHOTO</div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-urdu text-sm font-bold leading-tight truncate">{s.nameUrdu}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.name}</p>
                    <div className="pt-1 space-y-0.5">
                      <p className="text-[10px]"><span className="text-muted-foreground">Roll:</span> <span className="font-mono">{s.roll}</span></p>
                      <p className="text-[10px] truncate"><span className="text-muted-foreground">{s.type === "student" ? "Class" : "Role"}:</span> <span className="font-urdu">{s.subUrdu}</span></p>
                      <p className="text-[10px] text-muted-foreground">Session 2024–25</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/40 px-3 py-1.5 text-[9px] text-muted-foreground text-center border-t border-border">If found, please return to the institution office.</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
