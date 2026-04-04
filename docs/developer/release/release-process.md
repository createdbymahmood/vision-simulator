# Release Process

Release scripts are provided in `package.json`:
```bash
pnpm release:patch
pnpm release:minor
pnpm release:major
```

## What the Script Does
- Requires a clean git working tree
- Requires a non-detached branch
- Verifies `origin` remote and push access
- Bumps `package.json` version
- Creates `chore(release): vX.Y.Z` commit
- Creates `vX.Y.Z` git tag
- Pushes commit and tag
- Cleans up tags if push fails

## CI Publishing
A tag push triggers `.github/workflows/release-on-tag.yml`:
- Installs dependencies with pnpm
- Runs the library build
- Publishes to GitHub Packages

CI rejects releases when the git tag does not match `package.json.version`.
