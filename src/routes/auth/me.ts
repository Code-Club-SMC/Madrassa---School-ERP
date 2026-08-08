import { createFileRoute } from "@tanstack/react-router";
import { validateToken } from "@/lib/auth-token";

export const Route = createFileRoute("/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
        if (!token) {
          const cookieToken =
            request.headers.get("cookie")
              ?.split("; ")
              .find((c) => c.startsWith("msmis_auth_token="))
              ?.split("=")[1] ?? null;
          if (!cookieToken) {
            return new Response(JSON.stringify({ user: null }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          const result = await validateToken(cookieToken);
          if (!result) {
            return new Response(JSON.stringify({ user: null }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ user: result.user }), {
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

        return new Response(JSON.stringify({ user: result.user }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
