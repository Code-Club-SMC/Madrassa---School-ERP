import { createFileRoute } from "@tanstack/react-router";
import {
  deleteSchoolTimetablePeriod,
  updateSchoolTimetablePeriod,
  schoolTimetablePeriodUpdateSchema,
} from "@/lib/server/academic/school-timetable";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/timetable/$periodId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, schoolTimetablePeriodUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json({ period: await updateSchoolTimetablePeriod(request, params.periodId, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not update timetable period");
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          await deleteSchoolTimetablePeriod(request, params.periodId);
          return json({ success: true });
        } catch (error) {
          return errorResponse(error, "Could not delete timetable period");
        }
      },
    },
  },
});
