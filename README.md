# Base Project — NestJS REST API Boilerplate

An opinionated NestJS 11 + TypeScript starting point meant to be **forked** for new projects. It ships the infrastructure most APIs re-implement from scratch — authentication, a generic repository layer, uniform response envelopes, structured logging, config validation, rate limiting and API docs — so a new service starts with the plumbing already decided and consistent.

Persistence is dual-driver: the same repository contract runs on **MongoDB (Mongoose)** or **PostgreSQL (TypeORM)**, selected with a single env var.

## Features

**Persistence**
- `BaseRepository<T>` / `BasePostgresRepository<T>` — generic CRUD behind one contract, switched via `DB_TYPE`
- Offset **and** cursor (keyset) pagination, plus a `withTransaction()` helper, on both drivers
- Soft delete by default — reads exclude `state='D'`, with an `includeDeleted` opt-in
- Audit stamping of `createdBy` / `updatedBy` from request context (`nestjs-cls`)

**API layer**
- Uniform success/error envelopes with a `requestId` that correlates to the logs
- `AppException` hierarchy (8 business exceptions) + 3 global exception filters, including Mongoose error mapping
- URI versioning (`/api/v1/...`) and a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`)
- Swagger with shared decorators that document the *real* envelope, not a fiction

**Security**
- JWT auth: access tokens + rotating, bcrypt-hashed refresh tokens on separate secrets
- Authenticated by default via a global guard — `@Public()` opens a route, `@Auth(...roles)` adds RBAC
- Rate limiting in 3 tiers, helmet, compression, CORS allowlist
- Structured logging (`nestjs-pino`) that redacts `authorization` headers and `password` fields

**Operations**
- Joi-validated environment config — the app refuses to boot on a bad `.env`
- `GET /health` readiness probe via `@nestjs/terminus`; idempotent admin seed script
- `HttpClientService` for outbound calls: retry with backoff, and axios errors mapped into `AppException`

## Requirements

- **Node.js** 20+ (targets ES2023, typed against `@types/node` 22)
- **pnpm** — this repo uses pnpm, not npm or yarn
- **MongoDB** or **PostgreSQL** (Docker Compose provides both for local dev)

## Quickstart

```bash
# 1. Install
pnpm install

# 2. Configure
cp .env-example .env
```

> [!IMPORTANT]
> Two things in `.env-example` will stop your first boot:
> - `CACHE_EXPIRED_TIME=300_000` — underscore separators are **not** valid in dotenv files, and Joi rejects the value. Change it to `300000`.
> - `DB_URI` ships with a placeholder prefix. Set a real connection string, e.g. `mongodb://localhost:27017/base`.
>
> Also set `JWT_SECRET` and `JWT_REFRESH_SECRET` to two **different** values — both are required.

```bash
# 3. Start a database
docker compose up -d mongodb

# 4. (Optional) Seed an admin user — needs SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD in .env
pnpm run seed

# 5. Run
pnpm run start:dev
```

Swagger UI is then at `http://localhost:<PORT>/<API_SUB_PATH>/docs` — by default <http://localhost:3000/api/docs>.

> [!NOTE]
> The `postgres` service in `docker-compose.yaml` references `${DB_USER}`, `${DB_PASS}` and `${DB_NAME}`, which are not defined anywhere in this repo (the app itself uses `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`). Define them before running `docker compose up postgres`, or it starts with empty credentials. The `mongodb` service needs no configuration.

## Scripts

| Script | Description |
|---|---|
| `pnpm run start` | Start once |
| `pnpm run start:dev` | Development with watch mode |
| `pnpm run start:debug` | Watch mode with the debugger attached |
| `pnpm run start:prod` | Run the compiled build (`dist/main`) |
| `pnpm run build` | Compile TypeScript to `dist/` |
| `pnpm run lint` | ESLint with auto-fix |
| `pnpm run format` | Prettier formatting |
| `pnpm test` | Unit tests (`*.spec.ts`) |
| `pnpm run test:watch` | Unit tests in watch mode |
| `pnpm run test:cov` | Unit tests with coverage |
| `pnpm run test:debug` | Unit tests with the debugger attached |
| `pnpm run test:e2e` | E2E tests (`test/jest-e2e.json`) |
| `pnpm run seed` | Seed the initial admin user |

## Project structure

```
src/
├── main.ts          # Bootstrap only — no business logic
├── app.module.ts    # Composition root
├── common/          # Shared infrastructure: repositories, exceptions, filters,
│                    # interceptors, decorators, DTOs, entities, utils
├── core/            # Global infrastructure modules: config, database, logger,
│                    # cls, http, throttler, swagger
├── modules/         # Feature modules: auth, users, setting, health
└── seed/            # Admin seed script
```

Dependencies flow one way: `modules/` → `core/` + `common/`. **`common/` must never import from `modules/`**, and business logic never belongs in `common/`.

## Configuration

