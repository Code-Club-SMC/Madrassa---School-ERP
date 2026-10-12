import { createFileRoute } from "@tanstack/react-router";
import { getDashboardData, type DashboardFilter } from "@/lib/server/dashboard/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const filter = (url.searchParams.get("filter") || "all") as DashboardFilter;
          const data = await getDashboardData(request, filter);
          return json(data);
        } catch (error) {
          return errorResponse(error, "Could not load dashboard data");
        }
      },
    },
  },
});

