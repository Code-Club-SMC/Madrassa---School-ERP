import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Users2, Hash, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { madrassaCategories, students } from "@/mock";

export const Route = createFileRoute("/_authenticated/madrassa/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const totalStudents = students.filter((s) => s.system === "madrassa").length;
  const [cats, setCats] = useState(madrassaCategories);
  const [addCat, setAddCat] = useState(false);
  const [addDarja, setAddDarja] = useState<string | null>(null); // parent category id
  const [catForm, setCatForm] = useState({ name: "", nameUrdu: "" });
  const [darjaForm, setDarjaForm] = useState({ name: "", nameUrdu: "", rollPrefix: "", count: 0 });
  return (
    <div>
      <PageHeader
        title="Madrassa Categories"
        titleUrdu="مدرسہ کے درجات"
        description="Categories follow the Wifaq-ul-Madaris al-Arabia curriculum: Nazira, Hifz, Alimiyat (Dars-e-Nizami), and Takhassus."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setAddCat(true)}><Plus className="h-4 w-4" />Add Category</Button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Categories · کل درجات</p><p className="font-heading text-2xl font-bold mt-1">{cats.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Sub-categories · ذیلی</p><p className="font-heading text-2xl font-bold mt-1">{cats.reduce((a, c) => a + c.subcategories.length, 0)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Madrassa Students · طلبہ</p><p className="font-heading text-2xl font-bold mt-1">{totalStudents}</p></Card>
      </div>
      <div className="space-y-4">
        {cats.map((c) => {
          const subtotal = c.subcategories.reduce((a, s) => a + s.count, 0);
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
                <div className="min-w-0">
                  <h3 className="font-urdu text-xl font-semibold">{c.nameUrdu}</h3>
                  <p className="text-xs text-muted-foreground tracking-wide uppercase">{c.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1.5"><Users2 className="h-3 w-3" /><span>{subtotal} <span className="font-urdu">طلبہ</span></span></Badge>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7" onClick={() => { setDarjaForm({ name: "", nameUrdu: "", rollPrefix: "", count: 0 }); setAddDarja(c.id); }}><Plus className="h-3.5 w-3.5" />Darja</Button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {c.subcategories.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                      <div className="min-w-0">
                        <p className="font-urdu text-base">{s.nameUrdu}</p>
                        <p className="text-xs text-muted-foreground">{s.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded inline-flex items-center gap-1 text-muted-foreground"><Hash className="h-3 w-3" />{s.rollPrefix}</span>
                      <span className="font-mono text-sm tabular-nums w-12 text-end">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={addCat} onOpenChange={setAddCat}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Category · نیا درجہ</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Name (English)</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Tahfeez" /></div>
            <div><Label className="font-urdu">اردو نام</Label><Input dir="rtl" className="font-urdu" value={catForm.nameUrdu} onChange={(e) => setCatForm({ ...catForm, nameUrdu: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCat(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!catForm.name.trim()) { toast.error("Name required"); return; }
              setCats((p) => [...p, { id: `cat-${Date.now()}`, name: catForm.name, nameUrdu: catForm.nameUrdu || catForm.name, subcategories: [] }]);
              toast.success("Category added"); setCatForm({ name: "", nameUrdu: "" }); setAddCat(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!addDarja} onOpenChange={(v) => !v && setAddDarja(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Darja · نیا ذیلی درجہ</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Parent Category</Label>
              <Select value={addDarja ?? ""} onValueChange={(v) => setAddDarja(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Name</Label><Input value={darjaForm.name} onChange={(e) => setDarjaForm({ ...darjaForm, name: e.target.value })} /></div>
              <div><Label className="font-urdu">اردو</Label><Input dir="rtl" className="font-urdu" value={darjaForm.nameUrdu} onChange={(e) => setDarjaForm({ ...darjaForm, nameUrdu: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Roll Prefix</Label><Input value={darjaForm.rollPrefix} onChange={(e) => setDarjaForm({ ...darjaForm, rollPrefix: e.target.value })} placeholder="e.g. HF" /></div>
              <div><Label>Initial Count</Label><Input type="number" value={darjaForm.count} onChange={(e) => setDarjaForm({ ...darjaForm, count: +e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDarja(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!addDarja || !darjaForm.name.trim()) { toast.error("Name required"); return; }
              const parent = addDarja;
              setCats((p) => p.map((c) => c.id === parent ? { ...c, subcategories: [...c.subcategories, { id: `sub-${Date.now()}`, name: darjaForm.name, nameUrdu: darjaForm.nameUrdu || darjaForm.name, rollPrefix: darjaForm.rollPrefix || "X", count: darjaForm.count }] } : c));
              toast.success("Darja added"); setAddDarja(null);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
