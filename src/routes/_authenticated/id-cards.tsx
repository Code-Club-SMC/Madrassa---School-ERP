import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, IdCard as IdCardIcon, Search, Filter, Eye, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Subject = { type: "student" | "teacher"; id: string; name: string; nameUrdu: string; sub: string; subUrdu: string; roll: string };

export const Route = createFileRoute("/_authenticated/id-cards")({
  component: IdCardsPage,
});

type CardSection = "all" | "al-qasim-academy" | "jamia-zainab-school" | "jamia-qasimia-madrassa" | "jamia-zainab-madrassa" | "teachers";

const SECTION_OPTIONS: { value: CardSection; label: string; labelUrdu: string }[] = [
  { value: "all", label: "All Cards", labelUrdu: "تمام کارڈز" },
  { value: "al-qasim-academy", label: "Al-Qasim Academy", labelUrdu: "القاسم اکادمی" },
  { value: "jamia-zainab-school", label: "Jamia Zainab School", labelUrdu: "جمیہ زینب اسکول" },
  { value: "jamia-qasimia-madrassa", label: "Jamia Qasimia Baneen", labelUrdu: "جمیہ قاسمیہ بنین" },
  { value: "jamia-zainab-madrassa", label: "Jamia Zainab Banat", labelUrdu: "جمیہ زینب بنات" },
  { value: "teachers", label: "Teachers", labelUrdu: "اساتذہ" },
];

