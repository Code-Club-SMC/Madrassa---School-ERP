import fs from "node:fs";
import path from "node:path";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems as dbInventoryItems } from "@/db/schema/inventory";
import { inventoryItems as defaultItems, type InventoryItem } from "@/mock";

function getDataFilePaths(): string[] {
  return [
    path.join("/tmp", "inventory-items.json"),
    path.join(process.cwd(), "public", "inventory-items.json"),
  ];
}

let memoryInventory: InventoryItem[] | null = null;

function readFromFile(): InventoryItem[] | null {
  for (const filePath of getDataFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
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
      // ignore write error for read-only filesystem
    }
  }
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const rows = await db
      .select()
      .from(dbInventoryItems)
      .orderBy(desc(dbInventoryItems.createdAt));

    const mapped: InventoryItem[] = (rows || []).map((r) => ({
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
  } catch (err) {
    console.warn("[InventoryService] Failed to query items from DB, falling back to cache/file:", err);
    return loadStoredItemsSync();
  }
}

export async function ensureInventoryLoaded(): Promise<InventoryItem[]> {
  return await getInventoryItems();
}

export function listInventoryItems(): InventoryItem[] {
  return loadStoredItemsSync();
}

function loadStoredItemsSync(): InventoryItem[] {
  if (memoryInventory !== null) {
    return memoryInventory;
  }
  const fromFile = readFromFile();
  if (fromFile !== null) {
    memoryInventory = fromFile;
    return memoryInventory;
  }
  memoryInventory = [];
  return memoryInventory;
}

export function getInventorySummary(customItems?: InventoryItem[]) {
  const items = customItems ?? loadStoredItemsSync();
  const totalValue = items.reduce((acc, it) => acc + (Number(it.value) || 0), 0);
  const purchasedValue = items
    .filter((it) => it.type === "purchased")
    .reduce((acc, it) => acc + (Number(it.value) || 0), 0);
  const donatedValue = items
    .filter((it) => it.type === "donated" || it.type === "gift")
    .reduce((acc, it) => acc + (Number(it.value) || 0), 0);
  const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const lowStockCount = items.filter((it) => (Number(it.quantity) || 0) <= (Number(it.lowStockThreshold) || 0)).length;

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
      lowStock: Number(item.quantity) <= Number(item.lowStockThreshold),
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
  const current = memoryInventory !== null ? memoryInventory : loadStoredItemsSync();
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
  const current = memoryInventory !== null ? memoryInventory : loadStoredItemsSync();
  const updated = current.filter((i) => i.id !== id);
  memoryInventory = updated;
  writeToFile(updated);

  return true;
}

export async function deleteAllInventoryItems(): Promise<boolean> {
  // 1. Delete all from PostgreSQL database
  try {
    await db.delete(dbInventoryItems);
  } catch (err) {
    console.error("[InventoryService] Failed to clear items from DB:", err);
  }

  // 2. Clear memory and file backup
  memoryInventory = [];
  writeToFile([]);

  return true;
}

export async function resetInventoryToDefaults(): Promise<InventoryItem[]> {
  try {
    await db.delete(dbInventoryItems);
    if (defaultItems.length > 0) {
      await db.insert(dbInventoryItems).values(
        defaultItems.map((item) => ({
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
        }))
      );
    }
  } catch (err) {
    console.error("[InventoryService] Failed to reset items in DB:", err);
  }

  memoryInventory = [...defaultItems];
  writeToFile(memoryInventory);
  return memoryInventory;
}
