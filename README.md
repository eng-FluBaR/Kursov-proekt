# 3D Jobs Planner

Full-stack job planning and time tracking platform for 3D production work. The app supports planning jobs, grouping work by projects and task types, tracking active time, reviewing completed work, sharing visibility with other users, and managing users/admin data from a web workspace plus an Expo mobile client.

## Table of Contents

1. Executive Summary
2. Feature Scope
3. Technology Stack
4. System Architecture
5. Database Model
6. Authorization and Roles
7. Job and Time Entry Lifecycle
8. Key Application Flows
9. Project Structure
10. Environment and Configuration
11. Local Development
12. Build and Deployment
13. Troubleshooting Guide
14. Operational Checklist
15. Reference Files

## 1. Executive Summary

3D Jobs Planner is a monorepo application built from:

- `3d-jobs-web`: Next.js web application and API server.
- `3d-jobs-mobile`: Expo mobile client.
- `packages/db`: shared Drizzle ORM schema, migrations, and seed scripts.
- `3d-jobs-share`: reserved shared workspace package.

The system is designed around practical production planning for 3D-related work such as printing, scanning, modelling, post-processing, engineering tasks, and freelance job tracking.

Core capabilities:

- email/password authentication with signed app sessions;
- role-aware web and API behavior;
- project, job, task type, and time entry management;
- live timer start/stop workflow;
- completed job review and reporting;
- user and job visibility sharing;
- Neon PostgreSQL persistence through Drizzle ORM;
- web and mobile clients using the same API surface.

## 2. Feature Scope

### Web Workspace

- Dashboard and analytics views.
- Jobs workspace with active, paused, shared, and completed job flows.
- Project-based organization.
- Calendar and history-oriented time review.
- Settings page with user-facing preferences.
- Admin page for users, statistics, permissions, and shared job visibility.
- CSV/Word-style export helpers for operational reporting.

### Mobile Client

- Expo Router based navigation.
- Login and registration screens.
- Dashboard, jobs, timer, calendar, manual entry, completed, admin, and settings tabs.
- API client that talks to the Next.js server through `EXPO_PUBLIC_API_URL`.
- Bearer token support for mobile API requests.
- Local preview/mock data utilities for development-friendly screens.

### API and Data Operations

- Auth endpoints for register, login, logout, and current user lookup.
- Job endpoints for listing, creating, updating, deleting, file metadata, and file download flow.
- Time entry endpoints for creation, listing, active timer lookup, and stopping entries.
- Mobile-specific API routes for mobile-friendly project, task type, time entry, and current user access.
- Admin endpoints for users, password reset/update, statistics, user visibility permissions, and job sharing.
- Health endpoint for database connectivity checks.

## 3. Technology Stack

| Layer | Technology |
| --- | --- |
| Monorepo | npm workspaces |
| Web app | Next.js 16, React 19, TypeScript |
| Web styling | Tailwind CSS 4, custom component styles |
| API | Next.js Route Handlers |
| Mobile app | Expo 54, React Native 0.81, Expo Router |
| Database | Neon PostgreSQL |
| ORM/migrations | Drizzle ORM, drizzle-kit |
| Auth | bcryptjs password hashing, signed app session token/cookie |
| Hosting | Netlify planned for the Next.js web/API app |
| Tooling | ESLint, TypeScript, concurrently |

Root scripts:

```bash
npm run dev          # Start web/API and mobile dev servers
npm run dev:web      # Start Next.js on port 3001
npm run dev:mobile   # Start Expo
npm run build:web    # Build the web app
npm run build:mobile # Mobile placeholder build script
npm run db:migrate   # Apply Drizzle migrations
npm run db:seed      # Seed demo/reference data
npm run lint         # Lint web and mobile workspaces
```

## 4. System Architecture

```text
Browser / Expo Mobile
        |
        v
Next.js Web App + Route Handlers
        |
        v
Auth/session helpers + permission helpers
        |
        v
Drizzle ORM
        |
        v
Neon PostgreSQL
```

### Frontend Access Guarding

