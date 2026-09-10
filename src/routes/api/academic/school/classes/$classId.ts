import { createFileRoute } from "@tanstack/react-router";
import { deleteSchoolClass } from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/classes/$classId")({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const classId = url.pathname.split("/").pop() || "";
          await deleteSchoolClass(request, classId);
          return json({ success: true });
        } catch (error) {
          return errorResponse(error, "Could not delete school class");
        }
      },
    },
  },
});
