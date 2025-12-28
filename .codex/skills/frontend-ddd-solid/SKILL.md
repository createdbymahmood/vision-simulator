---
name: frontend-ddd-solid
description: Practical guide for applying SOLID, clean architecture, and domain-driven structure in frontend/React TypeScript work. Use when organizing features into domain folders, breaking monolithic components, separating hooks/services/UI, designing ports/adapters, or refactoring for testability and maintainability.
---

---

# Frontend DDD + SOLID

## Overview

Domain-first frontend guidance for React/TypeScript: carve features into domain slices, enforce SOLID, isolate side effects, and keep UI thin. Use this to plan new features, refactor monolithic files, or review PRs for architecture drift.

## Quick start workflow

1. **Clarify the domain**: capture ubiquitous language, inputs/outputs, invariants, and main user intents.
2. **Define the slice**: create `src/domains/<name>/` with `core` (types/use-cases), `ports` (interfaces), `adapters` (API/db/local storage), and `ui` (components/hooks).
3. **Design use-cases first**: write pure functions for behaviors; inject dependencies via ports; return results + domain errors.
4. **Implement adapters**: wrap fetch/SDK/local state behind ports; keep mapping functions near adapters.
5. **Keep UI thin**: hooks coordinate use-cases; components render; avoid business rules in JSX.
6. **Test seams**: unit test use-cases; contract test adapters; component tests for UI states.

## Cross-cutting conventions

- Always use Yarn as the primary package manager; run installs/scripts with `yarn` and avoid introducing npm/pnpm lockfiles.
- Use `useCallbackRef` from `@radix-ui/react-use-callback-ref` instead of `React.useCallback` for stable callbacks.
- Always use kebab-case for every filename and component; when React requires PascalCase identifiers, keep the public/display name in kebab-case (e.g., `task-list.tsx`, `TaskList.displayName = 'task-list'`).
- Name event-like callbacks as `onX` (not `handleX`); e.g., `onConfirm`, `onSubmit`, `onToggle`.
- Prefer lodash utilities imported from `@lodash-es` instead of bespoke helpers whenever possible.
- Always use Zustand for any global state; avoid alternative global stores. Build stores as context-backed instances with `createZustandContextStore`, and write mutators with `immer`’s `produce` helpers plus typed `set/get` aliases (no inline anonymous mutations).

## UI composition guardrails

- Keep components tight (~150 lines or less). If a view gets bulky or has multiple sections, extract subcomponents.
- Local-only pieces can live in the same file; reusable/complex pieces get their own file under `ui/`. Avoid 400–500 line components packed with Tailwind class strings.
- Consolidate styling: use `clsx`/`cva` or small wrapper components instead of repeating long class lists.

## Folder blueprint (React/TS)

```
src/domains/
  tasks/
    core/          // types, domain services/use-cases
    ports/         // interfaces for data/side-effects
    adapters/      // fetch/SDK/local implementations of ports
    ui/            // hooks + components (feature entry lives here)
    index.ts       // public surface (re-export core + ui entry)
```

- UI imports only `core` and `ports` (types) for typing; no adapter-to-ui reacharound.
- Cross-domain usage goes through public entry (no deep imports).
- Shared utilities: put in `src/shared/` but only when truly cross-domain.

## SOLID + layering heuristics

- **Single responsibility**: each file owns one concern (use-case, adapter, hook, component).
- **Open/closed**: add new adapters via ports; avoid switch-on-type cascades in UI.
- **Liskov**: ports should be substitutable; no adapter-specific behavior leaks to UI.
- **Interface segregation**: split fat ports; keep hook props minimal.
- **Dependency inversion**: UI depends on ports/use-cases; adapters plug in via injection/composition.

## Refactor a large component

- Extract domain words and state transitions; write `core` types + a use-case to model them.
- Identify side effects (fetch, storage, timers) -> define ports + adapters.
- Move stateful orchestration into a hook; keep component as presentational.
- Add tests: use-case unit test, adapter contract test (mock API), component/hook happy + error paths.

## Review checklist

- Domain slice exists with `core/ports/adapters/ui` and public index.
- Business rules live in `core`; UI handles rendering + interaction only.
- Side effects isolated in adapters; ports are injected (or at least easily swappable).
- Types/errors align with domain language; no leaky transport shapes in UI.
- Tests cover use-cases and UI states; adapters mocked at boundaries.

## References

- See `references/frontend-ddd-solid.md` for detailed patterns, sample use-case + hook scaffolds, and PR review prompts.
