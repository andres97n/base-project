# 0001 — Pin nestjs-pino to the Express 5 wildcard route syntax

## Status

Accepted — in effect.

## Context

`@nestjs/platform-express` ^11 resolves to **Express 5.2.1**, which bundles `path-to-regexp` v8. That version rejects bare legacy wildcard route paths (`*`, `?`, `+`) — it requires named wildcards like `{*path}`.

`nestjs-pino`'s `LoggerModule` hardcodes its default route match as:

```js
// node_modules/nestjs-pino/LoggerModule.js:30
const DEFAULT_ROUTES = [{ path: '*', method: RequestMethod.ALL }];
```

`src/core/logger/logger.module.ts` calls `PinoLoggerModule.forRootAsync(...)` without overriding `forRoutes`, so this default applies. Once Nest prepends the global `api` prefix, the effective path becomes `/api/*`, which fails `pathToRegexp()`. Nest's internal `LegacyRouteConverter` (`node_modules/@nestjs/core/router/legacy-route-converter.js`) catches the `TypeError`, auto-converts the path, and logs a `WARN` — on every single app boot. The app is never broken by this (all routes still map and pino still logs every request), but the warning is permanent noise until upstream changes.

By contrast, `nestjs-cls` already does proper Express-version feature detection (`node_modules/nestjs-cls/dist/.../feature-detection.utils.js`) and resolves its own mount point correctly for Express 5 — it was ruled out as a source of the warning.

## Decision

Explicitly set `forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }]` in the `useFactory` return of `PinoLoggerModule.forRootAsync` (`src/core/logger/logger.module.ts`), instead of relying on nestjs-pino's built-in default. This matches exactly what `LegacyRouteConverter` would have produced anyway (`route.replace('*', '{*path}')`), so logging behavior (every route, every method) is unchanged — only the startup warning disappears.

## Alternatives considered

- **Do nothing.** The warning is cosmetic and harmless, but it repeats on every boot indefinitely and could mask real warnings in the logs.
- **Downgrade to Express 4.** Rejected — fights the framework's own default and gives up Express 5 improvements for a one-line issue in a single dependency.
- **Wait for an upstream `nestjs-pino` fix.** No release addressing this exists as of this writing (`nestjs-pino` 4.6.1).

## Consequences

- No behavior change: pino still logs every route under every HTTP method.
- One line of override logic in `logger.module.ts` that has to be remembered/removed later.

## Revisit when

`nestjs-pino` ships a release that performs its own Express-5 feature detection (as `nestjs-cls` already does). At that point this override is redundant and the explicit `forRoutes` can be removed, falling back to the package default again.

## Verification performed

- `npx nest start` — confirmed the `LegacyRouteConverter` WARN no longer appears; `Nest application successfully started` logs cleanly with all controllers/routes mapped.
- `pnpm run lint` — no new errors introduced by this change (pre-existing `any`-related errors elsewhere in the same file are unrelated and tracked in `docs/plans/roadmap.md` P3).
