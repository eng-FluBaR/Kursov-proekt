<!-- BEGIN:nextjs-agent-rules -->
# App Purpose
Mobile companion to the time tracker. Users log time on projects and view basic stats from their phone.

# Technologies
next.js + Neon DB + Drizzle ORM + React + Tailwind
# Architecture Rules

Monorepo: this app lives in /apps/web
Business logic in /services, consumed by Server Components and API routes
API routes live in /app/api
DB schema changes: always via Drizzle migrations (drizzle-kit generate → migrate)
Use modular desing: split the app into selft-contained components, to avoid complex files with too much code
# User Interface Guidelines
 Implement modern UI, responsive desing. use server-rendered components in Next,js.
 Use server-side rendering, only use client components for browser interaction and forms