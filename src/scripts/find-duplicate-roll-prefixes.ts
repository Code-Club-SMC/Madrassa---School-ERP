import { db } from "@/db";
import { madrassaSubcategories, madrassaCategories } from "@/db/schema/academic";
import { eq, sql } from "drizzle-orm";

async function main() {
  const duplicates = await db
    .select({
      categoryId: madrassaSubcategories.categoryId,
      rollPrefix: madrassaSubcategories.rollPrefix,
      count: sql<number>`count(*)`,
    })
    .from(madrassaSubcategories)
    .groupBy(madrassaSubcategories.categoryId, madrassaSubcategories.rollPrefix)
    .having(sql`count(*) > 1`);

  console.log("Duplicate roll prefixes:", duplicates);

  if (duplicates.length > 0) {
    for (const dup of duplicates) {
      const subs = await db
        .select()
        .from(madrassaSubcategories)
        .where(
          eq(madrassaSubcategories.categoryId, dup.categoryId),
          eq(madrassaSubcategories.rollPrefix, dup.rollPrefix),
        );
      
      const [category] = await db
        .select({ name: madrassaCategories.name, nameUrdu: madrassaCategories.nameUrdu })
        .from(madrassaCategories)
        .where(eq(madrassaCategories.id, dup.categoryId));
      
      console.log(`\nCategory: ${category?.nameUrdu || category?.name} (${dup.categoryId})`);
      console.log(`Roll Prefix: ${dup.rollPrefix}`);
      console.log("Subcategories:", subs.map(s => ({ id: s.id, name: s.nameUrdu || s.name })));
    }
  }
}

main().catch(console.error);
