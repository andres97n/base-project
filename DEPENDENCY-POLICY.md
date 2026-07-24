# Dependency & Deprecation Policy

This boilerplate is maintained as a **versioned product**, not a static template. Dependency
changes are isolated, validated in CI, semver-tagged, and communicated through release notes.

> **Package manager:** this project uses **pnpm** (not npm/yarn). All commands below are pnpm.

## Core rules

- Keep `pnpm-lock.yaml` committed. Reproducibility comes from the lockfile + `--frozen-lockfile`,
  **not** from exact versions in `package.json` — dependencies use caret (`^`) ranges by design.
- Use `pnpm install --frozen-lockfile` in CI and deployment (the lockfile must never drift there).
- Keep the NestJS ecosystem aligned: update `@nestjs/*` packages as one compatible group, never
  a single `@nestjs/*` package in isolation.
- Before any NestJS **major** upgrade, read the official migration guide and use a dedicated
  branch (see [UPGRADE.md](./UPGRADE.md)).
- Never run `pnpm audit --fix` blindly, and never force through a fix that changes a major.
- Do not add `overrides`/patches without first investigating the dependency chain.

## Investigation commands

```bash
pnpm outdated              # what has newer versions
pnpm why <package-name>    # who depends on it (npm ls / npm explain equivalent)
pnpm list <package-name>   # installed version(s)
pnpm audit --prod          # runtime-only vulnerability report
```

## Deprecation policy (by impact)

| Situation | Action |
|---|---|
| Direct **runtime** dependency deprecated | Investigate and migrate with high priority |
| Direct **dev** dependency deprecated | Plan migration; usually less urgent |
| **Transitive runtime** dependency deprecated | Identify the direct parent (`pnpm why`) and update/replace it |
| **Transitive dev** dependency deprecated | Track it; resolve via tooling upgrades |
| **Runtime security** vulnerability | Fix urgently; release a patch version |
| Deprecated **NestJS API** | Migrate in the boilerplate before the next major |

Do not ignore deprecation warnings permanently — track every relevant one on the Renovate
**dependency dashboard**.

## SemVer

- **Patch** (`v1.0.1`): bug/security fixes, compatible dependency patches, internal refactors
  with no public-contract change.
- **Minor** (`v1.1.0`): backward-compatible optional features, new reusable modules/decorators/
  providers, additive config.
- **Major** (`v2.0.0`): breaking changes, removed APIs, mandatory structural changes,
  incompatible Node/NestJS upgrades, major core-module replacement.

Never remove a public boilerplate abstraction without deprecating it in a prior minor release
first — except for urgent security fixes.

## Automated updates (Renovate)

Configured in [`renovate.json`](./renovate.json):

- PRs for all updates; `@nestjs/*` grouped in one PR; TS tooling (`typescript`, `ts-node`,
  `ts-jest`, `ts-loader`, `tsconfig-paths`, `@types/node`, `typescript-eslint`) grouped together.
- Auto-merge **only** safe **patch** updates of **devDependencies** after CI passes.
- Never auto-merge majors or runtime dependencies. Manual review required for NestJS, runtime,
  security, and major updates.
- Dependency dashboard tracks the pending-upgrade / deprecation backlog.

## CI quality gate

Every dependency update and PR must pass the gate in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

```bash
pnpm install --frozen-lockfile
pnpm run lint:ci
pnpm run typecheck
pnpm test
pnpm run build
pnpm audit --prod        # report-only (non-blocking)
```

E2E runs in a separate job with a MongoDB service container.
