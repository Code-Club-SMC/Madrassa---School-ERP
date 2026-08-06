import { createFileRoute } from "@tanstack/react-router";
import {
  createMadrassaCategory,
  listMadrassaCategories,
  madrassaCategoryInputSchema,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/categories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json({ categories: await listMadrassaCategories(request) });
        } catch (error) {
          return errorResponse(error, "Could not load madrassa categories");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, madrassaCategoryInputSchema);
        if (!body.ok) return body.response;

        try {
          return json({ category: await createMadrassaCategory(request, body.data) }, 201);
        } catch (error) {
          return errorResponse(error, "Could not create madrassa category");
        }
      },
    },
  },
});
