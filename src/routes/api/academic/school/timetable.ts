import { createFileRoute } from "@tanstack/react-router";
import {
  createSchoolTimetablePeriod,
  deleteSchoolTimetablePeriod,
  listSchoolTimetablePeriods,
  schoolTimetablePeriodInputSchema,
  schoolTimetablePeriodUpdateSchema,
} from "@/lib/server/academic/school-timetable";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/timetable")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const schoolClassId = url.searchParams.get("schoolClassId");
        if (!schoolClassId) {
          return json({ error: "schoolClassId is required" }, 400);
        }

        try {
          const periods = await listSchoolTimetablePeriods(request, schoolClassId);
          return json({ periods });
        } catch (error) {
          return errorResponse(error, "Could not load school timetable");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, schoolTimetablePeriodInputSchema);
        if (!body.ok) return body.response;

        try {
          return json({ period: await createSchoolTimetablePeriod(request, body.data) }, 201);
        } catch (error) {
          return errorResponse(error, "Could not create timetable period");
        }
      },
    },
  },
});
