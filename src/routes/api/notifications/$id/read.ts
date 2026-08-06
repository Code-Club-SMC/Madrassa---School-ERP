import { createFileRoute } from "@tanstack/react-router";
import {
  markNotificationRead,
  notificationReadPatchSchema,
} from "@/lib/server/notifications/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/notifications/$id/read")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, notificationReadPatchSchema);
        if (!body.ok) return body.response;

        try {
          return json(await markNotificationRead(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update notification read state");
        }
      },
    },
  },
});
