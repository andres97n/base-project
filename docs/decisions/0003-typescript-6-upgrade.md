# 0003 — Upgrade to TypeScript 6.0

## Status

Accepted — in effect.

## Context

`baseUrl` becomes deprecated starting in TypeScript 6.0 (error `TS5101` until migrated,
hard removal in 7.0). Upgrading past 5.x also changes three other tsconfig defaults that
this project relied on implicitly:

1. **`rootDir`** now defaults to the tsconfig's own directory instead of being inferred
   from the common directory of the input files.
2. **`types`** now defaults to `[]` instead of auto-including every installed `@types/*`
   package.
3. **`strict`** now defaults to `true`.

None of these were flagged by the toolchain actually in use before this change
(TypeScript 5.9.3) — they only start to matter once TypeScript itself is bumped to 6.0.

## Decision

Upgraded `typescript` to `^6.0.3`, `typescript-eslint` to `^8.63.0` (its first release
supporting a TS 6.x peer range), and `ts-jest` to `^29.4.12` (first release widening its
peer range past `<6`) — both were previously locked to versions that reject TypeScript 6
(`typescript-eslint@8.54.0` required `<6.0.0`; `ts-jest@29.4.6` required `<6`).

**`baseUrl` → `paths`.** Removed `"baseUrl": "./"` from `tsconfig.json`, replaced with
`"paths": { "src/*": ["./src/*"] }`. Verified this is a no-op change for every consumer
of path resolution in this repo:
- `tsc`/`nest build` type-checking compiles cleanly (TS requires the `./` prefix on
  `paths` entries once `baseUrl` is absent — confirmed via `TS5090` during testing).
- `@nestjs/cli`'s import-rewriting build hook
  (`node_modules/@nestjs/cli/lib/compiler/hooks/tsconfig-paths.hook.js`) — the actual
  mechanism that rewrites bare `src/...` imports to relative `require()` calls in
  `dist/` (not plain `tsc`, which leaves them untouched). Its source defaults `baseUrl`
  to `'./'` internally regardless of tsconfig, so it keeps working identically.
- `tsconfig-paths/register` (used by `pnpm run seed` and `test:debug` via `ts-node`) —
  its `loadConfig`/`createMatchPath` fall back to the tsconfig's own directory when
  `baseUrl` is absent (confirmed directly via a sandbox test against this repo's
  installed `tsconfig-paths` package).
- Jest is unaffected either way — it resolves `src/...` via its own explicit
  `moduleNameMapper` in `package.json`, not tsconfig.

**`rootDir` pinned explicitly, in two places, at two different values.**
- `tsconfig.build.json` (used by `nest build`, which excludes `test/`) now sets
  `"compilerOptions": { "rootDir": "src" }` — matches what was already being *inferred*
  today, preserving `dist/`'s exact structure (`dist/common`, `dist/modules`, ... — no
  `dist/src/...` nesting).
- `tsconfig.json` (the base config, which also covers `test/**/*.e2e-spec.ts` and is
  what `ts-jest` compiles against per-file) sets `"rootDir": "."`. This was required
  for a reason beyond the documented default-change: `ts-jest` compiles each spec file
  through a single-file TypeScript program, and TS 6.0 throws a hard error
  (`TS5011: The common source directory of 'tsconfig.json' is '<file's own dir>' ...`)
  whenever `outDir` is set but `rootDir` isn't explicit — even for a single file. This
  broke all five existing unit spec suites until `rootDir: "."` was added to the base
  config.

**`types` pinned to `["node", "jest"]`.** The codebase uses `@types/node` globals
(`process`, `Buffer` — 13 files) and `@types/jest` globals (`describe`/`it` — 5 spec
files) with no explicit imports. `@types/express`, `@types/bcrypt`,
`@types/compression`, and `@types/supertest` did not need to be listed — they're always
consumed via explicit `import ... from '...'` statements, which pull in their type
declarations regardless of the `types` array.

