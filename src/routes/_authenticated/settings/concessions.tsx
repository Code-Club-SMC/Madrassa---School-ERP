import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Building2,
  Check,
  Filter,
  GraduationCap,
  HeartHandshake,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import { students as mockStudents } from "@/mock";

export const Route = createFileRoute("/_authenticated/settings/concessions")({
  component: ConcessionsPage,
});

export type SystemKey =
  | "qasimia_madrassa"
  | "zainab_madrassa"
  | "qasim_academy"
  | "zainab_school";

export interface SystemOption {
  id: SystemKey;
  system: "school" | "madrassa";
  institutionId: string;
  section: "male" | "female";
  nameEn: string;
  nameUr: string;
  badge: string;
  badgeUr: string;
}

export const SYSTEM_OPTIONS: SystemOption[] = [
  {
    id: "qasimia_madrassa",
    system: "madrassa",
    institutionId: "jamia_qasmia_baneen",
    section: "male",
    nameEn: "Jamia Qasmia Lil-Baneen (Madrassa)",
    nameUr: "جامعہ قاسمیہ للبنین (مدرسہ)",
    badge: "Madrassa Boys",
    badgeUr: "مدرسہ بنین",
  },
  {
    id: "zainab_madrassa",
    system: "madrassa",
    institutionId: "jamia_zainab_banat",
    section: "female",
    nameEn: "Jamia Zainab Lil-Banat (Madrassa)",
    nameUr: "جامعہ زینب للبنات (مدرسہ)",
    badge: "Madrassa Girls",
    badgeUr: "مدرسہ بنات",
  },
  {
    id: "qasim_academy",
    system: "school",
    institutionId: "al_qasim_academy",
    section: "male",
    nameEn: "Al-Qasim Academy (School - Boys)",
    nameUr: "القاسم اکیڈمی (سکول بنین)",
    badge: "School Boys",
    badgeUr: "سکول بنین",
  },
  {
    id: "zainab_school",
    system: "school",
    institutionId: "jamia_zainab_banat",
    section: "female",
    nameEn: "Jamia Zainab Support (School - Girls)",
    nameUr: "جامعہ زینب (سکول گرلز)",
    badge: "School Girls",
    badgeUr: "سکول گرلز",
  },
];

export interface ClassOption {
  id: string;
  nameEn: string;
  nameUr: string;
}

