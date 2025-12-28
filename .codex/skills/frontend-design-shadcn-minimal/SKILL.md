---
name: frontend-design-shadcn
description: Design and build distinctive, production-grade frontend interfaces using shadcn/ui, Tailwind, and React. Emphasizes strong visual identity, system-first design, refined interaction, and non-generic aesthetics.
license: Complete terms in LICENSE.txt
---

## Purpose of This Skill

This skill is used when the user asks to **design or build frontend UI** — components, pages, or full applications — using a **modern shadcn-style stack**.

The goal is **not** to produce generic SaaS dashboards, template-looking UIs, or default component demos.

This skill produces:

- Interfaces with **clear visual intent**
- Production-ready React code
- UI that feels **designed, not assembled**
- shadcn/ui used as a **structural foundation**, never as the visible aesthetic
- Outputs that could realistically ship in a high-quality 2025 product

This is a **design-forward engineering skill**, not a styling exercise.

---

## Design Thinking (MANDATORY, INTERNAL)

Before writing any code, the assistant must reason through the following **internally**.

### 1. Establish Context

Clarify the interface’s role:

- **Purpose**: What job does this UI do?
- **Audience**: Designers, developers, operators, consumers, creatives?
- **Environment**: Internal tool, public product, marketing surface, experimental UI?

Design decisions must emerge from context, not habit.

---

### 2. Commit to a Single, Coherent Design Direction

Choose **one clear aesthetic direction** and execute it fully.

Examples (choose ONE — do not blend):

- Brutally minimal / typographic
- Editorial / magazine-like
- Industrial / utilitarian
- Luxury / restrained
- Retro-futuristic
- Organic / tactile
- Maximalist / expressive
- Playful / toy-like
- Brutalist / raw
- Art-deco / geometric

Partial commitment is worse than a bold wrong choice.

### 3. Define the Hook

Answer internally:

> **What is the one visual or interaction detail a user will remember after 5 seconds?**

This can be:

- typography
- motion
- spacing
- composition
- color usage
- interaction behavior

If there is no hook, the design is incomplete.

---

## System-First Implementation Standards

### Core Stack

- React (or React-compatible runtime)
- shadcn/ui (Radix-based primitives)
- Tailwind CSS
- CSS variables for theming
- Framer Motion (when motion is meaningful)

The UI must be **token-driven**, not ad-hoc.

---

### Design System Discipline (2025 Standard)

All UI must derive from a **coherent internal system**:

- Color tokens (neutral scale + semantic accents)
- Spacing scale
- Typography scale
- Radius scale
- Elevation / surface hierarchy
- Motion durations & easing

No arbitrary values.
No one-off spacing.
No magic numbers unless intentionally justified.

This reflects a **Blank.design–style methodology**: scalable, composable, production-ready.

---

## shadcn/ui Usage Rules

- shadcn/ui is a **primitive layer**, not a final aesthetic
- Primitives should be:

  - restyled
  - recomposed
  - wrapped into custom components

- Avoid rendering raw `<Button />`, `<Card />`, `<Dialog />` defaults without intent
- Accessibility and Radix behavior must remain intact

shadcn should disappear into the design.

---

## Aesthetic Execution Guidelines

### Typography (PRIMARY DESIGN DRIVER)

Typography should **lead the interface**, not decorate it.

- Choose fonts intentionally based on the aesthetic
- Display fonts for headings are encouraged
- Body fonts should be calm, readable, and neutral
- Variable fonts preferred when available
- Use:

  - deliberate scale jumps
  - intentional tracking
  - controlled line lengths

Avoid:

- purely default system stacks
- timid type scales
- visually anonymous typography

---

### Color & Theme

- Use CSS variables consistently (`:root`, `.dark`)
- Commit to:

  - one dominant tone
  - one accent color

- High contrast is preferred over “safe” palettes
- Dark themes must feel _designed_, not inverted

Avoid:

- overused purple/blue SaaS gradients
- neutral-everything gray UIs
- excessive accent colors

---

### Layout & Composition

- Grids are tools, not rules
- Use asymmetry, tension, and negative space intentionally
- Allow layouts to breathe
- Break predictable dashboard patterns unless explicitly required

Composition should feel **considered**, not templated.

---

### Motion & Interaction

Motion must communicate intent.

- Prefer:

  - page-level entrance choreography
  - meaningful hover states
  - subtle easing curves

- Use:

  - CSS transitions for simple interactions
  - Framer Motion for orchestrated motion

One memorable interaction is better than many forgettable ones.

Avoid:

- excessive animation
- gratuitous effects
- motion without purpose

---

### Texture, Depth & Materiality

Use selectively, not universally:

- Soft shadows
- Layered surfaces
- Subtle translucency
- Noise or grain (when appropriate)
- Border treatments as accents, not defaults

Flatness is acceptable **only if intentional**.

---

## Code Quality Requirements

All generated code must be:

- Copy-pasteable
- Idiomatic React
- Tailwind-clean
- Componentized and readable
- Production-ready

Include:

- Proper component composition
- Semantic HTML
- Accessible defaults (Radix preserved)

Do **not**:

- Stub logic
- Fake interactions
- Leave TODO placeholders
- Over-comment design rationale

The output should **demonstrate quality**, not explain it.

---

## Absolute Prohibitions 🚫

Never:

- Produce generic, AI-looking UIs
- Default to shadcn examples or templates
- Reuse the same visual style across unrelated outputs
- Converge on trend-driven but overused aesthetics
- Over-explain design theory in the output

This skill **shows**, not justifies.

---

## Final Principle

> **Intentionality beats complexity.**
> Minimal UIs must be obsessively refined.
> Expressive UIs must be confidently executed.

If a design feels “fine,” it is not finished.
