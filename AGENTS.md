# AGENTS.md

## Package Manager
Uses **pnpm** (not npm or yarn). All commands must use `pnpm`.

## Commands
```bash
pnpm install          # Install dependencies
pnpm run start:dev    # Watch mode (auto-reload)
pnpm run start:prod   # Production (run dist/main)
pnpm run build        # Compile TypeScript to dist/
pnpm run lint         # ESLint + fix
pnpm run format       # Prettier format
pnpm test             # Unit tests (Jest, rootDir: src, *.spec.ts)
pnpm run test:watch   # Jest watch mode
pnpm run test:cov     # Coverage report
pnpm run test:e2e     # E2E tests (test/jest-e2e.json)
pnpm run seed         # Seed initial admin user (requires SEED_ADMIN_* env vars)
```

Run before committing/pushing: `pnpm run lint && pnpm run format && pnpm test`.

## Architecture, stack, conventions

See [CLAUDE.md](./CLAUDE.md) for the full picture, and [docs/](./docs/) (`architecture.md`, `database.md`, `api.md`) for detail. Don't duplicate that content here — keep this file as a pointer.
