import { createFileRoute } from "@tanstack/react-router";
import {
  setTeacherTimetablePeriodActive,
  teacherActiveStateSchema,
  updateTeacherTimetablePeriod,
  updateTeacherTimetablePeriodSchema,
} from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/$id/timetable/$periodId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateTeacherTimetablePeriodSchema);
        if (!body.ok) return body.response;

        try {
          return json(await updateTeacherTimetablePeriod(request, params.id, params.periodId, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update teacher timetable period");
        }
      },
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, teacherActiveStateSchema);
        if (!body.ok) return body.response;

        try {
          return json(await setTeacherTimetablePeriodActive(request, params.id, params.periodId, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update teacher timetable period active state");
        }
      },
    },
  },
});
