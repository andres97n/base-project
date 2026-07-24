# Support Policy

## Supported versions

- Only the **latest major** version receives new features.
- The **previous major** version receives critical **security** fixes for a defined maintenance
  window of **6 months** after the next major is released.
- Older majors are unsupported.

| Version | Status |
|---|---|
| 1.x | Active — features + fixes |

## Release model

- `main` — active development for the next release.
- `release/vX` — stable maintenance branch for a major version, created **only when** a newer
  major exists and the older one still needs security fixes.
- Releases are Git tags following SemVer (`v1.0.0`, `v1.1.0`, `v1.1.1`, `v2.0.0`). See
  [DEPENDENCY-POLICY.md](./DEPENDENCY-POLICY.md) for what constitutes patch/minor/major.

## Forks

- Every fork must record the boilerplate version it started from — the `boilerplate` field in
  `package.json` (`name`, `version`, `upstreamRepository`).
- Forks should adopt boilerplate releases selectively through controlled upgrade PRs
  (cherry-pick or upgrade branch), **not** uncontrolled upstream merges. See
  [UPGRADE.md](./UPGRADE.md).

## Security

Report vulnerabilities per [SECURITY.md](./SECURITY.md). Runtime security issues are fixed
urgently and released as a patch version.
