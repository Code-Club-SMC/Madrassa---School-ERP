import { createFileRoute } from "@tanstack/react-router";
import { getStudentLifecycleArchive } from "@/lib/server/students/lifecycle-service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admin/student-lifecycle/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const archive = await getStudentLifecycleArchive(request, params.id);
          return json(archive);
        } catch (error) {
          return errorResponse(error, "Could not load student educational life archive");
        }
      },
    },
  },
});

