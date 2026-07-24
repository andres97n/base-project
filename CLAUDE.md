# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**This is a base/boilerplate project**, forked as the starting point for future projects. Keep it lean, generic, and strongly configured — avoid adding product-specific logic here.

## Stack

| | |
|---|---|
| Framework | NestJS 11, TypeScript 5.7 (strict, `nodenext`) |
| Package manager | pnpm (not npm/yarn) |
| Persistence | Mongoose 9 **or** TypeORM 0.3/Postgres, switched via `DB_TYPE` |
| Auth | Passport JWT, access + refresh tokens |
| Validation | class-validator / class-transformer, global `ValidationPipe` |
| Caching | `@nestjs/cache-manager`, conditional on `ENABLE_CACHE` |
| Rate limiting | `@nestjs/throttler`, 3 global tiers |
| Logging | `nestjs-pino` |
| Request context | `nestjs-cls` (audit stamping) |
| Config | `@nestjs/config` + Joi schema validation |
| API docs | `@nestjs/swagger` |
| Health checks | `@nestjs/terminus` (`GET /api/v1/health`) |

## Commands

```bash
pnpm run start:dev     # Development with watch mode
pnpm run start:prod    # Run compiled production build
pnpm run build         # Compile TypeScript to dist/
pnpm run lint          # ESLint with auto-fix
pnpm run format        # Prettier formatting
pnpm test              # Run all unit tests (*.spec.ts)
pnpm run test:watch    # Unit tests in watch mode
pnpm run test:cov      # Unit tests with coverage
pnpm run test:e2e      # E2E tests (test/*.e2e-spec.ts)
pnpm run seed          # Seed initial admin user (requires SEED_ADMIN_* env vars)
```

Run a single test file:
```bash
npx jest src/modules/auth/services/auth.service.spec.ts
```

## Architecture Rules

```
src/
├── main.ts        # Bootstrap only — no business logic
├── app.module.ts  # Composition root
├── common/         # Shared infrastructure — NO business logic
├── core/           # Global config modules (config, database, logger, cls, http, throttler, swagger)
└── modules/        # Feature modules (auth, users, ...)
```

- `common/` never imports from `modules/`. Dependency direction is one-way.
- Every repository extends `BaseRepository<T>` (Mongoose) or `BasePostgresRepository<T>` (Postgres) — never query `Model`/`Repository` directly outside one.
- Every schema/entity extends `BaseSchema` or `BasePostgresEntity` — soft delete only (`state = 'D'`), no hard deletes in the base classes.
- Every thrown error extends `AppException` (`src/common/exceptions/base/app.exception.ts`).
- Successful responses are auto-wrapped by the global `ResponseInterceptor`; opt out with `@RawResponse()`.
- Routes resolve as `/<API_SUB_PATH>/v<n>/...` (URI versioning, default `v1`).
- All routes are **authenticated by default** (global `JwtAuthGuard`); `@Public()` opens one, `@Auth(...roles)` adds RBAC.

**New feature module:** `src/modules/<feature>/` with `schemas/`, `repositories/` (extends the base repository), `services/`, `controllers/`, `dto/`, and a `<feature>.module.ts` that registers the schema via `MongooseModule.forFeature` (or the TypeORM equivalent) — then import that module in `app.module.ts`. A feature is not wired up until its module is imported. Mirror `src/modules/setting/` (cached CRUD feature) or `src/modules/users/` (simple CRUD feature) as reference wiring.

Full detail: [docs/architecture.md](./docs/architecture.md), [docs/database.md](./docs/database.md), [docs/api.md](./docs/api.md).

## Quality and Security

