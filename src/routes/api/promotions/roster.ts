import { createFileRoute } from "@tanstack/react-router";
import { getPromotionRoster, promotionRosterQuerySchema } from "@/lib/server/promotions/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/promotions/roster")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = promotionRosterQuerySchema.safeParse({
          sourceAcademicYearId: url.searchParams.get("sourceAcademicYearId") ?? "",
          system: url.searchParams.get("system") ?? "school",
          institutionId: url.searchParams.get("institutionId") || undefined,
        });

        if (!parsed.success) {
          return json({ error: "Invalid roster query parameters", details: parsed.error.issues }, 400);
        }

        try {
          return json(await getPromotionRoster(request, parsed.data));
        } catch (error) {
          return errorResponse(error, "Could not load promotion roster");
        }
      },
    },
  },
});

