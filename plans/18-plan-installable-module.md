# Phase 18: Installable Module Packaging (TSUP + VisionSimulator Export)

**Timeline Reference**: Post-Phase 17 follow-up

---

## Phase Goal

Turn the app into an installable npm module while keeping the existing development workflow intact. Use **TSUP** for library builds, emit **TypeScript declarations**, and expose the `App` component as a named module export called **`VisionSimulator`**. Review the entire `package.json` and clean up dependencies as appropriate without removing any **Radix**-related design system packages.

---

## How Codex Should Use This Phase

- Keep all Radix UI dependencies intact (do not remove them).
- Prefer `peerDependencies` for host-provided packages (e.g., `react`, `react-dom`) after audit.
- Ensure TSUP build output includes both JS and `.d.ts` files.
- Ensure consumers can import `VisionSimulator` from the package root.

---

## Scope & Responsibilities

### Included

- Full audit of `package.json` dependencies and devDependencies.
- Define a packaging strategy using **TSUP**.
- Define an export surface: `VisionSimulator` (from `App`).
- Plan updates to `package.json` fields for library distribution.
- Plan changes to TS config for declaration generation.

### Explicitly Excluded

- Actual code refactors or dependency moves.
- UI changes or feature implementation.
- Any removal of Radix UI libraries.

---

## Deliverables (Plan Tasks)

### 1) Dependency Audit (Package.json)

- [ ] Inventory all dependencies vs devDependencies (runtime vs tooling).
- [ ] Identify packages that should become `peerDependencies` for library consumers:
  - React runtime (`react`, `react-dom`) at minimum.
  - Consider 3D stack (`three`, `@react-three/fiber`, `@react-three/drei`) if host app is expected to provide them.
  - Consider `mapbox-gl`, `react-map-gl`, `@mapbox/mapbox-gl-draw` if host app will already include Mapbox.
- [ ] Keep **all Radix UI packages** in dependencies (do not remove).
- [ ] Identify purely build-time tools that should remain `devDependencies`.
- [ ] Ensure dependency versions are compatible with the intended peer ranges.

### 2) TSUP Build Plan (Library Output)

- [ ] Add TSUP config (e.g., `tsup.config.ts`) targeting `src/index.ts`.
- [ ] Configure TSUP for ESM output with declaration generation (`dts: true`).
- [ ] Define output structure in `dist/`:
  - `dist/index.js` (ESM)
  - `dist/index.d.ts`
- [ ] Decide whether to also emit CJS (optional, based on target consumers).

### 3) Export Surface (VisionSimulator)

- [ ] Add or plan for a library entry file `src/index.ts` that re-exports:
  - `export { default as VisionSimulator } from "./App";` (or equivalent).
- [ ] Confirm `App` default export is compatible or plan a small wrapper export if needed.

### 4) Package.json Distribution Fields

- [ ] Update `package.json` for library distribution:
  - `name` (library package name) and `version` strategy.
  - `private: false` when ready to publish.
  - `main`/`module`/`types` or `exports` map (preferred).
  - `files` include `dist/` and required assets.
  - `sideEffects` if safe to mark.
- [ ] Add/plan `build:lib` script using TSUP.
- [ ] Ensure existing Vite app build remains available (do not remove `dev`/`build` scripts).

### 5) Type Declarations & TS Config

- [ ] Confirm `tsconfig` supports declaration emit for TSUP (`declaration`, `emitDeclarationOnly` as needed).
- [ ] Ensure `types` entry points resolve to `dist/index.d.ts`.
- [ ] Validate type export for `VisionSimulator` in generated typings.

### 6) Validation Checklist (No Implementation)

- [ ] Plan `npm pack` smoke test to verify package contents.
- [ ] Plan a minimal consumer import test:
  - `import { VisionSimulator } from "<package-name>";`
  - Ensure typings and runtime resolve cleanly.

---

## Acceptance Checklist

- [ ] A clear plan exists to convert the project into an installable module using TSUP.
- [ ] The plan explicitly preserves all Radix UI dependencies.
- [ ] The plan defines `VisionSimulator` as the exported module name for `App`.
- [ ] The plan covers dependency cleanup (including peerDependencies candidates).
- [ ] The plan covers TSUP build output and TypeScript declaration generation.
