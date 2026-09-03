import { db } from "@/db";
import { eq, notInArray } from "drizzle-orm";
import { madrassaCategories, madrassaSubcategories } from "@/db/schema/academic";

const KEEP_CATEGORY_IDS = ["nazara_male", "hifiz_male", "alam_male", "nazara_female", "alam_female"];

async function main() {
  const orphanSubcategories = await db.select().from(madrassaSubcategories).where(notInArray(madrassaSubcategories.categoryId, KEEP_CATEGORY_IDS));
  console.log(`Deleting ${orphanSubcategories.length} orphan subcategories...`);
  for (const sub of orphanSubcategories) {
    await db.delete(madrassaSubcategories).where(eq(madrassaSubcategories.id, sub.id));
  }

  const extraCategories = await db.select().from(madrassaCategories).where(notInArray(madrassaCategories.id, KEEP_CATEGORY_IDS));
  console.log(`Deleting ${extraCategories.length} extra categories...`);
  for (const category of extraCategories) {
    await db.delete(madrassaCategories).where(eq(madrassaCategories.id, category.id));
  }

  const remainingCategories = await db.select().from(madrassaCategories);
  const remainingSubcategories = await db.select().from(madrassaSubcategories);
  console.log("\nRemaining categories:", remainingCategories.map((c) => c.id).join(", "));
  console.log("Remaining subcategories:", remainingSubcategories.length);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to clean up categories:", error);
    process.exit(1);
  },
);