export const FALLBACK_CLASSES: Record<SystemKey, ClassOption[]> = {
  qasim_academy: [
    { id: "cls-nur", nameEn: "Nursery", nameUr: "نرسری" },
    { id: "cls-prep", nameEn: "Prep", nameUr: "پریپ" },
    { id: "cls-1", nameEn: "Class 1", nameUr: "اوّل" },
    { id: "cls-2", nameEn: "Class 2", nameUr: "دوئم" },
    { id: "cls-3", nameEn: "Class 3", nameUr: "سوئم" },
    { id: "cls-4", nameEn: "Class 4", nameUr: "چہارم" },
    { id: "cls-5", nameEn: "Class 5", nameUr: "پنجم" },
    { id: "cls-6", nameEn: "Class 6", nameUr: "ششم" },
    { id: "cls-7", nameEn: "Class 7", nameUr: "ہفتم" },
    { id: "cls-8", nameEn: "Class 8", nameUr: "ہشتم" },
    { id: "cls-9", nameEn: "Class 9", nameUr: "نہم" },
    { id: "cls-10", nameEn: "Class 10", nameUr: "دہم" },
  ],
  zainab_school: [
    { id: "zcls-nur", nameEn: "Nursery (Girls)", nameUr: "نرسری گرلز" },
    { id: "zcls-prep", nameEn: "Prep (Girls)", nameUr: "پریپ گرلز" },
    { id: "zcls-1", nameEn: "Class 1 (Girls)", nameUr: "اوّل گرلز" },
    { id: "zcls-2", nameEn: "Class 2 (Girls)", nameUr: "دوئم گرلز" },
    { id: "zcls-3", nameEn: "Class 3 (Girls)", nameUr: "سوئم گرلز" },
    { id: "zcls-4", nameEn: "Class 4 (Girls)", nameUr: "چہارم گرلز" },
    { id: "zcls-5", nameEn: "Class 5 (Girls)", nameUr: "پنجم گرلز" },
    { id: "zcls-6", nameEn: "Class 6 (Girls)", nameUr: "ششم گرلز" },
    { id: "zcls-7", nameEn: "Class 7 (Girls)", nameUr: "ہفتم گرلز" },
    { id: "zcls-8", nameEn: "Class 8 (Girls)", nameUr: "ہشتم گرلز" },
  ],
  qasimia_madrassa: [
    { id: "sub-hifz", nameEn: "Hifz-ul-Quran", nameUr: "حفظ القرآن الکریم" },
    { id: "sub-nazira", nameEn: "Nazira & Qaida", nameUr: "ناظرہ و قاعدہ" },
    { id: "sub-dn-1", nameEn: "Dars-e-Nizami (Awwala)", nameUr: "درس نظامی اولیٰ" },
    { id: "sub-dn-2", nameEn: "Dars-e-Nizami (Saniya)", nameUr: "درس نظامی ثانیہ" },
    { id: "sub-dn-3", nameEn: "Dars-e-Nizami (Salisa)", nameUr: "درس نظامی ثالثہ" },
    { id: "sub-dn-4", nameEn: "Dars-e-Nizami (Rabia)", nameUr: "درس نظامی رابعہ" },
    { id: "sub-dn-5", nameEn: "Dars-e-Nizami (Khamisa)", nameUr: "درس نظامی خامسہ" },
    { id: "sub-dn-6", nameEn: "Dars-e-Nizami (Sadisa)", nameUr: "درس نظامی سادسہ" },
    { id: "sub-dn-7", nameEn: "Dars-e-Nizami (Sabia)", nameUr: "درس نظامی سابعہ" },
    { id: "sub-dn-8", nameEn: "Daura-e-Hadith (Almiya)", nameUr: "دورہ حدیث شریف (عالمیہ)" },
  ],
  zainab_madrassa: [
    { id: "zsub-nazira", nameEn: "Nazira & Qaida (Banat)", nameUr: "ناظرہ و قاعدہ بنات" },
    { id: "zsub-dn-1", nameEn: "Dars-e-Nizami (Awwala)", nameUr: "درس نظامی اولیٰ بنات" },
    { id: "zsub-dn-2", nameEn: "Dars-e-Nizami (Saniya)", nameUr: "درس نظامی ثانیہ بنات" },
    { id: "zsub-dn-3", nameEn: "Dars-e-Nizami (Salisa)", nameUr: "درس نظامی ثالثہ بنات" },
    { id: "zsub-dn-4", nameEn: "Dars-e-Nizami (Rabia)", nameUr: "درس نظامی رابعہ بنات" },
    { id: "zsub-dn-5", nameEn: "Daura-e-Hadith (Banat)", nameUr: "دورہ حدیث شریف بنات" },
  ],
};

export type Concession = {
  id: string;
  studentId: string;
  studentName?: string;
  studentNameUrdu?: string;
  fatherName?: string;
  rollNo?: string;
  systemKey?: SystemKey;
  systemName?: string;
  systemNameUrdu?: string;
  classId?: string;
  className?: string;
  classNameUrdu?: string;
  monthlyFeePaisa?: number;
  reason: "orphan" | "hardship" | "merit" | "sibling" | "staff_child" | "other";
  reasonUrdu: string;
  percent: number;
  approvedBy: string;
  active: boolean;
  notes?: string;
  createdAt?: string;
};

const REASONS: { v: Concession["reason"]; en: string; ur: string; defaultPercent: number }[] = [
  { v: "orphan", en: "Orphan", ur: "یتیم", defaultPercent: 100 },
  { v: "hardship", en: "Hardship", ur: "مالی مشکل", defaultPercent: 50 },
  { v: "merit", en: "Merit / Scholarship", ur: "وظیفہ", defaultPercent: 50 },
  { v: "sibling", en: "Sibling discount", ur: "بھائی بہن رعایت", defaultPercent: 25 },
  { v: "staff_child", en: "Staff child", ur: "اہلکار اولاد", defaultPercent: 50 },
  { v: "other", en: "Other", ur: "دیگر رعایت", defaultPercent: 20 },
];

