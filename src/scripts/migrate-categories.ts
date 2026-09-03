import { db } from "@/db";
import { eq } from "drizzle-orm";
import { madrassaCategories, madrassaSubcategories } from "@/db/schema/academic";

async function main() {
  const originalStaticIds = new Set([
    "nazara_male",
    "hifiz_male",
    "alam_male",
    "nazara_female",
    "alam_female",
  ]);

  const allCategories = await db.select().from(madrassaCategories);
  console.log("All categories:", allCategories.map((c) => c.id));

  const categoryNameMap: Record<string, string> = {
    hifz: "hifiz_male",
    qaida_nazira: "nazara_male",
    dars_nizami: "alam_male",
    preparatory: "alam_male",
    tajweed: "alam_male",
    takhassus: "alam_male",
    short_courses: "alam_male",
  };

  const femaleCategoryMap: Record<string, string> = {
    qaida_nazira: "nazara_female",
    dars_nizami: "alam_female",
    preparatory: "alam_female",
    tajweed: "alam_female",
    takhassus: "alam_female",
  };

  for (const category of allCategories) {
    console.log(`Checking category: ${category.id} (original static: ${originalStaticIds.has(category.id)})`);
    if (originalStaticIds.has(category.id)) {
      console.log(`  Skipping original static category: ${category.id}`);
      continue;
    }

    const targetId = categoryNameMap[category.id];
    console.log(`  Target ID for ${category.id}: ${targetId}`);
    if (!targetId) {
      console.log(`  No mapping for: ${category.id}`);
      continue;
    }

    const target = allCategories.find((c) => c.id === targetId);
    if (!target) {
      console.log(`  Target category not found: ${targetId}`);
      continue;
    }

    const subcategories = await db.select().from(madrassaSubcategories).where(eq(madrassaSubcategories.categoryId, category.id));
    console.log(`  Migrating ${subcategories.length} subcategories from ${category.id} (${category.nameUrdu}) to ${targetId} (${target.nameUrdu})`);

    for (const sub of subcategories) {
      const finalTargetId = sub.section === "banat" || sub.section === "female"
        ? (femaleCategoryMap[category.id] ?? targetId)
        : targetId;
      await db.update(madrassaSubcategories).set({ categoryId: finalTargetId }).where(eq(madrassaSubcategories.id, sub.id));
    }

    await db.delete(madrassaCategories).where(eq(madrassaCategories.id, category.id));
    console.log(`  Deleted category: ${category.nameUrdu} (${category.id})`);
  }

  console.log("\nDone migrating categories.");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to migrate categories:", error);
    process.exit(1);
  },
);
