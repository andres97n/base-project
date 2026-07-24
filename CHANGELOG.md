# Changelog

All notable changes to this boilerplate are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Categories: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

## [Unreleased]

_Nothing yet._

## [1.0.0] - 2026-07-24

First semver-governed release. Establishes the boilerplate as a versioned product with
maintenance, release, and dependency governance.

### Added
- Maintenance & release governance: `DEPENDENCY-POLICY.md`, `UPGRADE.md`, `SUPPORT.md`,
  `SECURITY.md`, and a root `ARCHITECTURE.md` mapping clean-architecture layers onto the
  actual `common/ + core/ + modules/` structure.
- CI quality gate (`.github/workflows/ci.yml`): pnpm lint / typecheck / test / build, plus a
  MongoDB-backed e2e job and a non-blocking `pnpm audit --prod` step.
- Renovate configuration (`renovate.json`): grouped `@nestjs/*` and TypeScript-tooling PRs,
  dependency dashboard, dev-patch auto-merge, manual review for majors/runtime/security.
- `pnpm run typecheck` (`tsc --noEmit`) and a CI-only `lint:ci` script.
- `package.json` governance metadata: `packageManager`, `engines`, and a `boilerplate`
  self-identity block so forks can record their origin version. Added `.nvmrc` (Node 22).
- ADR `docs/decisions/0004-maintenance-and-release-policy.md`.

### Changed
- Pinned `@nestjs/mapped-types` from the unbounded `"*"` to `^2.1.0`.

### Security
- Runtime dependency audit wired into CI (`pnpm audit --prod`).

_Baseline prior to 1.0.0 (see `docs/decisions/`): ADR 0002 hardening pass (graceful shutdown,
Postgres env validation, e2e suite, coverage floor, Dockerfile) and ADR 0003 TypeScript 6.0
upgrade._

[Unreleased]: https://github.com/andres97n/base-project/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/andres97n/base-project/releases/tag/v1.0.0
