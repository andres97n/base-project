# Upgrade Guide

How to upgrade dependencies **in the boilerplate**, and how a **fork** should adopt boilerplate
releases. See also [DEPENDENCY-POLICY.md](./DEPENDENCY-POLICY.md) and [SUPPORT.md](./SUPPORT.md).

> Package manager: **pnpm**.

## Upgrading a dependency or framework (in the boilerplate)

1. Create a dedicated branch, e.g. `chore/nestjs-vNext-upgrade`.
2. Read the official migration notes and package changelogs.
3. Upgrade related packages as a compatible group (all `@nestjs/*` together; TS tooling
   together).
4. Replace deprecated APIs and packages.
5. Update tests, configuration, Dockerfiles, and docs as needed.
6. Run the full quality gate:
   ```bash
   pnpm install --frozen-lockfile
   pnpm run lint:ci
   pnpm run typecheck
   pnpm test
   pnpm run test:e2e   # requires a running DB (docker compose up -d mongodb)
   pnpm run build
   pnpm audit --prod
   ```
7. Add a `CHANGELOG.md` entry; if consumers must act, document steps here.
8. Merge only after review and CI success.
9. Bump the version, tag it, and publish the release:
   ```bash
   git tag v<x.y.z>
   git push origin v<x.y.z>
   ```
   Also bump `package.json` `version` and the `boilerplate.version` field.

Never claim an upgrade is complete if lint, typecheck, tests, build, or the audit fail.

## NestJS major upgrades

- Always read the official NestJS migration guide first.
- Upgrade `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/testing`, and
  the rest of the `@nestjs/*` group as one compatible set — never individually.
- Do not run `pnpm audit --fix` to force a major through.

## Adopting boilerplate releases in a fork

- Record the boilerplate version you started from — it lives in `package.json` under the
  `boilerplate` field (`name`, `version`, `upstreamRepository`).
- **Do not** continuously merge the boilerplate `main` into your fork.
- Adopt improvements deliberately: cherry-pick or a dedicated upgrade branch per boilerplate
  release, reviewed like any other change, then run your own quality gate.
- Consult `CHANGELOG.md` for the release's Added/Changed/Deprecated/Removed/Fixed/Security notes
  and any required migration steps before adopting.
