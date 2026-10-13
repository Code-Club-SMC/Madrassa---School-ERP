import { createFileRoute } from "@tanstack/react-router";
import {
  bootstrapSuperAdminSchema,
  createFirstSuperAdmin,
  parseJsonBody,
  requireSetupToken,
} from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

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
          return errorResponse(error, "سپر ایڈمن اکاؤنٹ بنانے میں خرابی پیش آئی · Could not create super admin");
        }
      },
    },
  },
});
