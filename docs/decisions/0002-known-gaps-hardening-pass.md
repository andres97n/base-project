# 0002 — Close the architecture.md Known Gaps: shutdown, Postgres validation, tests, Docker

## Status

Accepted — in effect.

## Context

`docs/architecture.md` carried a **Known Gaps** section enumerating six deficiencies
inherited by every fork of this boilerplate:

1. `app.enableShutdownHooks()` was never called — no graceful shutdown, `OnModuleDestroy`
   hooks never ran on SIGTERM/SIGINT, DB connections were never closed cleanly.
2. When `DB_TYPE=postgres`, none of the `POSTGRES_*` vars were required by Joi, so an
   empty config passed validation and only failed once the app tried to connect.
3. `test/app.e2e-spec.ts` was the untouched Nest scaffold (`GET / → "Hello World!"`),
   which cannot pass against this app (global prefix, URI versioning, global JWT guard,
   no root controller). `test/jest-e2e.json` also lacked `moduleNameMapper`, so any
   e2e spec importing `src/...` failed to resolve.
4. Only one unit spec existed in the whole repo
   (`src/core/http/helpers/axios-error.mapper.spec.ts`); no `coverageThreshold` was
   configured, so `test:cov` could never fail a build regardless of coverage.
5. No `Dockerfile` for the app itself — `docker-compose.yaml` only provisioned local
   databases, with no way to run the app in a container.
6. The `uncaughtException`/`unhandledRejection` handlers in `src/main.ts` called
   `process.exit(1)` synchronously, with the `app` instance out of scope, so no
   graceful close ever happened on a fatal error.

Because this is a base/boilerplate project forked as the starting point for real
projects, every gap here is inherited by every fork — fixing them here is high-leverage.

## Decision

Close all six gaps in a single hardening pass:

**Shutdown (gaps 1 & 6).** `src/main.ts` now holds `app` in a module-scoped `let`
(not a local `const` inside `bootstrap()`), and calls `app.enableShutdownHooks()`
immediately after `NestFactory.create(...)`. The two fatal-error handlers were
consolidated into a shared `handleFatalError` helper that attempts
`await app?.close()` before exiting, guarded by a 5-second force-exit timer so a
hung close can never block the process indefinitely.

**Postgres validation (gap 2).** `src/core/config/joi.validation.ts` gained a
reusable `requiredWhenPostgresWithoutUri` rule, applied to `POSTGRES_DB`,
`POSTGRES_USER`, and `POSTGRES_PASSWORD`. It mirrors the existing `DB_URI`
`Joi.when('DB_TYPE', …)` pattern but nests a second `when` on `POSTGRES_URI`,
matching the actual precedence enforced in `postgres-database.module.ts`
(`POSTGRES_URI` wins if present; otherwise the discrete trio is required).
`POSTGRES_HOST`/`POSTGRES_PORT` were left optional — they already default to
`localhost`/`5432`.

**E2E suite (gap 3).** `test/app.e2e-spec.ts` was replaced with
`test/health.e2e-spec.ts`, which replicates the real bootstrap (`setGlobalPrefix`,
`enableVersioning`) and hits the one genuinely public route, `GET /api/v1/health`.
`test/jest-e2e.json` gained a `moduleNameMapper` — note its `rootDir` is `.`
(resolved relative to the `test/` directory, since that's where `jest-e2e.json`
lives), so the mapping is `"^src/(.*)$": "<rootDir>/../src/$1"`, not the unit-test
config's `<rootDir>/$1`. Because `AppModule` connects to the database on boot, this
e2e test requires a running DB — `docker compose up -d mongodb` (or `postgres`)
before `pnpm run test:e2e`.

**Unit specs + coverage floor (gap 4).** Added four focused specs for pure/critical
units: `joi.validation.spec.ts` (locks in the gap-2 fix — asserts the postgres/empty
case fails and both the URI and discrete-trio cases pass), `brypt.util.spec.ts`,
`response.interceptor.spec.ts`, and `resource-not-found.exception.spec.ts`. Ran
`pnpm run test:cov`, read the achieved numbers (~20% statements/lines, ~11% branches,
~13% functions), and set a `coverageThreshold` in the `package.json` jest block a few
points below each — a regression ratchet, not an aspirational target.

**Dockerfile + compose (gap 5).** Added a multi-stage `Dockerfile` (deps → build →
slim non-root runtime, `node dist/main`) and `.dockerignore`. Extended
`docker-compose.yaml` with an `app` service (`depends_on` both DBs, `.env`-driven).
While touching that file, also fixed a latent mismatch it already had: the `postgres`
service read `${DB_USER}/${DB_PASS}/${DB_NAME}`, which don't exist in `.env`/
`.env-example` (the app uses `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`) —
`docker compose up postgres` previously started with blank credentials. **No CI**
(`.github/`) was added — that remains a deliberate, separate gap.

