import { db } from "@/db";
import { eq } from "drizzle-orm";
import { madrassaCategories, madrassaSubcategories } from "@/db/schema/academic";
import { buildMadrassaCategories } from "@/lib/madrassa-grade-catalog";

async function main() {
  const categories = buildMadrassaCategories();
  console.log(`Seeding ${categories.length} categories with subcategories...`);

  for (const category of categories) {
    const [existingCategory] = await db
      .select()
      .from(madrassaCategories)
      .where(eq(madrassaCategories.id, category.id))
      .limit(1);

    if (!existingCategory) {
      const categorySection = category.subcategories[0]?.section ?? "male";
      await db.insert(madrassaCategories).values({
        id: category.id,
        name: category.name,
        nameUrdu: category.nameUrdu,
        description: category.description,
        descriptionUrdu: category.descriptionUrdu,
        displayOrder: category.displayOrder ?? 0,
        active: true,
        section: categorySection,
        formVariantKeys: [],
      });
      console.log(`Created category: ${category.nameUrdu}`);
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
          categoryId: category.id,
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
        console.log(`  Created subcategory: ${sub.nameUrdu} (${category.nameUrdu})`);
      }
    }
  }

  console.log("\nDone seeding madrassa catalog.");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to seed madrassa catalog:", error);
    process.exit(1);
  },
);