Every variable is validated by Joi at startup (`src/core/config/joi.validation.ts`). Anything not declared there is stripped — **register new variables in that schema** or they will silently disappear.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `JWT_SECRET` | ✅ | — | |
| `JWT_REFRESH_SECRET` | ✅ | — | Must differ from `JWT_SECRET` |
| `CACHE_EXPIRED_TIME` | ✅ | `300000` | Declared `.required()`, so the default never applies |
| `DB_URI` | conditional | — | Required unless `DB_TYPE=postgres` |
| `DB_TYPE` | — | `mongodb` | `mongodb` \| `postgres` |
| `NODE_ENV` | — | `dev` | `dev` \| `uat` \| `qa` \| `prod` |
| `PORT` | — | `3000` | |
| `API_SUB_PATH` | — | `api` | Global route prefix |
| `DEFAULT_PAGE_SIZE` | — | `10` | |
| `CORS_ORIGIN` | — | `*` | `*` or a comma-separated allowlist |
| `LOG_LEVEL` | — | `info` | `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace` |
| `ENABLE_CACHE` | — | `true` | Disables `CacheModule` entirely when false |
| `JWT_TIME` | — | `2h` | Access token TTL |
| `JWT_REFRESH_TIME` | — | `7d` | Refresh token TTL |
| `HTTP_TIMEOUT` | — | `5000` | Outbound HTTP client |
| `HTTP_MAX_REDIRECTS` | — | `5` | |
| `HTTP_RETRY_ATTEMPTS` | — | `3` | |
| `HTTP_RETRY_BASE_DELAY` | — | `300` | ms, exponential backoff base |
| `POSTGRES_URI` | — | — | Takes precedence over the discrete vars below |
| `POSTGRES_HOST` | — | `localhost` | |
| `POSTGRES_PORT` | — | `5432` | |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | — | — | |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | — | — | Seed skips if absent |
| `SEED_ADMIN_FULL_NAME` | — | `Admin` | |

## API surface

Routes resolve as `/<API_SUB_PATH>/v<n>/...` — e.g. `POST /api/v1/auth/login`.

Every successful response is wrapped automatically by `ResponseInterceptor` (opt out with `@RawResponse()`):

```json
{
  "ok": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {},
  "timestamp": "2026-07-21T00:00:00.000Z",
  "path": "/api/v1/users",
  "method": "GET",
  "requestId": "uuid",
  "meta": { "total": 0, "page": 1, "limit": 10 }
}
```

Errors share one shape across all filters: `{ ok: false, statusCode, code, message, details, timestamp, path, requestId }`, plus a `validationErrors[]` array on validation failures.

**Auth endpoints** — all `@Public()` except logout:

| Route | Purpose |
|---|---|
| `POST /auth/register` | Create a user, return the profile + token pair |
| `POST /auth/login` | Authenticate (rejects inactive accounts) |
| `POST /auth/refresh` | Rotate the refresh token, issue a new pair |
| `POST /auth/check-status` | Validate an access token |
| `POST /auth/logout` | Clear the stored refresh token |

`GET /health` returns the Terminus readiness payload (200, or 503 when the database ping fails).

Full detail in [docs/api.md](./docs/api.md).

## Adding a feature module

1. Create `src/modules/<feature>/` with `schemas/`, `repositories/`, `services/`, `controllers/`, `dto/`.
2. Extend `BaseSchema` (Mongoose) or `BasePostgresEntity` (Postgres) in the schema/entity.
3. Extend `BaseRepository<T>` / `BasePostgresRepository<T>` in the repository — never query the model directly outside one.
4. Register the schema in the feature's own module via `MongooseModule.forFeature` (or the TypeORM equivalent).
5. Create `<feature>.module.ts` wiring controller + providers.
6. Import that module in `app.module.ts` — **a feature is not wired up until this step**.

Copy `src/modules/users/` for a simple CRUD feature, or `src/modules/setting/` for one with a cache layer.

## Testing

Jest is configured inline in `package.json` with `rootDir: src`, so **unit specs live next to the code they test** under `src/` and match `*.spec.ts`. E2E specs live in `test/` and use `test/jest-e2e.json`.

```bash
pnpm test                                  # all unit tests
npx jest src/path/to/file.spec.ts          # a single file
```

## Not included yet

This boilerplate deliberately stops short of some things you will likely want — expect to add them per project:

- **No CI pipeline** — there is no `.github/` workflow.
- **No application Dockerfile** — `docker-compose.yaml` only provisions local databases.
- **Minimal test coverage** — one spec file exists, and no coverage threshold is enforced. `test/app.e2e-spec.ts` is stale NestJS scaffold that fails as written.
- **No graceful shutdown** — `app.enableShutdownHooks()` is never called, so `OnModuleDestroy` hooks don't run on SIGTERM.
- **The settings module is Mongoose-only** — it has no Postgres entity, so importing it under `DB_TYPE=postgres` will fail at bootstrap.

Each doc under `docs/` ends with a **Known Gaps** section listing verified defects in that area — read it before treating any part of the code as a pattern to copy.

## Documentation

| Document | Contents |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | Conventions and architecture rules (also guides AI assistants working in this repo) |
| [docs/architecture.md](./docs/architecture.md) | Bootstrap sequence, global modules, config, exceptions, filters, interceptors, logging, seeding |
| [docs/database.md](./docs/database.md) | Driver selection, repository API, pagination, soft delete, transactions, schema conventions |
| [docs/api.md](./docs/api.md) | Route shape, response envelopes, auth flow, DTO and Swagger conventions |

## License

`UNLICENSED` — this is a private project (see `package.json`). Set a license of your own when you fork it.
