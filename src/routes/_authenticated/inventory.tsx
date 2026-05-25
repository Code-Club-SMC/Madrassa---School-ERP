import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Package, AlertTriangle, ShoppingCart, Gift, Pencil, History, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { inventoryItems as seedItems, type InventoryItem } from "@/mock";
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
  // sync when opening
  useMemo(() => { if (open) setF(initial ?? { id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type: "purchased", value: 0, lowStockThreshold: 5 }); }, [open, initial]);
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
