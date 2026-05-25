import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Package, AlertTriangle, ShoppingCart, Gift, Pencil, History, Trash2, GraduationCap, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { inventoryItems as seedItems, students, type InventoryItem } from "@/mock";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

const typeStyle: Record<string, string> = {
  purchased: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-400",
  donated: "bg-chart-1/15 text-chart-5 border-chart-2/40 dark:text-chart-1",
  gift: "bg-purple-500/10 text-purple-700 border-purple-300/40 dark:text-purple-400",
};

function InventoryPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<InventoryItem[]>(seedItems);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState<InventoryItem | null>(null);
  const [graduationOpen, setGraduationOpen] = useState(false);

  const filtered = useMemo(() => items.filter((i) =>
    !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.nameUrdu.includes(q) || i.category.toLowerCase().includes(q.toLowerCase())
  ), [q, items]);

  const totals = useMemo(() => ({
    items: items.length,
    lowStock: items.filter((i) => i.quantity <= i.lowStockThreshold).length,
    value: items.reduce((a, i) => a + i.value, 0),
  }), [items]);

  function openAdd() { setEditing(null); setDialogOpen(true); }
  function openEdit(it: InventoryItem) { setEditing(it); setDialogOpen(true); }
  function save(it: InventoryItem) {
    setItems((p) => editing ? p.map((x) => x.id === it.id ? it : x) : [it, ...p]);
    toast.success(editing ? "Item updated" : "Item added");
    setDialogOpen(false);
  }
  function remove(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success("Item deleted");
  }
  function recordTxn(type: InventoryItem["type"]) {
    setEditing({ id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type, value: 0, lowStockThreshold: 5 });
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        titleUrdu="انوینٹری"
        description="Books, stationery, mosque and classroom assets."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => recordTxn("purchased")}><ShoppingCart className="h-3.5 w-3.5" />Record Purchase</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => recordTxn("donated")}><Gift className="h-3.5 w-3.5" />Record Donation</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setGraduationOpen(true)}><GraduationCap className="h-3.5 w-3.5" />Graduation Gift</Button>
            <Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="h-3.5 w-3.5" />Add Item</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Items · کل اشیاء</p><p className="font-heading text-2xl font-bold mt-1">{totals.items}</p></Card>
        <Card className={cn("p-4 flex items-start justify-between", totals.lowStock > 0 && "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/10")}>
          <div>
            <p className="text-xs text-muted-foreground">Low Stock · کم اسٹاک</p>
            <p className="font-heading text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{totals.lowStock}</p>
          </div>
          {totals.lowStock > 0 && <AlertTriangle className="h-5 w-5 text-amber-500" />}
        </Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Value · کل مالیت</p><p className="font-heading text-2xl font-bold mt-1">{formatPKR(totals.value)}</p></Card>
      </div>

      <Card className="p-3 mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" className="pe-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-end">Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-end">Value</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12"><EmptyState icon={Package} heading="No items" headingUrdu="کوئی اشیاء نہیں" /></TableCell></TableRow>
            ) : filtered.map((i) => {
              const low = i.quantity <= i.lowStockThreshold;
              return (
                <TableRow key={i.id} className={cn(low && "bg-amber-50/50 dark:bg-amber-950/10")}>
                  <TableCell>
                    <p className="font-medium text-sm">{i.name}</p>
                    <p className="font-urdu text-sm text-muted-foreground">{i.nameUrdu}</p>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{i.category}</Badge></TableCell>
                  <TableCell className="text-end font-mono text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {low && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      {i.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{i.unit}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", typeStyle[i.type])}>{i.type}</span>
                  </TableCell>
                  <TableCell className="text-end font-mono text-sm">{formatPKR(i.value)}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="History" onClick={() => setHistoryOpen(i)}><History className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete" onClick={() => remove(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <ItemDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} onSave={save} />

      <GraduationDialog
        open={graduationOpen}
        onOpenChange={setGraduationOpen}
        items={items}
        onDistribute={(itemId, qty) => {
          setItems((prev) => prev.map((x) => x.id === itemId ? { ...x, quantity: Math.max(0, x.quantity - qty) } : x));
        }}
      />

      <Dialog open={!!historyOpen} onOpenChange={(v) => !v && setHistoryOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transaction History — {historyOpen?.name}</DialogTitle></DialogHeader>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground text-xs font-urdu">{historyOpen?.nameUrdu} · لین دین کی تاریخ</p>
            <div className="rounded border border-border divide-y">
              {[
                { d: "2026-05-12", n: `+${historyOpen?.quantity ?? 0} ${historyOpen?.unit}`, t: historyOpen?.type === "donated" ? "Donation received" : "Stock added" },
                { d: "2026-04-02", n: "-3", t: "Issued to Class 5" },
                { d: "2026-03-20", n: "-2", t: "Issued to Hifz wing" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between p-2 text-xs"><span className="font-mono text-muted-foreground">{r.d}</span><span>{r.t}</span><span className="font-mono">{r.n}</span></div>
              ))}
            </div>
          </div>
          <DialogFooter><Button onClick={() => setHistoryOpen(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemDialog({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; initial: InventoryItem | null; onSave: (i: InventoryItem) => void }) {
  const [f, setF] = useState<InventoryItem>({ id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type: "purchased", value: 0, lowStockThreshold: 5 });
  useEffect(() => { if (open) setF(initial ?? { id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type: "purchased", value: 0, lowStockThreshold: 5 }); }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial?.id ? "Edit Item" : "Add Item"} · {initial?.id ? "ترمیم" : "نئی شے"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><Label className="font-urdu">اردو نام</Label><Input className="font-urdu" dir="rtl" value={f.nameUrdu} onChange={(e) => setF({ ...f, nameUrdu: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Books", "Stationery", "Mosque", "Classroom", "Electronics", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as InventoryItem["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="purchased">Purchased</SelectItem><SelectItem value="donated">Donated</SelectItem><SelectItem value="gift">Gift</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Quantity</Label><Input type="number" value={f.quantity} onChange={(e) => setF({ ...f, quantity: +e.target.value })} /></div>
            <div><Label>Unit</Label><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
            <div><Label>Low @</Label><Input type="number" value={f.lowStockThreshold} onChange={(e) => setF({ ...f, lowStockThreshold: +e.target.value })} /></div>
          </div>
          <div><Label>Value (PKR)</Label><Input type="number" value={f.value} onChange={(e) => setF({ ...f, value: +e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.name.trim()) { toast.error("Name is required"); return; }
            onSave({ ...f, id: f.id || `inv-${Date.now()}` });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GraduationDialog({ open, onOpenChange, items, onDistribute }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: InventoryItem[];
  onDistribute: (itemId: string, qty: number) => void;
}) {
  const eligible = useMemo(() => students.filter((s) => s.status === "graduated" || s.system === "madrassa").slice(0, 12), []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [giftItem, setGiftItem] = useState<string>(items[0]?.id ?? "");
  const [perStudent, setPerStudent] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) { setSelectedIds([]); setDone(false); setGiftItem(items[0]?.id ?? ""); setPerStudent(1); }
  }, [open, items]);

  function toggle(id: string) {
    setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  const item = items.find((i) => i.id === giftItem);
  const totalNeeded = selectedIds.length * perStudent;
  const insufficient = item ? totalNeeded > item.quantity : false;

  function distribute() {
    if (!item) return;
    if (selectedIds.length === 0) { toast.error("Select at least one student"); return; }
    if (insufficient) { toast.error(`Not enough stock — need ${totalNeeded}, have ${item.quantity}`); return; }
    onDistribute(item.id, totalNeeded);
    setDone(true);
    toast.success(`Distributed ${totalNeeded} ${item.unit} of ${item.name} to ${selectedIds.length} students`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Gift className="h-4 w-4" />Graduation Gift Distribution · رخصتی تحائف</DialogTitle>
          <DialogDescription>Track inventory deducted as graduation gifts. Auto-creates a stock movement entry.</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-heading text-lg font-bold">Gifts distributed</p>
            <p className="font-urdu text-sm text-muted-foreground" dir="rtl">تحائف تقسیم ہو گئے</p>
            <p className="text-xs text-muted-foreground mt-2">{selectedIds.length} students · {item?.name} × {perStudent} each</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
            <Card className="p-3 max-h-[360px] overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">Select graduating students · فارغ التحصیل طلبہ</p>
              <div className="space-y-1">
                {eligible.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                    <Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-urdu text-sm truncate" dir="rtl">{s.nameUrdu}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{s.rollNo} · {s.system}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Gift item</Label>
                <Select value={giftItem} onValueChange={setGiftItem}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Quantity per student</Label>
                <Input type="number" min={1} value={perStudent} onChange={(e) => setPerStudent(Math.max(1, +e.target.value || 1))} />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Recipients</span><span className="font-mono">{selectedIds.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total needed</span><span className={cn("font-mono", insufficient && "text-destructive")}>{totalNeeded}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">In stock</span><span className="font-mono">{item?.quantity ?? 0}</span></div>
              </div>
              {insufficient && (
                <div className="flex gap-2 items-start text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Not enough stock for this distribution.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{done ? "Close" : "Cancel"}</Button>
          {!done && <Button onClick={distribute} disabled={insufficient || selectedIds.length === 0}>Distribute</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
