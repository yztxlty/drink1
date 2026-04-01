# Contributing to Drink1

Thanks for helping improve Drink1.

Drink1 is a WeChat Mini Program hydration tracker built with a simple branch model and tag-driven releases. This guide explains how to contribute safely and keep the repository release-ready.

## Branch Model

- `main` is the stable branch.
- `dev` is the integration branch for completed work.
- `feature/<short-name>` branches are created from `dev` for new work.
- `hotfix/<short-name>` branches may be created from `main` for urgent fixes.

## Recommended Workflow

1. Start from `dev`.
2. Create a feature branch:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-short-name
```

3. Make your changes in small, reviewable commits.
4. Run the relevant checks for the files you changed.
5. Merge the feature branch back into `dev` after review and verification.
6. When `dev` is ready for release, merge it into `main`.
7. Create a semantic version tag on `main` and push it to GitHub.

## Pull Request Expectations

- Keep each pull request focused on one task.
- Use clear titles and commit messages.
- Include screenshots when you change UI behavior.
- Mention any data migration, storage change, or release impact.
- Do not mix unrelated refactors with feature work.

## Release Checklist

Before merging `dev` into `main` and cutting a tag, confirm the following:

- The app opens cleanly in WeChat DevTools.
- The changed pages render without layout regressions.
- Any affected scripts or verification checks still pass.
- The README stays accurate for user-visible changes.
- The branching and release policy still matches the current workflow.
- The tag name follows semantic versioning, such as `v0.1.0`, `v0.1.1`, or `v1.0.0`.

Suggested commands:

```bash
git checkout main
git merge --no-ff dev
git tag -a v0.1.1 -m "release: v0.1.1"
git push origin main dev --tags
```

## Commit Message Style

Use short, conventional prefixes when possible:

- `feat:` for new user-facing functionality
- `fix:` for bug fixes
- `docs:` for documentation
- `chore:` for maintenance
- `ci:` for workflow and automation updates

Examples:

```bash
feat: add quick amount presets
fix: correct profile chart spacing
docs: update README screenshots
ci: add release workflow
```

## Repository Notes

- Keep shared text in `utils/copy.js`.
- Keep reusable UI behavior in `components/`.
- Keep hydration state and derived summaries in `utils/store.js`.
- Store README images under `docs/readme/`.
- Update `docs/branching-release.md` whenever the branch or release policy changes.

