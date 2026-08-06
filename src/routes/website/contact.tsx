import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { institution } from "@/mock";

export const Route = createFileRoute("/website/contact")({
  head: () => ({ meta: [{ title: "Contact — MSMIS" }, { name: "description", content: "Get in touch with the administration." }] }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-heading text-3xl font-bold">Contact Us</h1>
      <p className="font-urdu text-lg text-muted-foreground">رابطہ کریں</p>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6 space-y-4">
          <Info icon={Phone} label="Phone" value="+92-300-1234567" />
          <Info icon={Mail} label="Email" value="info@msmis.edu.pk" />
          <Info icon={MapPin} label="Address" value={`${institution.nameEnglish}, Township, Lahore`} />
        </Card>
        <Card className="p-6 space-y-3">
          <h3 className="font-heading font-semibold">Send a message</h3>
          <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea rows={5} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Button className="gap-1.5" onClick={() => { toast.success("Message sent — we'll respond within 24 hours"); setForm({ name: "", phone: "", message: "" }); }}><Send className="h-3.5 w-3.5" />Send Message</Button>
        </Card>
      </div>
    </section>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium mt-0.5">{value}</p></div>
    </div>
  );
}