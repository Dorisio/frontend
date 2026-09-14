# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup and scaffolding

### Changed

### Deprecated

### Removed

### Fixed

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
