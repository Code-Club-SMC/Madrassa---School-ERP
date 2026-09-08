import { db } from "@/db";
import { madrassaSubcategories } from "@/db/schema/academic";
import { eq } from "drizzle-orm";

async function main() {
  // Update the 4 hifiz_male subcategories to have unique roll prefixes
  await db.update(madrassaSubcategories)
    .set({ rollPrefix: "QH0" })
    .where(eq(madrassaSubcategories.id, "hifiz_male-nothing-8339807e"));
  
  await db.update(madrassaSubcategories)
    .set({ rollPrefix: "QH1" })
    .where(eq(madrassaSubcategories.id, "bn-hifz-1"));
  
  await db.update(madrassaSubcategories)
    .set({ rollPrefix: "QH2" })
    .where(eq(madrassaSubcategories.id, "bn-hifz-2"));
  
  await db.update(madrassaSubcategories)
    .set({ rollPrefix: "QH3" })
    .where(eq(madrassaSubcategories.id, "bn-hifz-3"));

  console.log("Updated roll prefixes:");
  console.log("  hifiz_male-nothing-8339807e -> QH0");
  console.log("  bn-hifz-1 -> QH1");
  console.log("  bn-hifz-2 -> QH2");
  console.log("  bn-hifz-3 -> QH3");
}

main().catch(console.error);
