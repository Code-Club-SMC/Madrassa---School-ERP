import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, Save, Plus, Trash2, ExternalLink, Image as ImgIcon, Phone, Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/website")({
  component: WebsiteCMS,
});

function WebsiteCMS() {
  const [home, setHome] = useState({
    heroEn: "Building Tomorrow's Scholars Today",
    heroUr: "علم و عمل کے ساتھ مستقبل کی تعمیر",
    about: "Madrassa Tul Quran is committed to integrating Wifaq-aligned Islamic education with the Pakistani national curriculum.",
  });
  const [gallery, setGallery] = useState<{ id: string; caption: string; url: string }[]>([
    { id: "g1", caption: "Annual Wifaq Result Day", url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400" },
    { id: "g2", caption: "Hifz completion ceremony", url: "https://images.unsplash.com/photo-1607450048555-8a8a3a2c8f2e?w=400" },
    { id: "g3", caption: "Science fair 2025", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400" },
  ]);
  const [notices, setNotices] = useState<{ id: string; en: string; ur: string }[]>([
    { id: "n1", en: "Admissions open for 2026-27", ur: "تعلیمی سال 2026-27 کے لیے داخلے کھلے ہیں" },
    { id: "n2", en: "Annual prize distribution Friday", ur: "سالانہ تقریب تقسیم انعامات جمعہ کو" },
  ]);
  const [contact, setContact] = useState({ phone: "+92-300-1234567", email: "info@msmis.edu.pk", address: "Township, Lahore, Pakistan" });

  return (
    <div>
      <PageHeader
        title="Website CMS"
        titleUrdu="ویب سائٹ"
        description="Edit public pages, gallery, notices, and contact info shown on /website."
        actions={<Link to="/website" target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" />View Site</Button></Link>}
      />

      <Tabs defaultValue="home">
        <TabsList>
          <TabsTrigger value="home"><Globe className="h-3.5 w-3.5 me-1.5" />Home</TabsTrigger>
          <TabsTrigger value="gallery"><ImgIcon className="h-3.5 w-3.5 me-1.5" />Gallery</TabsTrigger>
          <TabsTrigger value="notices"><Bell className="h-3.5 w-3.5 me-1.5" />Notices</TabsTrigger>
          <TabsTrigger value="contact"><Phone className="h-3.5 w-3.5 me-1.5" />Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <Card className="p-5 mt-3 space-y-4">
            <Field label="Hero (English)" value={home.heroEn} onChange={(v) => setHome({ ...home, heroEn: v })} />
            <Field label="Hero (Urdu)" value={home.heroUr} onChange={(v) => setHome({ ...home, heroUr: v })} urdu />
            <div>
              <label className="text-xs text-muted-foreground">About paragraph</label>
              <Textarea rows={4} value={home.about} onChange={(e) => setHome({ ...home, about: e.target.value })} />
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => toast.success("Home page saved")}><Save className="h-3.5 w-3.5" />Save Home</Button>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="p-5 mt-3 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              {gallery.map((g) => (
                <div key={g.id} className="relative rounded-xl overflow-hidden border border-border group">
                  <img src={g.url} alt={g.caption} className="w-full aspect-video object-cover" />
                  <div className="p-2 text-xs">{g.caption}</div>
                  <Button size="icon" variant="destructive" className="h-7 w-7 absolute top-2 end-2 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={() => setGallery(gallery.filter((x) => x.id !== g.id))} aria-label="Remove gallery image"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setGallery([...gallery, { id: `g${Date.now()}`, caption: "New photo", url: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400" }])}><Plus className="h-3.5 w-3.5" />Add Photo</Button>
          </Card>
        </TabsContent>

        <TabsContent value="notices">
          <Card className="p-5 mt-3 space-y-3">
            {notices.map((n, i) => (
              <div key={n.id} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-center p-3 rounded-lg border border-border">
                <Input value={n.en} onChange={(e) => setNotices(notices.map((x, j) => j === i ? { ...x, en: e.target.value } : x))} placeholder="English" />
                <Input value={n.ur} className="font-urdu" onChange={(e) => setNotices(notices.map((x, j) => j === i ? { ...x, ur: e.target.value } : x))} placeholder="Urdu" />
                <Button size="icon" variant="ghost" onClick={() => setNotices(notices.filter((x) => x.id !== n.id))} aria-label="Remove notice"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setNotices([...notices, { id: `n${Date.now()}`, en: "New notice", ur: "نیا اعلان" }])}><Plus className="h-3.5 w-3.5" />Add Notice</Button>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="p-5 mt-3 space-y-4">
            <Field label="Phone" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
            <Field label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} />
            <Field label="Address" value={contact.address} onChange={(v) => setContact({ ...contact, address: v })} />
            <Button size="sm" className="gap-1.5" onClick={() => toast.success("Contact saved")}><Save className="h-3.5 w-3.5" />Save</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value, onChange, urdu }: { label: string; value: string; onChange: (v: string) => void; urdu?: boolean }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className={urdu ? "font-urdu" : ""} />
    </div>
  );
}