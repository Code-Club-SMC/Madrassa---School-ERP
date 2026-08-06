import { createFileRoute } from "@tanstack/react-router";
import {
  setTeacherActiveState,
  teacherActiveStateSchema,
} from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/$id/active")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, teacherActiveStateSchema);
        if (!body.ok) return body.response;

        try {
          return json(await setTeacherActiveState(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update teacher active state");
        }
      },
    },
  },
});
