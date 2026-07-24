# Architecture

This is a thin entry point. The full, authoritative reference lives in `docs/`:

- [docs/architecture.md](./docs/architecture.md) — bootstrap sequence, global modules, env var
  table, exception/filter/interceptor wiring, CLS audit, logging, rate limiting, testing.
- [docs/database.md](./docs/database.md) — driver selection, base repositories, pagination,
  soft delete, transactions, schema conventions.
- [docs/api.md](./docs/api.md) — route shape, response envelopes, auth flow, DTO conventions.
- [docs/conventions.md](./docs/conventions.md) — where constants/types/enums/helpers must live.
- [docs/decisions/](./docs/decisions/) — ADRs (settled decisions in effect).

## Layer mapping

The maintenance policy describes clean-architecture layers as
`domain / application / infrastructure / presentation`. This project keeps the
NestJS-conventional `common/ + core/ + modules/` layout; the four layer **roles** are expressed
as folders **inside each feature module**, not as top-level directories. This is deliberate —
a physical restructure would break every fork and contradicts the "keep architecture stable"
principle.

| Clean-architecture layer | Where it lives here |
|---|---|
| **Presentation** | `modules/<f>/controllers/`, `modules/<f>/dto/`, guards, Swagger decorators |
| **Application** (use cases / orchestration) | `modules/<f>/services/` |
| **Domain** (entities, contracts, enums, types) | `modules/<f>/entities/`, `enums/`, `interfaces/` |
| **Infrastructure** (persistence, external APIs) | `modules/<f>/repositories/`, `schemas/`; `core/*`; shared bases in `common/*` |

Shared infrastructure (base repositories, exceptions, filters, interceptors, utils) lives in
`common/`; global cross-cutting modules (config, database driver switch, logger, cls, http,
throttler, swagger) live in `core/`.

## Dependency direction (one-way)

`common/` never imports from `modules/`. Feature modules depend on `common/` and `core/`, never
the reverse. Every repository extends `BaseRepository<T>` / `BasePostgresRepository<T>`; every
schema/entity extends `BaseSchema` / `BasePostgresEntity`; every thrown error extends
`AppException`. See [CLAUDE.md](./CLAUDE.md) for the full rule set.
