import { createFileRoute } from "@tanstack/react-router";
import {
  deleteInventoryItem,
  getInventorySummary,
  listInventoryItems,
  saveInventoryItem,
} from "@/lib/server/inventory/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/inventory")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const items = listInventoryItems();
          const summary = getInventorySummary();
          return json({ items, summary });
        } catch (error) {
          return errorResponse(error, "Could not load inventory");
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          if (!body || !body.name) {
            return json({ error: "Item name is required" }, 400);
          }
          const item = {
            id: String(body.id || `inv-${Date.now()}`),
            name: String(body.name || "").trim(),
            nameUrdu: String(body.nameUrdu || body.name || "").trim(),
            category: String(body.category || "Stationery").trim(),
            quantity: Number(body.quantity || 1),
            unit: String(body.unit || "pcs").trim(),
            type: (body.type || "purchased") as "purchased" | "donated" | "gift",
            value: Number(body.value || 0),
            lowStockThreshold: Number(body.lowStockThreshold || 5),
          };
          const saved = saveInventoryItem(item);
          const summary = getInventorySummary();
          return json({ success: true, item: saved, summary }, 201);
        } catch (error) {
          return errorResponse(error, "Could not save inventory item");
        }
      },
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) return json({ error: "Missing item id" }, 400);
          deleteInventoryItem(id);
          const summary = getInventorySummary();
          return json({ success: true, summary });
        } catch (error) {
          return errorResponse(error, "Could not delete inventory item");
        }
      },
    },
  },
});
