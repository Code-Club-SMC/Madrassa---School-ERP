import { db } from "@/db";
import { madrassaCategories } from "@/db/schema/academic";

async function main() {
  const categories = await db.select().from(madrassaCategories);
  console.log("Categories in database:", categories.length);
  for (const cat of categories) {
    console.log(`- ${cat.id}: ${cat.nameUrdu} (${cat.name}) - section: ${cat.section}`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to query categories:", error);
    process.exit(1);
  },
);
