# CI/CD: GitHub Actions

**Change**: cicd-github-actions

## Intent

Add continuous integration for OpenCoaster via GitHub Actions. Run tests and type-checking on every push to `main` and every pull request targeting `main`.

## Scope

- Single workflow file at `.github/workflows/ci.yml`
- Runs on `ubuntu-latest` with Node 20
- Steps: checkout → setup Node (npm cache) → `npm ci` → `npx jest --passWithNoTests` → `npx tsc --noEmit`
- No deployment, no secrets, no build artifacts

## Approach

Standard single-job CI workflow. No matrix, no caching of `node_modules` beyond the built-in `actions/setup-node` cache.

## Rollout

- Merge to `main` — subsequent PRs will show CI status
- If CI blocks incorrectly, can be temporarily disabled by removing the `on:` triggers or reverting the file
