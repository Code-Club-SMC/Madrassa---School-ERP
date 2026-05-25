import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Users2, Hash, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { madrassaCategories, students } from "@/mock";

export const Route = createFileRoute("/_authenticated/madrassa/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const totalStudents = students.filter((s) => s.system === "madrassa").length;
  return (
    <div>
      <PageHeader
        title="Madrassa Categories"
        titleUrdu="مدرسہ کے درجات"
        description="Categories follow the Wifaq-ul-Madaris al-Arabia curriculum: Nazira, Hifz, Alimiyat (Dars-e-Nizami), and Takhassus."
        actions={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Category</Button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Categories · کل درجات</p><p className="font-heading text-2xl font-bold mt-1">{madrassaCategories.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Sub-categories · ذیلی</p><p className="font-heading text-2xl font-bold mt-1">{madrassaCategories.reduce((a, c) => a + c.subcategories.length, 0)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Madrassa Students · طلبہ</p><p className="font-heading text-2xl font-bold mt-1">{totalStudents}</p></Card>
      </div>
      <div className="space-y-4">
        {madrassaCategories.map((c) => {
          const subtotal = c.subcategories.reduce((a, s) => a + s.count, 0);
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
                <div className="min-w-0">
                  <h3 className="font-urdu text-xl font-semibold">{c.nameUrdu}</h3>
                  <p className="text-xs text-muted-foreground tracking-wide uppercase">{c.name}</p>
                </div>
                <Badge variant="outline" className="gap-1.5"><Users2 className="h-3 w-3" /><span>{subtotal} <span className="font-urdu">طلبہ</span></span></Badge>
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
    </div>
  );
}