function IdCardsPage() {
  const [tab, setTab] = useState<"student" | "teacher">("student");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<CardSection>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [previewItem, setPreviewItem] = useState<Subject | null>(null);

  const [studentSection, setStudentSection] = useState<CardSection>("all");
  const [teacherScope, setTeacherScope] = useState<"all" | "school" | "madrassa" | "qasmia-both" | "qasmia-madrassa" | "qasmia-school" | "zainab-both" | "zainab-madrassa" | "zainab-school">("all");

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["id-cards-students", studentSection, search],
    queryFn: async () => {
      const results: any[] = [];
      const baseParams = new URLSearchParams();
      baseParams.set("pageSize", "100");
      if (search.trim()) baseParams.set("q", search.trim());
      
      if (studentSection === "all" || studentSection === "al-qasim-academy") {
        const res = await fetch(`/api/students?${baseParams.toString()}&system=school&institutionId=al_qasim_academy`, { credentials: "include" });
        const data = await res.json();
        if (data.students) results.push(...data.students);
      }
      
      if (studentSection === "all" || studentSection === "jamia-zainab-school") {
        const res = await fetch(`/api/students?${baseParams.toString()}&system=school&institutionId=jamia_zainab_banat`, { credentials: "include" });
        const data = await res.json();
        if (data.students) results.push(...data.students);
      }
      
      if (studentSection === "all" || studentSection === "jamia-qasimia-madrassa") {
        const res = await fetch(`/api/students?${baseParams.toString()}&system=madrassa&institutionId=jamia_qasmia_baneen`, { credentials: "include" });
        const data = await res.json();
        if (data.students) results.push(...data.students);
      }
      
      if (studentSection === "all" || studentSection === "jamia-zainab-madrassa") {
        const res = await fetch(`/api/students?${baseParams.toString()}&system=madrassa&institutionId=jamia_zainab_banat`, { credentials: "include" });
        const data = await res.json();
        if (data.students) results.push(...data.students);
      }
      
      return results;
    },
    enabled: tab === "student",
  });

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ["id-cards-teachers", teacherScope, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("all", "true");
      params.set("pageSize", "100");
      params.set("systemScope", teacherScope);
      if (search.trim()) params.set("q", search.trim());
      
      const res = await fetch(`/api/teachers?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Teachers API error:", res.status, errorText);
        return [];
      }
      const data = await res.json();
      console.log("Teachers API response:", data);
      return Array.isArray(data) ? data : (data.teachers || []);
    },
    enabled: tab === "teacher",
  });

  const subjects: Subject[] = useMemo(() => {
    if (tab === "student") {
      return (studentsData || []).slice(0, 50).map((s: any) => ({
        type: "student" as const,
        id: s.id,
        name: s.name || "",
        nameUrdu: s.nameUrdu || "",
        sub: s.schoolClassName || s.madrassaSubcategoryName || "—",
        subUrdu: s.schoolClassNameUrdu || s.madrassaSubcategoryNameUrdu || "—",
        roll: s.rollNo || s.admissionNo || "",
      }));
    }
    
    return (teachersData || []).slice(0, 50).map((t: any) => ({
      type: "teacher" as const,
      id: t.id,
      name: t.name || "",
      nameUrdu: t.nameUrdu || "",
      sub: t.designation?.replace(/_/g, " ") || "Teacher",
      subUrdu: t.qualification || "",
      roll: t.cnic || "",
    }));
  }, [tab, studentsData, teachersData]);

  const teacherScopes: { value: typeof teacherScope; label: string }[] = [
    { value: "all", label: "All Teachers" },
    { value: "qasmia-madrassa", label: "Qasim Madrassa" },
    { value: "qasmia-school", label: "Qasim School" },
    { value: "zainab-madrassa", label: "Zainab Madrassa" },
    { value: "zainab-school", label: "Zainab School" },
  ];

  const studentSections: { value: CardSection; label: string }[] = [
    { value: "all", label: "All Students" },
    { value: "al-qasim-academy", label: "Al-Qasim Academy" },
    { value: "jamia-zainab-school", label: "Jamia Zainab School" },
    { value: "jamia-qasimia-madrassa", label: "Jamia Qasimia Baneen" },
    { value: "jamia-zainab-madrassa", label: "Jamia Zainab Banat" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <PageHeader
          title="ID Card Generator"
          titleUrdu="شناختی کارڈ ساز"
          description="Print-ready CR80 cards for students and teachers."
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll, or CNIC..."
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      {showFilters && (
        <Card className="p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setSearch(""); }}>
              <TabsList className="h-8">
                <TabsTrigger value="student" className="text-xs px-3 py-1">Students</TabsTrigger>
                <TabsTrigger value="teacher" className="text-xs px-3 py-1">Teachers</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="h-6 w-px bg-border mx-1" />

            {tab === "student" ? (
              <div className="flex flex-wrap gap-1.5">
                {studentSections.map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={studentSection === item.value ? "default" : "outline"}
                    onClick={() => setStudentSection(item.value)}
                    className="text-xs h-8 px-2.5"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {teacherScopes.map((scope) => (
                  <Button
                    key={scope.value}
                    size="sm"
                    variant={teacherScope === scope.value ? "default" : "outline"}
                    onClick={() => setTeacherScope(scope.value)}
                    className="text-xs h-8 px-2.5"
                  >
                    {scope.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="space-y-2">
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No cards found. Adjust your filters or search query.</p>
          ) : (
            subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-urdu text-sm font-semibold truncate">{s.nameUrdu}</p>
                    <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">{s.roll}</span>
                    <span>·</span>
                    <span className="font-urdu truncate">{s.subUrdu}</span>
                    <span className="text-[10px] uppercase">{s.type === "student" ? "Student" : "Teacher"}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewItem(s)}
                  className="shrink-0 ml-2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ID Card Preview</DialogTitle>
            <DialogDescription>Preview of the selected ID card</DialogDescription>
          </DialogHeader>
          {previewItem && (
            <div className={cn("id-card-print rounded-2xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden", orientation === "landscape" && "aspect-[1.586/1]")}>
              <div className="bg-primary text-primary-foreground px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary-foreground/15 flex items-center justify-center">
                  <IdCardIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-[11px] uppercase tracking-wide truncate">Institution Name</p>
                  <p className="font-urdu text-[10px] truncate">ادارے کا نام</p>
                </div>
              </div>
              <div className="p-3 flex gap-3">
                <div className="w-16 h-20 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground text-center shrink-0">
                  PHOTO
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-urdu text-sm font-bold leading-tight truncate">{previewItem.nameUrdu}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{previewItem.name}</p>
                  <div className="pt-1 space-y-0.5">
                    <p className="text-[10px]">
                      <span className="text-muted-foreground">Roll:</span> <span className="font-mono">{previewItem.roll}</span>
                    </p>
                    <p className="text-[10px] truncate">
                      <span className="text-muted-foreground">{previewItem.type === "student" ? "Class" : "Role"}:</span> <span className="font-urdu">{previewItem.subUrdu}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">Session 2024–25</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/40 px-3 py-1.5 text-[9px] text-muted-foreground text-center border-t border-border">
                If found, please return to the institution office.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}