# Architecture

Global wiring of the base project: bootstrap, configuration, cross-cutting concerns.
See also [database.md](./database.md) and [api.md](./api.md).

## Layer boundaries

```
src/
├── main.ts          # Bootstrap only — no business logic
├── app.module.ts    # Composition root
├── common/          # Shared infrastructure. NO business logic, NO feature imports.
├── core/            # Global infrastructure modules (config, db, logger, cls, http, throttler, swagger)
└── modules/         # Feature modules (auth, users, setting)
```

Dependency direction is one-way: `modules/` → `core/` + `common/`. `common/` must never import from `modules/`.

## Bootstrap sequence (`src/main.ts`)

Order matters — this is the exact chain:

1. `process.on('uncaughtException' | 'unhandledRejection')` → log + `process.exit(1)`.
2. `NestFactory.create(AppModule, { bufferLogs: true })` — logs buffer until pino is installed.
3. `app.useLogger(app.get(PinoLogger))`.
4. `helmet()` — CSP enabled only when `NODE_ENV=prod`.
5. `compression()`.
6. Request-ID middleware — reads `x-request-id` or generates a uuid v4; echoes `X-Request-ID`.
7. `app.setGlobalPrefix(API_SUB_PATH)`.
8. `app.enableVersioning({ type: URI, defaultVersion: '1', prefix: 'v' })` → routes are `/api/v1/...`.
9. `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: false } })`.
10. `useGlobalFilters(AllExceptionsFilter, MongooseExceptionFilter, ValidationExceptionFilter)`.
11. `useGlobalInterceptors(new ResponseInterceptor(reflector))`.
12. `setupSwagger(app, globalPrefix)` → UI at `/<API_SUB_PATH>/docs`.
13. `app.enableCors({ origin })` — `CORS_ORIGIN` is `*` or a comma-separated allowlist.
14. `app.listen(port)`.

## Global modules (`src/app.module.ts`)

