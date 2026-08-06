import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Link2, Loader2, Search, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type { StudentListItem, StudentProfilePayload, StudentSiblingProfile } from "@/components/students/student-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  profile: StudentProfilePayload;
  onChanged: () => Promise<void> | void;
};

type StudentSearchPayload = {
  students?: StudentListItem[];
  error?: string;
};

export function StudentSiblingManager({ profile, onChanged }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<StudentSiblingProfile | null>(null);
  const [removingSubmitting, setRemovingSubmitting] = useState(false);

  const linkedSiblingIds = useMemo(() => new Set(profile.siblings.map((sibling) => sibling.id)), [profile.siblings]);

  async function searchStudents() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast.error("Enter a name, roll number, or phone");
      return;
    }

    setSearching(true);
    try {
      const [schoolResponse, madrassaResponse] = await Promise.all([
        fetch(`/api/students?system=school&q=${encodeURIComponent(trimmedQuery)}&pageSize=10`, { credentials: "include" }),
        fetch(`/api/students?system=madrassa&q=${encodeURIComponent(trimmedQuery)}&pageSize=10`, { credentials: "include" }),
      ]);
      const [schoolPayload, madrassaPayload] = (await Promise.all([
        schoolResponse.json().catch(() => ({})),
        madrassaResponse.json().catch(() => ({})),
      ])) as [StudentSearchPayload, StudentSearchPayload];

      if (!schoolResponse.ok) throw new Error(schoolPayload.error || "Could not search school students");
      if (!madrassaResponse.ok) throw new Error(madrassaPayload.error || "Could not search madrassa students");

      setResults(filterSearchResults([...(schoolPayload.students ?? []), ...(madrassaPayload.students ?? [])], profile.student.id, linkedSiblingIds));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not search students");
    } finally {
      setSearching(false);
    }
  }

  async function linkSibling(siblingStudentId: string) {
    setLinkingId(siblingStudentId);
    try {
      const response = await fetch(`/api/students/${profile.student.id}/siblings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ siblingStudentId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not link sibling");

      toast.success("Sibling linked");
      setResults((current) => current.filter((student) => student.id !== siblingStudentId));
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not link sibling");
    } finally {
      setLinkingId(null);
    }
  }

  async function removeSibling() {
    if (!removing) return;

    setRemovingSubmitting(true);
    try {
      const response = await fetch(`/api/students/${profile.student.id}/siblings/${removing.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not remove sibling link");

      toast.success("Sibling link removed");
      await onChanged();
      setRemoving(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove sibling link");
    } finally {
      setRemovingSubmitting(false);
    }
  }

  return (
    <Card className="mt-3 space-y-3 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Siblings</p>
          <p className="text-xs text-muted-foreground">Link existing students across school and madrassa records.</p>
        </div>
        <Button size="sm" className="gap-1.5 self-start sm:self-auto" onClick={() => setSearchOpen(true)}>
          <Link2 className="h-3.5 w-3.5" />
          Link Sibling
        </Button>
      </div>

      {profile.siblings.length === 0 && <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No siblings linked.</p>}

      <div className="space-y-2">
        {profile.siblings.map((sibling) => (
          <div key={sibling.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/students/$id" params={{ id: sibling.id }} className="min-w-0 hover:text-primary">
              <p className="truncate font-urdu text-sm">{sibling.nameUrdu}</p>
              <p className="truncate text-xs text-muted-foreground">{sibling.name}</p>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {sibling.rollNo ?? "—"}
              </Badge>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setRemoving(sibling)}>
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ResponsiveDialog
        title="Link Sibling"
        description="Search existing student records and link the selected student as a sibling."
        open={searchOpen}
        onOpenChange={setSearchOpen}
        icon={UsersRound}
        className="sm:max-w-[720px]"
      >
        <div className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void searchStudents();
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, Urdu name, roll number, or guardian phone"
              className="sm:flex-1"
            />
            <Button type="submit" className="gap-1.5" disabled={searching}>
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </Button>
          </form>

          <div className="max-h-[min(28rem,calc(100vh-15rem))] space-y-2 overflow-y-auto pr-1">
            {results.map((student) => (
              <div key={student.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{student.name}</p>
                    <Badge variant="secondary">{student.system === "madrassa" ? "Madrassa" : "School"}</Badge>
                  </div>
                  <p className="font-urdu text-sm text-muted-foreground">{student.nameUrdu}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.groupEnglish} · {student.institutionName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {student.rollNo}
                  </Badge>
                  <Button size="sm" className="gap-1.5" disabled={linkingId !== null} onClick={() => linkSibling(student.id)}>
                    {linkingId === student.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                    Link
                  </Button>
                </div>
              </div>
            ))}
            {!searching && query.trim() && results.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No matching students available to link.</p>
            )}
            {!query.trim() && <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Search existing students before linking a sibling.</p>}
          </div>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove sibling link?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the sibling relationship between {profile.student.name} and {removing?.name ?? "this student"}. Student records will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removingSubmitting}
              onClick={(event) => {
                event.preventDefault();
                void removeSibling();
              }}
            >
              {removingSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function filterSearchResults(students: StudentListItem[], currentStudentId: string, linkedSiblingIds: Set<string>) {
  const seenIds = new Set<string>();

  return students.filter((student) => {
    if (student.id === currentStudentId || linkedSiblingIds.has(student.id) || seenIds.has(student.id)) {
      return false;
    }

    seenIds.add(student.id);
    return true;
  });
}
