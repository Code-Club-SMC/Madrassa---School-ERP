import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  FileCheck2,
  ListChecks,
  ChevronLeft,
  ArrowUpRight,
  Phone,
  User,
  Inbox,
  Plus,
  Trash2,
  Globe,
  CheckCircle2,
  Search,
  Pencil,
  Award,
  RotateCcw,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AppLoader } from "@/components/shared/app-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/components/language-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admission/interviews")({
  component: InterviewsPage,
});

type Slot = {
  id: string;
  appId: string;
  applicantName?: string;
  applicantNameUrdu?: string;
  refNo?: string;
  system?: "madrassa" | "school";
  categoryOrClass?: string;
  source?: string;
  date: string;
  time: string;
  interviewer: string;
  room: string;
  status: "scheduled" | "completed" | "passed" | "failed" | "no_show";
  marks?: number | null;
  notes?: string | null;
  guardianPhone?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Doc = { key: string; en: string; ur: string; required: boolean };
const DEFAULT_CHECKLIST: Doc[] = [
  { key: "bform", en: "B-Form / Birth Certificate", ur: "ب فارم / پیدائش سرٹیفکیٹ", required: true },
  { key: "cnic", en: "Guardian CNIC Copy", ur: "والد/والدہ کا شناختی کارڈ", required: true },
  { key: "photos", en: "2 Passport Photos", ur: "2 پاسپورٹ سائز تصاویر", required: true },
  { key: "prev_result", en: "Previous Result Card", ur: "پچھلا نتیجہ", required: false },
  { key: "tc", en: "Transfer Certificate (if any)", ur: "ٹرانسفر سرٹیفکیٹ", required: false },
  { key: "medical", en: "Medical Fitness Form", ur: "میڈیکل فٹنس فارم", required: false },
  { key: "address", en: "Address Proof (Bill copy)", ur: "پتہ تصدیق (بل کاپی)", required: true },
];

const INTERVIEWERS = [
  "Maulana Imran Hussain",
  "Mufti Tariq Saeed",
  "Mrs. Saira Tariq",
  "Principal — Hafiz Bilal",
];
const ROOMS = ["Conference Room A", "Principal's Office", "Library Room 2"];

type AdmissionApplication = {
  id: string;
  refNo: string;
  source?: string;
  status: string;
  name: string;
  nameUrdu: string;
  fatherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  phone?: string;
  system?: string;
  categoryOrClass?: string;
  submittedAt?: string;
};

type Waitlist = {
  id: string;
  appId: string;
  rank: number;
  reason: string;
};

function InterviewsPage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [docState, setDocState] = useState<Record<string, Record<string, boolean>>>({});
  const [docTypes, setDocTypes] = useState<Doc[]>(DEFAULT_CHECKLIST);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state for scheduled interviews table
  const [slotFilter, setSlotFilter] = useState<
    "all" | "website" | "scheduled" | "passed" | "completed" | "failed" | "no_show"
  >("all");

  // New interview dialog state
  const [newSlotOpen, setNewSlotOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [newDate, setNewDate] = useState(() => {
    const d = new Date(Date.now() + 86400e3);
    return d.toISOString().slice(0, 10);
  });
  const [newTime, setNewTime] = useState("10:00");
  const [newInterviewer, setNewInterviewer] = useState(INTERVIEWERS[0]);
  const [newRoom, setNewRoom] = useState(ROOMS[0]);
  const [candidateFilter, setCandidateFilter] = useState<"all" | "website">("all");
  const [candidateSearch, setCandidateSearch] = useState("");

  // Evaluation modal state
  const [evaluationSlot, setEvaluationSlot] = useState<Slot | null>(null);
  const [evalStatus, setEvalStatus] = useState<Slot["status"]>("passed");
  const [evalMarks, setEvalMarks] = useState<string>("");
  const [evalNotes, setEvalNotes] = useState<string>("");

  // Doc types editor modal state
  const [docEditorOpen, setDocEditorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [docKey, setDocKey] = useState("");
  const [docEn, setDocEn] = useState("");
  const [docUr, setDocUr] = useState("");
  const [docRequired, setDocRequired] = useState(true);

  // Add waitlist dialog state
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistAppId, setWaitlistAppId] = useState("");
  const [waitlistReason, setWaitlistReason] = useState("Awaiting seat availability");
  const [waitlistRank, setWaitlistRank] = useState(1);

  // Docs tab state
  const [activeDoc, setActiveDoc] = useState<string>("");
  const [docFilter, setDocFilter] = useState<"all" | "website" | "pending">("pending");

  // Load applications and saved interviews from backend
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [appsData, interviewsData] = await Promise.all([
        fetch("/api/admission/applications", { credentials: "include" })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
        fetch("/api/admission/interviews", { credentials: "include" })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ]);

      let appsList: AdmissionApplication[] = [];
      if (appsData?.applications && Array.isArray(appsData.applications) && appsData.applications.length > 0) {
        appsList = appsData.applications;
      } else if (interviewsData?.applications && Array.isArray(interviewsData.applications)) {
        appsList = interviewsData.applications;
      }

      if (interviewsData) {
        if (Array.isArray(interviewsData.slots)) {
          setSlots(interviewsData.slots);

          // If any applicant in slots is missing from appsList, synthesize it so counts & lists are complete
          const existingIds = new Set(appsList.map((a) => a.id));
          interviewsData.slots.forEach((s: Slot) => {
            if (!existingIds.has(s.appId)) {
              appsList.push({
                id: s.appId,
                refNo: s.refNo || `APP-${s.appId.slice(0, 6)}`,
                source: s.source || "admin",
                status:
                  s.status === "passed" || s.status === "completed"
                    ? "interview_completed"
                    : s.status === "failed"
                      ? "rejected"
                      : "interview_scheduled",
                name: s.applicantName || "Applicant",
                nameUrdu: s.applicantNameUrdu || s.applicantName || "امیدوار",
                guardianPhone: s.guardianPhone,
                phone: s.guardianPhone,
                system: s.system || "school",
                categoryOrClass: s.categoryOrClass || "General",
              });
              existingIds.add(s.appId);
            }
          });
        }
        if (interviewsData.docStates && typeof interviewsData.docStates === "object") {
          setDocState(interviewsData.docStates);
        }
        if (Array.isArray(interviewsData.waitlist)) {
          setWaitlist(interviewsData.waitlist);
        }
        if (Array.isArray(interviewsData.docTypes) && interviewsData.docTypes.length > 0) {
          setDocTypes(interviewsData.docTypes);
        }
      }

      setApplications(appsList);
      if (appsList.length > 0) {
        setActiveDoc((curr) => curr || appsList[0].id);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const accepted = useMemo(
    () => applications.filter((a) => a.status === "accepted"),
    [applications],
  );

  const pending = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.status === "pending" ||
          a.status === "interview_scheduled" ||
          a.status === "under_review",
      ),
    [applications],
  );

  const websiteApplicants = useMemo(() => {
    const publicAppIds = new Set<string>();
    applications.forEach((a) => {
      if (a.source === "public") publicAppIds.add(a.id);
    });
    slots.forEach((s) => {
      if (s.source === "public") publicAppIds.add(s.appId);
    });
    return applications.filter((a) => publicAppIds.has(a.id) || a.source === "public");
  }, [applications, slots]);

  const scheduledCount = useMemo(
    () => slots.filter((s) => s.status === "scheduled").length,
    [slots],
  );

  const passedOrCompletedCount = useMemo(
    () => slots.filter((s) => s.status === "passed" || s.status === "completed").length,
    [slots],
  );

  // Dynamically compute pending docs based on active doc checklist & docStates
  const pendingDocsCount = useMemo(() => {
    const requiredKeys = docTypes.filter((d) => d.required).map((d) => d.key);
    if (requiredKeys.length === 0) return 0;

    return applications.filter((a) => {
      if (a.status === "accepted") return false;
      const applicantDocs = docState[a.id] || {};
      const allRequiredVerified = requiredKeys.every((k) => Boolean(applicantDocs[k]));
      return !allRequiredVerified;
    }).length;
  }, [applications, docTypes, docState]);

  // Handle slot field update
  const handleUpdateSlot = async (slotId: string, updates: Partial<Slot>) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...updates } : s)));

    // Synchronize application status
    if (updates.status) {
      const targetAppStatus =
        updates.status === "completed" || updates.status === "passed"
          ? "interview_completed"
          : updates.status === "failed"
            ? "rejected"
            : updates.status === "scheduled"
              ? "interview_scheduled"
              : undefined;

      if (targetAppStatus) {
        const slot = slots.find((s) => s.id === slotId);
        if (slot) {
          setApplications((prev) =>
            prev.map((a) => (a.id === slot.appId ? { ...a, status: targetAppStatus } : a)),
          );
        }
      }
    }

    try {
      const res = await fetch(`/api/admission/interviews/${slotId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save slot");
      toast.success(isUrdu ? "تبدیلی ڈیٹا بیس میں محفوظ ہو گئی" : "Changes saved to database");
    } catch (err) {
      console.error("Error saving slot update:", err);
      toast.error(isUrdu ? "تبدیلی محفوظ نہیں ہو سکی" : "Could not save slot update");
    }
  };

  // Evaluation modal open & save
  const handleOpenEvaluation = (s: Slot) => {
    setEvaluationSlot(s);
    setEvalStatus(s.status || "passed");
    setEvalMarks(s.marks != null ? String(s.marks) : "");
    setEvalNotes(s.notes || "");
  };

  const handleSaveEvaluation = async () => {
    if (!evaluationSlot) return;
    const num = evalMarks.trim() === "" ? null : Number(evalMarks);
    await handleUpdateSlot(evaluationSlot.id, {
      status: evalStatus,
      marks: Number.isFinite(num) ? num : null,
      notes: evalNotes.trim() || null,
    });
    setEvaluationSlot(null);
  };

  // Document types management handlers
  const handleOpenAddDoc = () => {
    setEditingDoc(null);
    setDocKey("");
    setDocEn("");
    setDocUr("");
    setDocRequired(true);
    setDocEditorOpen(true);
  };

  const handleOpenEditDoc = (doc: Doc) => {
    setEditingDoc(doc);
    setDocKey(doc.key);
    setDocEn(doc.en);
    setDocUr(doc.ur);
    setDocRequired(doc.required);
    setDocEditorOpen(true);
  };

  const handleSaveDocType = async () => {
    const key =
      docKey.trim() ||
      docEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .slice(0, 32);

    if (!key || !docEn.trim()) {
      toast.error(isUrdu ? "دستاویز کا انگریزی نام لازمی ہے" : "Document English name is required");
      return;
    }

    const item: Doc = {
      key,
      en: docEn.trim(),
      ur: docUr.trim() || docEn.trim(),
      required: docRequired,
    };

    try {
      const res = await fetch("/api/admission/interviews/doc-types", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "add_or_update", item }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save document type");

      if (Array.isArray(data.docTypes)) {
        setDocTypes(data.docTypes);
      } else {
        setDocTypes((prev) => {
          const idx = prev.findIndex((d) => d.key === item.key);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = item;
            return next;
          }
          return [...prev, item];
        });
      }
      setDocEditorOpen(false);
      toast.success(
        isUrdu
          ? "دستاویز کی قسم کامیابی سے محفوظ ہو گئی"
          : "Document type saved successfully",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save document type");
    }
  };

  const handleDeleteDocType = async (key: string) => {
    if (docTypes.length <= 1) {
      toast.error(
        isUrdu
          ? "کم از کم ایک دستاویز کا ہونا ضروری ہے"
          : "At least one document type must remain",
      );
      return;
    }

    try {
      const res = await fetch(`/api/admission/interviews/doc-types?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete document type");

      if (Array.isArray(data.docTypes)) {
        setDocTypes(data.docTypes);
      } else {
        setDocTypes((prev) => prev.filter((d) => d.key !== key));
      }
      toast.success(isUrdu ? "دستاویز حذف کر دی گئی" : "Document type deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document type");
    }
  };

  const handleResetDocTypes = async () => {
    try {
      const res = await fetch("/api/admission/interviews/doc-types", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to reset");

      if (Array.isArray(data.docTypes)) {
        setDocTypes(data.docTypes);
      } else {
        setDocTypes(DEFAULT_CHECKLIST);
      }
      toast.success(
        isUrdu
          ? "طے شدہ دستاویزات کی فہرست بحال کر دی گئی"
          : "Checklist reset to defaults",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset document types");
    }
  };

  // Handle slot mark as completed
  const handleMarkCompleted = async (s: Slot) => {
    await handleUpdateSlot(s.id, { status: "completed" });
    setApplications((prev) =>
      prev.map((a) => (a.id === s.appId ? { ...a, status: "interview_completed" } : a)),
    );
    toast.success(
      isUrdu
        ? "انٹرویو مکمل نشان زد ہو گیا اور محفوظ کر دیا گیا"
        : "Interview marked completed and saved to database",
    );
  };

  // Handle slot deletion
  const handleDeleteSlot = async (slotId: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
    try {
      await fetch(`/api/admission/interviews/${slotId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success(isUrdu ? "انٹرویو سلاٹ حذف کر دیا گیا" : "Slot removed");
    } catch {
      toast.error(isUrdu ? "سلاٹ حذف کرنے میں ناکامی" : "Failed to delete slot");
    }
  };

  // Create new interview slot and persist to DB & file
  const handleCreateSlot = async () => {
    const candidate = applications.find((a) => a.id === selectedAppId);
    if (!candidate) {
      toast.error(isUrdu ? "امیدوار منتخب کریں" : "Please select an applicant");
      return;
    }

    const payload = {
      appId: candidate.id,
      applicantName: candidate.name,
      applicantNameUrdu: candidate.nameUrdu,
      refNo: candidate.refNo,
      system: (candidate.system === "madrassa" ? "madrassa" : "school") as "madrassa" | "school",
      categoryOrClass: candidate.categoryOrClass,
      source: candidate.source,
      date: newDate,
      time: newTime,
      interviewer: newInterviewer,
      room: newRoom,
      status: "scheduled" as const,
      guardianPhone: candidate.guardianPhone || candidate.phone,
    };

    try {
      const res = await fetch("/api/admission/interviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to schedule");

      if (data.slot) {
        setSlots((prev) => {
          const filtered = prev.filter((s) => s.id !== data.slot.id && s.appId !== candidate.id);
          return [data.slot, ...filtered];
        });
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === candidate.id ? { ...a, status: "interview_scheduled" } : a)),
      );

      setNewSlotOpen(false);
      setSelectedAppId("");
      toast.success(
        isUrdu
          ? `${candidate.nameUrdu || candidate.name} کا انٹرویو ڈیٹا بیس میں کامیابی سے محفوظ ہو گیا`
          : `Interview scheduled and saved to database for ${candidate.name}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule interview");
    }
  };

  // Handle document toggle and persist
  const handleToggleDoc = async (appId: string, docKey: string, checked: boolean) => {
    const current = docState[appId] ?? {};
    const nextDocs = { ...current, [docKey]: checked };
    setDocState((prev) => ({ ...prev, [appId]: nextDocs }));

    try {
      await fetch("/api/admission/interviews/docs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appId, docs: nextDocs }),
      });
    } catch (err) {
      console.error("Failed to persist doc check:", err);
    }
  };

  // Handle waitlist promote
  const handlePromote = async (appId: string) => {
    setWaitlist((w) => w.filter((x) => x.appId !== appId));
    try {
      await fetch(`/api/admission/interviews/waitlist?appId=${appId}`, {
        method: "DELETE",
        credentials: "include",
      });
      await fetch(`/api/admission/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "interview_scheduled" }),
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "interview_scheduled" } : a)),
      );
    } catch {
      // ignore
    }

    toast.success(
      isUrdu
        ? "درخواست گزار کو فعال داخلوں / انٹرویو میں منتقل کر دیا گیا"
        : "Promoted to active intake — scheduled for interview",
    );
  };

  // Handle adding applicant to waitlist
  const handleAddToWaitlist = async () => {
    if (!waitlistAppId) {
      toast.error(isUrdu ? "امیدوار منتخب کریں" : "Select an applicant");
      return;
    }
    try {
      const res = await fetch("/api/admission/interviews/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appId: waitlistAppId,
          rank: waitlistRank,
          reason: waitlistReason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to add to waitlist");

      if (data.entry) {
        setWaitlist((prev) => [...prev.filter((w) => w.appId !== waitlistAppId), data.entry]);
      }
      setApplications((prev) =>
        prev.map((a) => (a.id === waitlistAppId ? { ...a, status: "waitlisted" } : a)),
      );

      setWaitlistOpen(false);
      setWaitlistAppId("");
      toast.success(isUrdu ? "ویٹ لسٹ میں محفوظ ہو گیا" : "Saved to waitlist");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to waitlist");
    }
  };

  const activeApp = applications.find((x) => x.id === activeDoc);
  const isAlreadyAccepted = activeApp?.status === "accepted";
  const docsForActive = docState[activeDoc] ?? {};
  const verified =
    isAlreadyAccepted ||
    docTypes.filter((d) => d.required).every((d) => docsForActive[d.key]);

  // Candidates available for scheduling in modal
  const candidatesForDialog = useMemo(() => {
    let list = pending;
    if (candidateFilter === "website") {
      list = list.filter((a) => a.source === "public");
    }
    if (candidateSearch.trim()) {
      const q = candidateSearch.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.nameUrdu && a.nameUrdu.includes(q)) ||
          a.refNo.toLowerCase().includes(q) ||
          (a.phone && a.phone.includes(q)),
      );
    }
    return list;
  }, [pending, candidateFilter, candidateSearch]);

  // Filtered slots for table
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const a = applications.find((x) => x.id === s.appId);
      if (slotFilter === "website") {
        return a?.source === "public" || s.source === "public";
      }
      if (slotFilter === "scheduled") {
        return s.status === "scheduled";
      }
      if (slotFilter === "passed") {
        return s.status === "passed";
      }
      if (slotFilter === "completed") {
        return s.status === "completed" || s.status === "passed";
      }
      if (slotFilter === "failed") {
        return s.status === "failed";
      }
      if (slotFilter === "no_show") {
        return s.status === "no_show";
      }
      return true;
    });
  }, [slots, applications, slotFilter]);

  return (
    <div className="space-y-6">
      <Link
        to="/admission"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
      >
        <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        <span>{isUrdu ? "واپس داخلہ مرکز" : "Admission Hub"}</span>
      </Link>

      <PageHeader
        title={isUrdu ? "انٹرویو، دستاویزات اور انتظار کی فہرست" : "Interviews, Documents & Waitlist"}
        titleUrdu="انٹرویو، دستاویزات اور انتظار"
        description={
          isUrdu
            ? "ویب سائٹ اور براہ راست آن لائن درخواست گزاروں کے انٹرویو شیڈول کریں، دستاویزات کی تصدیق کریں اور ڈیٹا بیس میں محفوظ رکھیں۔"
            : "Schedule interviews for website applicants, verify documents, and maintain persistent records in the database."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void loadData(false);
                toast.success(isUrdu ? "ڈیٹا ریفریش ہو گیا" : "Data refreshed");
              }}
              className="gap-1.5 h-8 text-xs"
              title={isUrdu ? "تازہ ترین ڈیٹا لوڈ کریں" : "Reload latest records"}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{isUrdu ? "ریفریش" : "Refresh"}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const defaultPick = candidatesForDialog[0]?.id || "";
                setSelectedAppId(defaultPick);
                setNewSlotOpen(true);
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{isUrdu ? "نیا انٹرویو شیڈول کریں" : "Schedule Interview"}</span>
            </Button>
          </div>
        }
      />

      {loading ? (
        <Card className="p-12">
          <AppLoader text="Loading interviews and applications..." textUrdu="درخواستیں اور انٹرویوز لوڈ ہو رہے ہیں..." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <Stat
              icon={CalendarClock}
              en="Scheduled"
              ur="مقررہ انٹرویو"
              v={scheduledCount}
              tone="text-blue-600 dark:text-blue-400"
            />
            <Stat
              icon={CheckCircle2}
              en="Passed & Done"
              ur="کامیاب و مکمل"
              v={passedOrCompletedCount}
              tone="text-emerald-600 dark:text-emerald-400"
            />
            <Stat
              icon={Globe}
              en="Website Applicants"
              ur="آن لائن درخواستیں"
              v={websiteApplicants.length}
              tone="text-indigo-600 dark:text-indigo-400"
            />
            <Stat
              icon={FileCheck2}
              en="Pending Docs"
              ur="دستاویزات کمی"
              v={pendingDocsCount}
              tone="text-amber-600 dark:text-amber-400"
            />
            <Stat
              icon={ListChecks}
              en="On Waitlist"
              ur="انتظار میں"
              v={waitlist.length}
              tone="text-orange-600 dark:text-orange-400"
            />
          </div>

          <Tabs defaultValue="interviews">
            <TabsList>
              <TabsTrigger value="interviews">
                <CalendarClock className="h-3.5 w-3.5 me-1.5" />
                {isUrdu ? "انٹرویو شیڈول" : "Schedule"}
              </TabsTrigger>
              <TabsTrigger value="docs">
                <FileCheck2 className="h-3.5 w-3.5 me-1.5" />
                {isUrdu ? "دستاویزات کی تصدیق" : "Document Verification"}
              </TabsTrigger>
              <TabsTrigger value="waitlist">
                <ListChecks className="h-3.5 w-3.5 me-1.5" />
                {isUrdu ? "انتظار کی فہرست" : "Waitlist"}
              </TabsTrigger>
            </TabsList>

            {/* SCHEDULE */}
            <TabsContent value="interviews">
              <Card className="overflow-hidden mt-3">
                <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 bg-card">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {isUrdu ? "مقررہ انٹرویوز" : "Scheduled Interviews"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {filteredSlots.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex rounded-lg border border-border p-0.5 bg-muted/40 flex-wrap gap-0.5">
                      <Button
                        size="sm"
                        variant={slotFilter === "all" ? "secondary" : "ghost"}
                        className="h-7 text-xs px-2"
                        onClick={() => setSlotFilter("all")}
                      >
                        {isUrdu ? "تمام" : "All"}
                      </Button>
                      <Button
                        size="sm"
                        variant={slotFilter === "website" ? "secondary" : "ghost"}
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => setSlotFilter("website")}
                      >
                        <Globe className="h-3 w-3 text-blue-500" />
                        <span>{isUrdu ? "آن لائن" : "Web"}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={slotFilter === "scheduled" ? "secondary" : "ghost"}
                        className="h-7 text-xs px-2"
                        onClick={() => setSlotFilter("scheduled")}
                      >
                        {isUrdu ? "شیڈول" : "Scheduled"}
                      </Button>
                      <Button
                        size="sm"
                        variant={slotFilter === "passed" ? "secondary" : "ghost"}
                        className="h-7 text-xs px-2 text-emerald-700 dark:text-emerald-400"
                        onClick={() => setSlotFilter("passed")}
                      >
                        {isUrdu ? "پاس" : "Passed"}
                      </Button>
                      <Button
                        size="sm"
                        variant={slotFilter === "completed" ? "secondary" : "ghost"}
                        className="h-7 text-xs px-2"
                        onClick={() => setSlotFilter("completed")}
                      >
                        {isUrdu ? "مکمل" : "Completed"}
                      </Button>
                      <Button
                        size="sm"
                        variant={slotFilter === "failed" ? "secondary" : "ghost"}
                        className="h-7 text-xs px-2 text-destructive"
                        onClick={() => setSlotFilter("failed")}
                      >
                        {isUrdu ? "فیل" : "Failed"}
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      className="gap-1.5 h-8 text-xs"
                      onClick={() => {
                        const defaultPick = candidatesForDialog[0]?.id || "";
                        setSelectedAppId(defaultPick);
                        setNewSlotOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isUrdu ? "نیا انٹرویو" : "New Interview"}
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>{isUrdu ? "امیدوار (طالب علم)" : "Applicant"}</TableHead>
                      <TableHead>{isUrdu ? "تاریخ و وقت" : "Date & Time"}</TableHead>
                      <TableHead>{isUrdu ? "انٹرویو لینے والا" : "Interviewer"}</TableHead>
                      <TableHead>{isUrdu ? "کمرہ" : "Room"}</TableHead>
                      <TableHead>{isUrdu ? "حیثیت" : "Status"}</TableHead>
                      <TableHead className="text-end">{isUrdu ? "اقدامات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm font-medium">
                            {isUrdu ? "کوئی انٹرویو شیڈول نہیں ملا" : "No scheduled interviews found"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            {isUrdu
                              ? "ویب سائٹ یا داخلہ فارم سے درخواست گزار منتخب کر کے نیا انٹرویو شیڈول کریں۔"
                              : "Click 'New Interview' to pick an applicant who applied on the website and schedule their slot."}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-1.5"
                            onClick={() => {
                              setSelectedAppId(candidatesForDialog[0]?.id || "");
                              setNewSlotOpen(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {isUrdu ? "انٹرویو شیڈول کریں" : "Schedule Interview"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSlots.map((s) => {
                        const a = applications.find((x) => x.id === s.appId);
                        const isOnline = a?.source === "public" || s.source === "public";
                        const displayName = a ? a.nameUrdu || a.name : s.applicantNameUrdu || s.applicantName || "Applicant";
                        const refNumber = a ? a.refNo : s.refNo || "";
                        const details = [
                          a?.system || s.system,
                          a?.categoryOrClass || s.categoryOrClass,
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-urdu text-sm font-semibold leading-tight">
                                      {displayName}
                                    </p>
                                    {isOnline && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 py-0"
                                      >
                                        <Globe className="h-2.5 w-2.5 me-0.5" />
                                        {isUrdu ? "آن لائن درخواست" : "Website"}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                    {refNumber} {details ? `· ${details}` : ""}
                                  </p>
                                  {s.notes && (
                                    <p
                                      className="text-[11px] text-muted-foreground italic truncate max-w-[200px] mt-0.5"
                                      title={s.notes}
                                    >
                                      📝 {s.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1.5">
                                <Input
                                  type="date"
                                  value={s.date}
                                  onChange={(e) => handleUpdateSlot(s.id, { date: e.target.value })}
                                  className="h-8 w-[140px] text-xs font-mono"
                                />
                                <Input
                                  type="time"
                                  value={s.time}
                                  onChange={(e) => handleUpdateSlot(s.id, { time: e.target.value })}
                                  className="h-8 w-[95px] text-xs font-mono"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={s.interviewer}
                                onValueChange={(v) => handleUpdateSlot(s.id, { interviewer: v })}
                              >
                                <SelectTrigger className="h-8 text-xs w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INTERVIEWERS.map((i) => (
                                    <SelectItem key={i} value={i}>
                                      {i}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={s.room}
                                onValueChange={(v) => handleUpdateSlot(s.id, { room: v })}
                              >
                                <SelectTrigger className="h-8 text-xs w-[170px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROOMS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Select
                                  value={s.status}
                                  onValueChange={(val) =>
                                    handleUpdateSlot(s.id, { status: val as Slot["status"] })
                                  }
                                >
                                  <SelectTrigger
                                    className={`h-7 text-xs font-semibold w-[130px] border ${
                                      s.status === "passed"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : s.status === "completed"
                                          ? "bg-chart-1/10 text-chart-1 border-chart-1/30"
                                          : s.status === "failed"
                                            ? "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
                                            : s.status === "no_show"
                                              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                                              : "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
                                    }`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="scheduled">
                                      <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span>{isUrdu ? "شیڈول شدہ" : "Scheduled"}</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="passed">
                                      <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span>{isUrdu ? "کامیاب / پاس" : "Passed"}</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                        <span>{isUrdu ? "مکمل" : "Completed"}</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="failed">
                                      <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-red-500" />
                                        <span>{isUrdu ? "فیل / ناکام" : "Failed"}</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="no_show">
                                      <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                                        <span>{isUrdu ? "غیر حاضر" : "No-Show"}</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                {s.marks != null && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-primary/5 border-primary/25 font-mono py-0 text-primary"
                                  >
                                    <Award className="h-2.5 w-2.5 me-1 text-primary" />
                                    {isUrdu ? `نمبر: ${s.marks}/100` : `Score: ${s.marks}/100`}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex justify-end gap-1.5 items-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                  onClick={() => handleOpenEvaluation(s)}
                                  title={isUrdu ? "نمبر اور ارزیابی درج کریں" : "Evaluate applicant"}
                                >
                                  <Award className="h-3 w-3" />
                                  <span>{isUrdu ? "ارزیابی" : "Evaluate"}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  title={isUrdu ? "یاد دہانی ایس ایم ایس" : "Send Reminder"}
                                  onClick={() => {
                                    const phone = a?.guardianPhone || a?.phone || s.guardianPhone || "";
                                    toast.success(
                                      isUrdu
                                        ? `ایس ایم ایس بھیج دیا گیا: ${phone || displayName}`
                                        : `SMS reminder sent to ${phone || displayName}`,
                                    );
                                  }}
                                >
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  title={isUrdu ? "سلاٹ حذف کریں" : "Delete Slot"}
                                  onClick={() => handleDeleteSlot(s.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* DOCS */}
            <TabsContent value="docs">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 mt-3">
                <Card className="p-2 space-y-1 h-fit">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b px-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {isUrdu ? "درخواستیں" : "Applications"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={docFilter === "pending" ? "secondary" : "ghost"}
                        className="h-6 text-[11px] px-1.5"
                        onClick={() => setDocFilter("pending")}
                      >
                        {isUrdu ? `زیر التواء (${pending.length})` : `Pending (${pending.length})`}
                      </Button>
                      <Button
                        size="sm"
                        variant={docFilter === "website" ? "secondary" : "ghost"}
                        className="h-6 text-[11px] px-1.5"
                        onClick={() => setDocFilter("website")}
                      >
                        {isUrdu ? `ویب سائٹ (${websiteApplicants.length})` : `Web (${websiteApplicants.length})`}
                      </Button>
                      <Button
                        size="sm"
                        variant={docFilter === "all" ? "secondary" : "ghost"}
                        className="h-6 text-[11px] px-1.5"
                        onClick={() => setDocFilter("all")}
                      >
                        {isUrdu ? `تمام (${applications.length})` : `All (${applications.length})`}
                      </Button>
                    </div>
                  </div>
                  {(() => {
                    let displayed = applications;
                    if (docFilter === "pending") {
                      displayed = pending.length > 0 ? pending : applications;
                    } else if (docFilter === "website") {
                      displayed = websiteApplicants.length > 0 ? websiteApplicants : applications;
                    }

                    if (displayed.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          {isUrdu ? "کوئی درخواست نہیں ملی" : "No applications found"}
                        </div>
                      );
                    }
                    return displayed.slice(0, 25).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setActiveDoc(a.id)}
                        className={`w-full text-start p-2.5 rounded-lg transition-colors ${
                          activeDoc === a.id
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-urdu text-sm font-semibold leading-tight truncate">
                            {a.nameUrdu || a.name}
                          </p>
                          {a.source === "public" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 shrink-0 py-0"
                            >
                              Web
                            </Badge>
                          )}
                          {a.status === "accepted" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 shrink-0 py-0"
                            >
                              {isUrdu ? "منظور" : "Accepted"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {a.refNo} {a.categoryOrClass ? `· ${a.categoryOrClass}` : ""}
                        </p>
                      </button>
                    ));
                  })()}
                </Card>

                <Card className="p-5">
                  {(() => {
                    const a = applications.find((x) => x.id === activeDoc);
                    if (!a) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">
                            {pending.length === 0
                              ? isUrdu
                                ? "دستاویزات کی تصدیق کے لیے کوئی زیر التواء درخواست موجود نہیں ہے"
                                : "No pending applications for verification"
                              : isUrdu
                                ? "فہرست سے ایک درخواست دہندہ منتخب کریں"
                                : "Select an applicant from the left"}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pb-3 border-b">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading text-lg font-bold">
                                {a.name}{" "}
                                {a.nameUrdu && (
                                  <span className="font-urdu text-base text-muted-foreground ms-2">
                                    {a.nameUrdu}
                                  </span>
                                )}
                              </h3>
                              {a.source === "public" && (
                                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25 text-xs">
                                  <Globe className="h-3 w-3 me-1" />
                                  {isUrdu ? "آن لائن ویب سائٹ درخواست" : "Website Applicant"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {a.refNo} {a.system ? `· ${a.system}` : ""}{" "}
                              {a.categoryOrClass ? `· ${a.categoryOrClass}` : ""}{" "}
                              {a.guardianPhone ? `· 📞 ${a.guardianPhone}` : ""}
                            </p>
                          </div>
                          {verified ? (
                            <Badge className="bg-chart-1/15 text-chart-1 border-0">
                              <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                              {isUrdu ? "تمام ضروری دستاویزات تصدیق شدہ" : "All required documents verified"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              {isUrdu ? "دستاویزات نامکمل / زیر التواء" : "Awaiting required documents"}
                            </Badge>
                          )}
                        </div>

                        {/* Document Types Management Toolbar */}
                        <div className="flex items-center justify-between pb-2 mb-3 border-b flex-wrap gap-2">
                          <div>
                            <span className="text-xs font-semibold text-foreground">
                              {isUrdu ? "دستاویزات کی چیک لسٹ" : "Documents Checklist"}
                            </span>
                            <span className="text-[11px] text-muted-foreground ms-2">
                              ({docTypes.length} {isUrdu ? "اقسام" : "types"})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={handleOpenAddDoc}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{isUrdu ? "نیا دستاویز شامل کریں" : "Add Document"}</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={handleResetDocTypes}
                              title={isUrdu ? "طے شدہ فہرست بحال کریں" : "Reset to default checklist"}
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>{isUrdu ? "طے شدہ بحال کریں" : "Reset"}</span>
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {docTypes.map((d) => {
                            const checked = isAlreadyAccepted || !!docsForActive[d.key];
                            return (
                              <div
                                key={d.key}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                  checked
                                    ? "border-chart-1/40 bg-chart-1/5"
                                    : "border-border hover:bg-muted/40"
                                }`}
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={isAlreadyAccepted}
                                  onCheckedChange={(v) =>
                                    handleToggleDoc(activeDoc, d.key, Boolean(v))
                                  }
                                  className="mt-0.5"
                                  id={`doc-${d.key}`}
                                />
                                <label
                                  htmlFor={`doc-${d.key}`}
                                  className="flex-1 min-w-0 cursor-pointer"
                                >
                                  <p className="text-sm font-medium">
                                    {d.en}{" "}
                                    {d.required && (
                                      <span className="text-destructive ms-1">*</span>
                                    )}
                                  </p>
                                  <p className="font-urdu text-sm text-muted-foreground">{d.ur}</p>
                                </label>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge
                                    variant={d.required ? "default" : "secondary"}
                                    className="text-[10px]"
                                  >
                                    {d.required
                                      ? isUrdu
                                        ? "لازمی"
                                        : "Required"
                                      : isUrdu
                                        ? "اختیاری"
                                        : "Optional"}
                                  </Badge>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                    title={isUrdu ? "دستاویز کی قسم میں ترمیم کریں" : "Edit document type"}
                                    onClick={() => handleOpenEditDoc(d)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    title={isUrdu ? "دستاویز خارج کریں" : "Delete document type"}
                                    onClick={() => handleDeleteDocType(d.key)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              setSelectedAppId(a.id);
                              setNewSlotOpen(true);
                            }}
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>{isUrdu ? "انٹرویو شیڈول کریں" : "Schedule Interview"}</span>
                          </Button>

                          <div className="flex gap-2">
                            {a.status === "accepted" ? (
                              <div className="flex items-center gap-3">
                                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-0">
                                  {isUrdu ? "داخلہ منظور شدہ · طالب علم فعال" : "Admission Accepted · Student Active"}
                                </Badge>
                                <Link
                                  to="/settings/student-lifecycle"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium border border-primary/20 px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                                >
                                  <span>{isUrdu ? "طالب علم لائف ٹائم ریکارڈ" : "View Student Dossier"}</span>
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const phone = a.guardianPhone || a.phone || "";
                                    toast.success(
                                      isUrdu
                                        ? `دستاویزات کی یاد دہانی بھیج دی گئی: ${phone || a.nameUrdu}`
                                        : `Document checklist reminder sent to ${phone || a.name}`,
                                    );
                                  }}
                                >
                                  {isUrdu ? "یاد دہانی بھیجیں" : "Send Reminder"}
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={!verified}
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(
                                        `/api/admission/applications/${a.id}/status`,
                                        {
                                          method: "PATCH",
                                          headers: { "content-type": "application/json" },
                                          credentials: "include",
                                          body: JSON.stringify({ status: "interview_scheduled" }),
                                        },
                                      );
                                      if (res.ok) {
                                        setApplications((prev) =>
                                          prev.map((item) =>
                                            item.id === a.id
                                              ? { ...item, status: "interview_scheduled" }
                                              : item,
                                          ),
                                        );
                                      }
                                    } catch {
                                      // fallback
                                    }
                                    toast.success(
                                      isUrdu
                                        ? `${a.nameUrdu || a.name} کے دستاویزات منظور ہو گئے اور محفوظ ہیں`
                                        : `${a.name} cleared for admission and saved`,
                                    );
                                  }}
                                >
                                  {isUrdu ? "دستاویزات منظور کریں" : "Approve Documents"}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </Card>
              </div>
            </TabsContent>

            {/* WAITLIST */}
            <TabsContent value="waitlist">
              <Card className="overflow-hidden mt-3">
                <div className="px-4 py-3 border-b flex items-center justify-between gap-3 bg-card">
                  <div>
                    <p className="text-sm font-semibold">
                      {isUrdu ? "انتظار کی فہرست" : "Waitlist"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isUrdu
                        ? "نشست دستیاب ہونے پر امیدوار کو داخلہ / انٹرویو کے لیے ترقی دیں"
                        : "Ordered by rank · promote when seat opens"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => {
                      setWaitlistAppId(pending[0]?.id || "");
                      setWaitlistOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isUrdu ? "ویٹ لسٹ میں شامل کریں" : "Add to Waitlist"}</span>
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[60px]">{isUrdu ? "نمبر" : "Rank"}</TableHead>
                      <TableHead>{isUrdu ? "امیدوار" : "Applicant"}</TableHead>
                      <TableHead>{isUrdu ? "شعبہ / درجہ" : "Preference"}</TableHead>
                      <TableHead>{isUrdu ? "وجہ" : "Reason"}</TableHead>
                      <TableHead className="text-end">{isUrdu ? "کارروائی" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlist.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">
                            {isUrdu
                              ? "انتظار کی فہرست میں فی الحال کوئی امیدوار نہیں ہے"
                              : "No applicants on waitlist currently"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      waitlist.map((w) => {
                        const a = applications.find((x) => x.id === w.appId);
                        const isOnline = a?.source === "public";
                        const displayName = a ? a.nameUrdu || a.name : "Applicant";

                        return (
                          <TableRow key={w.id || w.appId}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                #{w.rank}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-urdu text-sm font-semibold leading-tight">
                                  {displayName}
                                </p>
                                {isOnline && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 py-0"
                                  >
                                    Website
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {a?.refNo}{" "}
                                {a?.submittedAt ? `· ${formatDate(a.submittedAt)}` : ""}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{a?.categoryOrClass || "-"}</p>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {w.reason}
                            </TableCell>
                            <TableCell className="text-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 h-7 text-[10px]"
                                onClick={() => handlePromote(w.appId)}
                              >
                                <ArrowUpRight className="h-3 w-3" />
                                {isUrdu ? "ترقی دیں" : "Promote"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* SCHEDULE INTERVIEW DIALOG */}
      <Dialog open={newSlotOpen} onOpenChange={setNewSlotOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <span>{isUrdu ? "طالب علم کا انٹرویو شیڈول کریں" : "Schedule Student Interview"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Candidate Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "امیدوار منتخب کریں (آن لائن و دیگر)" : "Select Applicant (Website & Direct)"} *
                </label>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCandidateFilter("all")}
                    className={`px-2 py-0.5 rounded ${candidateFilter === "all" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {isUrdu ? "تمام" : "All"} ({pending.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter("website")}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 ${candidateFilter === "website" ? "bg-blue-600 text-white font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Globe className="h-3 w-3" />
                    <span>{isUrdu ? "صرف ویب سائٹ" : "Website Only"}</span> ({websiteApplicants.length})
                  </button>
                </div>
              </div>

              {/* Search candidate */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder={isUrdu ? "نام، رجسٹریشن نمبر یا فون سے تلاش کریں..." : "Search by name, refNo or phone..."}
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder={isUrdu ? "امیدوار منتخب کریں" : "Choose applicant..."} />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  {candidatesForDialog.map((c) => {
                    const isOnline = c.source === "public";
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="font-urdu font-medium">{c.nameUrdu || c.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">({c.refNo})</span>
                          {c.categoryOrClass && (
                            <span className="text-[11px] text-muted-foreground">· {c.categoryOrClass}</span>
                          )}
                          {isOnline && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 py-0"
                            >
                              Online
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "انٹرویو کی تاریخ" : "Interview Date"} *
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "انٹرویو کا وقت" : "Interview Time"} *
                </label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Interviewer and Room */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "انٹرویو لینے والا ممتحن" : "Interviewer"} *
                </label>
                <Select value={newInterviewer} onValueChange={setNewInterviewer}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEWERS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "کمرہ / مقام" : "Interview Room"} *
                </label>
                <Select value={newRoom} onValueChange={setNewRoom}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOMS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewSlotOpen(false)}>
              {isUrdu ? "منسوخ کریں" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateSlot} disabled={!selectedAppId}>
              {isUrdu ? "ڈیٹا بیس میں محفوظ کریں" : "Save & Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD TO WAITLIST DIALOG */}
      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-amber-600" />
              <span>{isUrdu ? "ویٹ لسٹ میں شامل کریں" : "Add to Waitlist"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isUrdu ? "امیدوار منتخب کریں" : "Applicant"}
              </label>
              <Select value={waitlistAppId} onValueChange={setWaitlistAppId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={isUrdu ? "امیدوار منتخب کریں" : "Choose applicant..."} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {pending.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-urdu font-medium">{c.nameUrdu || c.name}</span> (
                      {c.refNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isUrdu ? "نمبر شمار (ترجیح)" : "Rank"}
              </label>
              <Input
                type="number"
                min={1}
                value={waitlistRank}
                onChange={(e) => setWaitlistRank(Number(e.target.value) || 1)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isUrdu ? "انتظار کی وجہ" : "Reason"}
              </label>
              <Input
                value={waitlistReason}
                onChange={(e) => setWaitlistReason(e.target.value)}
                placeholder={isUrdu ? "مثلاً نشستوں کی کمی" : "e.g. Capped grade / pending docs"}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setWaitlistOpen(false)}>
              {isUrdu ? "منسوخ" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleAddToWaitlist} disabled={!waitlistAppId}>
              {isUrdu ? "ویٹ لسٹ میں محفوظ کریں" : "Save to Waitlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EVALUATION DIALOG */}
      <Dialog
        open={evaluationSlot !== null}
        onOpenChange={(open) => !open && setEvaluationSlot(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>{isUrdu ? "امیدوار کا انٹرویو رزلٹ و ارزیابی" : "Interview Evaluation & Score"}</span>
            </DialogTitle>
          </DialogHeader>

          {evaluationSlot && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50 border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-urdu font-bold text-sm text-foreground">
                    {evaluationSlot.applicantNameUrdu || evaluationSlot.applicantName}
                  </span>
                  <span className="font-mono text-muted-foreground">{evaluationSlot.refNo}</span>
                </div>
                <div className="text-muted-foreground flex gap-2">
                  <span>{evaluationSlot.categoryOrClass || "-"}</span>
                  <span>·</span>
                  <span>{evaluationSlot.interviewer}</span>
                  <span>·</span>
                  <span>{evaluationSlot.date}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "انٹرویو کی حتمی حیثیت" : "Interview Outcome / Status"} *
                </label>
                <Select
                  value={evalStatus}
                  onValueChange={(v) => setEvalStatus(v as Slot["status"])}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          {isUrdu ? "کامیاب / پاس (Passed)" : "Passed"}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        <span>{isUrdu ? "مکمل شدہ (Completed)" : "Completed"}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        <span className="font-medium text-destructive">
                          {isUrdu ? "فیل / نااہل (Failed)" : "Failed"}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>{isUrdu ? "شیڈول شدہ (Scheduled)" : "Scheduled"}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="no_show">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>{isUrdu ? "غیر حاضر (No-show)" : "No-show"}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marks */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "حاصل کردہ نمبر (100 میں سے)" : "Obtained Marks (out of 100)"}
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 85"
                  value={evalMarks}
                  onChange={(e) => setEvalMarks(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Examiner Notes */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {isUrdu ? "ممتحن کے تاثرات و ریمارکس" : "Examiner Notes / Feedback"}
                </label>
                <Textarea
                  rows={3}
                  placeholder={
                    isUrdu
                      ? "مثلاً: طالب علم کی تجوید بہترین ہے، ریاضی کا ٹیسٹ پاس کیا۔"
                      : "e.g. Strong Arabic recitation, clear foundation in arithmetic."
                  }
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEvaluationSlot(null)}>
              {isUrdu ? "منسوخ" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleSaveEvaluation}>
              {isUrdu ? "محفوظ کریں اور اپڈیٹ کریں" : "Save Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DOCUMENT TYPE EDITOR DIALOG */}
      <Dialog open={docEditorOpen} onOpenChange={setDocEditorOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <span>
                {editingDoc
                  ? isUrdu
                    ? "دستاویز کی قسم میں ترمیم کریں"
                    : "Edit Document Requirement"
                  : isUrdu
                    ? "نیا تصدیقی دستاویز شامل کریں"
                    : "Add Document Requirement"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isUrdu ? "دستاویز کا نام (انگریزی)" : "Document Name (English)"} *
              </label>
              <Input
                placeholder="e.g. School Leaving Certificate"
                value={docEn}
                onChange={(e) => {
                  setDocEn(e.target.value);
                  if (!editingDoc && !docKey) {
                    setDocKey(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "_")
                        .slice(0, 32),
                    );
                  }
                }}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isUrdu ? "دستاویز کا نام (اردو)" : "Document Name (Urdu)"} *
              </label>
              <Input
                placeholder="مثلاً: اسکول چھوڑنے کا سرٹیفکیٹ"
                value={docUr}
                onChange={(e) => setDocUr(e.target.value)}
                className="h-9 text-xs font-urdu"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isUrdu ? "کوڈ / کلید (Key)" : "System Identifier (Key)"}
              </label>
              <Input
                placeholder="e.g. leaving_certificate"
                value={docKey}
                disabled={!!editingDoc}
                onChange={(e) => setDocKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="doc-req-checkbox"
                checked={docRequired}
                onCheckedChange={(v) => setDocRequired(Boolean(v))}
              />
              <label
                htmlFor="doc-req-checkbox"
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                {isUrdu
                  ? "لازمی دستاویز ہے (داخلہ منظوری کے لیے ضروری)"
                  : "Required document (Mandatory for admission clearance)"}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDocEditorOpen(false)}>
              {isUrdu ? "منسوخ" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleSaveDocType} disabled={!docEn.trim()}>
              {isUrdu ? "محفوظ کریں" : "Save Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon: Icon,
  en,
  ur,
  v,
  tone,
}: {
  icon: typeof CalendarClock;
  en: string;
  ur: string;
  v: number;
  tone?: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{en}</span> · <span className="font-urdu">{ur}</span>
      </div>
      <p className={`font-heading text-2xl font-bold mt-1 ${tone ?? ""}`}>{v}</p>
    </Card>
  );
}
