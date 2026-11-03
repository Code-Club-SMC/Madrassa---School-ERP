import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const inventoryItems = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameUrdu: text("name_urdu").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("pcs"),
  type: text("type").notNull().default("purchased"), // 'purchased' | 'donated' | 'gift'
  value: integer("value").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DbInventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

