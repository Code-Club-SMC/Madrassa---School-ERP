import { createFileRoute } from "@tanstack/react-router";
import { applyPromotionRun } from "@/lib/server/promotions/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/promotions/runs/$id/apply")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          return json(await applyPromotionRun(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not apply promotion run");
        }
      },
    },
  },
});
