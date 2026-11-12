import fs from "node:fs";
import path from "node:path";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems as dbInventoryItems } from "@/db/schema/inventory";
import { inventoryItems as defaultItems, type InventoryItem } from "@/mock";

function getDataFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "inventory-items.json"),
    path.join(process.cwd(), ".output", "public", "inventory-items.json"),
  ];
}

let memoryInventory: InventoryItem[] | null = null;
let dbSyncAttempted = false;

function readFromFile(): InventoryItem[] | null {
  for (const filePath of getDataFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as InventoryItem[];
        }
      }
    } catch {
      // try next file path
    }
  }
  return null;
}

function writeToFile(items: InventoryItem[]) {
  for (const filePath of getDataFilePaths()) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
    } catch {
      // ignore write error for read-only or nonexistent secondary directories
    }
  }
}

export async function ensureInventoryLoaded(): Promise<InventoryItem[]> {
  try {
    const rows = await db
      .select()
      .from(dbInventoryItems)
      .orderBy(desc(dbInventoryItems.createdAt));

    if (rows && rows.length > 0) {
      const mapped: InventoryItem[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameUrdu: r.nameUrdu,
        category: r.category,
        quantity: r.quantity,
        unit: r.unit,
        type: r.type as InventoryItem["type"],
        value: r.value,
        lowStockThreshold: r.lowStockThreshold,
      }));
      memoryInventory = mapped;
      writeToFile(mapped);
      dbSyncAttempted = true;
      return mapped;
    }

    // Database table is empty: seed default items into DB and files
    const fromFile = readFromFile();
    const seeded = fromFile && fromFile.length > 0 ? fromFile : [...defaultItems];
    for (const item of seeded) {
      await db
        .insert(dbInventoryItems)
        .values({
          id: item.id,
          name: item.name,
          nameUrdu: item.nameUrdu,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          type: item.type,
          value: item.value,
          lowStockThreshold: item.lowStockThreshold,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .catch(() => {});
    }
    memoryInventory = seeded;
    writeToFile(seeded);
    dbSyncAttempted = true;
    return seeded;
  } catch (err) {
    // Database connection offline or failed; fallback to file or defaults
    if (!memoryInventory) {
      const fromFile = readFromFile();
      memoryInventory = fromFile ?? [...defaultItems];
    }
    return memoryInventory;
  }
}

// Background warmup of inventory on process launch
if (!dbSyncAttempted) {
  ensureInventoryLoaded().catch(() => {});
}

function loadStoredItemsSync(): InventoryItem[] {
  if (memoryInventory && memoryInventory.length > 0) {
    return memoryInventory;
  }
  const fromFile = readFromFile();
  if (fromFile && fromFile.length > 0) {
    memoryInventory = fromFile;
    return memoryInventory;
  }
  memoryInventory = [...defaultItems];
  writeToFile(memoryInventory);
  return memoryInventory;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const rows = await db
      .select()
      .from(dbInventoryItems)
      .orderBy(desc(dbInventoryItems.createdAt));

    if (rows && rows.length > 0) {
      const mapped: InventoryItem[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameUrdu: r.nameUrdu,
        category: r.category,
        quantity: r.quantity,
        unit: r.unit,
        type: r.type as InventoryItem["type"],
        value: r.value,
        lowStockThreshold: r.lowStockThreshold,
      }));
      memoryInventory = mapped;
      writeToFile(mapped);
      return mapped;
    }

    // Table is empty, seed and return
    return await ensureInventoryLoaded();
  } catch (err) {
    console.warn("[InventoryService] Failed to query items from DB, falling back to cache/file:", err);
    return loadStoredItemsSync();
  }
}

export function listInventoryItems(): InventoryItem[] {
  return loadStoredItemsSync();
}

export function getInventorySummary(customItems?: InventoryItem[]) {
  const items = customItems ?? loadStoredItemsSync();
  const totalValue = items.reduce((acc, it) => acc + (it.value || 0), 0);
  const purchasedValue = items
    .filter((it) => it.type === "purchased")
    .reduce((acc, it) => acc + (it.value || 0), 0);
  const donatedValue = items
    .filter((it) => it.type === "donated" || it.type === "gift")
    .reduce((acc, it) => acc + (it.value || 0), 0);
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const lowStockCount = items.filter((it) => it.quantity <= it.lowStockThreshold).length;

  return {
    totalItems: items.length,
    totalUnits,
    totalValue,
    purchasedValue,
    donatedValue,
    lowStockCount,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      nameUrdu: item.nameUrdu,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      value: item.value,
      type: item.type,
      lowStockThreshold: item.lowStockThreshold,
      lowStock: item.quantity <= item.lowStockThreshold,
    })),
  };
}

export async function saveInventoryItem(item: InventoryItem): Promise<InventoryItem> {
  // 1. Persist directly to PostgreSQL database
  try {
    await db
      .insert(dbInventoryItems)
      .values({
        id: item.id,
        name: item.name,
        nameUrdu: item.nameUrdu,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        type: item.type,
        value: item.value,
        lowStockThreshold: item.lowStockThreshold,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: dbInventoryItems.id,
        set: {
          name: item.name,
          nameUrdu: item.nameUrdu,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          type: item.type,
          value: item.value,
          lowStockThreshold: item.lowStockThreshold,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[InventoryService] Failed to persist item to DB:", err);
  }

  // 2. Concurrently update memory and file backup
  const current = loadStoredItemsSync();
  const index = current.findIndex((i) => i.id === item.id);
  const updated = index >= 0 ? current.map((x) => (x.id === item.id ? item : x)) : [item, ...current];
  memoryInventory = updated;
  writeToFile(updated);

  return item;
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  // 1. Delete from PostgreSQL database
  try {
    await db.delete(dbInventoryItems).where(eq(dbInventoryItems.id, id));
  } catch (err) {
    console.error("[InventoryService] Failed to delete item from DB:", err);
  }

  // 2. Concurrently update memory and file backup
  const current = loadStoredItemsSync();
  const updated = current.filter((i) => i.id !== id);
  memoryInventory = updated;
  writeToFile(updated);

  return true;
}
