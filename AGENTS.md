# Repository Guidelines

## Project Structure & Module Organization

This is a TanStack Start + React + TypeScript app. Main application code lives in `src/`. File-based routes are in `src/routes/`, shared UI primitives are in `src/components/ui/`, feature components are grouped under `src/components/` and `src/features/`, and reusable logic is in `src/lib/`, `src/hooks/`, and `src/stores/`. Database code uses Drizzle: schema files are in `src/db/`, migration output is in `drizzle/`, and configuration is in `drizzle.config.ts`. Static assets, including admission form PDFs and generated print templates, live in `public/`.

## Build, Test, and Development Commands

- `bun run dev` starts Vite on `localhost:3000` with `strictPort`.
- `bun run build` creates a production build and validates route/type integration.
- `bun run preview` previews the built app.
- `bun run lint` runs ESLint across the repo.
- `bun run format` formats files with Prettier.
- `bun run db:generate` creates Drizzle migrations from schema changes.
- `bun run db:migrate` applies migrations.
- `bun run db:studio` opens Drizzle Studio.
- `bun run auth:generate` regenerates Better Auth Drizzle schema output.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Prefer existing shadcn/Radix UI primitives and local helpers before adding new abstractions. Keep route files readable and organized by folder under `src/routes/`, using TanStack file-route conventions. Use `@/` imports for source aliases. Components use PascalCase, hooks use `useSomething`, and utility files use kebab-case or descriptive lower-case names. Formatting is handled by Prettier; lint rules are defined in `eslint.config.js`.

## Testing Guidelines

No test runner or test script is currently configured. Until one is added, verify changes with `bun run build` and `bun run lint`. For new tests, colocate them near the code as `*.test.ts` or `*.test.tsx`, and focus on routing, auth/session behavior, database logic, and form workflows.

## Commit & Pull Request Guidelines

Recent history uses short messages such as `Changes` and `Added print to admission forms`; prefer more specific imperative messages, for example `Add template-backed admission printing`. Pull requests should include a concise summary, verification commands run, linked issues when applicable, and screenshots for UI or print-output changes.

## Security & Configuration Tips

Keep secrets in `.env`; do not commit real `DATABASE_URL`, `BETTER_AUTH_SECRET`, or setup tokens. Use `docker-compose.yml` for local Postgres and keep Drizzle migrations committed when schema changes are intentional.
