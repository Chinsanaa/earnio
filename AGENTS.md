## Cursor Cloud specific instructions

→ Full project map: [context.md](./context.md)

### Project structure

Monorepo with three `package.json` files (root, `frontend/`, `backend/`). Run `npm install` in each directory.

### Services

| Service | Directory | Dev command | Port |
|---------|-----------|-------------|------|
| Frontend (Next.js 16) | `frontend/` | `npm run dev` | 3000 |
| Backend (Express 5) | `backend/` | `npm run dev` | 3001 |

### Key commands

- **Both servers:** `npm run dev` (root)
- **Lint:** `npm run lint` (frontend only)
- **Backend tests:** `cd backend && npm test`
- **Health:** `curl http://localhost:3001/api/health`

### Gotchas

- Next.js 16 `turbopack.root` lockfile warning is cosmetic.
- Backend has no lint script; frontend only.
- Read [frontend/AGENTS.md](./frontend/AGENTS.md) before changing Next.js code.
- MVP uses mock platform sync — see [instructions.md](./instructions.md).