## Alternatives considered

- **Add GitHub Actions CI alongside the Dockerfile.** Rejected for this pass — scoped
  down to Dockerfile + compose only, per explicit direction, to avoid growing the
  change further than the six documented gaps warranted.
- **Push for high/aggressive test coverage.** Rejected — this is a lean boilerplate;
  a broad test push would be premature investment ahead of real feature code. A modest
  ratchet was chosen instead, to be raised over time as real modules accrue tests.
- **DB-free liveness route for the e2e target.** Considered so the e2e smoke test
  wouldn't need a live database, but the existing health endpoints intentionally ping
  the DB (`MongooseHealthIndicator`/`TypeOrmHealthIndicator`); kept the DB-backed
  health endpoint as the target and documented the DB prerequisite for `test:e2e`
  instead of adding a new route.

## Consequences

- `pnpm run start:dev` / `start:prod` now close DB connections and run lifecycle
  hooks on SIGTERM/SIGINT/fatal error instead of hard-exiting.
- Fork operators get a fail-fast error at startup if they set `DB_TYPE=postgres`
  without either `POSTGRES_URI` or the discrete credential trio, instead of a
  connection-time failure discovered later.
- `pnpm run test:e2e` now requires a running database (documented in
  `docs/architecture.md`'s Testing section and `docs/database.md`).
- `coverageThreshold` will fail `pnpm run test:cov` if coverage regresses below the
  current floor; raise the floor as more specs are added, never lower it to force a
  build green.
- `docker compose up --build` runs the full stack (app + both DBs) in one command.
- Fixed two small latent issues discovered incidentally while touching adjacent code:
  `docs/architecture.md`'s stale `CACHE_EXPIRED_TIME` note (the Joi rule had already
  been fixed to `.default()` without `.required()` in an earlier uncommitted change,
  but the doc still described the old, contradictory behavior) and `.env-example`'s
  malformed `DB_URI` placeholder (`[DB_PATH_CONNECTION] mongodb://...`, invalid if
  copied verbatim).

## Remaining gaps (deliberately out of scope)

- **No CI** (`.github/` still doesn't exist) — lint/test/build only run locally or as
  part of the Docker build step.
- **No DB-free liveness route** — every health check pings the database by design, so
  orchestrator liveness probes and `test:e2e` both depend on DB availability.
- **`main.ts`'s request-ID middleware is `any`-typed** (`(req: any, res: any, next: any)`
  at the top of `bootstrap()`), pre-existing and untouched by this pass — contradicts
  the project's "no `any`" rule but was out of scope here.
- **Pre-existing lint debt elsewhere in the repo** (~130 `@typescript-eslint` errors
  across files this pass didn't touch — e.g. `base-postgres.repository.ts`,
  `query.util.ts`, `logger.module.ts`, several `auth` module files) predates this
  session and was left untouched to keep this change scoped to the six documented gaps.

## Revisit when

A fork adds real CI, needs Postgres in production, or grows its test suite enough to
raise the `coverageThreshold` — at that point also revisit the "Remaining gaps" list
above, several of which are natural follow-ups (CI, the `any`-typed middleware, a
DB-free liveness route).

## Verification performed

- `pnpm run build` — clean TypeScript compile.
- `pnpm test` — 5 suites, 29 tests, all passing (4 new spec files added).
- `pnpm run test:cov` — passes the new `coverageThreshold`.
- `npx eslint` on every file this pass touched or added — zero errors (pre-existing
  errors elsewhere are unrelated to this change, see "Remaining gaps").
- `pnpm run format` — repo-wide Prettier pass, no functional changes.
- Postgres Joi validation manually verified: `DB_TYPE=postgres` with no
  `POSTGRES_URI` and no discrete trio fails validation; supplying either passes.
- `pnpm run test:e2e` (against a locally running MongoDB, with `.env` populated from
  `.env-example` and `NODE_ENV` overridden — Jest sets `NODE_ENV=test` by default,
  which isn't one of the project's allowed `EviromentTypes` values) —
  `GET /api/v1/health` returns 200.
- `docker compose config` — validated the extended `docker-compose.yaml` resolves
  correctly (env interpolation, service wiring). The Docker daemon was not running in
  this environment, so `docker compose up --build` itself was not executed live.
- Graceful-shutdown signal delivery was not conclusively verified live: Git Bash on
  Windows does not reliably deliver POSIX `SIGINT`/`SIGTERM` to a `node.exe` process
  spawned as a background job, so a `kill -SIGINT` smoke test was inconclusive by
  environment limitation, not a code issue. The app started cleanly with
  `enableShutdownHooks()` in place; re-verify with a real `SIGTERM` (e.g. `docker stop`
  or a Linux/macOS shell) when available.
