# Database

Persistence layer: dual-driver setup, base entity/repository contracts, pagination, transactions.
See also [architecture.md](./architecture.md) and [api.md](./api.md).

## Driver selection

`src/core/database/database.module.ts` (`@Global`) branches on `DB_TYPE` (read from `process.env` directly, before `ConfigModule` defaults apply):

- `DB_TYPE=mongodb` (default) → `MongooseModule.forRootAsync({ uri: dbUri })`. Feature schemas (including `Setting`) register their own `forFeature` inside their feature module — `DatabaseModule` only owns the root connection.
- `DB_TYPE=postgres` → delegates to `PostgresDatabaseModule` (`src/core/database/postgres-database.module.ts`), which configures `TypeOrmModule.forRootAsync`: prefers `postgresUri` if set, otherwise the discrete `POSTGRES_*` vars. `autoLoadEntities: true`, `synchronize: !isProd`, `logging: isDev`.

Only one driver is active per deployment — there is no dual-write. Pick the driver's base classes accordingly:

| | Mongoose | Postgres (TypeORM) |
|---|---|---|
| Schema base | `BaseSchema` (`src/common/entities/base.entity.ts`) | `BasePostgresEntity` (`src/common/entities/base-postgres.entity.ts`) |
| Repository base | `BaseRepository<T>` | `BasePostgresRepository<T>` |

## Base entity contracts

**`BaseSchema`** — `@Schema({ timestamps: true, toJSON/toObject: { virtuals: true, versionKey: false, transform: _id → id } })`.

- `id` — virtual, maps `_id` (bypassed on `.lean()` reads — see below).
- `state` — `String`, default `BaseEntityStates.ACTIVE` (`'A'`), enum-constrained (`'A'` \| `'I'` \| `'D'`).
- `createdBy?`, `updatedBy?` — stamped by `BaseRepository` from `AuditContextService`.
- `createdAt` / `updatedAt` — from `timestamps: true`, not declared on the class.

**`BasePostgresEntity`** — `id` (`@PrimaryGeneratedColumn('uuid')`), `state` (`varchar(1)`, default `'A'`), `createdAt`/`updatedAt` (`@CreateDateColumn`/`@UpdateDateColumn`, timestamptz), `createdBy?`/`updatedBy?` (uuid, nullable).

## `BaseRepository<T extends BaseSchema>`

`src/common/repositories/base.repository.ts`. Constructor: `(model: Model<T>, auditContext?: AuditContextService)`. Every feature repository extends this — never query `Model` directly outside a repository.

| Method | Signature | Notes |
|---|---|---|
| `create` | `(data: Partial<T>) => Promise<FlattenMaps<T>>` | Stamps `createdBy`/`updatedBy` from CLS |
| `findById` | `(id, options?: FindOptions, errorMessage?) => Promise<FlattenMaps<T>>` | Throws `ResourceNotFoundException` if missing |
| `findOne` | `(filter, options?: FindOptions, errorMessage?) => Promise<FlattenMaps<T>>` | Same |
| `findAll` | `(filter?, page = 1, limit = 10, options?: FindOptions) => Promise<PaginatedResult<FlattenMaps<T>>>` | Offset pagination — see below |
| `findAllCursor` | `(filter?, cursorOpts?: CursorPaginationDto, options?: FindOptions) => Promise<CursorPaginatedResult<FlattenMaps<T>>>` | Keyset pagination — see below |
| `updateById` | `(id, data: UpdateQuery<T>, options?) => Promise<FlattenMaps<T>>` | Forces `{ new: true }`, stamps `updatedAt`/`updatedBy` |
| `update` | `(filter, data, options?) => Promise<FlattenMaps<T>>` | Same via `findOneAndUpdate` |
| `removeById` / `remove` | `(id \| filter) => Promise<boolean>` | **Soft delete only** — see below |
| `withTransaction` | `<R>(fn: (session: ClientSession) => Promise<R>) => Promise<R>` | See Transactions |

`BasePostgresRepository<T extends BasePostgresEntity>` mirrors the same method names with TypeORM types (`DeepPartial<T>`, `FindOptionsWhere<T>`, `FindManyOptions<T>`) and a `withTransaction<R>(fn: (manager: EntityManager) => Promise<R>)`.

All reads return plain objects (`FlattenMaps<T>` / lean rows) passed through `getResultWithVirtualId` (`src/common/utils/query.util.ts`), which manually rewrites `_id → id`.

## Pagination

Two strategies, both built into `BaseRepository`:

- **Offset** (`findAll`) — `skip = (page-1)*limit`, default sort `{ createdAt: -1 }`. Returns `PaginatedResult<T> = { data, total, page, limit, totalPages }`. Request shape: `PaginationDto` (`src/common/dto/pagination.dto.ts`) — `page` (default 1, min 1), `limit` (default 10, min 1, max 100).
- **Cursor** (`findAllCursor`) — keyset pagination, tie-broken on `_id`. Request shape: `CursorPaginationDto` (`src/common/dto/cursor-pagination.dto.ts`) — `cursor?`, `limit` (default 20, max 100), `sortField` (default `createdAt`, must match `^[a-zA-Z_][a-zA-Z0-9_]*$`), `sortOrder` (`'asc' | 'desc'`, default `'desc'`). Comparison operator (`$gt`/`$lt`) is chosen from `sortOrder`. Fetches `limit + 1` rows to compute `hasMore`. Returns `CursorPaginatedResult<T> = { data, nextCursor, hasMore, limit }`. Cursors are opaque base64url JSON — encode/decode via `encodeCursor`/`decodeCursor` (`src/common/utils/cursor.util.ts`), payload shape `{ value, id }`.
  - **Postgres only:** `sortField` (and every filter key) is interpolated into raw SQL via `QueryBuilder.andWhere`. `BasePostgresRepository.assertValidColumn()` checks the field against `this.repository.metadata.columns` and throws `ValidationException` for anything not a real column — this is the actual defense; the DTO's regex is a shallow first filter, not a substitute.

