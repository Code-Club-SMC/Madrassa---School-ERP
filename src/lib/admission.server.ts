import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { madrassaCategories, madrassaSubcategories } from "@/db/schema/academic";

export type AdmissionSubcategoryOption = {
  id: string;
  categoryId: string;
  name: string;
  nameUrdu: string;
  rollPrefix: string;
  section: string;
  categoryName: string;
  categoryNameUrdu: string;
};

/**
 * Public listing of madrassa subcategories (classes) for admission form dropdowns.
 * Intentionally does not require a view permission so it can be used on public forms.
 */
export const getAdmissionSubcategories = createServerFn({ method: "GET" })
  .validator(z.object({ section: z.enum(["male", "female"]).optional() }))
  .handler(async ({ data }) => {
    return db
      .select({
        id: madrassaSubcategories.id,
        categoryId: madrassaSubcategories.categoryId,
        name: madrassaSubcategories.name,
        nameUrdu: madrassaSubcategories.nameUrdu,
        rollPrefix: madrassaSubcategories.rollPrefix,
        section: madrassaSubcategories.section,
        categoryName: madrassaCategories.name,
        categoryNameUrdu: madrassaCategories.nameUrdu,
      })
      .from(madrassaSubcategories)
      .innerJoin(madrassaCategories, eq(madrassaSubcategories.categoryId, madrassaCategories.id))
      .where(data.section ? eq(madrassaSubcategories.section, data.section) : undefined)
      .orderBy(asc(madrassaSubcategories.displayOrder), asc(madrassaSubcategories.name));
  });
