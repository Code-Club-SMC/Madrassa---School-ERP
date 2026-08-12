import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const institutions = pgTable(
  "institutions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    system: text("system").notNull(),
    section: text("section"),
    isFormal: boolean("is_formal").default(true).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("institutions_system_idx").on(table.system),
    index("institutions_active_idx").on(table.active),
  ],
);

export const programs = pgTable(
  "programs",
  {
    id: text("id").primaryKey(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    system: text("system").notNull(),
    kind: text("kind").notNull(),
    rollPrefix: text("roll_prefix").notNull(),
    isFormal: boolean("is_formal").default(true).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("programs_institution_idx").on(table.institutionId),
    index("programs_system_idx").on(table.system),
    index("programs_active_idx").on(table.active),
  ],
);

export const schoolClasses = pgTable(
  "school_classes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    level: text("level").notNull(),
    govtEquivalent: text("govt_equivalent"),
    displayOrder: integer("display_order").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("school_classes_level_idx").on(table.level),
    index("school_classes_active_idx").on(table.active),
  ],
);

export const schoolClassSections = pgTable(
  "school_class_sections",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => schoolClasses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    group: text("group"),
    active: boolean("active").default(true).notNull(),
  },
  (table) => [
    index("school_class_sections_class_idx").on(table.classId),
    uniqueIndex("school_class_sections_class_name_idx").on(table.classId, table.name),
  ],
);

export const madrassaCategories = pgTable(
  "madrassa_categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    description: text("description").notNull(),
    descriptionUrdu: text("description_urdu").notNull(),
    displayOrder: integer("display_order").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("madrassa_categories_active_idx").on(table.active)],
);

export const madrassaSubcategories = pgTable(
  "madrassa_subcategories",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => madrassaCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    rollPrefix: text("roll_prefix").notNull(),
    darja: text("darja"),
    govtEquivalent: text("govt_equivalent"),
    durationYears: integer("duration_years"),
    fee: integer("fee"),
    displayOrder: integer("display_order").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("madrassa_subcategories_category_idx").on(table.categoryId),
    index("madrassa_subcategories_darja_idx").on(table.darja),
    index("madrassa_subcategories_active_idx").on(table.active),
  ],
);

export const institutionRelations = relations(institutions, ({ many }) => ({
  programs: many(programs),
}));

export const programRelations = relations(programs, ({ one }) => ({
  institution: one(institutions, {
    fields: [programs.institutionId],
    references: [institutions.id],
  }),
}));

export const schoolClassRelations = relations(schoolClasses, ({ many }) => ({
  sections: many(schoolClassSections),
}));

export const schoolClassSectionRelations = relations(schoolClassSections, ({ one }) => ({
  class: one(schoolClasses, {
    fields: [schoolClassSections.classId],
    references: [schoolClasses.id],
  }),
}));

export const madrassaCategoryRelations = relations(madrassaCategories, ({ many }) => ({
  subcategories: many(madrassaSubcategories),
}));

export const madrassaSubcategoryRelations = relations(madrassaSubcategories, ({ one }) => ({
  category: one(madrassaCategories, {
    fields: [madrassaSubcategories.categoryId],
    references: [madrassaCategories.id],
  }),
}));