const DEFAULT_CONCESSIONS: Concession[] = [
  {
    id: "c-101",
    studentId: "stu_demo_01",
    studentName: "Muhammad Bilal",
    studentNameUrdu: "محمد بلال",
    rollNo: "DN-101",
    fatherName: "Abdur Rahman",
    systemKey: "qasimia_madrassa",
    systemName: "Jamia Qasmia (Madrassa - Boys)",
    systemNameUrdu: "جامعہ قاسمیہ للبنین (مدرسہ)",
    className: "Dars-e-Nizami (Awwala)",
    classNameUrdu: "درس نظامی اولیٰ",
    monthlyFeePaisa: 250000,
    reason: "orphan",
    reasonUrdu: "یتیم",
    percent: 100,
    approvedBy: "Principal / مہتمم",
    active: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "c-102",
    studentId: "stu_demo_02",
    studentName: "Hamza Farooq",
    studentNameUrdu: "حمزہ فاروق",
    rollNo: "SCH-204",
    fatherName: "Farooq Ahmad",
    systemKey: "qasim_academy",
    systemName: "Al-Qasim Academy (School - Boys)",
    systemNameUrdu: "القاسم اکیڈمی (سکول)",
    className: "Class 6",
    classNameUrdu: "ششم",
    monthlyFeePaisa: 200000,
    reason: "sibling",
    reasonUrdu: "بھائی بہن رعایت",
    percent: 25,
    approvedBy: "Accountant / اکاؤنٹنٹ",
    active: true,
    createdAt: "2026-05-02T00:00:00.000Z",
  },
  {
    id: "c-103",
    studentId: "stu_demo_03",
    studentName: "Fatima Zahra",
    studentNameUrdu: "فاطمہ زہرا",
    rollNo: "ZDN-302",
    fatherName: "Tariq Mahmood",
    systemKey: "zainab_madrassa",
    systemName: "Jamia Zainab (Madrassa - Girls)",
    systemNameUrdu: "جامعہ زینب للبنات (مدرسہ)",
    className: "Dars-e-Nizami (Saniya)",
    classNameUrdu: "درس نظامی ثانیہ",
    monthlyFeePaisa: 220000,
    reason: "merit",
    reasonUrdu: "وظیفہ",
    percent: 50,
    approvedBy: "Admin / منتظم",
    active: true,
    createdAt: "2026-05-03T00:00:00.000Z",
  },
];

