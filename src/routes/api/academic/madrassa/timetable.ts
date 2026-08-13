import { createFileRoute } from "@tanstack/react-router";
import { listTimetablePeriods, timetablePeriodInputSchema, createTimetablePeriod } from "@/lib/server/academic/timetable";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/timetable")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const subcategoryId = url.searchParams.get("subcategoryId");
          if (!subcategoryId) {
            return json({ error: "subcategoryId is required" }, 400);
          }
          return json({ periods: await listTimetablePeriods(request, subcategoryId) });
        } catch (error) {
          return errorResponse(error, "Could not load timetable");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, timetablePeriodInputSchema);
        if (!body.ok) return body.response;

        try {
          return json({ period: await createTimetablePeriod(request, body.data) }, 201);
        } catch (error) {
          return errorResponse(error, "Could not create timetable period");
        }
      },
    },
  },
});
