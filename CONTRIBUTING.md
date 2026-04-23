# Contributing to NEON GRID

This document defines the team workflow for branches, commits, and pull requests.

## Branching Rules

### Protected branches

- `main` is the default protected branch.
- `master` should be treated as protected if still used in your local or remote flow.
- Do not push directly to protected branches.

### Working branches

Create branches from the latest `main` using one of the following prefixes:

- `feature/<short-description>` for new functionality
- `fix/<short-description>` for bug fixes
- `hotfix/<short-description>` for urgent production fixes
- `chore/<short-description>` for maintenance tasks
- `docs/<short-description>` for documentation-only changes
- `refactor/<short-description>` for code restructuring without behavior changes

Examples:

- `feature/admin-rom-bulk-upload`
- `fix/session-cookie-refresh`
- `docs/readme-cicd-update`

## Commit Rules

Use Conventional Commit style:

```text
<type>(optional-scope): <short imperative summary>
```

Allowed types:

- `feat`
- `fix`
- `refactor`
- `docs`
- `chore`
- `test`
- `ci`
- `perf`

Examples:

- `feat(auth): add session validation for admin routes`
- `fix(bucket): prevent duplicate inserts on resync`
- `docs(readme): add architecture and ci sections`
- `ci(actions): add manual distribution workflow`

Commit message rules:

- Keep subject line under 72 characters when possible.
- Write in imperative mood ("add", "fix", "update").
- Group related changes in one commit.
- Avoid generic messages like "update files" or "fix stuff".

## Pull Request Rules

- Open a pull request from your branch to `main`.
- Link related issue IDs or task references.
- Provide a clear summary of what changed and why.
- Include screenshots or API examples for UI/behavior changes.
- Ensure CI checks pass before requesting review.
- At least one reviewer approval is recommended before merge.

## Merge Strategy

- Prefer squash merge for small or medium feature branches.
- Use merge commit only when branch history is intentionally preserved.
- Rebase on `main` before merge if conflicts exist.

## Quality Gate Before Merge

Run these locally before opening or updating a pull request:

```bash
npm install
npm run lint
npm run build
```

If tests are added, also run:

```bash
npm test
```

## Documentation Rule

Any change affecting architecture, workflows, API behavior, or developer setup must update:

- `README.md` for high-level usage and architecture notes
- `CONTRIBUTING.md` for process or policy changes
