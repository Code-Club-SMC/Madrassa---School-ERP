import fs from "node:fs";
import path from "node:path";
import { inventoryItems as defaultItems, type InventoryItem } from "@/mock";

const DATA_FILE = path.join(process.cwd(), "public", "inventory-items.json");

let memoryInventory: InventoryItem[] | null = null;

function loadStoredItems(): InventoryItem[] {
  if (memoryInventory) return memoryInventory;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryInventory = parsed;
        return memoryInventory;
      }
    }
  } catch (err) {
    console.error("[InventoryService] Error reading inventory-items.json:", err);
  }

  // Fallback to initial seed items
  memoryInventory = [...defaultItems];
  saveItemsToFile(memoryInventory);
  return memoryInventory;
}

function saveItemsToFile(items: InventoryItem[]) {
  memoryInventory = items;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("[InventoryService] Error saving inventory-items.json:", err);
  }
}

export function listInventoryItems(): InventoryItem[] {
  return loadStoredItems();
}

export function getInventorySummary() {
  const items = loadStoredItems();
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

export function saveInventoryItem(item: InventoryItem): InventoryItem {
  const items = loadStoredItems();
  const index = items.findIndex((i) => i.id === item.id);
  let updated: InventoryItem[];
  if (index >= 0) {
    updated = items.map((x) => (x.id === item.id ? item : x));
  } else {
    updated = [item, ...items];
  }
  saveItemsToFile(updated);
  return item;
}

export function deleteInventoryItem(id: string): boolean {
  const items = loadStoredItems();
  const updated = items.filter((i) => i.id !== id);
  saveItemsToFile(updated);
  return true;
}
