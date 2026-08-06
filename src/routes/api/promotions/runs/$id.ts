import { createFileRoute } from "@tanstack/react-router";
import { getPromotionRun } from "@/lib/server/promotions/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/promotions/runs/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getPromotionRun(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not load promotion run");
        }
      },
    },
  },
});
