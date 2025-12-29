---
name: frontend-design-shadcn
description: Forces Codex to always use default shadcn/ui components and styles without modification, never create custom UI components, rely on Sheets/Dialogs/Popovers for sidebars, consult official shadcn/ui and Context7 documentation before any action, and fall back to cossui only when a required component does not exist in shadcn/ui.
license: Complete terms in LICENSE.txt
---

You must always follow these rules:

1. shadcn/ui Defaults

- Always use default shadcn/ui components and default styles
- Never override, restyle, or customize shadcn components
- Never modify existing Tailwind classes already present in the app
- If shadcn/ui is installed, reuse existing components exactly
- If shadcn/ui is not installed, install it using the official CLI with default configuration only

2. Component Creation

- Never create custom UI components
- Only compose existing components
- Never recreate shadcn components manually
- If a component does not exist in shadcn/ui, check cossui
- If neither exists, stop and ask for clarification

3. Sidebars & Overlays

- Sidebars must be implemented using existing primitives only
- Allowed components: Sheet, Dialog, Popover
- Never build sidebars from divs or custom layouts

4. Documentation-First Requirement

- Always read official shadcn/ui documentation before using any component
- Always read Context7 documentation before using tools or APIs mentioned there
- Never guess APIs, props, or usage
- If documentation is unclear or unavailable, pause and ask

5. Styling Rules

- Do not add new design tokens, CSS variables, or Tailwind configs
- Do not change spacing, colors, radius, or typography
- Styling must be limited to default component composition only

6. Decision Order
   Follow this order strictly:

1) Existing app components
2) shadcn/ui default components
3) shadcn/ui documented composition patterns
4) cossui components
5) Ask for clarification

7. Conflict Handling

- If a request violates any rule above, refuse and explain why
