# Security Policy

## Supported versions

See [docs/support.md](./docs/support.md). The latest major receives security fixes; the previous major
receives critical security fixes for 6 months after a new major is released.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the maintainer rather than opening a public issue.
Include affected version, reproduction steps, and impact. You can expect an initial response
within a few business days.

## Triage & response

- Runtime dependency vulnerabilities are triaged with `pnpm audit --prod` and fixed urgently,
  released as a patch version (see [docs/dependency-policy.md](./docs/dependency-policy.md)).
- CI runs `pnpm audit --prod` as a report-only step on every PR; Renovate raises security PRs
  via `vulnerabilityAlerts`.
- `pnpm audit --fix` is never run blindly, and never used to force a breaking major.

## Handled in the boilerplate by default

Global `JwtAuthGuard`, `ThrottlerGuard`, and `ValidationPipe` (`whitelist` +
`forbidNonWhitelisted` + `transform`); `helmet`; pino redaction of `authorization` /
`password`; bcrypt password hashing via `src/common/utils/brypt.util.ts`. See
[docs/architecture.md](./docs/architecture.md) and [CLAUDE.md](./CLAUDE.md).
