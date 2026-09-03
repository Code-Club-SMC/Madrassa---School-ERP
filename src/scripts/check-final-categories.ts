import { db } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { madrassaCategories, madrassaSubcategories } from "@/db/schema/academic";

async function main() {
  const KEEP_CATEGORY_IDS = ["nazara_male", "hifiz_male", "alam_male", "nazara_female", "alam_female"];

  const categories = await db.select().from(madrassaCategories).where(inArray(madrassaCategories.id, KEEP_CATEGORY_IDS));
  const subcategories = await db.select().from(madrassaSubcategories).where(inArray(madrassaSubcategories.categoryId, KEEP_CATEGORY_IDS));

  console.log("Categories:", categories.length);
  for (const cat of categories) {
    const subs = subcategories.filter((s) => s.categoryId === cat.id);
    console.log(`- ${cat.id}: ${cat.nameUrdu} (${cat.name}) - ${subs.length} subcategories`);
    for (const sub of subs.slice(0, 3)) {
      console.log(`  - ${sub.id}: ${sub.nameUrdu} (${sub.name})`);
    }
    if (subs.length > 3) {
      console.log(`  ... and ${subs.length - 3} more`);
    }
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to query categories:", error);
    process.exit(1);
  },
);
