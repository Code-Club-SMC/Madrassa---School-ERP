import { describe, expect, it } from "bun:test";
import {
  ensureInventoryLoaded,
  getInventoryItems,
  listInventoryItems,
  getInventorySummary,
  saveInventoryItem,
  deleteInventoryItem,
  deleteAllInventoryItems,
  resetInventoryToDefaults,
} from "./service";

describe("Inventory Service Persistence and Summary", () => {
  it("loads inventory items with default seed or persisted data", async () => {
    const items = await ensureInventoryLoaded();
    expect(Array.isArray(items)).toBe(true);
  });

  it("fetches async inventory items cleanly", async () => {
    const items = await getInventoryItems();
    expect(Array.isArray(items)).toBe(true);
  });

  it("calculates inventory summary accurately", () => {
    const summary = getInventorySummary();
    expect(typeof summary.totalItems).toBe("number");
    expect(typeof summary.totalValue).toBe("number");
    expect(typeof summary.purchasedValue).toBe("number");
    expect(typeof summary.totalUnits).toBe("number");
  });

  it("saves a new inventory item and updates summary", async () => {
    const testItem = {
      id: "inv-test-persist-1",
      name: "Whiteboard Markers Pack",
      nameUrdu: "وائٹ بورڈ مارکر پیک",
      category: "Stationery",
      quantity: 15,
      unit: "packs",
      type: "purchased" as const,
      value: 7500,
      lowStockThreshold: 5,
    };

    const saved = await saveInventoryItem(testItem);
    expect(saved.id).toBe("inv-test-persist-1");

    const items = listInventoryItems();
    const found = items.find((i) => i.id === "inv-test-persist-1");
    expect(found).toBeDefined();
    expect(found?.name).toBe("Whiteboard Markers Pack");
    expect(found?.value).toBe(7500);

    // Update the item
    const updatedItem = {
      ...testItem,
      quantity: 20,
      value: 10000,
    };
    await saveInventoryItem(updatedItem);
    const updatedFound = listInventoryItems().find((i) => i.id === "inv-test-persist-1");
    expect(updatedFound?.quantity).toBe(20);
    expect(updatedFound?.value).toBe(10000);

    // Delete the item to clean up
    const deleted = await deleteInventoryItem("inv-test-persist-1");
    expect(deleted).toBe(true);

    const itemsAfterDelete = listInventoryItems();
    expect(itemsAfterDelete.some((i) => i.id === "inv-test-persist-1")).toBe(false);
  });

  it("resets and clears inventory properly without unwanted resurrection", async () => {
    // Reset to defaults
    const defaults = await resetInventoryToDefaults();
    expect(defaults.length).toBe(8);

    const afterReset = await getInventoryItems();
    expect(afterReset.length).toBe(8);

    // Delete all items
    const cleared = await deleteAllInventoryItems();
    expect(cleared).toBe(true);

    // Verify it stays 0 and does NOT re-seed on next query
    const afterClear = await getInventoryItems();
    expect(afterClear.length).toBe(0);

    const summary = getInventorySummary(afterClear);
    expect(summary.totalItems).toBe(0);
    expect(summary.totalValue).toBe(0);

    // Restore defaults for application usage
    await resetInventoryToDefaults();
    const restored = await getInventoryItems();
    expect(restored.length).toBe(8);
  }, 15000);
});