**`strict` explicitly set to `false`.** This project intentionally runs with only
`strictNullChecks: true` (documented in `CLAUDE.md`'s Code Style section), not full
strict mode. Left un-pinned, TS 6.0's new `strict: true` default would have silently
turned on `strictPropertyInitialization`, `strictFunctionTypes`, and the rest of the
strict family project-wide. The existing individual flags
(`noImplicitAny: false`, `strictBindCallApply: false`, `noFallthroughCasesInSwitch:
false`, `strictNullChecks: true`) continue to override the `strict` umbrella exactly as
before — explicit sub-flags always win over the umbrella regardless of its value.

## Alternatives considered

- **Adopt full `strict: true` as part of this upgrade**, since TS 6.0 nudges toward it.
  Rejected — that's a large, separate initiative (would require auditing every class
  for `strictPropertyInitialization`, every callback for `strictFunctionTypes`, etc.)
  and is out of scope for a compiler-version bump. Explicitly pinned `strict: false` so
  a future fork doesn't mistake the omission for an oversight.
- **Keep `baseUrl` via `"ignoreDeprecations": "6.0"`** instead of migrating to `paths`.
  Rejected — it's a temporary escape hatch that stops working in 7.0 anyway, and the
  `paths` migration was verified to be a true no-op, so there was no reason to defer it.
- **Set `rootDir` in only one place.** Considered pinning `rootDir` solely in
  `tsconfig.build.json` (matching the pre-6.0 inferred value there) and leaving the base
  `tsconfig.json` alone. Rejected once testing showed `ts-jest`'s single-file compilation
  against the base config hits `TS5011` regardless of what `tsconfig.build.json` does —
  the base config needed its own explicit value too.

## Consequences

- `tsc`, `nest build`, `pnpm run seed`, `test:debug`, and Jest all resolve `src/...`
  imports exactly as before; `dist/`'s output structure is byte-for-byte unchanged in
  shape.
- A stale `tsconfig.build.tsbuildinfo` (from `"incremental": true`) can produce an
  incomplete `dist/` (declaration files only, missing `.js`) after a tsconfig change
  that affects `rootDir`/`paths` — hit this once during verification, fixed by deleting
  the cache file and rebuilding clean. `*.tsbuildinfo` is now gitignored.
- Full unit suite (5 suites / 29 tests) and the e2e health-check suite pass unchanged.
- `pnpm run lint` still reports the same ~130 pre-existing `@typescript-eslint` errors
  documented as a "Remaining gap" in `0002-known-gaps-hardening-pass.md` — confirmed via
  a side-by-side baseline comparison (133 problems on the original 5.9.3/8.54.0
  toolchain vs. 130 after this upgrade, the difference being auto-fixable
  formatting/unnecessary-type-assertion cleanups, not new errors). This upgrade does not
  touch that gap.
- One test file needed a genuine fix unrelated to config:
  `src/core/http/helpers/axios-error.mapper.spec.ts` cast a mock `AxiosError['config']`
  (typed `InternalAxiosRequestConfig | undefined`) directly into a field requiring
  non-optional `InternalAxiosRequestConfig`; changed the cast to
  `NonNullable<AxiosError['config']>`.

## Remaining gaps (deliberately out of scope)

- **`strict: false`** — the codebase does not run full strict mode. Adopting it is a
  legitimate future initiative but a large one; not attempted here.
- **Pre-existing lint debt** (~130 `@typescript-eslint` errors, e.g. `no-unsafe-*` from
  untyped Express/passport-jwt request objects) — predates this change, already tracked
  in `0002-known-gaps-hardening-pass.md`, left untouched.

## Revisit when

A fork decides to adopt full TypeScript `strict` mode (a separate, larger initiative),
or when TypeScript 7.0 removes `baseUrl`/`ignoreDeprecations` entirely (this project no
longer uses either, so 7.0 should be a smaller jump when it arrives).

## Verification performed

- `npx tsc --noEmit` — zero diagnostics (no `TS5101`, `TS5090`, or `TS5011`).
- `pnpm run build` (clean, after clearing the stale `.tsbuildinfo`) — `dist/` structure
  verified unchanged (`dist/common`, `dist/modules`, ... — no `dist/src` nesting); spot
  checked `dist/common/utils/string.util.js` still compiles its `src/...` import to a
  relative `require(...)`.
- `pnpm test` — 5 suites, 29 tests, all passing.
- `pnpm run test:e2e` (with `NODE_ENV=dev`, per the existing `.env`) —
  `GET /api/v1/health` returns 200.
- `pnpm run lint` — baseline-compared against the original toolchain (5.9.3 /
  typescript-eslint 8.54.0 / ts-jest 29.4.6) by temporarily stashing all changes,
  reinstalling, and re-running: 133 problems before vs. 130 after, confirming no new
  errors were introduced by the upgrade.
