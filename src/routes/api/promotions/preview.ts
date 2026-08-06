import { createFileRoute } from "@tanstack/react-router";
import { createPromotionPreview, promotionPreviewSchema } from "@/lib/server/promotions/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/promotions/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, promotionPreviewSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createPromotionPreview(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create promotion preview");
        }
      },
    },
  },
});
