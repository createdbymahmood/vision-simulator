---
name: software-architecture
description: Quality-focused software development guidance rooted in Clean Architecture and DDD. Use when writing or reviewing code, designing features, or assessing architecture; emphasizes early returns, domain-first design, library-first solutions, clear naming, and separation of concerns.
---

# Software Architecture Skill

Use this for design/review/implementation decisions that demand maintainable, domain-focused code.

## Core principles

- Prefer **early returns** over deep nesting.
- **Library-first**: search for mature libraries/solutions before custom code.
- **Clean Architecture/DDD**: keep domain logic isolated from infrastructure/UI.
- **Separation of concerns**: no DB calls in controllers; keep business logic out of UI.
- **Naming**: avoid generic `utils/helpers`; use domain-specific names.
- **Decompose** long functions (>50 lines) and files (>200 lines) into cohesive parts.
- **Arrow functions** preferred where possible.

## Best practices

- Define clear use cases; keep them isolated from frameworks.
- Keep business logic framework-agnostic; inject infrastructure at boundaries.
- Handle errors explicitly; type catches when possible.
- Avoid NIH: don’t reimplement auth/state/validation if solid libraries exist.
- Maintain focus: one module, one purpose; enforce explicit boundaries between contexts.
- Always use absolute paths if configured. eg: import {x} from '@/components/ui/x'

## Anti-patterns to avoid

- Mixing business logic with UI/infrastructure.
- Dumping unrelated helpers into generic files.
- Over-custom solutions when stable libraries exist (auth, state, validation, retries).

## Quality checklist

- Early returns used; minimal nesting.
- Naming reflects domain intent; no vague buckets.
- Functions concise (<50 lines); files scoped (<200 lines) or split.
- Proper error handling; no unchecked side effects.
- Dependencies chosen over custom code when sensible.
- Architecture respects boundaries (domain vs infrastructure vs UI).
