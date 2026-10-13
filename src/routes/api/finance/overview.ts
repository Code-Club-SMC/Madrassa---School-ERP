import { createFileRoute } from "@tanstack/react-router";
import { getFinanceOverview } from "@/lib/server/finance/overview";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/finance/overview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const overview = await getFinanceOverview(request);
          return json(overview);
        } catch (error) {
          return errorResponse(error, "Could not load finance overview");
        }
      },
    },
  },
});

