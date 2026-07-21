# Roadmap

Deferred work, organized by risk. Each item's detail also lives in the relevant doc's **Known Gaps** section — this file adds sequencing and rationale. See [project-knowledge.md](./project-knowledge.md) for background.

## P1 — Correctness and production risk

These affect whether the app behaves correctly or can run safely in production. Do these before treating the boilerplate as production-ready.

- **Postgres has no migration path.** `postgres-database.module.ts` uses `synchronize: !isProd` only — no `DataSource`, no `migrations/` folder, no typeorm CLI scripts. In production (`synchronize: false`) there is no way to apply schema changes at all. Add a `DataSource` config + `typeorm migration:generate`/`run` scripts before anyone deploys on `DB_TYPE=postgres`. See `docs/database.md#known-gaps`.
- **No graceful shutdown.** `app.enableShutdownHooks()` is never called in `src/main.ts`, so `OnModuleDestroy` hooks (DB connections, in-flight requests) don't run on SIGTERM. The `uncaughtException`/`unhandledRejection` handlers also call `process.exit(1)` without `await app.close()`. Fix: capture `app` in a module-scoped variable, call `enableShutdownHooks()`, and await `app.close()` in the process handlers before exiting.
- **`SettingModule` breaks under `DB_TYPE=postgres`.** It unconditionally calls `MongooseModule.forFeature`. Either make it driver-aware like `HealthModule` (branch on `DB_TYPE` internally), or guard its import in `app.module.ts` the way `DatabaseModule` branches — until then, this boilerplate is not safely forkable for a Postgres-only project.

## P2 — Config hygiene

Low-risk but will confuse someone eventually.

- **`CACHE_EXPIRED_TIME` is `.required().default(300000)`** in `joi.validation.ts` — Joi's `.required()` wins, so the default is dead code and the var is silently mandatory. Either drop `.required()` or drop `.default(...)`; they contradict each other.
- **No `POSTGRES_*` vars are required when `DB_TYPE=postgres`.** An empty Postgres config currently passes Joi validation and only fails at connect time. Add a `Joi.when('DB_TYPE', { is: 'postgres', then: Joi.required() })` to the relevant vars, mirroring how `DB_URI` already does this for Mongo.
- **`docker-compose.yaml` credential mismatch** — see `docs/database.md#known-gaps`. Either rename the compose env vars to `POSTGRES_*` or add `DB_USER`/`DB_PASS`/`DB_NAME` to `.env-example` and read them consistently.

## P3 — Quality and infrastructure

Nice to have; not urgent for a boilerplate whose purpose is being forked and extended per-project.

- Replace `test/app.e2e-spec.ts` with a real e2e spec (or delete it) and add `moduleNameMapper` to `test/jest-e2e.json` so `src/...` imports resolve.
- Add a `coverageThreshold` to the jest config once there's more than one spec file to enforce it against.
- Add a CI workflow (`.github/workflows/`) running `pnpm run lint && pnpm run build && pnpm test` at minimum.
- Add an application `Dockerfile` — `docker-compose.yaml` currently only provisions local databases, not the app itself.
- Burn down the ~129-error lint baseline (see `project-knowledge.md#traps-for-a-new-contributor`), concentrated in `src/modules/auth/decorators/*`, `user-role.guard.ts`, `jwt.strategy.ts`, `main.ts`, and `logger.module.ts`.

## Explicitly out of scope

- **Git/commit conventions.** No `.husky/`, commitlint, or `CONTRIBUTING.md` exists, and commit history is inconsistent (`ADD:`, `add:`, `refactor:`, bare sentences). Deliberately not addressed — revisit only if asked.
