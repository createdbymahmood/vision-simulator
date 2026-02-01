# Phase 21: Scoped Tailwind CSS for Library Embedding (No Classname Changes)

**Timeline Reference**: Post-Phase 20 follow-up

---

## Phase Goal

Scope all Tailwind-generated CSS and base theme styles to the library root so the host app is not affected, without changing any existing classnames in TSX.

---

## How Codex Should Use This Phase

- Do not edit component classnames (no prefixes).
- Use the existing root wrapper `.vision-simulator` as the scope anchor.
- Ensure global preflight and CSS variables are scoped.
- Keep build and dev workflows intact; prefer build-time transforms when possible.

---

## Scope & Responsibilities

### Included

- Analyze current styling entrypoints and global selectors.
- Define a scoping strategy (Tailwind `important`, PostCSS selector scoping, or `@scope`).
- Plan for base layer and variable scoping (`:root`, `body`, `*`, `.dark`).
- Integrate with `build:styles` and library exports.
- Validation steps to ensure no global leakage.

### Explicitly Excluded

- Renaming Tailwind utility classnames in TSX.
- Changing runtime behavior or theming API.
- Rewriting UI components.

---

## Context Snapshot (Current Styling)

- `src/index.css` imports Tailwind and `tw-animate-css`, defines theme variables on `:root` and `.dark`, and applies `@layer base` rules to `*` and `body`.
- `src/app.tsx` wraps the app in `<div className="vision-simulator">`.
- `build:styles` uses `tailwindcss -i src/index.css -o dist/style.css ...`.

---

## Deliverables (Plan Tasks)

### 1) Scoping Strategy Decision

- [ ] Evaluate options:
  - Tailwind `important: ".vision-simulator"` to scope utilities/components without touching classnames.
  - PostCSS selector transformer to prefix all selectors with `.vision-simulator` (or `:where(.vision-simulator)`), with special-case rewrites.
  - CSS `@scope` wrapper if browser support is acceptable.
- [ ] Choose a default scope selector: `.vision-simulator` (already in App) with optional env override.

### 2) Base Layer + Theme Variable Scoping Plan

- [ ] Rewrite `:root` variables to the scope selector (e.g., `.vision-simulator`).
- [ ] Rewrite `.dark` to `.vision-simulator.dark` (or `.vision-simulator [data-theme="dark"]`).
- [ ] Replace `body` rules with the scope container selector.
- [ ] Ensure `*` rules become `.vision-simulator :where(*)` to avoid specificity inflation.

### 3) Selector Transformer Plan (If Using PostCSS)

- [ ] Implement or configure a PostCSS pass that:
  - Prefixes all class and element selectors with the scope selector.
  - Skips or preserves `@keyframes` names and `@font-face`.
  - Rewrites `:root`, `html`, `body` into the scope container.
  - Handles grouped selectors, media queries, and nesting.
- [ ] Ensure `tw-animate-css` output is also scoped.

### 4) Build Pipeline Integration

- [ ] Update `build:styles` to produce:
  - `dist/styles.raw.css` (unscoped for debugging).
  - `dist/styles.css` (scoped output).
- [ ] Keep the `exports` map pointing at the scoped CSS.

### 5) Dev Workflow Consistency

- [ ] Ensure Vite dev build uses the same scoped CSS (plugin or prebuild step).
- [ ] Confirm the example app still renders with the wrapper class intact.

### 6) Validation Checklist (No Implementation)

- [ ] Confirm compiled CSS contains no unscoped `body`, `:root`, or universal selectors.
- [ ] Verify utilities only apply inside `.vision-simulator`.
- [ ] Smoke-test in a host app with its own Tailwind to ensure no collisions.

---

## Acceptance Checklist

- [ ] A plan exists to scope all Tailwind CSS to `.vision-simulator` without changing TSX classnames.
- [ ] The plan covers base layer and variable scoping plus `tw-animate-css`.
- [ ] The plan updates the style build output to a scoped `dist/styles.css`.
- [ ] The plan includes verification steps to prevent global leakage.
