# Phase 24: Tag-Driven Package Release Automation

**Timeline Reference**: Post-Phase 23 follow-up

---

## Phase Goal

Move package publishing from local manual scripts to a tag-driven CI release flow:

- Any pushed release tag (for example `v1.2.3`) triggers GitHub Actions to build and publish the package.
- Remove local direct-publish behavior from `publish:minor`.
- Add a single local command surface to bump semantic version (`major`, `minor`, `patch`), create release tag, and push commit + tag automatically.

---

## How Codex Should Use This Phase

- Do not implement features; this is **plan-only**.
- Keep release orchestration deterministic and auditable (tag is the release event).
- Prefer one release path (tag -> workflow -> publish), not parallel local publish flows.
- Keep compatibility with current GitHub Packages registry (`https://npm.pkg.github.com/`).

---

## Scope & Responsibilities

### Included

- GitHub Actions workflow design for tag-triggered release publishing.
- Script strategy to replace `publish:minor` with semantic tag creation commands.
- Version/tag policy (`vX.Y.Z`) and package version synchronization rules.
- Validation gates (local pre-tag checks + CI publish checks).
- Documentation updates for maintainers.

### Explicitly Excluded

- Multi-registry publishing (npmjs + GitHub Packages) in this phase.
- Changes to package contents/exports/build artifacts beyond existing `build:lib` behavior.
- Release notes/changelog generation automation.

---

## Current Baseline (Observed)

- `package.json` contains `publish:minor`:
  - `npm run build:lib && npm version minor && npm publish --registry=https://npm.pkg.github.com/`
- This couples version bump + publish to local machine state and bypasses CI release guarantees.
- `.npmrc` already points scoped packages to GitHub Packages.

---

## Target Release Architecture

### 1) Release Event Model

- Source of truth for release trigger: pushed git tag matching `v*.*.*`.
- Publishing occurs only inside GitHub Actions release workflow.
- Local command only prepares and pushes version/tag; it does not publish.

### 2) Tag + Version Contract

- Tag format: `v<semver>` (examples: `v0.32.0`, `v1.0.0`).
- `package.json.version` must exactly match the tag without `v` prefix.
- Workflow fails fast if tag/version mismatch is detected.

### 3) Workflow Responsibilities

- Checkout code at tag commit.
- Install dependencies.
- Build library (`yarn build:lib`).
- Authenticate with GitHub Packages using `NODE_AUTH_TOKEN`.
- Publish package once, from tagged commit.

### 4) Local Tag Command Responsibilities

- Validate clean git tree before mutation.
- Perform semver bump (`major|minor|patch`).
- Create commit and `v<version>` tag.
- Push branch commit and tag to origin automatically.

---

## Implementation Workstreams

### Workstream A: GitHub Action for Tag Releases

- [ ] Create `.github/workflows/release-on-tag.yml`.
- [ ] Configure trigger on tag push pattern `v*.*.*`.
- [ ] Set required permissions (`contents: read`, `packages: write`).
- [ ] Add build + publish steps using existing package settings.
- [ ] Add guard step to verify `package.json.version === tag version`.

### Workstream B: Replace Local Publish Script

- [ ] Remove `publish:minor` from `package.json`.
- [ ] Add new release-tag command entrypoint (single script receiving bump type).
- [ ] Add convenience commands:
  - [ ] `release:patch`
  - [ ] `release:minor`
  - [ ] `release:major`
- [ ] Ensure command pushes commit + tag automatically.

### Workstream C: Release Script Design

- [ ] Implement `scripts/create-release-tag.mjs` (name can be finalized during implementation).
- [ ] Enforce allowed bump types: `major`, `minor`, `patch`.
- [ ] Fail early when git tree is dirty.
- [ ] Use `npm version <type>` for authoritative semver bump + tag creation.
- [ ] Push `HEAD` and tags to `origin` in the same command flow.

### Workstream D: Documentation and Operability

- [ ] Document release process in `README.md` (or dedicated release doc).
- [ ] Include prerequisites (GitHub package permissions, authenticated remote).
- [ ] Document one-command release examples for patch/minor/major.
- [ ] Document failure recovery path (tag exists, CI publish failed, retry policy).

---

## Proposed Command Surface (Plan)

```json
{
  "scripts": {
    "release:patch": "node scripts/create-release-tag.mjs patch",
    "release:minor": "node scripts/create-release-tag.mjs minor",
    "release:major": "node scripts/create-release-tag.mjs major"
  }
}
```

Behavior contract:
- These commands do not call `npm publish` directly.
- Successful command outcome means: version bumped, commit created, tag created, commit + tag pushed.
- GitHub Action then performs publish.

---

## CI Workflow Contract (Plan)

Workflow file target: `.github/workflows/release-on-tag.yml`

High-level steps:
1. Trigger on push tags matching `v*.*.*`.
2. Setup Node and install dependencies.
3. Build package with `yarn build:lib`.
4. Verify tag/version alignment.
5. Publish to GitHub Packages using `NODE_AUTH_TOKEN`.

Required repo configuration:
- `GITHUB_TOKEN` must have package write permission in workflow job context.
- Package owner/scope (`@vega-tek-hub`) must match repository publishing permissions.

---

## Acceptance Checklist

- [ ] Pushing `vX.Y.Z` tag triggers release workflow automatically.
- [ ] Workflow publishes package successfully to GitHub Packages.
- [ ] `publish:minor` is removed and no local publish script remains.
- [ ] New semantic release commands exist for patch/minor/major.
- [ ] New command pushes commit + tag automatically.
- [ ] CI rejects mismatched tag vs `package.json.version`.
- [ ] Release process is documented for maintainers.

---

## Risks & Mitigations

1. Risk: Tag pushed without package version sync.
   Mitigation: mandatory CI guard step before publish.

2. Risk: Duplicate publish attempt on existing version.
   Mitigation: rely on registry immutability; fail explicitly and document recovery.

3. Risk: Accidental releases from dirty local state.
   Mitigation: release-tag script blocks when working tree is not clean.

4. Risk: Token/permission misconfiguration in Actions.
   Mitigation: define explicit workflow permissions and document required access.

---

## Execution Sequence (PR Slices)

### PR-1: Script and Command Surface

Scope:
- Remove `publish:minor`.
- Add semantic release tag commands and release-tag script.

Gate:
- Local `release:patch|minor|major` command successfully creates and pushes tag in test branch.

### PR-2: Tag-Triggered Workflow

Scope:
- Add `.github/workflows/release-on-tag.yml` with build, version guard, and publish steps.

Gate:
- Test tag push runs workflow and reaches publish step with expected package metadata.

### PR-3: Documentation + Recovery Playbook

Scope:
- Add maintainers guide for release commands, CI expectations, and failure handling.

Gate:
- Another maintainer can perform a release end-to-end using documented steps.

---

## Definition of Done

Release management is tag-driven and CI-owned:
- Maintainer runs one semantic command (`release:patch|minor|major`).
- Command creates version commit and pushes release tag.
- Tag push triggers GitHub Action and publishes package to GitHub Packages.
- No direct local publish script remains.
