import { createFileRoute } from "@tanstack/react-router";
import { listTimetableStatus } from "@/lib/server/academic/timetable";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/timetable/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const ids = url.searchParams.getAll("subcategoryId");
          if (ids.length === 0) {
            return json({ status: {} });
          }
          const status = await listTimetableStatus(request, ids);
          return json({ status: Object.fromEntries(status) });
        } catch (error) {
          return errorResponse(error, "Could not load timetable status");
        }
      },
    },
  },
});
