# Automated dependency updates and security scanning

The repository configuration provides the following automated checks:

- Dependabot checks the root npm dependencies weekly and groups patch updates separately from minor updates.
- CodeQL scans JavaScript and TypeScript on pull requests, pushes to `main` and `develop`, and weekly.
- Dependency Review checks pull request dependency changes and blocks newly introduced vulnerabilities rated moderate or higher.
- Dependabot patch update pull requests are set to squash auto-merge after the repository's required checks pass.

## Repository settings required

Repository administrators must enable these settings once under **Settings → Code security and analysis**:

1. Enable **Dependabot alerts** and **Dependabot security updates**.
2. Enable **Allow auto-merge** under **Settings → General → Pull Requests**.
3. Configure branch protection or a ruleset for `main` and `develop` so auto-merge waits for the repository's required CI checks.

CodeQL findings are published in the repository's **Security → Code scanning** tab. Dependabot alert and update status is shown under **Security → Dependabot**.
