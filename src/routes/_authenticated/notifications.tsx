import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Check, AlertTriangle, Wallet, FileSignature, Package, Megaphone, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

type Notice = {
  id: string;
  category: "fee" | "admission" | "exam" | "inventory" | "system";
  title: string;
  titleUrdu: string;
  body: string;
  at: string;
  read: boolean;
};

const CAT_META: Record<Notice["category"], { icon: typeof Bell; tone: string; label: string }> = {
  fee: { icon: Wallet, tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300", label: "Fees" },
  admission: { icon: FileSignature, tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300", label: "Admissions" },
  exam: { icon: Megaphone, tone: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300", label: "Exams" },
  inventory: { icon: Package, tone: "bg-destructive/15 text-destructive", label: "Inventory" },
  system: { icon: AlertTriangle, tone: "bg-muted text-foreground", label: "System" },
};

function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<Notice[]>([
    { id: "n1", category: "fee", title: "5 fee payments due today", titleUrdu: "آج 5 فیسیں واجب الادا", body: "School: 3, Madrassa: 2 students with overdue dues.", at: new Date().toISOString(), read: false },
    { id: "n2", category: "admission", title: "3 new admission applications", titleUrdu: "3 نئی داخلہ درخواستیں", body: "Pending review in Admissions queue.", at: new Date(Date.now() - 3600e3).toISOString(), read: false },
    { id: "n3", category: "inventory", title: "Low stock: Notebooks (12 left)", titleUrdu: "نوٹ بک کم — 12 باقی", body: "Re-order before next week to avoid distribution gap.", at: new Date(Date.now() - 6 * 3600e3).toISOString(), read: false },
    { id: "n4", category: "exam", title: "Mid-term date sheet published", titleUrdu: "ششماہی شیڈول جاری", body: "Visible on parents portal and notice board.", at: new Date(Date.now() - 2 * 86400e3).toISOString(), read: true },
    { id: "n5", category: "system", title: "Database backup completed", titleUrdu: "بیک اپ مکمل", body: "Nightly backup uploaded to cloud storage successfully.", at: new Date(Date.now() - 3 * 86400e3).toISOString(), read: true },
  ]);

  const filtered = items.filter((i) => tab === "all" || !i.read);

  return (
    <div>
      <PageHeader
        title="Notifications"
        titleUrdu="اعلانات"
        description={`${items.filter((i) => !i.read).length} unread of ${items.length}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setItems((p) => p.map((x) => ({ ...x, read: true }))); toast.success("All marked as read"); }}><Check className="h-3.5 w-3.5" />Mark all read</Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => { setItems([]); toast.success("All notifications cleared"); }}><Trash2 className="h-3.5 w-3.5" />Clear</Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({items.filter((i) => !i.read).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-3 opacity-40" />
          You're all caught up · سب کچھ پڑھ لیا
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = CAT_META[n.category];
            return (
              <Card key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.tone}`}><meta.icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.read && <Badge variant="default" className="h-4 px-1.5 text-[9px]">NEW</Badge>}
                  </div>
                  <p className="font-urdu text-sm text-muted-foreground">{n.titleUrdu}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">{formatDate(n.at)} · {meta.label}</p>
                </div>
                {!n.read && <Button size="sm" variant="ghost" onClick={() => setItems((p) => p.map((x) => x.id === n.id ? { ...x, read: true } : x))}><Check className="h-3.5 w-3.5" /></Button>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}