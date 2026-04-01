# Branching and Release Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a standard GitHub workflow for this repository with `main` as the stable release branch, `dev` as the integration branch, `feature/*` branches for day-to-day work, and tag-driven GitHub Releases for versioned snapshots.

**Architecture:** The repository will keep product code unchanged while adding a lightweight governance layer: a contributor-facing branching guide in `docs/`, a GitHub Actions workflow that publishes releases whenever a `v*` tag is pushed, and an initial `dev` branch plus version tag so the flow is real from day one. The implementation should avoid unnecessary tooling and stay compatible with a plain WeChat Mini Program repository.

**Tech Stack:** Git, Markdown, GitHub Actions, semantic version tags.

---

### Task 1: Document the branching and release policy

**Files:**
- Create: `docs/branching-release.md`
- Modify: `README.md`

- [ ] **Step 1: Write the documentation content**

Create `docs/branching-release.md` with the following content:

````md
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
5. Push the tag to GitHub. The release workflow will publish a GitHub Release automatically.

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
````

Add a short `Versioning & Release` note to `README.md` that links to `docs/branching-release.md` and explains that releases are tag-driven.

- [ ] **Step 2: Verify the markdown renders cleanly**

Run:

```bash
sed -n '1,240p' docs/branching-release.md
sed -n '1,260p' README.md
```

Expected: the new doc reads clearly, the flow is unambiguous, and the README contains a link to the policy page.

- [ ] **Step 3: Commit the policy documentation**

```bash
git add docs/branching-release.md README.md
git commit -m "docs: add branching and release policy"
```

### Task 2: Add a tag-triggered GitHub Release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Add the workflow file**

Create `.github/workflows/release.yml` with this exact workflow:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Publish GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          name: ${{ github.ref_name }}
          tag_name: ${{ github.ref_name }}
```

- [ ] **Step 2: Verify the workflow syntax visually**

Run:

```bash
sed -n '1,220p' .github/workflows/release.yml
```

Expected: the workflow is tag-triggered, writes release artifacts with repository write permissions, and generates notes automatically.

- [ ] **Step 3: Commit the workflow**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add tag driven release workflow"
```

### Task 3: Establish the initial Git branches and version tag

**Files:**
- No code files; Git refs only

- [ ] **Step 1: Create the integration branch**

Run:

```bash
git branch dev
git push -u origin dev
```

Expected: `dev` exists locally and on GitHub, tracking `origin/dev`.

- [ ] **Step 2: Create the initial semantic version tag**

Run:

```bash
git tag -a v0.1.0 -m "release: v0.1.0"
git push origin v0.1.0
```

Expected: GitHub receives a `v0.1.0` tag, which triggers the release workflow and creates the first GitHub Release snapshot.

- [ ] **Step 3: Confirm the remote refs**

Run:

```bash
git branch -a
git tag --list
```

Expected: `main`, `dev`, `origin/main`, `origin/dev`, and `v0.1.0` are visible.

- [ ] **Step 4: Commit no additional code changes**

This task only creates Git refs, so no commit is needed beyond the branch/tag operations.

## Self-Review

- Spec coverage: the branching model is documented, the release automation is defined, and the initial branch/tag state is established.
- Placeholder scan: no TBD-style placeholders remain.
- Type consistency: branch names and tag names are consistent across the doc and workflow.
- Ambiguity check: `v0.1.0` is explicitly chosen as the first public snapshot to keep the versioning conservative and semantic.
