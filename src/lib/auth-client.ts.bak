import { createAuthClient } from "better-auth/react";
import { adminClient, usernameClient } from "better-auth/client/plugins";
import { authAc, authRoles } from "@/lib/auth-permissions";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    adminClient({
      ac: authAc,
      roles: authRoles,
    }),
  ],
});
