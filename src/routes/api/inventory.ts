import { createFileRoute } from "@tanstack/react-router";
import {
  deleteInventoryItem,
  getInventoryItems,
  getInventorySummary,
  saveInventoryItem,
} from "@/lib/server/inventory/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/inventory")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const items = await getInventoryItems();
          const summary = getInventorySummary(items);
          return json({ items, summary });
        } catch (error) {
          return errorResponse(error, "Could not load inventory");
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const rawName = body?.name ? String(body.name).trim() : "";
          const rawNameUrdu = body?.nameUrdu ? String(body.nameUrdu).trim() : "";

          if (!rawName && !rawNameUrdu) {
            return json({ error: "Item name is required" }, 400);
          }

          const name = rawName || rawNameUrdu;
          const nameUrdu = rawNameUrdu || rawName;

          const item = {
            id: String(body.id || `inv-${Date.now()}`),
            name,
            nameUrdu,
            category: String(body.category || "Stationery").trim(),
            quantity: Math.max(0, Number(body.quantity ?? 1)),
            unit: String(body.unit || "pcs").trim(),
            type: (body.type || "purchased") as "purchased" | "donated" | "gift",
            value: Math.max(0, Number(body.value ?? 0)),
            lowStockThreshold: Math.max(0, Number(body.lowStockThreshold ?? 5)),
          };

          const saved = await saveInventoryItem(item);
          const currentItems = await getInventoryItems();
          const summary = getInventorySummary(currentItems);
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
          await deleteInventoryItem(id);
          const currentItems = await getInventoryItems();
          const summary = getInventorySummary(currentItems);
          return json({ success: true, summary });
        } catch (error) {
          return errorResponse(error, "Could not delete inventory item");
        }
      },
    },
  },
});
