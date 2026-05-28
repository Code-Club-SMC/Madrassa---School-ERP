import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useHR } from "@/stores/hr-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/departments")({ component: DepartmentsPage });

function DepartmentsPage() {
  const { departments, staff, addDepartment, updateDepartment, deleteDepartment } = useHR();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <div>
      <PageHeader title="Departments" titleUrdu="شعبہ جات" description="Manage departments and heads." actions={<Button size="sm" className="gap-1.5" onClick={() => { setName(""); setOpen(true); }}><Plus className="h-3.5 w-3.5" />Add</Button>} />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Head</TableHead><TableHead className="text-end">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{departments.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell><Select value={d.headStaffId ?? ""} onValueChange={(v) => updateDepartment(d.id, { headStaffId: v })}><SelectTrigger className="w-60"><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent>{staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></TableCell>
              <TableCell className="text-end"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Delete ${d.name}?`)) { deleteDepartment(d.id); toast.success("Deleted"); } }}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Department name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!name.trim()) return; addDepartment(name.trim()); toast.success("Added"); setOpen(false); }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}