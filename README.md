# 3D Jobs - Project Time Tracker
A full-stack multi-platform app for tracking time spent on tasks within projects. Built with Next.js, PostgreSQL, and Expo as a capstone project for the Full Stack Apps with AI course at SoftUni.

# hat It Does
TaskTimer lets professionals (3D artists, engineers, designers, freelancers) log exactly how much time each task takes — whether by running a live start/stop timer or entering time manually. All entries appear on an interactive calendar so overlapping tasks are immediately visible. Rich analytics then surface how time is distributed across projects and task types.
# User Roles
RoleAccessGuest (not logged in)Browse public project summaries and read-only statsUserFull personal dashboard — create projects, log time, view own analyticsAdminAll of the above + user management, global statistics, data moderation

# Core Features
- Time Logging

    Live timer — Start / Stop a task with one tap; duration is calculated automatically
    Manual entry — Enter any past date, start time, and end time (or duration)
    Each entry is linked to a project and a task type (e.g. 3D Scanning, 3D Printing, Modelling, Post-processing)
    Optional free-text note per entry

- Calendar View

    Monthly / weekly calendar showing all time entries as coloured blocks
    Overlap detection — visually highlights when two tasks were running simultaneously
    Click any block to view or edit the entry

- Analytics & Statistics

    Total time per project (daily / weekly / monthly / custom range)
    Breakdown by task type with percentage share
    Average task duration per type
    Most productive days / hours heatmap
    Export data as CSV

- Projects

    Create, edit, archive projects
    Assign a colour and optional description to each project
    View all time entries and stats scoped to one project

- Authentication

    Register / Login / Logout
    JWT-based auth, passwords hashed with bcrypt
    Role-based access control enforced at API and UI level

- Admin Panel (Web only)

    List and manage all users and roles
    View global usage statistics
    Moderate or delete any entry


# Tech Stack
- Backend

    Next.js (App Router) — API routes + Server Actions
    PostgreSQL on Neon (serverless)
    Drizzle ORM — all DB access; schema changes only via migrations
    JWT authentication, bcrypt password hashing

- Web App

    Next.js + React + TypeScript
    Tailwind CSS
    Minimum 10 screens, fully responsive (desktop + mobile browser)

- Mobile App

    React Native + Expo (SDK 51+)
    Expo Router (file-based navigation)
    Connects to backend via RESTful API
    JWT stored in expo-secure-store
    Minimum 5 screens