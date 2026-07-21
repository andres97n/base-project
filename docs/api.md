# API

Route shape, response envelopes, auth flow, DTOs, and Swagger conventions.
See also [architecture.md](./architecture.md) and [database.md](./database.md).

## Route shape

`/<API_SUB_PATH>/v<n>/...` — global prefix from `API_SUB_PATH` (default `api`), URI versioning with `defaultVersion: '1'`. Example: `POST /api/v1/auth/login`.

Every response carries an `X-Request-ID` header (echoes the incoming header or a generated uuid v4), which also appears as `requestId` in the response body and as a correlated field in pino logs.

## Response envelopes

`ResponseInterceptor` (`src/common/interceptors/response.interceptor.ts`) wraps every successful response automatically:

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

- `meta` is present only for paginated results (derived from `PaginatedResult`/`CursorPaginatedResult` shape).
- A controller/service can set a custom top-level `message` by returning `{ message, ...data }`.
- Use `@RawResponse()` (`src/common/decorators/raw-response.decorator.ts`) on a handler to skip the envelope entirely (e.g. for file downloads or third-party webhook responses).

### Error envelope

Global filters (`AllExceptionsFilter`, `MongooseExceptionFilter`, `ValidationExceptionFilter` — see [architecture.md](./architecture.md#exceptions)) all emit the same shape:

```json
{
  "ok": false,
  "statusCode": 404,
  "code": "RESOURCE_NOT_FOUND_ERROR",
  "message": "User with identifier \"...\" not found",
  "details": {},
  "timestamp": "2026-07-21T00:00:00.000Z",
  "path": "/api/v1/users/123",
  "requestId": "uuid"
}
```

Validation failures additionally carry a `validationErrors: { field, constraints, value? }[]` array; `value` is redacted for fields listed in `SENSITIVE_VALIDATION_FIELDS` (password, confirmPassword, currentPassword, refreshToken, token).

## Auth flow

Module: `src/modules/auth/`. Global `JwtAuthGuard` (bound as `APP_GUARD`) means **every route requires a valid bearer token by default**.

- `@Public()` (`src/common/decorators/public.decorator.ts`) — opens a route to unauthenticated access.
- `@Auth(...roles)` (`src/modules/auth/decorators/auth.decorator.ts`) — combines role metadata with `UserRoleGuard`; throws `ForbiddenException` listing the valid roles.
- `@GetUser()` — pulls the authenticated user off the request.

Endpoints (`auth.controller.ts`), all returning a flat payload (the envelope's `message`/`data` split comes entirely from `ResponseInterceptor`, not from the controller):

| Route | Purpose | Response |
|---|---|---|
| `POST /auth/register` | Create user | `{ id, email, fullName, isActive, roles, accessToken, refreshToken }` |
| `POST /auth/login` | Authenticate | Same shape as register. Rejects inactive users (401) |
| `POST /auth/refresh` | Rotate refresh token, issue new pair | `{ accessToken, refreshToken }` |
| `POST /auth/check-status` | Validate an **access** token | `{ valid: true }`, or 401 if invalid/expired |
| `POST /auth/logout` | Clear stored refresh token | `{ id }` |

`register`/`login` never include the password hash — `AuthService` builds the response explicitly via `toAuthResponse()` (`src/modules/auth/helpers/user.helper.ts`) rather than spreading the raw repository result.

Refresh tokens are bcrypt-hashed and persisted on the user document with `refreshTokenExpiresAt`; refreshing rotates the stored hash. Access tokens are signed with `JWT_SECRET`/`JWT_TIME` and verified against that same secret (including by `check-status`); refresh tokens are signed and verified with `JWT_REFRESH_SECRET`/`JWT_REFRESH_TIME` — always two distinct secrets, selected via `JwtService.getPayloadAndVerifyToken(token, secretKey)`.

## Users endpoints

Module: `src/modules/users/`. Reuses `UserRepository` exported from `AuthModule` — no repository of its own.

| Route | Access | Purpose |
|---|---|---|
| `GET /users` | `@Auth(ADMIN)` | Paginated list, `?search&page&limit` |
| `GET /users/:id` | `@Auth()` (any authenticated user) | Fetch one user |
| `PATCH /users/:id/roles` | `@Auth(ADMIN)` | Replace a user's roles |
| `PATCH /users/:id/status` | `@Auth(ADMIN)` | Toggle `isActive` |
| `DELETE /users/:id` | `@Auth(ADMIN)` | Soft delete |

## Settings endpoints

Module: `src/modules/setting/`. Class-level `@Auth(UserRoles.ADMIN)` — every route requires an admin token.

| Route | Purpose |
|---|---|
| `GET /settings/:key` | Read a setting (cache-first, `null` if missing) |
| `POST /settings` | Create/upsert a setting from `{ key, value, description? }` |
| `PATCH /settings/:key` | Update `value`/`description` |
| `DELETE /settings/:key` | Delete a setting and evict it from cache |

## DTOs and validation

Every controller method that accepts a body/query needs a DTO — the global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` strips/rejects anything without one. Pagination query DTOs: `PaginationDto` / `CursorPaginationDto` (see [database.md](./database.md#pagination)).

## Swagger

`setupSwagger` (`src/core/swagger/swagger.setup.ts`) mounts the UI at `/<API_SUB_PATH>/docs` with a bearer scheme named `access-token` and `persistAuthorization: true`.

The `@nestjs/swagger` CLI plugin is enabled in `nest-cli.json` (`classValidatorShim`, `introspectComments`) — request DTOs are auto-documented from their `class-validator` decorators and don't need explicit `@ApiProperty()`.

Shared response decorators (`src/common/decorators/api-response.decorator.ts`):

- `ApiOkResponseWrapped(Model, { isArray?, paginated?, status?, description? })` — documents the real `ResponseInterceptor` envelope (`allOf` of `ApiResponseDto` + `Model`); `paginated: true` adds the `meta` block.
- `ApiErrorResponses()` — bundles 401/403/404/422 responses against the shared error DTOs.

Reference usage (`src/modules/users/controllers/users.controller.ts`):

```ts
@ApiTags('Users')
@ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
@ApiErrorResponses()
export class UsersController {
  @ApiOperation({ summary: '...' })
  @ApiOkResponseWrapped(UserResponseDto, { paginated: true })
  findAll(@Query() query: FindUsersDto) { ... }
}
```

## Rate limiting

Global `ThrottlerGuard` with three tiers (`short` 10/s, `medium` 60/min, `long` 1000/hr) — see [architecture.md](./architecture.md#rate-limiting). Exceeding a limit returns 429 with `DEFAULT_TOO_MANY_CALLS`.

## Health check

`GET /api/v1/health` (`src/modules/health/`) — subject to the same global prefix and versioning as every other route, despite the module name. `@Public()`, `@RawResponse()` (Terminus' own payload is returned as-is, not wrapped). Backed by `@nestjs/terminus`; pings the active database (`MongooseHealthIndicator` or `TypeOrmHealthIndicator`, selected on `DB_TYPE` the same way `DatabaseModule` does). Returns 200 with a per-indicator status, or 503 if the check fails.

## Known Gaps

Nothing specific to this document — see `docs/architecture.md#known-gaps` and `docs/database.md#known-gaps` for what's still open across the project.