- Never bypass the global `JwtAuthGuard`/`ThrottlerGuard`/`ValidationPipe` — they're process-wide, not per-route opt-in.
- `ValidationPipe` runs with `whitelist: true, forbidNonWhitelisted: true, transform: true` — every input needs a DTO.
- Secrets never get logged: pino redacts `req.headers.authorization` and `req.body.password`; keep that list updated for new sensitive fields.
- Hash passwords via `src/common/utils/brypt.util.ts` — never call `bcrypt` directly.
- Any new env var must be added to the Joi schema (`src/core/config/joi.validation.ts`) or it's silently stripped. Before committing: `pnpm run lint && pnpm run format && pnpm test`.

## Specific Documentation

- [docs/architecture.md](./docs/architecture.md) — bootstrap sequence, global modules, full env var table, exception/filter/interceptor wiring, CLS audit flow, logging, rate limiting, outbound HTTP, seeding, testing setup.
- [docs/database.md](./docs/database.md) — driver selection, `BaseRepository`/`BasePostgresRepository` method reference, offset vs cursor pagination, soft delete, transactions, schema conventions.
- [docs/api.md](./docs/api.md) — route shape, success/error envelopes, auth flow, DTO conventions, Swagger decorators.
- [docs/conventions.md](./docs/conventions.md) — file & code organization: where constants, types, interfaces, enums, and reusable helpers must live (never inline in logic files).
- [docs/plans/](./docs/plans/) — investigation notes and the deferred-work roadmap.
- [docs/dependency-policy.md](./docs/dependency-policy.md), [docs/upgrade.md](./docs/upgrade.md), [docs/support.md](./docs/support.md), [SECURITY.md](./SECURITY.md), [CHANGELOG.md](./CHANGELOG.md) — maintenance, release, and dependency governance (pnpm; see [docs/decisions/0004-maintenance-and-release-policy.md](./docs/decisions/0004-maintenance-and-release-policy.md)).

Each doc ends with a **Known Gaps** section — read it before treating that area as a pattern to copy.

## Code Style

Prettier enforces single quotes and trailing commas. TypeScript strict mode is on (`strictNullChecks`; `strict` itself is off — see [docs/decisions/0003-typescript-6-upgrade.md](./docs/decisions/0003-typescript-6-upgrade.md)). Module resolution is `nodenext`. There is **no `@/` path alias** — imports use `src/...` absolute specifiers, resolved via `paths` in `tsconfig.json`.

## Change Documentation

Before deploying, create or update a file in `docs/plans/`
only if the change involves architecture, security, persistence,
external integrations, cross-cutting configuration, multi-module
refactoring, or a decision that can be reused by future forks.

The plan must include: objective, context, scope, affected files,
steps, risks, tests, and acceptance criteria.

Do not create plans for trivial, mechanical, or isolated changes.

If a decision remains in effect for the base project, document the
final outcome in `docs/decisions/`, not just in `docs/plans/`.

## What NOT to Do

- **Don't use raw SQL or direct MongoDB/Postgres queries** outside of `BaseRepository`/`BasePostgresRepository` or a repository that extends one
- **Don't add business logic to `common/`** — that folder is for shared infrastructure only
- **Don't install new dependencies without confirming** — keep the boilerplate lean; ask before adding packages
- **Don't use `any` in TypeScript** — use generics or proper interfaces instead
- **Don't perform hard deletes** — always use soft delete via `state = 'D'`
- **Don't skip Joi validation for new env vars** — add every new variable to the Joi schema in `core/config/`
- **Don't create a controller without its corresponding DTO** — DTOs are required for validation pipes to work
- **Don't bypass `AppException`** — never throw raw `Error` or NestJS `HttpException` directly; extend `AppException` instead
- **Don't hand-roll a response envelope** — return data as-is and let the global `ResponseInterceptor` wrap it; use `@RawResponse()` only when the envelope genuinely doesn't apply
- **Don't create a feature folder without a `.module.ts` that's imported in `app.module.ts`** — an unregistered module's providers can't be injected anywhere
- **Don't assume MongoDB** — check `DB_TYPE` and use the matching base class (Mongoose vs Postgres)
