# Contributing to Dorisio Frontend

Thank you for your interest in contributing to Dorisio! This document provides guidelines and instructions for contributing.

## Getting Started

Before you start, please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to understand our community standards.

## How to Contribute

### Filing Issues

When reporting a bug or suggesting a feature:
1. Check existing issues to avoid duplicates
2. Use the appropriate issue template (bug report or feature request)
3. Provide clear, detailed descriptions and steps to reproduce
4. Include screenshots or logs when relevant

### Which Repo?

- **frontend**: React/Next.js UI, components, pages, and frontend logic
- **backend**: API, authentication, payments, database services
- **sdk**: Client libraries for wallet integration and API interaction
- **.github-org**: Organization-level documentation and governance

## Branch Naming Conventions

Use descriptive branch names with the following format:

```
<type>/<issue-number>-<description>
```

Types:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks
- `test/` - Test additions or updates

Examples:
- `feature/123-user-profile-page`
- `fix/456-wallet-balance-display`
- `docs/789-update-readme`

## Commit Conventions

Follow conventional commits for clarity and automated changelog generation:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test additions or updates
- `chore:` - Build, dependencies, or tooling changes
- `ci:` - CI/CD configuration changes

Example:
```
feat(wallet): add balance refresh functionality

- Implement automatic balance sync every 30 seconds
- Add visual indicator for refresh status
- Update tests for new refresh logic

Closes #123
```

## Pull Request Process

1. Create a branch from `main` following naming conventions
2. Make your changes with clear, atomic commits
3. Write or update tests for your changes
4. Update documentation as needed
5. Push to your branch and create a Pull Request
6. Ensure CI checks pass
7. Request review from maintainers
8. Address review feedback

## Development Setup

See the project README for development environment setup instructions.

## Code Standards

- Follow the existing code style in the project
- Use TypeScript for type safety
- Write meaningful comments for complex logic
- Keep functions focused and testable
- Add tests for new features and bug fixes

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

Thank you for contributing!