| Module | Source | Purpose |
|---|---|---|
| `ConfigModule` | `@nestjs/config` | `isGlobal`, loads 6 config factories, validates with `JoiValidationSchema` |
| `AppClsModule` | `src/core/cls/` | `nestjs-cls` request context; provides `AuditContextService` |
| `AppLoggerModule` | `src/core/logger/` | `nestjs-pino`; `pino-pretty` in non-prod |
| `HttpClientModule` | `src/core/http/` | `@nestjs/axios` + retry + error mapping |
| `CacheModule` | `@nestjs/cache-manager` | Registered **conditionally** via `ConditionalModule.registerWhen(...)` on `ENABLE_CACHE` |
| `ThrottlerLocalModule` | `src/core/throttler/` | Rate limiting; binds `ThrottlerGuard` as `APP_GUARD` |
| `DatabaseModule` | `src/core/database/` | Branches on `DB_TYPE` — see [database.md](./database.md) |
| `SettingModule` | `src/modules/setting/` | Cached key/value settings; admin-only CRUD — see [database.md](./database.md#schema-conventions) |
| `HealthModule` | `src/modules/health/` | `GET /health` via `@nestjs/terminus` — see [api.md](./api.md#health-check) |

Global providers:

- `APP_GUARD` → `JwtAuthGuard` — **every route is authenticated by default**.
- `APP_GUARD` → `ThrottlerGuard` (from `ThrottlerLocalModule`).
- `APP_INTERCEPTOR` → `AuditInterceptor`.

## Configuration

Config factories live in `src/core/config/` and are re-exported from its `index.ts`. They are plain factories (no `registerAs`), so all keys land in a flat namespace read via `configService.get('<key>')`.

| Factory | Keys produced |
|---|---|
| `AppConfiguration` | `environment`, `apiSubPath`, `defaultPageSize`, `corsOrigin`, `logLevel` |
| `DatabaseConfiguration` | `dbUri`, `port` |
| `PostgresConfiguration` | `postgresUri`, `postgresHost`, `postgresPort`, `postgresDb`, `postgresUser`, `postgresPassword` |
| `JwtConfiguration` | `jwtSecret`, `jwtRefreshSecret`, `jwtTime`, `jwtRefreshTime` |
| `CacheConfiguration` | `enableCache`, `cacheExpiredTime` |
| `HttpConfiguration` | `httpTimeout`, `httpMaxRedirects`, `httpRetryAttempts`, `httpRetryBaseDelay` |

### Environment variables

All 27 vars are validated at startup by `src/core/config/joi.validation.ts`. **Any new variable must be added there** or it will be stripped.

| Variable | Type | Required | Default | Notes |
|---|---|---|---|---|
| `JWT_SECRET` | string | ✅ | — | |
| `JWT_REFRESH_SECRET` | string | ✅ | — | Must differ from `JWT_SECRET` |
| `CACHE_EXPIRED_TIME` | number | ✅ | `300000` | `.required()` — the default never applies |
| `DB_URI` | string | conditional | — | Required unless `DB_TYPE=postgres` |
| `DB_TYPE` | string | — | `mongodb` | `mongodb` \| `postgres` |
| `NODE_ENV` | string | — | `dev` | `dev` \| `uat` \| `qa` \| `prod` |
| `PORT` | number | — | `3000` | |
| `API_SUB_PATH` | string | — | `api` | |
| `DEFAULT_PAGE_SIZE` | number | — | `10` | |
| `CORS_ORIGIN` | string | — | `*` | Comma-separated allowlist or `*` |
| `LOG_LEVEL` | string | — | `info` | `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace` |
| `ENABLE_CACHE` | boolean | — | `true` | Compared as the string `'true'` |
| `JWT_TIME` | string | — | `2h` | |
| `JWT_REFRESH_TIME` | string | — | `7d` | |
| `HTTP_TIMEOUT` | number | — | `5000` | |
| `HTTP_MAX_REDIRECTS` | number | — | `5` | |
| `HTTP_RETRY_ATTEMPTS` | number | — | `3` | |
| `HTTP_RETRY_BASE_DELAY` | number | — | `300` | ms, exponential backoff base |
| `POSTGRES_URI` | string | — | — | Takes precedence over discrete vars |
| `POSTGRES_HOST` | string | — | `localhost` | |
| `POSTGRES_PORT` | number | — | `5432` | |
| `POSTGRES_DB` | string | — | — | |
| `POSTGRES_USER` | string | — | — | |
| `POSTGRES_PASSWORD` | string | — | — | |
| `SEED_ADMIN_EMAIL` | email | — | — | Seed skips if absent |
| `SEED_ADMIN_PASSWORD` | string | — | — | Seed skips if absent |
| `SEED_ADMIN_FULL_NAME` | string | — | `Admin` | |

Start from `.env-example`.

## Exceptions

Base: `AppException extends HttpException` (`src/common/exceptions/base/app.exception.ts`) — carries `code`, `timestamp`, `isOperational`, optional `details`.

| Class | HTTP | `ExceptionAppCodes` |
|---|---|---|
| `ValidationException` | 400 | `VALIDATION_ERROR` |
| `UnauthorizedException` | 401 | `UNAUTHORIZED_ERROR` |
| `ForbiddenException` | 403 | `FORBIDDEN_ERROR` |
| `ResourceNotFoundException` | 404 | `RESOURCE_NOT_FOUND_ERROR` |
| `ConflictException` | 409 | `CONFLICT_ERROR` |
| `InternalServerException` | 500 | `INTERNAL_SERVER_ERROR` (`isOperational: false`) |
| `BadGatewayException` | 502 | `BAD_GATEWAY_ERROR` |
| `ServiceUnavailableException` | 503 | `SERVICE_UNAVAILABLE_ERROR` |

`ResourceNotFoundException` has a different signature from its siblings: `(resourceType, identifier, details?)`.

### Filters

Registered in `main.ts` as `AllExceptionsFilter, MongooseExceptionFilter, ValidationExceptionFilter`. Nest evaluates global filters **last-registered-first**, so the effective order is the reverse of the argument list:

1. `ValidationExceptionFilter` — `@Catch(BadRequestException)`. Handles class-validator payloads only; **rethrows** anything else.
2. `MongooseExceptionFilter` — `@Catch(ValidationError, CastError, MongoError)`. Duplicate key (`11000`) → 409, cast/validation → 400, other → 500.
3. `AllExceptionsFilter` — `@Catch()`. Catch-all; includes `stack` only when `NODE_ENV=dev`; logs `.error` for ≥500, `.warn` below.

## Interceptors

- **`ResponseInterceptor`** (`src/common/interceptors/response.interceptor.ts`) — wraps every successful response in the standard envelope. Skipped when `@RawResponse()` is present. See [api.md](./api.md).
- **`AuditInterceptor`** (`src/common/interceptors/audit.interceptor.ts`) — sets `cls.set('userId', request.user?.id ?? null)`.

There is **no `LoggingInterceptor`** — request logging is handled entirely by `nestjs-pino`.

## Audit context (CLS)

```
AuditInterceptor → cls.set('userId') → AuditContextService.getUserId() → BaseRepository
```

`BaseRepository` reads `AuditContextService` on every write and stamps `createdBy` / `updatedBy`. If a repository is constructed without the optional `auditContext` argument, those columns stay empty.

## Logging

`src/core/logger/logger.module.ts` configures `nestjs-pino`:

- Level from `LOG_LEVEL` (default `info`).
- `genReqId` reuses the incoming `x-request-id`, so log correlation matches the response header.
- `customProps` attaches `userId` and `requestId` to every line.
- **Redaction:** `req.headers.authorization` and `req.body.password` → `[REDACTED]`.
- `pino-pretty` transport on any non-`prod` environment.

## Rate limiting

`src/core/throttler/throttler.module.ts` defines three named tiers, all enforced globally:

| Name | Limit | Window |
|---|---|---|
| `short` | 10 | 1 second |
| `medium` | 60 | 1 minute |
| `long` | 1000 | 60 minutes |

## Outbound HTTP

`HttpClientService` (`src/core/http/http-client.service.ts`) is the only sanctioned way to call external APIs. `get/post/put/patch/delete<T>()` return the response **body** directly.

`onModuleInit` installs `axios-retry` (exponential backoff on network errors, idempotent methods, and 429) plus request/response logging with duration metrics.

`mapAxiosError` (`src/core/http/helpers/axios-error.mapper.ts`) converts every axios failure into an `AppException`: no response → `ServiceUnavailableException`; 400/422 → `ValidationException`; 401/403/404/409/502/503/504 → the matching business exception; anything else → `InternalServerException`. Detail payloads are truncated to 2000 chars.

## Seeding

```bash
pnpm run seed    # ts-node -r tsconfig-paths/register src/seed/seed.ts
```

Creates a single admin user via `createApplicationContext`. Idempotent — skips if `SEED_ADMIN_EMAIL` already exists. Requires `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (warns and exits if absent). `SeedModule` loads the full Joi schema, so every required env var must be present.

## Testing

- **Unit** — jest config is inline in `package.json`: `rootDir: src`, `testRegex: .*\.spec\.ts$`, `moduleNameMapper: { '^src/(.*)$': '<rootDir>/$1' }`. Specs must live under `src/`.
- **E2E** — `test/jest-e2e.json`, `testRegex: .e2e-spec.ts$`.
- Single file: `npx jest src/path/to/file.spec.ts`.

## Known Gaps

- `app.enableShutdownHooks()` is never called, so `OnModuleDestroy` hooks do not run on SIGTERM. No graceful shutdown.
- `CACHE_EXPIRED_TIME` is declared `.required().default(300000)` — in Joi, `.required()` wins, so the default is unreachable and the var is mandatory.
- When `DB_TYPE=postgres`, none of the `POSTGRES_*` vars are required, so an empty config passes validation and fails only at connect time.
- `test/app.e2e-spec.ts` is untouched NestJS scaffold asserting `GET /` returns `Hello World!`. It cannot pass — there is no root controller, plus a global prefix, versioning, and a global auth guard. `test/jest-e2e.json` also lacks `moduleNameMapper`, so any e2e importing `src/...` fails to resolve.
- Only one spec exists in the whole repo (`src/core/http/helpers/axios-error.mapper.spec.ts`). No coverage threshold is configured.
- No CI (`.github/` does not exist) and no Dockerfile for the app itself (`docker-compose.yaml` only provisions local databases).
- Process-level handlers call `process.exit(1)` without awaiting `app.close()`.
