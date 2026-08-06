import { createFileRoute } from "@tanstack/react-router";
import { getMyGuardianDashboard } from "@/lib/server/guardians/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/parents/me/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json(await getMyGuardianDashboard(request));
        } catch (error) {
          return errorResponse(error, "Could not load guardian dashboard");
        }
      },
    },
  },
});
