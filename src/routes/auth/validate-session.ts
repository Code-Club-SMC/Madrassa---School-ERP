import { createFileRoute, redirect } from "@tanstack/react-router";
import { hasAnyRole, staffRoles, toAppUser } from "@/lib/auth-session";
import { validateToken } from "@/lib/auth-token";

export const Route = createFileRoute("/auth/validate-session")({
  server: {
    handlers: {
      GET: async () => {
        const token = await getAuthTokenFromRequest();
        if (!token) {
          return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        const result = await validateToken(token);
        if (!result) {
          return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        const user = toAppUser(result.user);
        if (!hasAnyRole(user, [...staffRoles, "parent"])) {
          return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ user: result.user }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});

async function getAuthTokenFromRequest(): Promise<string | null> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = cookieHeader.split("; ").reduce((acc, cookie) => {
      const [key, ...rest] = cookie.split("=");
      acc[key] = rest.join("=");
      return acc;
    }, {} as Record<string, string>);
    return cookies["msmis_auth_token"] ?? null;
  } catch {
    return null;
  }
}
