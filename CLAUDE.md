# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with ts-node
npm run build        # Compile TypeScript → dist/
npm start            # Run compiled dist/index.js
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run seed         # Seed database via Prisma

npm run db:up        # Start PostgreSQL in Docker
npm run db:down      # Stop PostgreSQL container
npm run db:reset     # Recreate DB (down -v + up -d)
```

No test suite exists in this project.

## Architecture

Backend API for an indoor cycling studio booking platform. Express 5 + TypeScript + Prisma + PostgreSQL, with [better-auth](https://www.better-auth.com/) handling authentication.

### Request lifecycle

```
src/index.ts (start server, run background job)
  └─ src/app.ts (Express app)
       ├─ /api/auth/{*}  → better-auth handler (src/lib/auth.ts)
       ├─ global middleware: authenticate → CORS → json
       └─ routes/
            ├─ health.routes.ts     (no auth required)
            ├─ users.routes.ts
            ├─ rides.routes.ts
            ├─ studios.routes.ts
            └─ bookings.routes.ts
```

### Authentication & authorization

`src/lib/auth.ts` configures better-auth with a Prisma adapter. Sessions come in via `Authorization: Bearer <token>` headers. The `authenticate` middleware (`src/middleware/authenticate.ts`) validates every request and attaches `user` and `session` to `req`.

Role-based access uses `requireRole` (`src/middleware/requireRole.ts`). Four roles: `USER`, `INSTRUCTOR`, `ADMIN`, `SUPER_ADMIN`.

Route handlers are wrapped with `authed` (`src/middleware/authed.ts`) — a higher-order function that catches async errors. Request types use the generic `WithAuth<ReqBody, ResBody, Params>` from `src/types/withAuth.ts`.

### Key domain models (Prisma schema)

- **Ride** — belongs to an `Instructor` (User) and a `Studio`; has `rideType` (`NORMAL` | `EVENT` | `INTRO`) and `tokenPrice`
- **Booking** — links a `User` + `Ride` + `Bike`; supports a single friend booking per booking record (friendEmail, friendName, etc.); tracks check-in/out with timestamps and the user who performed the action
- **WaitlistEntry** — per (rideId, userId) with status `WAITING` | `NOTIFIED`; when promoted, `reservedUntil` is set to 15 min from now
- **Bike** — belongs to a `Studio`; unique on `(studioId, bikeNumber)`

### Waitlist background job

`src/index.ts` schedules `handleExpiredReservations` every 60 seconds. This service (`src/services/services/handleExpiredReservations.ts`) finds `NOTIFIED` entries whose `reservedUntil` has passed, moves them back to `WAITING`, and calls `triggerNextWaitlistUser` to promote the next person.

### Validation

Zod schemas live in `src/zod/schemas/`. Booking creation has a `superRefine` check that enforces friend booking constraints (e.g., can't book >2 bikes for a single user per ride).

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth signing secret |
| `BETTER_AUTH_URL` | Public URL of this server |
| `LOCAL_HOST_URL` | LAN IP for Expo dev client (e.g. `192.168.x.x`) |
| `NODE_ENV` | `development` \| `production` |
