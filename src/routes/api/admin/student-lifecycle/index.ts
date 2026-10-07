import { createFileRoute } from "@tanstack/react-router";
import { searchStudentsForLifecycle } from "@/lib/server/students/lifecycle-service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admin/student-lifecycle/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") ?? undefined;
        const system = url.searchParams.get("system") ?? undefined;
        const status = url.searchParams.get("status") ?? undefined;
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

        try {
          const students = await searchStudentsForLifecycle(request, { q, system, status, limit });
          return json({ students });
        } catch (error) {
          return errorResponse(error, "Could not search students");
        }
      },
    },
  },
});