- Public pages are available for unauthenticated visitors.
- App pages read `/api/auth/me` and render role-aware navigation.
- Admin navigation is shown only when the authenticated user has the `admin` role.
- API routes perform server-side auth checks and return `401` or `403` when needed.

### API Access Pattern

- Web requests primarily use the `tasktimer_user` HTTP-only cookie.
- Mobile requests use `Authorization: Bearer <token>` when a token is available.
- CORS headers are applied to `/api/*` through `3d-jobs-web/src/proxy.ts`.

## 5. Database Model

### 5.1 Operational Data Dictionary

| Table | Purpose | Key Relations | Notes |
| --- | --- | --- | --- |
| `users` | Application users and role metadata | primary owner for projects, jobs, and time entries | Roles are `user` or `admin`; passwords are stored as hashes. |
| `projects` | Work containers for jobs and time entries | `user_id -> users.id` | Supports color, description, and archived state. |
| `task_types` | Catalog of task categories | referenced by jobs/time entries | Useful for work classification such as modelling, printing, review, etc. |
| `jobs` | Main planned work records | `user_id`, `project_id`, optional `task_type_id` | Status-driven workflow: active, paused, completed, or compatible custom status values. |
| `time_entries` | Tracked work sessions | `user_id`, `project_id`, optional `job_id`, optional `task_type_id` | Open entries have `ended_at = null`; completed entries store duration. |
| `entry_files` | Files attached to time entries | `time_entry_id -> time_entries.id` | File metadata table for image/model/document/other file types. |
| `job_files` | Files attached to jobs | `job_id -> jobs.id`, `uploader_id -> users.id` | Stores metadata and storage keys for job-level files. |
| `task_visibility_permissions` | User-to-user task visibility grants | grantor/viewer/subject all reference `users.id` | Allows one user to view another user's tasks when granted. |
| `job_visibility_permissions` | Job-specific sharing grants | grantor/viewer reference users, `job_id -> jobs.id` | Allows sharing individual jobs without exposing every task. |

### 5.2 Migration Source

The Drizzle schema lives in:

```text
packages/db/src/schema.ts
```

Migration files live in:

```text
packages/db/drizzle/
```

## 6. Authorization and Roles

### Role Definitions

- `user`: standard account that can manage its own projects, jobs, and time entries.
- `admin`: operational account that can access admin-only routes and manage users/permissions.

### Authorization Model

- Passwords are hashed with `bcryptjs`.
- Signed auth data is created and verified in `3d-jobs-web/src/lib/auth-session.ts`.
- Web sessions are stored in the `tasktimer_user` cookie.
- API requests can also authenticate through a Bearer token.
- Admin-only handlers use `requireAdmin`.
- Permission helpers check shared user/job visibility for collaborative workflows.

### Access Matrix

| Area | unauthenticated | user | admin |
| --- | --- | --- | --- |
| Public home/login/register | yes | yes | yes |
| Dashboard/analytics/jobs/calendar/projects/settings | limited/redirected by UI/API behavior | yes | yes |
| Own jobs and time entries | no | yes | yes |
| Shared jobs/tasks | no | when granted | yes |
| Admin workspace | no | no | yes |
| User and permission management | no | no | yes |

## 7. Job and Time Entry Lifecycle

### Job Lifecycle

```text
Create job
   |
   v
active
   |
   +--> paused
   |       |
   |       v
   |     active
   |
   v
completed
```

Lifecycle notes:

- Jobs belong to a project and a user.
- Jobs can optionally be connected to a task type.
- Completed jobs are used by review/reporting screens.
- Shared jobs are exposed through `job_visibility_permissions`.

### Time Entry Lifecycle

```text
Start timer
   |
   v
time_entries row with ended_at = null
   |
   v
Stop timer
   |
   v
ended_at and duration_minutes are stored
```

Lifecycle notes:

- A user should have at most one active timer in normal UI flow.
- Time entries can be connected to a job, project, and task type.
- API responses support both web and mobile clients.

## 8. Key Application Flows

