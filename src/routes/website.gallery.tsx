import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/website/gallery")({
  head: () => ({ meta: [{ title: "Gallery — MSMIS" }, { name: "description", content: "Photos from events, ceremonies and academic life." }] }),
  component: Gallery,
});

const PHOTOS = [
  { caption: "Annual Wifaq Result Day", url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800" },
  { caption: "Hifz completion ceremony", url: "https://images.unsplash.com/photo-1564769625392-651b1c4cfb8b?w=800" },
  { caption: "Science fair 2025", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800" },
  { caption: "Sports day", url: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800" },
  { caption: "Quran competition", url: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800" },
  { caption: "Library inauguration", url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800" },
];

function Gallery() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-heading text-3xl font-bold">Gallery</h1>
      <p className="font-urdu text-lg text-muted-foreground">گیلری</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {PHOTOS.map((p) => (
          <figure key={p.url} className="rounded-2xl overflow-hidden border border-border bg-card">
            <img src={p.url} alt={p.caption} className="w-full aspect-[4/3] object-cover" loading="lazy" />
            <figcaption className="p-3 text-sm">{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}