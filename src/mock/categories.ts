import type { MadrassaCategory } from "@/types";
import { buildMadrassaCategories } from "@/lib/madrassa-grade-catalog";

export const madrassaCategories: MadrassaCategory[] = buildMadrassaCategories();

export const allSubcategories = madrassaCategories.flatMap((c) =>
  c.subcategories.map((s) => ({
    ...s,
    categoryId: c.id,
    categoryName: c.name,
    categoryNameUrdu: c.nameUrdu,
  })),
);

export const categoryDistribution = allSubcategories.map((s) => ({
  name: s.nameUrdu,
  value: s.count,
}));
