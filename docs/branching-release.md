# Branching and Release Policy

## Branch Model

- `main` holds production-ready snapshots.
- `dev` is the integration branch for completed work before release.
- `feature/<short-name>` branches are created from `dev` for isolated development.
- `hotfix/<short-name>` branches may be created from `main` for urgent fixes.

## Flow

1. Create a feature branch from `dev`.
2. Merge the feature branch back into `dev` after review and verification.
3. When `dev` is ready, merge it into `main`.
4. Create a semantic version tag such as `v0.1.0` on `main`.
5. Push the tag to GitHub. The release workflow publishes a GitHub Release automatically.

## Versioning

- Use semantic versioning: `vMAJOR.MINOR.PATCH`
- Use `v0.1.0` for the first public snapshot of this repository
- Increment `PATCH` for bug fixes, `MINOR` for additive changes, and `MAJOR` for breaking changes

## Suggested Commands

```bash
git checkout dev
git checkout -b feature/home-redesign
git checkout dev
git merge --no-ff feature/home-redesign
git checkout main
git merge --no-ff dev
git tag -a v0.1.0 -m "release: v0.1.0"
git push origin main dev --tags
```

