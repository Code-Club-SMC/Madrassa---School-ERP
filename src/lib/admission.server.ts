import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, asc, or } from "drizzle-orm";
import { db } from "@/db";
import { madrassaCategories, madrassaSubcategories, schoolClasses } from "@/db/schema/academic";

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

export type AdmissionSchoolClassOption = {
  id: string;
  code: string;
  name: string;
  nameUrdu: string;
  level?: string | null;
  gender?: string | null;
  displayOrder?: number | null;
};

export const CANONICAL_SCHOOL_CLASSES: AdmissionSchoolClassOption[] = [
  { id: "demo_sc_nursery", code: "NUR", name: "Nursery", nameUrdu: "نرسری", level: "pre-primary", gender: "mixed", displayOrder: 10 },
  { id: "demo_sc_kg", code: "KG", name: "KG", nameUrdu: "کی جی", level: "pre-primary", gender: "mixed", displayOrder: 20 },
  { id: "demo_sc_1", code: "I", name: "Class 1", nameUrdu: "جماعت اول", level: "primary", gender: "mixed", displayOrder: 30 },
  { id: "demo_sc_2", code: "II", name: "Class 2", nameUrdu: "جماعت دوم", level: "primary", gender: "mixed", displayOrder: 40 },
  { id: "demo_sc_3", code: "III", name: "Class 3", nameUrdu: "جماعت سوم", level: "primary", gender: "mixed", displayOrder: 50 },
  { id: "demo_sc_4", code: "IV", name: "Class 4", nameUrdu: "جماعت چہارم", level: "primary", gender: "mixed", displayOrder: 60 },
  { id: "demo_sc_5", code: "V", name: "Class 5", nameUrdu: "جماعت پنجم", level: "primary", gender: "mixed", displayOrder: 70 },
  { id: "demo_sc_6", code: "VI", name: "Class 6", nameUrdu: "جماعت ششم", level: "middle", gender: "mixed", displayOrder: 80 },
  { id: "demo_sc_7", code: "VII", name: "Class 7", nameUrdu: "جماعت ہفتم", level: "middle", gender: "mixed", displayOrder: 90 },
  { id: "demo_sc_8", code: "VIII", name: "Class 8", nameUrdu: "جماعت ہشتم", level: "middle", gender: "mixed", displayOrder: 100 },
  { id: "demo_sc_9", code: "IX", name: "Class 9", nameUrdu: "جماعت نہم", level: "secondary", gender: "mixed", displayOrder: 110 },
  { id: "demo_sc_10", code: "X", name: "Class 10", nameUrdu: "جماعت دہم", level: "secondary", gender: "mixed", displayOrder: 120 },
];

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
      .where(
        data.section
          ? or(
              eq(madrassaSubcategories.section, data.section),
              eq(
                madrassaSubcategories.section,
                data.section === "male" ? "baneen" : "banat",
              ),
              eq(madrassaSubcategories.section, "both"),
              eq(madrassaSubcategories.section, "all"),
            )
          : undefined,
      )
      .orderBy(asc(madrassaSubcategories.displayOrder), asc(madrassaSubcategories.name));
  });

/**
 * Public listing of school classes for admission form dropdowns.
 * Intentionally does not require a view permission so it can be used on public forms.
 */
export const getAdmissionSchoolClasses = createServerFn({ method: "GET" })
  .validator(z.object({ gender: z.enum(["male", "female"]).optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const rows = await db
        .select({
          id: schoolClasses.id,
          code: schoolClasses.code,
          name: schoolClasses.name,
          nameUrdu: schoolClasses.nameUrdu,
          level: schoolClasses.level,
          gender: schoolClasses.gender,
          displayOrder: schoolClasses.displayOrder,
        })
        .from(schoolClasses)
        .where(eq(schoolClasses.active, true))
        .orderBy(asc(schoolClasses.displayOrder), asc(schoolClasses.name));

      if (rows && rows.length > 0) {
        if (data?.gender) {
          return rows.filter((r) => {
            const g = (r.gender || "").toLowerCase();
            return !g || g === "mixed" || g === "both" || g === "all" || g === data.gender;
          });
        }
        return rows;
      }
    } catch (err) {
      console.warn("[getAdmissionSchoolClasses] DB query fallback to canonical classes:", err);
    }

    if (data?.gender) {
      return CANONICAL_SCHOOL_CLASSES.filter((r) => {
        const g = (r.gender || "").toLowerCase();
        return !g || g === "mixed" || g === "both" || g === "all" || g === data.gender;
      });
    }
    return CANONICAL_SCHOOL_CLASSES;
  });
