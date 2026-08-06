import { createFileRoute } from "@tanstack/react-router";
import {
  setTeacherAssignmentActive,
  teacherActiveStateSchema,
  updateTeacherAssignment,
  updateTeacherAssignmentSchema,
} from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/$id/assignments/$assignmentId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateTeacherAssignmentSchema);
        if (!body.ok) return body.response;

        try {
          return json(await updateTeacherAssignment(request, params.id, params.assignmentId, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update teacher assignment");
        }
      },
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, teacherActiveStateSchema);
        if (!body.ok) return body.response;

        try {
          return json(await setTeacherAssignmentActive(request, params.id, params.assignmentId, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update teacher assignment active state");
        }
      },
    },
  },
});
