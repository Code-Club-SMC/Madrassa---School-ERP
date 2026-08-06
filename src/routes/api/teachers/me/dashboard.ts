import { createFileRoute } from "@tanstack/react-router";
import { getMyTeacherDashboard } from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/me/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json(await getMyTeacherDashboard(request));
        } catch (error) {
          return errorResponse(error, "Could not load teacher dashboard");
        }
      },
    },
  },
});
