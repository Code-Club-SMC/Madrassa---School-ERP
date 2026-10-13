import { createFileRoute } from "@tanstack/react-router";
import {
  parseJsonBody,
  recoverSuperAdminPassword,
  recoverSuperAdminSchema,
  requireSetupToken,
} from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

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
          return errorResponse(error, "سپر ایڈمن پاس ورڈ بحال نہیں ہو سکا · Could not recover super admin");
        }
      },
    },
  },
});
