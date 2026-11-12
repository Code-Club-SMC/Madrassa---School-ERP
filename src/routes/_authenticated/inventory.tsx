import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Package, AlertTriangle, PackagePlus, Pencil, History, Trash2, X, Loader2, RefreshCw, Wallet, LayoutDashboard, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { inventoryItems, type InventoryItem } from "@/mock";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BilingualLabel } from "@/components/shared/bilingual-label";

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("inventory_items");
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Fetch persistent inventory from server
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setItems(data.items);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("inventory_items", JSON.stringify(data.items));
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Error loading inventory from server:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("inventory_items", JSON.stringify(items));
      } catch {}
    }
  }, [items]);

  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState<InventoryItem | null>(null);

  const allCategories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  const filtered = useMemo(() => items.filter((i) => {
    if (q && !(i.name.toLowerCase().includes(q.toLowerCase()) || i.nameUrdu.includes(q) || i.category.toLowerCase().includes(q.toLowerCase()))) return false;
    if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (stockFilter === "low" && !(i.quantity <= i.lowStockThreshold)) return false;
    if (stockFilter === "out" && i.quantity !== 0) return false;
    if (stockFilter === "ok" && i.quantity <= i.lowStockThreshold) return false;
    return true;
  }), [q, items, categoryFilter, typeFilter, stockFilter]);

  const activeFilters = (categoryFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0) + (stockFilter !== "all" ? 1 : 0);
  function clearFilters() { setCategoryFilter("all"); setTypeFilter("all"); setStockFilter("all"); setQ(""); }

  const totals = useMemo(() => ({
    items: items.length,
    lowStock: items.filter((i) => (Number(i.quantity) || 0) <= (Number(i.lowStockThreshold) || 0)).length,
    value: items.reduce((a, i) => a + (Number(i.value) || 0), 0),
  }), [items]);

  function openEdit(it: InventoryItem) { setEditing(it); setDialogOpen(true); }

  async function save(it: InventoryItem) {
    const isEdit = Boolean(editing?.id);
    const trimmedName = it.name.trim();
    const trimmedNameUrdu = it.nameUrdu.trim();
    const name = trimmedName || trimmedNameUrdu;
    const nameUrdu = trimmedNameUrdu || trimmedName;
    const itemToSave: InventoryItem = {
      ...it,
      id: it.id || `inv-${Date.now()}`,
      name,
      nameUrdu,
    };

    // Optimistically update UI and local storage
    setItems((p) => {
      const next = isEdit ? p.map((x) => (x.id === itemToSave.id ? itemToSave : x)) : [itemToSave, ...p];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("inventory_items", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    setDialogOpen(false);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(itemToSave),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setItems((p) => {
            const next = p.map((x) => (x.id === itemToSave.id ? data.item : x));
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("inventory_items", JSON.stringify(next));
              } catch {}
            }
            return next;
          });
        }
        toast.success(
          isEdit
            ? "Item updated · اشیاء کی معلومات محفوظ ہوگئیں"
            : it.type === "donated"
            ? "Donation recorded · عطیہ درج کر لیا گیا"
            : "Stock recorded · نیا اسٹاک محفوظ ہوگیا"
        );
      } else {
        const errJson = await res.json().catch(() => null);
        toast.error(errJson?.error || "Failed to save inventory item on server");
        fetchInventory();
      }
    } catch {
      toast.error("Network error while saving inventory item");
      fetchInventory();
    }
  }

  async function remove(id: string) {
    // Optimistically remove
    setItems((p) => {
      const next = p.filter((x) => x.id !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("inventory_items", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    try {
      const res = await fetch(`/api/inventory?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Item deleted · آئٹم حذف کر دیا گیا");
      } else {
        toast.error("Failed to delete inventory item on server");
        fetchInventory();
      }
    } catch {
      toast.error("Network error while deleting inventory item");
      fetchInventory();
    }
  }

  async function clearAll() {
    if (!window.confirm("Are you sure you want to delete all inventory items? · کیا آپ تمام اشیاء حذف کرنا چاہتے ہیں؟")) {
      return;
    }
    setItems([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("inventory_items", JSON.stringify([]));
      } catch {}
    }
    try {
      const res = await fetch("/api/inventory?all=true", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("All inventory items deleted · تمام اشیاء حذف کر دی گئیں");
      } else {
        toast.error("Failed to clear inventory on server");
        fetchInventory();
      }
    } catch {
      toast.error("Network error while clearing inventory");
      fetchInventory();
    }
  }

  async function resetToDefaults() {
    if (!window.confirm("Restore default sample inventory items? · کیا آپ ابتدائی نمونہ اشیاء بحال کرنا چاہتے ہیں؟")) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setItems(data.items);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("inventory_items", JSON.stringify(data.items));
            } catch {}
          }
        }
        toast.success("Default sample items restored · نمونہ اشیاء بحال ہو گئیں");
      } else {
        toast.error("Failed to restore default sample items");
      }
    } catch {
      toast.error("Network error while restoring sample items");
    } finally {
      setLoading(false);
    }
  }

  function recordStock() {
    setEditing({ id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type: "purchased", value: 0, lowStockThreshold: 5 });
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        titleUrdu="انوینٹری"
        description="Books, stationery, mosque and classroom assets."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInventory()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            {items.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All · تمام صاف کریں</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                disabled={loading}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Sample Data · نمونہ ڈیٹا</span>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link to="/finance">
                <Wallet className="h-3.5 w-3.5" />
                <span>Finance · مالیات</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link to="/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard · ڈیش بورڈ</span>
              </Link>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={recordStock}>
              <PackagePlus className="h-3.5 w-3.5" />
              <span>Record Stock</span>
            </Button>
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
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative md:w-72">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" className="pe-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="md:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="md:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="purchased">Purchased</SelectItem>
              <SelectItem value="donated">Donated</SelectItem>
              <SelectItem value="gift">Gift</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="md:w-36"><SelectValue placeholder="Stock" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="ok">In stock</SelectItem>
              <SelectItem value="low">Low stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          {(activeFilters > 0 || q) && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />Clear
            </Button>
          )}
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
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <EmptyState
                    icon={Package}
                    heading={items.length === 0 ? "No inventory items" : "No matching items"}
                    headingUrdu={items.length === 0 ? "کوئی اشیاء موجود نہیں" : "کوئی مماثل اشیاء نہیں"}
                    description={
                      items.length === 0
                        ? "All inventory items have been deleted or none recorded yet. You can add new stock or restore default sample items."
                        : "Try adjusting your search query or filters to find what you are looking for."
                    }
                    descriptionUrdu={
                      items.length === 0
                        ? "تمام اشیاء حذف کر دی گئی ہیں یا ابھی تک کوئی درج نہیں ہوئی۔ آپ نیا اسٹاک درج کر سکتے ہیں یا نمونہ اشیاء بحال کر سکتے ہیں۔"
                        : "مطلوبہ اشیاء تلاش کرنے کے لیے اپنے فلٹرز یا تلاش کے الفاظ تبدیل کریں۔"
                    }
                    action={
                      items.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <Button size="sm" onClick={recordStock} className="gap-1.5">
                            <PackagePlus className="h-4 w-4" />
                            <span>Record Stock · نیا اسٹاک</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={resetToDefaults} className="gap-1.5">
                            <RotateCcw className="h-4 w-4" />
                            <span>Sample Items · نمونہ اشیاء</span>
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={clearFilters} className="mt-4">
                          Clear Filters · فلٹرز ختم کریں
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
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
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" aria-label="Edit" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="History" aria-label="History" onClick={() => setHistoryOpen(i)}><History className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete" aria-label="Delete" onClick={() => remove(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

function ItemDialog({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; initial: InventoryItem | null; onSave: (i: InventoryItem) => void | Promise<void> }) {
  const [f, setF] = useState<InventoryItem>({ id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type: "purchased", value: 0, lowStockThreshold: 5 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { 
    if (open) setF(initial ?? { id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type: "purchased", value: 0, lowStockThreshold: 5 }); 
  }, [open, initial]);

  const handleSubmit = async () => {
    if (submitting) return;
    const nameTrimmed = f.name.trim();
    const urduTrimmed = f.nameUrdu.trim();
    if (!nameTrimmed && !urduTrimmed) {
      toast.error("Item name is required · آئٹم کا نام درج کریں");
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        ...f,
        id: f.id || `inv-${Date.now()}`,
        name: nameTrimmed || urduTrimmed,
        nameUrdu: urduTrimmed || nameTrimmed,
      });
      setF({ id: "", name: "", nameUrdu: "", category: "Stationery", quantity: 1, unit: "pcs", type: "purchased", value: 0, lowStockThreshold: 5 });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-0.5">
            <span>{initial?.id ? "Edit Item" : "Record Stock Entry"}</span>
            <span className="font-urdu text-sm text-muted-foreground" dir="rtl">{initial?.id ? "ترمیم" : "اسٹاک اندراج"}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <BilingualLabel urdu="نام (انگریزی)" english="Item Name" required>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} disabled={submitting} />
            </BilingualLabel>
            <BilingualLabel urdu="نام (اردو)" english="Urdu Name" required>
              <Input className="font-urdu" dir="rtl" value={f.nameUrdu} onChange={(e) => setF({ ...f, nameUrdu: e.target.value })} disabled={submitting} />
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <BilingualLabel urdu="زمرہ" english="Category">
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })} disabled={submitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Books", "Stationery", "Mosque", "Classroom", "Electronics", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </BilingualLabel>
            <BilingualLabel urdu="قسم" english="Type" required>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as InventoryItem["type"] })} disabled={submitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="purchased">Purchased</SelectItem><SelectItem value="donated">Donated</SelectItem><SelectItem value="gift">Gift</SelectItem></SelectContent>
              </Select>
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <BilingualLabel urdu="مقدار" english="Quantity">
              <Input type="number" value={f.quantity} onChange={(e) => setF({ ...f, quantity: +e.target.value })} disabled={submitting} />
            </BilingualLabel>
            <BilingualLabel urdu="اکائی" english="Unit">
              <Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} disabled={submitting} />
            </BilingualLabel>
            <BilingualLabel urdu="کم اسٹاک" english="Low @">
              <Input type="number" value={f.lowStockThreshold} onChange={(e) => setF({ ...f, lowStockThreshold: +e.target.value })} disabled={submitting} />
            </BilingualLabel>
          </div>
          <BilingualLabel urdu="مالیت (روپے)" english="Value (PKR)">
            <Input type="number" value={f.value} onChange={(e) => setF({ ...f, value: +e.target.value })} disabled={submitting} />
          </BilingualLabel>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
