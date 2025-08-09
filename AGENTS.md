# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Turborepo. Workspaces: `apps/*`, `packages/*`, `tooling/*`, `scripts/`.
- Web app and workers live in `apps/` (e.g., `apps/web`, `apps/opennext-cache`).
- Reusable libraries live in `packages/` (e.g., `packages/api`, `packages/db`, `packages/ui`).
- Environment examples in `.env.example`; copy and adapt to `.env.local`.

## Build, Test, and Development Commands
- Install deps: `bun install` (requires Node >= 24, Bun 1.2+).
- Dev (all apps): `bun run dev`; Web-only: `bun run dev:web`.
- Build all: `bun run build`; Type checks: `bun run typecheck`.
- Format check/fix: `bun run format` / `bun run format:fix`.
- Lint check/fix: `bun run lint` / `bun run lint:fix`.
- DB workflows: `bun run migration:generate`, `bun run migration:local`, `bun run studio:dev`.
- Preview/Deploy (Cloudflare): `bun run preview`, `bun run deploy`.
- Tests across workspaces (if defined): `turbo test` (or run per package).

## Coding Style & Naming Conventions
- Formatter/Linter: Biome (see `biome.json`).
- Indentation: 2 spaces; line width: 100; quotes: single; semicolons: as needed; trailing commas: ES5.
- TypeScript-first; keep strict types and meaningful names.
- Prefer feature-oriented folders; test files near code or under `__tests__/`.
- Zod v4 only: `import { z } from 'zod/v4'`.

## Testing Guidelines
- Framework: Vitest. Typical locations: `__tests__/` or `*.test.ts` adjacent to source.
- Run all: `turbo test`; per package: `bun test` (from that workspace) or package-specific scripts.
- Name tests `*.test.ts`; add integration tests where behavior spans modules.
- Aim for reliable, isolated tests; include minimal setup files when needed.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`; optional scope (e.g., `feat(web): ...`).
- PRs must include: concise description, linked issues (`#123`), screenshots for UI, and passing checks (build, typecheck, lint, tests).
- Keep changes scoped; update docs and `.env.example` when config changes.

## Security & Configuration Tips
- Never commit secrets; use `.env.local` for local-only settings.
- Validate env at runtime (see `@t3-oss/env-nextjs` usage in the repo).
- For DB changes, always generate migrations and run locally before PR.
