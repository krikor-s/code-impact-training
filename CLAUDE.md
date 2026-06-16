# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Orbit — a personal productivity app. Express + TypeScript backend, React + Vite + Tailwind frontend, Postgres database managed via Prisma.

## Stack

| Layer | Technology |
|---|---|
| Backend | Express 4, TypeScript, Node.js |
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Database | PostgreSQL 16 (Docker) + Prisma 7 ORM |
| Auth | JWT (jsonwebtoken + bcrypt) |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) |
| Testing | Vitest (both backend and frontend) |

## Commands

### Backend (`/backend`)
```bash
npm run dev        # start dev server (tsx, port 3000)
npm run build      # compile TypeScript → dist/
npm run test       # run Vitest test suite
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

### Frontend (`/frontend`)
```bash
npm run dev        # start Vite dev server (port 5173)
npm run build      # type-check + Vite build → dist/
npm run test       # run Vitest test suite
npm run lint       # ESLint
```

### Docker (full stack)
```bash
docker compose up   # starts db, backend, and frontend together
```

## Architecture Pattern

Backend follows a strict three-layer pattern: **route → controller → service**

- `src/routes/` — Express router, maps HTTP verbs + paths to controller methods
- `src/controllers/` — validates request input, calls service, sends response
- `src/services/` — all business logic and Prisma queries; no Express types here

## Known Gotchas

- `.env` lives at the **repo root** (`/code-impact-training/.env`), not inside `backend/`. Prisma config loads it with `path: resolve(__dirname, "../.env")`.
- **Prisma 7** uses `prisma.config.ts` (not `schema.prisma` datasource block) to configure the datasource URL. Run `npx prisma generate` after schema changes.
- In Docker, the backend connects to Postgres via the service hostname `db` (`DATABASE_URL=postgresql://postgres:password@db:5432/orbit`). Locally, use `localhost:5432` instead.
- `.env` is gitignored — never commit it.
- Commit messages use Conventional Commits format (e.g., `feat:`, `fix:`, `chore:`).
- Branch names follow `feat/<issue-number>-<short-description>` (e.g., `feat/101-update-claude-md`).

## Tools & Versions

- Node.js v24.14.1
- npm 11.11.0
- Git 2.52
- Claude Code 2.1.89
- VS Code
