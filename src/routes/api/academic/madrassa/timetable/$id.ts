import { createFileRoute } from "@tanstack/react-router";
import { deleteTimetablePeriod, timetablePeriodUpdateSchema, updateTimetablePeriod } from "@/lib/server/academic/timetable";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/timetable/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, timetablePeriodUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json({ period: await updateTimetablePeriod(request, params.id, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not update timetable period");
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          return json(await deleteTimetablePeriod(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not delete timetable period");
        }
      },
    },
  },
});
