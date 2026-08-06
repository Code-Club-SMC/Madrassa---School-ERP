import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, GraduationCap, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { institution } from "@/mock";

export const Route = createFileRoute("/website/")({
  head: () => ({
    meta: [
      { title: `${institution.nameEnglish} — Islamic Education & National Curriculum` },
      { name: "description", content: "Wifaq-aligned Islamic education integrated with the Pakistani national curriculum." },
      { property: "og:title", content: institution.nameEnglish },
      { property: "og:description", content: "Building tomorrow's scholars today." },
    ],
  }),
  component: WebsiteHome,
});

function WebsiteHome() {
  return (
    <>
      <section className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <p className="font-urdu text-3xl md:text-4xl font-bold text-primary">{institution.nameUrdu}</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mt-3">Building Tomorrow's Scholars Today</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Wifaq-aligned Madrassa education and the Pakistani national school curriculum, side by side under one roof.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link to="/apply"><Button size="lg" className="gap-1.5">Apply Online <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Button></Link>
            <Link to="/website/contact"><Button size="lg" variant="outline">Contact Us</Button></Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-heading text-2xl font-bold mb-6 text-center">What We Offer</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, t: "Madrassa", u: "مدرسہ", d: "Qaida, Nazira, Hifz, Dars-e-Nizami & Takhassus tracks aligned with Wifaq ul Madaris." },
            { icon: GraduationCap, t: "School", u: "اسکول", d: "Pre-Primary through Higher Secondary following BISE / FBISE curriculum." },
            { icon: Users2, t: "Parents Portal", u: "والدین پورٹل", d: "Track attendance, fees, and exam results for your children online." },
          ].map((c) => (
            <Card key={c.t} className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3"><c.icon className="h-6 w-6 text-primary" /></div>
              <h3 className="font-heading text-lg font-semibold">{c.t}</h3>
              <p className="font-urdu text-base text-muted-foreground">{c.u}</p>
              <p className="text-sm text-muted-foreground mt-2">{c.d}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}