Prefer cursor pagination for large or frequently-appended collections; offset pagination for small, page-numbered UIs.

## Soft delete

`removeById` / `remove` never delete a row. They set `state = BaseEntityStates.DELETED` (`'D'`) plus `updatedAt`/`updatedBy`, throw `ResourceNotFoundException` if nothing matched, and return `true` iff the resulting `state === 'D'`. There is no hard-delete path in either base repository — **do not add one**; this is a hard project rule (see root `CLAUDE.md`).

All four read methods (`findById`, `findOne`, `findAll`, `findAllCursor`) **exclude soft-deleted records by default** — they merge `{ state: { $ne: 'D' } }` (Mongo) / `Not('D')` (Postgres) into the filter via a protected `withNotDeleted()` helper on each base repository. Pass `{ includeDeleted: true }` in the `options` argument to opt back in for a specific call (e.g. an admin "show deleted" view or a restore flow):

```ts
await this.userRepository.findById(id, { includeDeleted: true });
```

`includeDeleted` is stripped from `options` before it reaches the underlying Mongoose/TypeORM query — it's not a native query option.

## Transactions

`withTransaction(fn)` opens a `ClientSession` (`model.db.startSession()`), runs `fn` inside `session.withTransaction(...)`, and always calls `session.endSession()`. The session is **not** auto-injected into other `BaseRepository` methods — callers must thread it through manually via `options.session` on each call inside `fn`.

MongoDB transactions require a replica set. A standalone `mongod` throws `Transaction numbers are only allowed on a replica member or mongos`. For local dev, use MongoDB Atlas or `mongod --replSet rs0`.

## `.lean()` implications

Every `BaseRepository` read uses `.lean()` for performance, which has two consequences:

1. The `toJSON`/`toObject` transforms on `BaseSchema` (including the `_id → id` mapping) **do not run**. `getResultWithVirtualId` does that mapping manually instead.
2. Mongoose instance methods (e.g. a `schema.methods.foo` defined on a feature schema) are **unreachable** on lean results — put reusable logic in a util or service method instead.

## Schema conventions

Reference: `src/modules/auth/entities/user.entity.ts`.

- `@Prop({ unique: true, index: true, lowercase: true, trim: true, validate: { validator, message } })` for constrained string fields.
- `select: false` on secrets (`password`, `refreshToken`, `refreshTokenExpiresAt`) — remember this only affects the *default projection*; `.create().toObject()` and explicit `.select('+password')` still expose them (see Known Gaps).
- `enum: Object.values(UserRoles)` for role-like fields.
- `UserSchema.pre('save')` for password hashing — has no effect on `.lean()` reads or `updateById`/`update`, which bypass Mongoose middleware entirely; hash passwords explicitly before those calls.

`src/modules/setting/` is the reference for a small, fully-wired **cached** feature module — schema → repository → service (with a `SettingModule`-owned `MongooseModule.forFeature`, cache-preload on boot, and an admin-only controller). Its schema (`setting.schema.ts`) is the minimal example: `unique: true` on `key`, `MongooseSchema.Types.Mixed` for `value`, and a `SettingDocument = Setting & Document` type alias — a convention `user.entity.ts` does not follow. Neither schema declares compound indexes via `schema.index(...)`.

## Caching (settings module)

`SettingService` (`src/modules/setting/services/setting.service.ts`) is the reference for a cache-backed service:

- `get<T>(key)` — read-through: checks the cache first, falls back to `SettingRepository.findOne({ key })` on a miss, backfills the cache, returns `null` if the key doesn't exist (never throws).
- `set(key, value, description?)` — upserts via `SettingRepository.update({ key }, ..., { upsert: true })`, then invalidates and re-populates the cache key.
- `delete(key)` — removes the record (soft delete) and evicts the cache key.
- Keys are prefixed `setting:<key>` (`CACHE_PREFIX`).
- `onModuleInit` preloads every record where `isInitialSetting: true` into the cache on boot.
- The cache manager is injected with `@Optional() @Inject(CACHE_MANAGER)` — every cache call is guarded with `?.`, so the service still works (just uncached) when `ENABLE_CACHE=false` and `CacheModule` isn't registered at all.

## Local databases (Docker)

`docker-compose.yaml` at the repo root starts `postgres:16-alpine` (port 5432, volume `pg_data`) and `mongo:7-jammy` (port 27017, volume `mongo_data`) for local development. See Known Gaps below before relying on it for Postgres.

## Known Gaps

- **No migration infrastructure exists for Postgres.** `postgres-database.module.ts` configures TypeORM with `synchronize: !isProd` — schema sync only, no `DataSource`, no `migrations/` folder, no typeorm CLI scripts in `package.json`. Under `DB_TYPE=postgres` in production (`synchronize: false`), there is **no path at all** to apply schema changes. Any real deployment on Postgres needs a migration workflow added before going to production. See `docs/plans/roadmap.md`.
- `docker-compose.yaml` references `${DB_USER}`, `${DB_PASS}`, `${DB_NAME}`, none of which exist in `.env`/`.env-example` (the app uses `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`). `docker compose up postgres` currently starts with empty credentials.
- The setting module is Mongoose-only (its `MongooseModule.forFeature` assumes a Mongo connection exists). Importing `SettingModule` while `DB_TYPE=postgres` will fail to resolve at bootstrap — there is no Postgres-backed `Setting` entity/repository yet.
