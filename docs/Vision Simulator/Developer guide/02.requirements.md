# Requirements

## Tools
- Git
- Node.js (modern LTS recommended)
- `pnpm@10.30.2`

## pnpm via Corepack
```bash
corepack enable
corepack prepare pnpm@10.30.2 --activate
```

## Notes
The repo enforces pnpm using the `packageManager` field in `package.json`. Use `pnpm` for all install and build commands.
