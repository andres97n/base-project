# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev     # Development with watch mode
npm run start:prod    # Run compiled production build
npm run build         # Compile TypeScript to dist/

npm run lint          # ESLint with auto-fix
npm run format        # Prettier formatting

npm test              # Run all unit tests (*.spec.ts)
npm run test:watch    # Unit tests in watch mode
npm run test:cov      # Unit tests with coverage
npm run test:e2e      # E2E tests (test/*.e2e-spec.ts)
```

Run a single test file:
```bash
npx jest src/auth/auth.service.spec.ts
```

## Architecture

NestJS REST API with MongoDB (Mongoose), JWT auth, caching, rate limiting, and Swagger docs.

### Module layout

```
src/
├── main.ts              # Bootstrap: versioning, pipes, filters, interceptors, Swagger
├── app.module.ts        # Root: config, DB, cache, throttler, HttpModule, AuthModule
├── auth/                # Auth scaffold (not fully implemented)
├── common/              # Shared infrastructure (no business logic)
│   ├── constants/       # API paths, port, JWT defaults, cache TTL
│   ├── decorators/      # @RawResponse() — skips response wrapping
│   ├── entities/        # BaseSchema (timestamps, soft-delete state, virtual id)
│   ├── enums/           # EnvironmentTypes, ExceptionAppCodes, BaseEntityStates
│   ├── exceptions/      # AppException base + business exceptions (401/403/404/422)
│   ├── filters/         # AllExceptions → Mongoose → Validation (applied in this order)
│   ├── helpers/         # Response/exception formatting, Mongoose error parsers
│   ├── interceptors/    # LoggingInterceptor, ResponseInterceptor (global)
│   ├── interfaces/      # ApiResponse union, ISuccessResponse, IErrorResponse
│   ├── repositories/    # BaseRepository<T> — generic Mongoose CRUD
│   └── utils/           # bcrypt, string, query utilities
├── core/
│   ├── config/          # app/database/jwt/cache configs + Joi env validation
│   ├── database/        # Global DatabaseModule (Mongoose)
│   └── throttler/       # Rate limiting module
└── modules/
    └── settings/        # Example feature module: schema → repository → service
```

### Key patterns

**BaseRepository** (`src/common/repositories/base.repository.ts`) — extend this for every feature repository. Provides `create`, `findById`, `findOne`, `findAll` (paginated), `updateById`, `update`, `removeById`, `remove`. All returns are `FlattenMaps<T>`.

**BaseSchema** (`src/common/entities/base.entity.ts`) — all Mongoose schemas extend this. Adds `createdAt`/`updatedAt`, virtual `id` (maps `_id`), and `state` (ACTIVE/DELETED). Soft deletes only — `removeById`/`remove` set `state = DELETED`.

**AppException** (`src/common/exceptions/base/app.exception.ts`) — base for all thrown errors. Business exceptions (Unauthorized, Forbidden, ResourceNotFound, Validation) extend it and carry an `ExceptionAppCode`, `timestamp`, and optional `details`.

**ResponseInterceptor** wraps every successful response:
```json
{ "ok": true, "statusCode": 200, "message": "...", "data": ..., "timestamp": "...", "path": "...", "method": "...", "requestId": "uuid", "meta": { "total": 0, "page": 1, "limit": 10 } }
```
Use `@RawResponse()` on a controller method to bypass wrapping.

**Three global exception filters** are applied in order in `main.ts`: `AllExceptionsFilter` → `MongooseExceptionFilter` → `ValidationExceptionFilter`. NestJS applies them last-registered-first, so `ValidationExceptionFilter` catches first.

**Settings caching** (`src/modules/settings/`) is the reference implementation for feature modules with a cache layer — preloads on init, uses key prefix `setting:${key}`, invalidates on update.

### Adding a feature module

1. Create `src/modules/<feature>/` with `schema`, `repository` (extends `BaseRepository`), `service`, `controller`, `module`, and `dto/` subdirectory.
2. Schema class extends `BaseSchema`; decorate with `@Schema({ timestamps: true })`.
3. Register schema in the feature module via `MongooseModule.forFeature`.
4. Import the feature module in `app.module.ts`.

### Environment variables

Copy `.env-example` to `.env`. Required vars (validated by Joi at startup):

| Variable | Default |
|---|---|
| `DB_URI` | — (required) |
| `JWT_SECRET` | — (required) |
| `JWT_REFRESH_SECRET` | — (required) |
| `NODE_ENV` | `dev` |
| `PORT` | `3000` |
| `API_SUB_PATH` | `api` |
| `ENABLE_CACHE` | `true` |
| `CACHE_EXPIRED_TIME` | `300000` |

### API structure

- Global prefix: `/<API_SUB_PATH>` (e.g., `/api`)
- URI versioning: `/v1`, `/v2`, etc.
- Swagger UI: `http://localhost:<PORT>/api`

### Code style

Prettier enforces single quotes and trailing commas. TypeScript strict mode is on (`strictNullChecks`). Module resolution is `nodenext` — use `.js` extensions in relative imports if needed by the compiler.
