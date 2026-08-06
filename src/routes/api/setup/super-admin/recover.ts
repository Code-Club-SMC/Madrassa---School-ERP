import { createFileRoute } from "@tanstack/react-router";
import {
  json,
  parseJsonBody,
  recoverSuperAdminPassword,
  recoverSuperAdminSchema,
  requireSetupToken,
} from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/setup/super-admin/recover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const tokenError = requireSetupToken(request, "recovery");
        if (tokenError) return tokenError;

        const body = await parseJsonBody(request, recoverSuperAdminSchema);
        if (!body.ok) return body.response;

        try {
          return await recoverSuperAdminPassword(body.data);
        } catch (error) {
          return json({ error: error instanceof Error ? error.message : "Could not recover super admin" }, 500);
        }
      },
    },
  },
});
