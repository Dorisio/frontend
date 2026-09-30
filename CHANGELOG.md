# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup and scaffolding
- Memory profiling and leak detection: runtime heap monitor with Sentry metrics (`src/lib/memory-monitor.ts`), development dashboard at `/dev/memory`, `pnpm test:memory` suite (run with `--expose-gc`), Playwright heap profiler + threshold gate (`pnpm memory:profile|baseline|check`), committed baseline budgets, and a CI `memory` job. Guides: `docs/MEMORY_PROFILING.md`, `docs/MEMORY_LEAK_PITFALLS.md`, `docs/MEMORY_MONITORING.md`
- Supporter loyalty system: bronze/silver/gold/platinum badges based on cumulative support, per-creator configurable thresholds, badge progress indicator, top-supporter leaderboard, and supporter opt-in/opt-out for a public badge profile (#42)
- Error monitoring with Sentry: client/server/edge initialization, React error-boundary reporting, signed-in user context, navigation breadcrumbs, and optional source map upload (#45)

### Changed

### Deprecated

### Removed

### Fixed
- Memory leaks: untracked timers in realtime/polling hooks and transient success banners are now cleared via `useSafeTimeout`; realtime tip/activity/notification state, the toast store, and the request-deduplicator map are bounded so long sessions no longer grow without limit

### Security

## [0.1.0] - 2024-01-01

### Added
- Initial release of Dorisio Frontend
- React/Next.js application setup
- Core UI components
- Authentication integration with backend
- User profile management
- Creator dashboard
- Payment integration UI
- Wallet management interface
- Analytics dashboard for creators

### Changed

### Deprecated

### Removed

### Fixed

### Security

---

## How to Update This Changelog

When making changes, update this file following these guidelines:

1. Add entries under the `[Unreleased]` section
2. Group changes by category: Added, Changed, Deprecated, Removed, Fixed, Security
3. When releasing a new version:
   - Create a new section with version number and date
   - Move entries from `[Unreleased]` to the new version
   - Update the version links at the bottom

### Example Entry

```
## [1.0.0] - 2024-01-15

### Added
- New feature description
- Another feature

### Fixed
- Bug fix description

### Security
- Security patch description
```

## Versioning

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backward compatible manner
- **PATCH** version when you make backward compatible bug fixes
- Pre-release versions may use: `1.0.0-alpha`, `1.0.0-beta`, `1.0.0-rc.1`

## Release Process

1. Update version number in `package.json`
2. Update this CHANGELOG.md
3. Create a git tag: `git tag v<version>`
4. Push changes and tags to repository
5. Create a GitHub release from the tag

For more information, see [CONTRIBUTING.md](CONTRIBUTING.md).
