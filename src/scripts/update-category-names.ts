import { db } from "@/db";
import { eq } from "drizzle-orm";
import { madrassaCategories } from "@/db/schema/academic";

async function main() {
  const updates = [
    { id: "hifz", name: "Hifiz", nameUrdu: "حفاظ", description: "Hifiz / Memorization category", descriptionUrdu: "حفظ زمرہ" },
    { id: "qaida_nazira", name: "Nazara", nameUrdu: "ناظرہ", description: "Nazara / Qaida category", descriptionUrdu: "ناظرہ / قاعدہ زمرہ" },
    { id: "dars_nizami", name: "Alam", nameUrdu: "علم", description: "Alam / Dars-e-Nizami category", descriptionUrdu: "علم / درس نظامی زمرہ" },
    { id: "preparatory", name: "Alam", nameUrdu: "علم", description: "Alam / Preparatory category", descriptionUrdu: "علم / ابتدائی و اعدادی زمرہ" },
    { id: "tajweed", name: "Alam", nameUrdu: "علم", description: "Alam / Tajweed category", descriptionUrdu: "علم / تجوید زمرہ" },
    { id: "takhassus", name: "Alam", nameUrdu: "علم", description: "Alam / Takhassus category", descriptionUrdu: "علم / تخصص زمرہ" },
    { id: "short_courses", name: "Alam", nameUrdu: "علم", description: "Alam / Short Courses category", descriptionUrdu: "علم / دورات زمرہ" },
  ];

  for (const update of updates) {
    const [category] = await db.select().from(madrassaCategories).where(eq(madrassaCategories.id, update.id)).limit(1);
    if (!category) {
      console.log(`Category not found: ${update.id}`);
      continue;
    }

    await db.update(madrassaCategories).set({
      name: update.name,
      nameUrdu: update.nameUrdu,
      description: update.description,
      descriptionUrdu: update.descriptionUrdu,
    }).where(eq(madrassaCategories.id, update.id));

    console.log(`Updated category: ${update.nameUrdu} (${update.id})`);
  }

  console.log("\nDone updating category names.");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to update category names:", error);
    process.exit(1);
  },
);
