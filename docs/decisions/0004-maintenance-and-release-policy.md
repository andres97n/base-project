# 0004 — Maintenance, release & dependency governance

## Status

Accepted — in effect.

## Context

This repo is a boilerplate forked as the starting point for real projects. It had mature *code*
conventions (CLAUDE.md, `docs/`, ADRs, plans) but **no product-lifecycle governance**: no
release/versioning model, no dependency/deprecation policy, no CI quality gate, no dependency
automation, and no way for a fork to record which boilerplate revision it started from. The
maintainer adopted a formal "Maintenance and Dependency Policy" and asked for it to be applied
to the letter — but that policy is written for **npm**, whereas this project uses **pnpm**.

## Decision

Adopt the policy, translated to pnpm and wired into the existing docs culture.

- **Versioning:** first semver-governed release is **`1.0.0`** (was `0.0.1`). Added a
  `boilerplate` self-identity block (`name`, `version`, `upstreamRepository`) to `package.json`
  so forks can record their origin.
- **Dependency pinning:** keep caret (`^`) ranges + committed `pnpm-lock.yaml`. Reproducibility
  is guaranteed by `pnpm install --frozen-lockfile`, so exact pins in the manifest are
  redundant here. Fixed the one unbounded spec (`@nestjs/mapped-types: "*"` → `^2.1.0`).
- **Tooling:** added `typecheck` (`tsc --noEmit`), a CI-only `lint:ci` (no `--fix`),
  `packageManager: pnpm@10.30.3`, `engines` (Node `>=22 <23`, pnpm `>=10`), and `.nvmrc` (22).
- **CI:** `.github/workflows/ci.yml` (GitHub Actions) — quality-gate job
  (`install --frozen-lockfile` → `lint:ci` → `typecheck` → `test` → `build`, plus report-only
  `pnpm audit --prod`) and a separate e2e job with a `mongo:7` service container.
- **Automation:** `renovate.json` — grouped `@nestjs/*` and TS-tooling PRs, dependency
  dashboard, dev-patch auto-merge, manual review for majors/runtime/security.
- **Docs:** `DEPENDENCY-POLICY.md`, `UPGRADE.md`, `SUPPORT.md`, `SECURITY.md`, and a thin root
  `ARCHITECTURE.md` mapping the policy's `domain/application/infrastructure/presentation` layers
  onto the actual `common/core/modules` structure. Seeded `CHANGELOG.md` at 1.0.0.
- **Architecture:** documented the layer mapping; **no physical restructure**.

## Alternatives considered

- **Pin exact versions in `package.json`** (literal policy text). Rejected — the committed
  lockfile already gives byte-reproducible installs; exact pins add churn with no benefit under
  pnpm. Renovate manages controlled bumps instead.
- **Restructure `src/` into `domain/application/infrastructure/presentation`.** Rejected — a
  large breaking refactor that would fork every downstream project and contradicts the policy's
  own "keep architecture stable" rule. Documented the mapping instead.
- **Make `pnpm audit` a hard CI gate.** Rejected — pnpm audit is noisy/flaky; kept it
  report-only (`continue-on-error`) so transient advisories don't block unrelated PRs, with
  Renovate `vulnerabilityAlerts` as the actioned channel.

## Consequences

- Every PR to `main` runs the quality gate; e2e runs against a real MongoDB in CI.
- Renovate opens grouped, reviewable dependency PRs and tracks a deprecation/upgrade backlog.
- Forks can record and reason about their boilerplate origin version.
- Releases are reproducible: bump version → gate green → `git tag vX.Y.Z` → GitHub release from
  the changelog (see UPGRADE.md).

## Remaining gaps (deliberately out of scope)

- **~129-error `@typescript-eslint` lint baseline** (project-knowledge.md). `lint:ci` runs
  without `--fix` and will surface it; if it blocks CI, burn it down or make that step
  non-blocking initially. Tracked in `docs/plans/roadmap.md`.
- **No commit/husky/commitlint conventions** — still parked per the roadmap.
- **No `release/vX` branch yet** — created only when a v2 exists and v1 still needs security fixes.

## Revisit when

The lint baseline is burned down (tighten `lint:ci` to blocking), a NestJS major upgrade lands
(exercise UPGRADE.md end-to-end), or a v2 requires a `release/v1` maintenance branch.

## Verification performed

- `pnpm run typecheck` — zero diagnostics. `pnpm test` — 5 suites / 29 tests pass.
  `pnpm run build` — clean.
- `pnpm install --lockfile-only` then `pnpm install --frozen-lockfile` — lockfile updated for
  the `@nestjs/mapped-types` range and then verified drift-free.
- `renovate.json` — "Config validated successfully" via `renovate-config-validator`.
- `pnpm run lint:ci` — 130 problems (124 errors) from the known baseline; the CI Lint step is
  therefore `continue-on-error: true` (non-blocking) until the baseline is burned down.
