import { createFileRoute } from "@tanstack/react-router";
import {
  json,
  parseJsonBody,
  updateCurrentSuperAdmin,
  updateSuperAdminSchema,
} from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admin/super-admin")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const body = await parseJsonBody(request, updateSuperAdminSchema);
        if (!body.ok) return body.response;

        try {
          return await updateCurrentSuperAdmin(request, body.data);
        } catch (error) {
          return json({ error: error instanceof Error ? error.message : "Could not update super admin" }, 500);
        }
      },
    },
  },
});
