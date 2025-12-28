# Contributing to BPA AI-Native

Thank you for your interest in contributing to BPA AI-Native. This document provides guidelines and information for contributors.

## Development Setup

See [README.md](README.md) for complete development environment setup instructions.

## Branch Strategy

We use a trunk-based development workflow:

- `main` - Production-ready code, protected branch
- `develop` - Integration branch for features (optional)
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `chore/*` - Maintenance branches

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Ensure all checks pass locally:
   ```bash
   pnpm lint
   pnpm build
   pnpm test
   ```

4. Push your branch and create a pull request

5. Wait for CI checks to pass and request review

6. After approval and CI pass, squash and merge

## Branch Protection Rules

The `main` branch is protected with the following rules. Repository administrators should configure these in GitHub Settings > Branches > Branch protection rules.

### Required Settings for `main` Branch

| Setting | Value | Description |
|---------|-------|-------------|
| Require a pull request before merging | Yes | All changes must go through PR |
| Require approvals | 1+ | At least one reviewer must approve |
| Dismiss stale pull request approvals | Yes | New commits require re-approval |
| Require status checks to pass | Yes | CI must pass before merge |
| Required status checks | `Build & Test` | The CI workflow job name |
| Require branches to be up to date | Yes | Branch must be current with main |
| Require conversation resolution | Yes | All comments must be resolved |
| Restrict who can push | Yes | Only maintainers can push directly |

### Configuring Branch Protection

1. Go to repository Settings > Branches
2. Click "Add branch protection rule"
3. Enter `main` as the branch name pattern
4. Enable the settings listed above
5. Under "Require status checks to pass before merging":
   - Search for and select `Build & Test`
6. Click "Create" or "Save changes"

### Status Checks

The following status checks are required:

- **Build & Test** - Runs lint, build, and test via Turborepo

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Examples

```
feat(api): add user authentication endpoint
fix(web): resolve login form validation error
docs: update README with setup instructions
chore(ci): add automated testing workflow
```

## Code Style

- TypeScript strict mode is required
- No `any` types without explicit justification
- Use pnpm only (npm/yarn not supported)
- Follow existing patterns in the codebase

## Testing

- Write tests for new features
- Ensure existing tests pass
- Run tests locally before pushing:
  ```bash
  pnpm test
  ```

## CI/CD Pipeline

### CI Workflow (`.github/workflows/ci.yml`)

Triggered on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Steps:
1. Checkout code
2. Install pnpm and Node.js 20
3. Install dependencies
4. Generate Prisma client
5. Run lint checks
6. Build all packages
7. Run tests

### Deploy Workflow (`.github/workflows/deploy.yml`)

Triggered on:
- Push to `main`
- Manual dispatch

Steps:
1. Build all packages
2. Upload build artifacts
3. Build and push Docker images to GHCR
4. Deploy to staging (when configured)

## Turborepo Caching

We use Turborepo for monorepo orchestration with caching:

- Local cache: `.turbo` directory (gitignored)
- CI cache: GitHub Actions cache
- Remote cache: Vercel (optional, requires `TURBO_TOKEN`)

### Enabling Vercel Remote Cache

1. Create a Vercel account and team
2. Generate a scoped access token
3. Add repository secrets:
   - `TURBO_TOKEN` - Your Vercel access token
   - `TURBO_TEAM` (variable) - Your Vercel team slug

## Questions?

Open an issue for questions or discussions about contributing.
