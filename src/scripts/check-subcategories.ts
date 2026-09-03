import { db } from "@/db";
import { madrassaCategories, madrassaSubcategories } from "@/db/schema/academic";

async function main() {
  const categories = await db.select().from(madrassaCategories);
  const subcategories = await db.select().from(madrassaSubcategories);
  
  console.log("Categories:", categories.length);
  for (const cat of categories) {
    console.log(`- ${cat.id}: ${cat.nameUrdu} (${cat.name})`);
  }
  
  console.log("\nSubcategories:", subcategories.length);
  for (const sub of subcategories) {
    console.log(`- ${sub.id}: ${sub.nameUrdu} (${sub.name}) - category: ${sub.categoryId}`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to query:", error);
    process.exit(1);
  },
);