### 8.1 Authentication Flow

```text
Register/Login form
   |
   v
Next.js auth route
   |
   v
Validate credentials / hash password
   |
   v
Create signed auth session
   |
   v
Web cookie or mobile Bearer token
```

### 8.2 Timer Flow

```text
User selects project/job/task type
   |
   v
POST /api/time-entries
   |
   v
Active entry appears in dashboard/timer UI
   |
   v
POST /api/time-entries/[id]/stop
   |
   v
Completed duration appears in history, analytics, and job totals
```

### 8.3 Admin Sharing Flow

```text
Admin opens admin workspace
   |
   v
Select viewer and subject user or specific job
   |
   v
Create permission grant
   |
   v
Viewer can see granted tasks/jobs in supported screens/API responses
```

## 9. Project Structure

```text
.
|-- 3d-jobs-web/          # Next.js web app and API routes
|   |-- src/app/          # App Router pages, layouts, and API route handlers
|   |-- src/components/   # Web UI components
|   |-- src/lib/          # DB, auth, admin, permission, and file helpers
|   `-- public/           # Static assets
|-- 3d-jobs-mobile/       # Expo mobile app
|   |-- src/app/          # Expo Router screens and tabs
|   |-- src/components/   # Mobile UI components
|   |-- src/contexts/     # Auth and theme providers
|   |-- src/lib/          # Mobile API client and preview data
|   `-- src/assets/       # Mobile image assets
|-- packages/db/          # Drizzle schema, migrations, and seed scripts
|-- scripts/              # Local development helper scripts
|-- .env.example          # Environment variable template
|-- package.json          # Root workspace scripts
`-- README.md             # Project documentation
```

## 10. Environment and Configuration

### 10.1 Required Environment Variables

Create `.env` in the repository root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

### 10.2 Configuration Notes

- `DATABASE_URL` must point to the Neon PostgreSQL database for this project.
- For Neon MCP usage, connect only to the Neon database project named `3D Jops planer`.
- `AUTH_SECRET` signs app sessions; use a long random value in production.
- `EXPO_PUBLIC_API_URL` must be reachable from the mobile device or emulator.
- For a physical phone, use the computer LAN IP instead of `localhost`, for example `http://192.168.1.50:3001`.

### 10.3 Configuration Sources

| Concern | File |
| --- | --- |
| Database schema | `packages/db/src/schema.ts` |
| Drizzle config | `packages/db/drizzle.config.ts` |
| Web DB client | `3d-jobs-web/src/lib/db.ts` |
| Auth session helpers | `3d-jobs-web/src/lib/auth-session.ts` |
| Admin guard | `3d-jobs-web/src/lib/admin.ts` |
| User visibility helpers | `3d-jobs-web/src/lib/permissions.ts` |
| Job sharing helpers | `3d-jobs-web/src/lib/job-permissions.ts` |
| Mobile API base URL | `3d-jobs-mobile/src/lib/api.ts` |

## 11. Local Development

### 11.1 Prerequisites

- Node.js 20+
- npm 10+
- Neon PostgreSQL database
- Expo Go, Android emulator, iOS simulator, or Expo web target

### 11.2 Install Dependencies

```bash
npm install
```

### 11.3 Database Setup

Apply migrations:

```bash
npm run db:migrate
```

Seed sample/reference data:

```bash
npm run db:seed
```

### 11.4 Run the Apps

Run web/API and mobile together:

```bash
npm run dev
```

Run only the web/API server:

```bash
npm run dev:web
```

Run only Expo:

```bash
npm run dev:mobile
```

Default web/API URL:

```text
http://localhost:3001
```

## 12. Build and Deployment

### 12.1 Web Build

```bash
npm run build:web
```

Production start from the web workspace:

```bash
npm --workspace 3d-jobs-web run start
```

### 12.2 Mobile Build

The mobile workspace is an Expo app. Local development uses:

```bash
npm --workspace 3d-jobs-mobile run start
```

Production mobile builds should be handled through the chosen Expo/EAS workflow if native app artifacts are required.