function ConcessionsPage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState<string>("all");

  const [items, setItems] = useState<Concession[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fee_concessions");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_CONCESSIONS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("fee_concessions", JSON.stringify(items));
      } catch {}
    }
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((c) => {
      if (systemFilter !== "all" && c.systemKey !== systemFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.studentName?.toLowerCase().includes(q);
        const matchesUrdu = c.studentNameUrdu?.includes(q);
        const matchesRoll = c.rollNo?.toLowerCase().includes(q);
        const matchesId = c.studentId?.toLowerCase().includes(q);
        const matchesFather = c.fatherName?.toLowerCase().includes(q);
        if (!matchesName && !matchesUrdu && !matchesRoll && !matchesId && !matchesFather) {
          return false;
        }
      }
      return true;
    });
  }, [items, systemFilter, searchQuery]);

  const totalWaivedPaisa = items
    .filter((i) => i.active)
    .reduce((a, c) => {
      return a + Math.round(((c.monthlyFeePaisa ?? 200000) * c.percent) / 100);
    }, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={isUrdu ? "فیس رعایات و وظائف" : "Concessions & Scholarships"}
        titleUrdu="رعایات و وظائف"
        description={
          isUrdu
            ? "یتیم طلباء، مالی پریشانی، بھائی بہن اور قابلیت کی بنیاد پر فیس رعایت کا خودکار انتظام۔"
            : "Manage fee waivers for orphans, hardship cases, sibling discounts and scholarships."
        }
        actions={
          <AddConcessionDialog
            onSave={(c) => {
              setItems((p) => [c, ...p]);
              toast.success(isUrdu ? "رعایت کامیابی سے شامل کر دی گئی" : "Concession added successfully");
            }}
          />
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{isUrdu ? "کل فعال رعایات" : "Active Concessions"}</p>
          <p className="font-heading text-2xl font-bold mt-1">
            {items.filter((i) => i.active).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{isUrdu ? "یتیم طلباء (100% معاف)" : "Orphans (100% Free)"}</p>
          <p className="font-heading text-2xl font-bold mt-1 text-chart-1">
            {items.filter((i) => i.reason === "orphan" && i.active).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{isUrdu ? "تعلیمی وظائف" : "Scholarships"}</p>
          <p className="font-heading text-2xl font-bold mt-1 text-chart-2">
            {items.filter((i) => i.reason === "merit" && i.active).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{isUrdu ? "ماہانہ کل رعایت" : "Monthly Waived"}</p>
          <p className="font-heading text-2xl font-bold mt-1 font-mono text-emerald-600 dark:text-emerald-400">
            {formatPKR(totalWaivedPaisa / 100)}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder={isUrdu ? "طالب علم، رول نمبر، ولدیت تلاش کریں..." : "Search by student, roll no, father..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Button
              size="sm"
              variant={systemFilter === "all" ? "default" : "outline"}
              className="h-7 text-xs px-2.5 rounded-lg shrink-0"
              onClick={() => setSystemFilter("all")}
            >
              {isUrdu ? "تمام شعبہ جات" : "All Branches"}
            </Button>
            {SYSTEM_OPTIONS.map((sys) => (
              <Button
                key={sys.id}
                size="sm"
                variant={systemFilter === sys.id ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-lg shrink-0"
                onClick={() => setSystemFilter(sys.id)}
              >
                {isUrdu ? sys.badgeUr : sys.badge}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Concessions Table */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{isUrdu ? "طالب علم" : "Student"}</TableHead>
              <TableHead>{isUrdu ? "شعبہ و کلاس" : "System & Class"}</TableHead>
              <TableHead>{isUrdu ? "وجہِ رعایت" : "Reason"}</TableHead>
              <TableHead>{isUrdu ? "شرح" : "%"}</TableHead>
              <TableHead>{isUrdu ? "ماہانہ رعایت" : "Monthly Waived"}</TableHead>
              <TableHead>{isUrdu ? "منظور کنندہ" : "Approved By"}</TableHead>
              <TableHead>{isUrdu ? "حیثیت" : "Status"}</TableHead>
              <TableHead className="text-end">{isUrdu ? "کارروائی" : "Action"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {isUrdu
                    ? "کوئی فیس رعایت ریکارڈ نہیں ملا۔ نیا ریکارڈ شامل کرنے کے لیے اوپر دیے گئے بٹن کا استعمال کریں۔"
                    : "No fee concessions found matching your filters. Click 'Add Concession' to create one."}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((c) => {
                const waived = Math.round(((c.monthlyFeePaisa ?? 200000) * c.percent) / 100);
                const reasonMeta = REASONS.find((r) => r.v === c.reason);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">
                            {c.studentName ?? c.studentId}
                          </span>
                          {c.rollNo && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono">
                              {c.rollNo}
                            </Badge>
                          )}
                        </div>
                        {c.studentNameUrdu && (
                          <p className="font-urdu text-xs text-muted-foreground">
                            {c.studentNameUrdu} {c.fatherName ? `ولد ${c.fatherName}` : ""}
                          </p>
                        )}
                        {!c.studentNameUrdu && c.fatherName && (
                          <p className="text-[11px] text-muted-foreground">
                            Father: {c.fatherName}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">
                          {isUrdu ? c.systemNameUrdu ?? c.systemName : c.systemName ?? "General"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {isUrdu ? c.classNameUrdu ?? c.className : c.className ?? "—"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {reasonMeta?.en}
                      </Badge>
                      <p className="font-urdu text-[11px] text-muted-foreground mt-0.5">
                        {c.reasonUrdu}
                      </p>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-xs font-semibold",
                          c.percent === 100
                            ? "border-emerald-500/30 text-emerald-700 bg-emerald-500/10 dark:text-emerald-400"
                            : "border-primary/30 text-primary bg-primary/10",
                        )}
                      >
                        {c.percent}%
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatPKR(waived / 100)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">{c.approvedBy}</TableCell>

                    <TableCell>
                      {c.active ? (
                        <Badge
                          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                          variant="outline"
                        >
                          {isUrdu ? "فعال" : "Active"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{isUrdu ? "غیر فعال" : "Ended"}</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setItems((p) => p.filter((x) => x.id !== c.id));
                          toast.success(isUrdu ? "رعایت ختم کر دی گئی" : "Concession removed");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Auto-apply Information Note */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              {isUrdu ? "خودکار رعایتی اصول (Auto-apply policy)" : "Auto-apply policy & guidelines"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isUrdu
                ? "یتیم (Orphan) طلباء کے لیے 100% مکمل فیس معاف ہے۔ بھائی بہن (Siblings) کی صورت میں چھوٹے بچے کی فیس پر 25% رعایت لاگو ہوتی ہے۔ اساتذہ و عملہ کے بچوں کے لیے 50% رعایت ہے۔ آپ یہاں سے کسی بھی طالب علم کی مخصوص رعایت شامل کر سکتے ہیں۔"
                : "Orphans receive 100% full tuition waiver automatically. Younger siblings automatically qualify for 25% discount. Staff children receive 50% waiver. You can configure and approve custom student waivers above."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AddConcessionDialog({ onSave }: { onSave: (c: Concession) => void }) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // 1. First Field: System / Branch Selection
  const [selectedSystem, setSelectedSystem] = useState<SystemKey>("qasimia_madrassa");

  // 2. Second Field: Class / Darja Selection (Dependent on System)
  const [classList, setClassList] = useState<ClassOption[]>(FALLBACK_CLASSES.qasimia_madrassa);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [classesLoading, setClassesLoading] = useState(false);

  // 3. Third Field: Student Selection (Dependent on System & Class)
  const [studentList, setStudentList] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [manualIdMode, setManualIdMode] = useState(false);

  // Form concession inputs
  const [form, setForm] = useState({
    studentId: "",
    reason: "orphan" as Concession["reason"],
    percent: 100,
    notes: "",
  });

  const selectedSysConfig = useMemo(() => {
    return SYSTEM_OPTIONS.find((s) => s.id === selectedSystem) ?? SYSTEM_OPTIONS[0];
  }, [selectedSystem]);

  // Load Classes when System changes
  useEffect(() => {
    if (!open) return;
    let active = true;
    setClassesLoading(true);

    const fallbacks = FALLBACK_CLASSES[selectedSystem] ?? [];

    if (selectedSysConfig.system === "school") {
      const url = selectedSysConfig.institutionId
        ? `/api/academic/school/classes?institutionId=${encodeURIComponent(selectedSysConfig.institutionId)}&gender=${selectedSysConfig.section}`
        : "/api/academic/school/classes";

      fetch(url, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active) return;
          if (d?.classes && Array.isArray(d.classes) && d.classes.length > 0) {
            const mapped: ClassOption[] = d.classes.map((c: any) => ({
              id: c.id,
              nameEn: c.name,
              nameUr: c.nameUrdu || c.name,
            }));
            setClassList(mapped);
          } else {
            setClassList(fallbacks);
          }
        })
        .catch(() => {
          if (active) setClassList(fallbacks);
        })
        .finally(() => {
          if (active) setClassesLoading(false);
        });
    } else {
      const params = new URLSearchParams();
      if (selectedSysConfig.section) params.set("section", selectedSysConfig.section);

      fetch(`/api/academic/madrassa/categories?${params.toString()}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active) return;
          if (d?.categories && Array.isArray(d.categories) && d.categories.length > 0) {
            const mapped: ClassOption[] = [];
            for (const cat of d.categories) {
              if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
                for (const sub of cat.subcategories) {
                  mapped.push({
                    id: sub.id,
                    nameEn: `${cat.name} — ${sub.name}`,
                    nameUr: `${cat.nameUrdu || cat.name} — ${sub.nameUrdu || sub.name}`,
                  });
                }
              } else {
                mapped.push({
                  id: cat.id,
                  nameEn: cat.name,
                  nameUr: cat.nameUrdu || cat.name,
                });
              }
            }
            setClassList(mapped.length > 0 ? mapped : fallbacks);
          } else {
            setClassList(fallbacks);
          }
        })
        .catch(() => {
          if (active) setClassList(fallbacks);
        })
        .finally(() => {
          if (active) setClassesLoading(false);
        });
    }

    // Reset class and student selection on system change
    setSelectedClass("all");
    setForm((f) => ({ ...f, studentId: "" }));

    return () => {
      active = false;
    };
  }, [open, selectedSystem, selectedSysConfig]);

  // Load Students when System or Class changes
  useEffect(() => {
    if (!open) return;
    let active = true;
    setStudentsLoading(true);

    const params = new URLSearchParams({
      system: selectedSysConfig.system,
      status: "active",
      pageSize: "100",
    });

    if (selectedSysConfig.institutionId) {
      params.set("institutionId", selectedSysConfig.institutionId);
    }
    if (selectedSysConfig.system === "madrassa" && selectedSysConfig.section) {
      params.set("section", selectedSysConfig.section);
    }
    if (selectedClass && selectedClass !== "all") {
      if (selectedSysConfig.system === "school") {
        params.set("classId", selectedClass);
      } else {
        params.set("subcategoryId", selectedClass);
      }
    }

    fetch(`/api/students?${params.toString()}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        const list = d?.students && Array.isArray(d.students) ? d.students : [];

        // If strict query returned empty, try querying system students without institutionId filter
        if (list.length === 0 && selectedSysConfig.institutionId) {
          const fallbackParams = new URLSearchParams({
            system: selectedSysConfig.system,
            status: "active",
            pageSize: "100",
          });
          if (selectedClass && selectedClass !== "all") {
            if (selectedSysConfig.system === "school") {
              fallbackParams.set("classId", selectedClass);
            } else {
              fallbackParams.set("subcategoryId", selectedClass);
            }
          }
          return fetch(`/api/students?${fallbackParams.toString()}`, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : null))
            .then((fallbackData) => {
              if (!active) return;
              let fallbackList =
                fallbackData?.students && Array.isArray(fallbackData.students)
                  ? fallbackData.students
                  : [];
              if (fallbackList.length === 0) {
                // Filter mock students
                fallbackList = mockStudents.filter(
                  (ms) => ms.system === selectedSysConfig.system || ms.system === "both",
                );
              }
              setStudentList(fallbackList);
              if (fallbackList.length > 0) {
                setForm((f) => ({ ...f, studentId: fallbackList[0].id }));
              } else {
                setForm((f) => ({ ...f, studentId: "" }));
              }
            });
        }

        setStudentList(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, studentId: list[0].id }));
        } else {
          setForm((f) => ({ ...f, studentId: "" }));
        }
      })
      .catch(() => {
        if (!active) return;
        const fallbackList = mockStudents.filter(
          (ms) => ms.system === selectedSysConfig.system || ms.system === "both",
        );
        setStudentList(fallbackList);
        if (fallbackList.length > 0) {
          setForm((f) => ({ ...f, studentId: fallbackList[0].id }));
        }
      })
      .finally(() => {
        if (active) setStudentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, selectedSystem, selectedClass, selectedSysConfig]);

  const selectedStudent = useMemo(() => {
    return studentList.find((s) => s.id === form.studentId);
  }, [studentList, form.studentId]);

  const selectedClassMeta = useMemo(() => {
    return classList.find((c) => c.id === selectedClass);
  }, [classList, selectedClass]);

  const regularMonthlyFeePaisa = useMemo(() => {
    if (selectedStudent?.monthlyFeePaisa) return selectedStudent.monthlyFeePaisa;
    if (selectedStudent?.monthlyFee) return selectedStudent.monthlyFee * 100;
    if (selectedStudent?.schoolClassFee) return selectedStudent.schoolClassFee * 100;
    if (selectedStudent?.madrassaSubcategoryFee) return selectedStudent.madrassaSubcategoryFee * 100;
    return 200000; // default PKR 2,000
  }, [selectedStudent]);

  const waivedPaisa = Math.round((regularMonthlyFeePaisa * form.percent) / 100);
  const payablePaisa = Math.max(0, regularMonthlyFeePaisa - waivedPaisa);

  const handleReasonChange = (newReason: Concession["reason"]) => {
    const meta = REASONS.find((r) => r.v === newReason);
    setForm((f) => ({
      ...f,
      reason: newReason,
      percent: meta ? meta.defaultPercent : f.percent,
    }));
  };

  const handleApprove = () => {
    if (!form.studentId) {
      toast.error(isUrdu ? "طالب علم کا انتخاب لازمی ہے" : "Please select or enter a student");
      return;
    }

    const reasonMeta = REASONS.find((x) => x.v === form.reason) ?? REASONS[0];

    onSave({
      id: `c${Date.now()}`,
      studentId: form.studentId,
      studentName: selectedStudent?.name ?? form.studentId,
      studentNameUrdu: selectedStudent?.nameUrdu,
      fatherName: selectedStudent?.fatherName,
      rollNo: selectedStudent?.rollNo,
      systemKey: selectedSystem,
      systemName: selectedSysConfig.nameEn,
      systemNameUrdu: selectedSysConfig.nameUr,
      classId: selectedClass !== "all" ? selectedClass : undefined,
      className: selectedClassMeta?.nameEn ?? (selectedClass !== "all" ? selectedClass : undefined),
      classNameUrdu: selectedClassMeta?.nameUr,
      monthlyFeePaisa: regularMonthlyFeePaisa,
      reason: form.reason,
      reasonUrdu: reasonMeta.ur,
      percent: form.percent,
      approvedBy: user?.name ? `${user.name} (${user.role})` : "Super Admin",
      active: true,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 cursor-pointer">
          <Plus className="h-3.5 w-3.5" />
          {isUrdu ? "نئی رعایت شامل کریں" : "Add Concession"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-primary" />
            <span>{isUrdu ? "نئی فیس رعایت و وظیفہ" : "New Fee Concession & Waiver"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">
          {/* FIELD 1: System / Branch Selection */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>
                1. {isUrdu ? "شعبہ و ادارہ (System / Branch)" : "1. Select System / Branch"}
              </span>
            </Label>
            <Select
              value={selectedSystem}
              onValueChange={(v) => setSelectedSystem(v as SystemKey)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select system / branch" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_OPTIONS.map((sys) => (
                  <SelectItem key={sys.id} value={sys.id}>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-medium">{sys.nameEn}</span>
                      <span className="font-urdu text-xs text-muted-foreground ms-2">
                        {sys.nameUr}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FIELD 2: Class / Darja Selection (Dependent on System) */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <span>
                2. {isUrdu ? "کلاس یا درجہ (Class / Darja)" : "2. Select Class / Darja"}
              </span>
            </Label>
            <Select
              value={selectedClass}
              onValueChange={(v) => setSelectedClass(v)}
              disabled={classesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={classesLoading ? "Loading classes..." : "Select class / darja"}
                />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="all">
                  <span className="font-medium">
                    {isUrdu ? "تمام کلاسز و درجات (All Classes)" : "All Classes / تمام کلاسز"}
                  </span>
                </SelectItem>
                {classList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>{c.nameEn}</span>
                      <span className="font-urdu text-xs text-muted-foreground ms-2">
                        {c.nameUr}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FIELD 3: Student Selection (ID & Name, Dependent on System & Class) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>
                  3. {isUrdu ? "طالب علم منتخب کریں (Student ID & Name)" : "3. Select Student (ID & Name)"}
                </span>
              </Label>
              <button
                type="button"
                onClick={() => setManualIdMode(!manualIdMode)}
                className="text-[11px] text-primary hover:underline cursor-pointer"
              >
                {manualIdMode
                  ? isUrdu
                    ? "فہرست سے منتخب کریں"
                    : "Select from list"
                  : isUrdu
                    ? "دستی ID درج کریں"
                    : "Enter ID manually"}
              </button>
            </div>

            {manualIdMode ? (
              <Input
                placeholder={
                  isUrdu
                    ? "طالب علم کا شناختی نمبر / رول نمبر درج کریں"
                    : "Enter Student ID / Roll Number directly"
                }
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              />
            ) : studentsLoading ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>
                  {isUrdu ? "طالب علموں کی فہرست لوڈ ہو رہی ہے..." : "Loading student roster..."}
                </span>
              </div>
            ) : studentList.length === 0 ? (
              <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">
                  {isUrdu
                    ? "اس کلاس میں کوئی فعال طالب علم نہیں ملا"
                    : "No active students found in this class."}
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-xs mt-1 h-auto p-0"
                  onClick={() => setManualIdMode(true)}
                >
                  {isUrdu ? "براہ راست طالب علم ID درج کریں" : "Enter Student ID directly"}
                </Button>
              </div>
            ) : (
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm({ ...form, studentId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {studentList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2 text-start">
                        <span className="font-semibold text-xs text-primary font-mono">
                          {s.rollNo ? `#${s.rollNo}` : s.id.slice(0, 8)}
                        </span>
                        <span>·</span>
                        <span className="font-medium">{s.name}</span>
                        {s.nameUrdu && (
                          <span className="font-urdu text-xs text-muted-foreground">
                            ({s.nameUrdu})
                          </span>
                        )}
                        {s.fatherName && (
                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            · ولد: {s.fatherName}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Student Info & Fee Waiver Live Preview */}
          {selectedStudent && (
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-sm">{selectedStudent.name}</span>
                  {selectedStudent.nameUrdu && (
                    <span className="font-urdu text-muted-foreground">
                      ({selectedStudent.nameUrdu})
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {selectedStudent.rollNo ? `Roll #${selectedStudent.rollNo}` : selectedStudent.id}
                </Badge>
              </div>

              {selectedStudent.fatherName && (
                <p className="text-muted-foreground text-[11px]">
                  {isUrdu ? "والد کا نام:" : "Father:"} {selectedStudent.fatherName}
                </p>
              )}

              <div className="pt-2 mt-1 border-t border-primary/10 grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-lg bg-background/60">
                  <p className="text-[10px] text-muted-foreground">
                    {isUrdu ? "ماہانہ فیس" : "Regular Fee"}
                  </p>
                  <p className="font-heading font-bold tabular-nums text-foreground mt-0.5">
                    {formatPKR(regularMonthlyFeePaisa / 100)}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {form.percent}% {isUrdu ? "رعایت" : "Waiver"}
                  </p>
                  <p className="font-heading font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    -{formatPKR(waivedPaisa / 100)}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <p className="text-[10px] text-primary">
                    {isUrdu ? "قابلِ ادائیگی" : "Net Payable"}
                  </p>
                  <p className="font-heading font-bold tabular-nums text-primary mt-0.5">
                    {formatPKR(payablePaisa / 100)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {isUrdu ? "وجہِ رعایت (Reason / Category)" : "Reason / Category"}
            </Label>
            <Select
              value={form.reason}
              onValueChange={(v) => handleReasonChange(v as Concession["reason"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.v} value={r.v}>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>{r.en}</span>
                      <span className="font-urdu text-xs text-muted-foreground ms-2">
                        {r.ur} ({r.defaultPercent}%)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Waiver % with Quick Preset Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                {isUrdu
                  ? `رعایت فیصد (Waiver Percentage: ${form.percent}%)`
                  : `Waiver Percentage (${form.percent}%)`}
              </Label>
              <span className="text-xs font-mono font-bold text-primary">{form.percent}%</span>
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: Math.min(100, Math.max(0, +e.target.value)) })}
            />
            <div className="flex items-center gap-1.5 pt-1">
              {[25, 50, 75, 100].map((pct) => (
                <Button
                  key={pct}
                  type="button"
                  size="sm"
                  variant={form.percent === pct ? "default" : "outline"}
                  className="h-6 px-2.5 text-xs rounded-md"
                  onClick={() => setForm({ ...form, percent: pct })}
                >
                  {pct}%
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {isUrdu ? "وضاحت یا دفتری حوالہ (Notes / Reason Details)" : "Notes / Remarks"}
            </Label>
            <Textarea
              rows={2}
              placeholder={isUrdu ? "منظوری کی تفصیل یا حوالہ درج کریں..." : "Optional approval reference or details..."}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {isUrdu ? "منسوخ" : "Cancel"}
          </Button>
          <Button
            disabled={!form.studentId}
            onClick={handleApprove}
            className="cursor-pointer"
          >
            <Check className="h-3.5 w-3.5 me-1.5" />
            {isUrdu ? "رعایت منظور کریں" : "Approve Concession"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
