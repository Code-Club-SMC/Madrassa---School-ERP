import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, HandCoins, Phone, RefreshCw, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatPKR } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getFeeLedger, listFeeStudents } from "./fee-api";
import { CollectPaymentDialog } from "./fee-dialogs";
import type { FeeStudent, FeeSystem } from "./fee-types";

type FeeStatusFilter = "all" | "due" | "clear";

export function FeeWorkspace({ system }: { system: FeeSystem }) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<FeeStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<FeeStudent | null>(null);
  const [collectOpen, setCollectOpen] = useState(false);
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof getFeeLedger>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [feeStatus, setFeeStatus] = useState<FeeStatusFilter>("all");

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await listFeeStudents(system, query, {
        categoryId: categoryId || undefined,
        status: feeStatus === "all" ? undefined : "active",
      });
      let filtered = payload.students ?? [];
      
      if (feeStatus === "due") {
        filtered = filtered.filter((s) => s.summary.outstandingPaisa > 0);
      } else if (feeStatus === "clear") {
        filtered = filtered.filter((s) => s.summary.outstandingPaisa === 0);
      }
      
      setStudents(filtered);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [query, system, categoryId, feeStatus]);

  const handleCollect = async (student: FeeStudent) => {
    setSelectedStudent(student);
    setLedgerLoading(true);
    try {
      const data = await getFeeLedger(system, student.id);
      setLedger(data);
      setCollectOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load ledger");
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleSuccess = async () => {
    setCollectOpen(false);
    setSelectedStudent(null);
    setLedger(null);
    await loadStudents();
  };

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const title = system === "school" ? "School Fees" : "Madrassa Fees";
  const titleUrdu = system === "school" ? "اسکول — فیس" : "مدرسہ کی فیس";

  const totalStudents = students.length;
  const paidStudents = students.filter((s) => s.summary.outstandingPaisa === 0).length;
  const pendingStudents = totalStudents - paidStudents;
  const collectionRate = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0;
  const totalOutstanding = useMemo(() => students.reduce((sum, s) => sum + s.summary.outstandingPaisa, 0), [students]);

  const hasActiveFilters = categoryId || feeStatus !== "all";

  const clearFilters = () => {
    setCategoryId("");
    setFeeStatus("all");
  };

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; nameUrdu: string }>();
    students.forEach((s) => {
      if (s.categoryId && s.categoryName) {
        map.set(s.categoryId, { id: s.categoryId, name: s.categoryName, nameUrdu: s.categoryName });
      }
    });
    return Array.from(map.values());
  }, [students]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <PageHeader
        title={title}
        titleUrdu={titleUrdu}
        description="Collect and manage student fees"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void loadStudents()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-600" />
            <p className="text-xs text-muted-foreground">Total Students</p>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono">{totalStudents}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono">
            {paidStudents} <span className="text-sm text-muted-foreground">({collectionRate}%)</span>
          </p>
          <div className="mt-2">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono">
            {pendingStudents} <span className="text-sm text-muted-foreground">({totalStudents > 0 ? Math.round((pendingStudents / totalStudents) * 100) : 0}%)</span>
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-red-600" />
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono">{formatPKR(totalOutstanding)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by roll, name, phone..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameUrdu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fee Status</label>
              <Select value={feeStatus} onValueChange={(value) => setFeeStatus(value as FeeStatusFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="clear">Clear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card className="overflow-hidden shadow-xl shadow-primary/5 border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Students</CardTitle>
            <Badge variant="secondary" className="font-mono">
              {students.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={HandCoins}
                  heading="No students found"
                  headingUrdu="کوئی طالبِ علم نہیں ملا"
                />
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-muted text-sm font-bold">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-urdu text-sm font-medium">{student.nameUrdu}</p>
                      <Badge
                        variant={student.summary.outstandingPaisa > 0 ? "destructive" : "secondary"}
                        className="shrink-0"
                      >
                        {student.summary.outstandingPaisa > 0 ? "Due" : "Clear"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.rollNo} · {student.groupLabel ?? student.institutionName}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {student.guardianPhone || "No phone"}
                      </p>
                      <Button
                        size="sm"
                        className="h-7 gap-1.5 px-3 text-xs"
                        onClick={() => handleCollect(student)}
                        disabled={student.summary.outstandingPaisa === 0}
                      >
                        <HandCoins className="h-3 w-3" />
                        Collect
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CollectPaymentDialog
        open={collectOpen}
        onOpenChange={(open) => {
          setCollectOpen(open);
          if (!open) {
            setSelectedStudent(null);
            setLedger(null);
          }
        }}
        onSuccess={handleSuccess}
        ledger={ledger}
      />
    </div>
  );
}
