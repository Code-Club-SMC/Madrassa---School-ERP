import { createFileRoute } from "@tanstack/react-router";
import {
  bootstrapSuperAdminSchema,
  createFirstSuperAdmin,
  json,
  parseJsonBody,
  requireSetupToken,
} from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/setup/super-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const tokenError = requireSetupToken(request, "setup");
        if (tokenError) return tokenError;

        const body = await parseJsonBody(request, bootstrapSuperAdminSchema);
        if (!body.ok) return body.response;

        try {
          return await createFirstSuperAdmin(body.data);
        } catch (error) {
          return json({ error: error instanceof Error ? error.message : "Could not create super admin" }, 500);
        }
      },
    },
  },
});
