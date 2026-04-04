# Linting and Formatting

## Lint
```bash
pnpm lint
```

Lint config is defined in `eslint.config.mjs` and includes:
- unused import/vars warnings
- React refresh safeguards
- Tailwind class prefix enforcement

## Formatting
Prettier config lives at `.prettierrc.cjs` and `.prettierignore`.

There is no dedicated format script in `package.json`; use your editor or run Prettier manually if needed.
