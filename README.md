# 3D Jobs Planner

3D Jobs Planner is a full-stack job planning and time tracking app for production workflows such as 3D printing, scanning, modelling, post-processing, engineering tasks, and freelance project work.

The repository contains a Next.js web app, a REST API, a shared database package, and an Expo mobile app. Users can create tasks, organize them by status, track live work time, review completed tasks, search large task lists, and manage shared/admin workflows.

## Features

- Web dashboard with analytics, task management, completed tasks, calendar, settings, and admin tools.
- Expo mobile client with dashboard, jobs, active timer, calendar, completed tasks, admin, and settings screens.
- Active, paused, shared, and completed task flows kept separate for cleaner day-to-day work.
- Live start/stop timer with active task visibility.
- Completed task review with search.
- Task filtering by status, type, project, owner, and search text.
- JWT-style session auth with role-aware UI and API behavior.
- Neon PostgreSQL database access through Drizzle ORM.
- Responsive UI for desktop web and mobile devices.

## Tech Stack

- Monorepo: npm workspaces
- Web and API: Next.js, React, TypeScript, Tailwind CSS
- Mobile: Expo, React Native, Expo Router
- Database: Neon PostgreSQL, Drizzle ORM
- Auth: password hashing with bcryptjs, signed app session token
- Tooling: ESLint, TypeScript

## Repository Structure

```text
.
├── 3d-jobs-web/       # Next.js web app and API routes
├── 3d-jobs-mobile/    # Expo mobile app
├── 3d-jobs-share/     # Shared workspace package placeholder
├── packages/db/       # Drizzle schema, migrations, seed scripts
├── scripts/           # Helper scripts
├── package.json       # Root workspace scripts
└── .env.example       # Required environment variables template
```

## Prerequisites

- Node.js 20+
- npm 10+
- A Neon PostgreSQL database
- Expo Go or an emulator/device for the mobile app

## Environment Setup

Create a local `.env` file from the template:

```bash
cp .env.example .env
```

Fill in:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

Notes:

- `DATABASE_URL` must point to the Neon database used by the project.
- `AUTH_SECRET` should be a long random value in production.
- `EXPO_PUBLIC_API_URL` should point to the web/API server reachable from the mobile device. For a physical phone, use your machine LAN IP instead of `localhost`.

## Install

```bash
npm install
```

## Database

Run migrations:

```bash
npm run db:migrate
```

Seed sample data if needed:

```bash
npm run db:seed
```

## Development

Run both apps:

```bash
npm run dev
```

Run only the web app/API:

```bash
npm run dev:web
```

Run only the mobile app:

```bash
npm run dev:mobile
```

Default local web/API URL:

```text
http://localhost:3001
```

## Quality Checks

Run lint checks for all workspaces:

```bash
npm run lint
```

Build the web app:

```bash
npm run build:web
```

## Useful Scripts

```bash
npm run dev          # Start web/API and mobile dev servers
npm run dev:web      # Start Next.js on port 3001
npm run dev:mobile   # Start Expo
npm run build:web    # Build the web app
npm run db:migrate   # Apply database migrations
npm run db:seed      # Seed database data
npm run lint         # Lint all workspaces
```

## GitHub Readiness

The repository is prepared to keep source code, config, migrations, and documentation in Git while excluding:

- local environment files and secrets
- node_modules
- Next.js, Expo, TypeScript, and build caches
- logs
- generated uploads
- local worktree folders
- mobile signing certificates

For reproducible installs, commit `package-lock.json` with the project.

## License

ISC