### 12.3 Netlify Deployment

- Deploy `3d-jobs-web` to Netlify as the server-rendered Next.js application and API host.
- Configure the Netlify project to build from the `3d-jobs-web` workspace.
- Use `npm run build:web` from the repository root, or the equivalent workspace build command required by the final Netlify setup.
- Ensure production environment variables are configured in Netlify.
- Ensure the deployed API URL is configured for the mobile app through `EXPO_PUBLIC_API_URL`.
- Run Drizzle migrations against the production Neon database before release.
- Use a strong `AUTH_SECRET`; changing it invalidates existing signed sessions.
- Add or update `netlify.toml` when deployment routing/build settings are finalized.

## 13. Troubleshooting Guide

### 13.1 Database connection fails

- Confirm `.env` contains a valid `DATABASE_URL`.
- Confirm Neon allows the connection and SSL mode is included when required.
- Run the DB health route or a local connection test script if needed.
- Verify MCP/database tools are pointed only at the `3D Jops planer` Neon project.

### 13.2 Mobile app cannot reach API

- Confirm the Next.js server is running on port `3001`.
- Set `EXPO_PUBLIC_API_URL` to a LAN IP when testing on a physical phone.
- Android emulator can usually use `http://10.0.2.2:3001`.
- Confirm `/api/*` CORS handling is active through `src/proxy.ts`.

### 13.3 Auth or admin access fails

- Confirm the user exists in `users`.
- Confirm the role is `admin` for admin-only routes.
- Confirm `AUTH_SECRET` is stable between login and API requests.
- Clear old cookies if session format or signing configuration changed.

### 13.4 Timer cannot start or stop

- Check that the selected project exists and belongs to the user or is available through the intended flow.
- Check for an already active time entry with `ended_at = null`.
- Confirm migrations for job/time-entry response fixes have been applied.

### 13.5 Shared jobs or tasks are missing

- Confirm rows exist in `task_visibility_permissions` or `job_visibility_permissions`.
- Confirm the viewer and subject/job IDs are correct.
- Confirm the relevant migration has been applied.

## 14. Operational Checklist

Before production or presentation release:

- `npm install` completes cleanly.
- `.env` is configured with production-safe values.
- `npm run db:migrate` has been applied to the target Neon database.
- `npm run db:seed` has been run if demo/reference data is needed.
- `npm run lint` passes.
- `npm run build:web` passes.
- Web auth, mobile auth, and `/api/auth/me` are tested.
- Timer start/stop is tested end-to-end.
- Job create/update/complete flows are tested.
- Admin-only pages and APIs reject standard users.
- Sharing permissions are tested with at least two users.
- Mobile `EXPO_PUBLIC_API_URL` points to a reachable API server.

## 15. Reference Files

- `package.json` - root workspace scripts and workspace definitions.
- `3d-jobs-web/package.json` - Next.js dependencies and scripts.
- `3d-jobs-web/src/app/` - web pages and API routes.
- `3d-jobs-web/src/lib/auth-session.ts` - session token and cookie helpers.
- `3d-jobs-web/src/lib/admin.ts` - admin route guard.
- `3d-jobs-web/src/lib/permissions.ts` - user task visibility permissions.
- `3d-jobs-web/src/lib/job-permissions.ts` - job sharing permissions.
- `3d-jobs-web/src/proxy.ts` - API CORS handling.
- `3d-jobs-mobile/src/app/` - mobile screens and tabs.
- `3d-jobs-mobile/src/lib/api.ts` - mobile API client.
- `packages/db/src/schema.ts` - Drizzle schema source.
- `packages/db/drizzle/` - migration history.
- `packages/db/scripts/seed.ts` - database seed script.
- `TASK_VISIBILITY_QUICKSTART.md` - task sharing quickstart notes.
- `3d-jobs-web/PERMISSIONS_IMPLEMENTATION.md` - web permission implementation notes.

This documentation is intended to be complete enough for onboarding, architecture review, local setup, database configuration, deployment preparation, and common operations troubleshooting.
