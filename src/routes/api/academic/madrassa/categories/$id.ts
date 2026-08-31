import { createFileRoute } from "@tanstack/react-router";
import {
  getMadrassaCategory,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/categories/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json({ category: await getMadrassaCategory(request, params.id) });
        } catch (error) {
          return errorResponse(error, "Could not load madrassa category");
        }
      },
    },
  },
});
