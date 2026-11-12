import { describe, expect, it } from "bun:test";
import {
  ensureInventoryLoaded,
  getInventoryItems,
  listInventoryItems,
  getInventorySummary,
  saveInventoryItem,
  deleteInventoryItem,
} from "./service";

describe("Inventory Service Persistence and Summary", () => {
  it("loads inventory items with default seed or persisted data", async () => {
    const items = await ensureInventoryLoaded();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(8);
  });

  it("fetches async inventory items cleanly", async () => {
    const items = await getInventoryItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(8);
  });

  it("calculates inventory summary accurately", () => {
    const summary = getInventorySummary();
    expect(summary.totalItems).toBeGreaterThanOrEqual(8);
    expect(summary.totalValue).toBeGreaterThan(0);
    expect(summary.purchasedValue).toBeGreaterThan(0);
    expect(summary.totalUnits).toBeGreaterThan(0);
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
});

