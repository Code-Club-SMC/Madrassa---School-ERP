import { db } from "@/db";
import { eq } from "drizzle-orm";
import { madrassaCategories, madrassaSubcategories } from "@/db/schema/academic";
import { buildMadrassaCategories } from "@/lib/madrassa-grade-catalog";

async function main() {
  const categories = buildMadrassaCategories();
  console.log(`Syncing ${categories.length} categories with subcategories...`);

  const categoryMap = new Map<string, string>();
  categoryMap.set("hifz", "hifiz_male");
  categoryMap.set("qaida_nazira", "nazara_male");
  categoryMap.set("dars_nizami", "alam_male");
  categoryMap.set("preparatory", "alam_male");
  categoryMap.set("tajweed", "alam_male");
  categoryMap.set("takhassus", "alam_male");
  categoryMap.set("short_courses", "alam_male");

  const targetIds = Array.from(categoryMap.values());
  const existingCategories = await db.select().from(madrassaCategories).where(inArray(madrassaCategories.id, targetIds));
  const existingCategoryIds = new Set(existingCategories.map((c) => c.id));

  for (const category of categories) {
    const targetId = categoryMap.get(category.id);
    if (!targetId) continue;

    const displayName = category.name;
    const displayNameUrdu = category.nameUrdu;
    const description = category.description;
    const descriptionUrdu = category.descriptionUrdu;
    const displayOrder = category.displayOrder ?? 0;
    const section = category.subcategories[0]?.section ?? "male";

    if (!existingCategoryIds.has(targetId)) {
      await db.insert(madrassaCategories).values({
        id: targetId,
        name: displayName,
        nameUrdu: displayNameUrdu,
        description: description,
        descriptionUrdu: descriptionUrdu,
        displayOrder: displayOrder,
        active: true,
        section: section,
        formVariantKeys: [],
      });
      console.log(`Created category: ${displayNameUrdu} (${targetId})`);
    }

    for (const sub of category.subcategories) {
      const [existingSub] = await db
        .select()
        .from(madrassaSubcategories)
        .where(eq(madrassaSubcategories.id, sub.id))
        .limit(1);

      if (!existingSub) {
        await db.insert(madrassaSubcategories).values({
          id: sub.id,
          categoryId: targetId,
          name: sub.name,
          nameUrdu: sub.nameUrdu,
          rollPrefix: sub.rollPrefix,
          darja: sub.darja ?? null,
          govtEquivalent: sub.govtEquivalent ?? null,
          durationYears: sub.durationYears,
          fee: null,
          displayOrder: sub.displayOrder ?? 0,
          active: true,
          section: sub.section,
        });
        console.log(`  Created subcategory: ${sub.nameUrdu} (${targetId})`);
      }
    }
  }

  console.log("\nDone syncing madrassa catalog.");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to sync madrassa catalog:", error);
    process.exit(1);
  },
);
