import { createFileRoute } from "@tanstack/react-router";
import { removeStudentSibling } from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id/siblings/$siblingId")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        try {
          return json(await removeStudentSibling(request, params.id, params.siblingId));
        } catch (error) {
          return errorResponse(error, "Could not remove sibling link");
        }
      },
    },
  },
});
