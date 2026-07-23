# Decisions

This folder holds decisions that remain **in effect** for the base project — the final outcome of something investigated, not the investigation itself. That's what `docs/plans/` is for (see [../plans/README.md](../plans/README.md)): open questions, findings, and deferred work. A decision moves here once it's settled and worth remembering the next time this boilerplate is forked or a related dependency is touched.

Each entry should cover: the decision, the context/problem that prompted it, alternatives considered, the outcome, when to revisit it, and how it was verified.

- **[0001-express5-wildcard-route-fix.md](./0001-express5-wildcard-route-fix.md)** — why `src/core/logger/logger.module.ts` pins an explicit Express-5-compatible route pattern instead of relying on `nestjs-pino`'s legacy `'*'` default.
- **[0002-known-gaps-hardening-pass.md](./0002-known-gaps-hardening-pass.md)** — closing the six `docs/architecture.md` Known Gaps: graceful shutdown, fail-fast Postgres env validation, a working e2e suite, core unit specs + a coverage floor, and an app Dockerfile/compose service.
