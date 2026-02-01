# Phase 20: Tailwind Classname Prefix Transformer (Build-Time Only)

**Timeline Reference**: Post-Phase 19 follow-up

---

## Phase Goal

Add a **build-time transformer** that prefixes all Tailwind classnames in the generated CSS output (e.g., `bg-blue-200` → `PREFIX-bg-blue-200`) **without modifying any source files**. The prefixing must happen during the build pipeline only.

---

## How Codex Should Use This Phase

- Do **not** edit or rewrite any application source code to add prefixes.
- Ensure prefixing is applied **only during build** (library CSS output).
- Keep the existing build pipeline intact and extend it with a new step.
- Preserve non-class selectors (e.g., element selectors, data-attributes, keyframes) unchanged unless they contain Tailwind utility classnames.

---

## Scope & Responsibilities

### Included

- Define a configurable prefix (e.g., `PREFIX-` or `vs-`).
- Build a transformer that rewrites CSS selectors to include the prefix.
- Wire the transformer into the `build:styles` pipeline.
- Ensure the final exported stylesheet uses prefixed classes only.

### Explicitly Excluded

- Modifying any `.tsx` or `.css` source files.
- Changing Tailwind config or source classnames in code.
- Changing runtime behavior (only build output is affected).

---

## Deliverables (Plan Tasks)

### 1) Prefix Specification

- [ ] Choose a prefix string (e.g., `vs-` or `PREFIX-`) and document it.
- [ ] Add a single source of truth for the prefix (env var or build script argument).
- [ ] Ensure prefix is applied consistently across all utilities.

### 2) Transformer Implementation Plan

- [ ] Implement a PostCSS-based transformer that:
  - Rewrites class selectors like `.bg-blue-200` → `.PREFIX-bg-blue-200`.
  - Handles complex selectors (grouped selectors, pseudo-classes, media queries).
  - Skips non-class selectors and keyframes names.
- [ ] Confirm the transformer can run after Tailwind output is produced.
- [ ] Keep the output deterministic (same input → same output).

### 3) Build Pipeline Integration

- [ ] Extend `build:styles` script:
  - Tailwind build → raw CSS
  - Optional flatten step (if used)
  - Prefix transformer → final CSS
- [ ] Ensure `dist/styles.css` is the prefixed output.
- [ ] Keep any `styles.raw.css` or intermediate artifacts for debugging (optional).

### 4) Validation Checklist (No Code Yet)

- [ ] Verify compiled CSS contains only prefixed Tailwind classes.
- [ ] Ensure no `@layer` or PostCSS syntax errors introduced.
- [ ] Ensure exports map still points to the final prefixed stylesheet.

---

## Acceptance Checklist

- [ ] A plan exists to prefix all Tailwind classnames **during build only**.
- [ ] The plan does not require touching any source files.
- [ ] The plan updates the build pipeline to emit prefixed CSS.
- [ ] The plan describes how to validate the prefixed output.
