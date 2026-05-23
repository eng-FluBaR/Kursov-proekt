# Task Visibility & Permissions - Implementation Summary

## ✅ Completed Components

### 1. Database Schema (/packages/db/src/schema.ts)
- Added `taskVisibilityPermissions` table with:
  - `id` (uuid, primary key)
  - `grantorId` (admin who granted permission)
  - `viewerId` (user allowed to view tasks)
  - `subjectId` (user whose tasks are visible)
  - `createdAt` (timestamp)
  - Indexes on all foreign keys and unique constraint on (viewerId, subjectId)
  - Relations defined for type safety

### 2. Database Migration (/packages/db/drizzle/0006_add_task_visibility_permissions.sql)
- SQL migration file ready to apply
- Creates table with proper constraints and indexes
- Includes unique constraint to prevent duplicate permissions

### 3. Permissions Utility Library (/3d-jobs-web/src/lib/permissions.ts)
- `getUserAccessibleTaskIds(userId)` - Returns all user IDs the user can view tasks for
- `grantPermission(grantorId, viewerId, subjectId)` - Admin grants permission
- `revokePermission(permissionId)` - Admin revokes permission
- `listPermissions(viewerId, subjectId)` - Admin lists all permissions

### 4. Jobs API Endpoint Updated (/3d-jobs-web/src/app/api/jobs/route.ts)
- GET endpoint now:
  - Retrieves user's own tasks
  - Retrieves tasks from users with granted permissions
  - Uses `getUserAccessibleTaskIds()` utility
  - Filters by status and projectId as before

### 5. Permissions Management API (/3d-jobs-web/src/app/api/mobile/permissions-route.ts)
- POST /api/mobile/permissions-route - Grant permission to user
  - Requires: viewerId, subjectId
  - Only admins can access
  - Validates users exist
  - Prevents duplicate permissions
- GET /api/mobile/permissions-route - List permissions
  - Optional filters: viewerId, subjectId
  - Only admins can access
- DELETE /api/mobile/permissions-route - Revoke permission
  - Requires: permissionId
  - Only admins can access

## 📋 How It Works

### User Task Visibility
1. Regular users see only their own tasks
2. Admin grants permission: "User A can see User B's tasks"
3. User A now sees both their tasks and User B's tasks in the jobs list
4. User B still sees only their own tasks unless permission is granted

### Admin Permissions Flow
1. Admin calls POST to grant permission with viewerId and subjectId
2. System creates entry in task_visibility_permissions table
3. Next time User A calls GET /api/jobs, they receive both sets of tasks
4. Admin can revoke by calling DELETE with permissionId

## 🚀 To Deploy

### Step 1: Apply Migration
```bash
cd packages/db
npm run migrate
```

### Step 2: Rebuild
```bash
npm run build:web
```

### Step 3: Test Endpoints

Grant permission:
```bash
curl -X POST http://localhost:3001/api/mobile/permissions-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "viewerId": "user-a-id",
    "subjectId": "user-b-id"
  }'
```

List permissions:
```bash
curl http://localhost:3001/api/mobile/permissions-route \
  -H "Authorization: Bearer <admin-token>"
```

Get jobs (now with shared tasks):
```bash
curl http://localhost:3001/api/jobs \
  -H "Authorization: Bearer <user-token>"
```

Revoke permission:
```bash
curl -X DELETE http://localhost:3001/api/mobile/permissions-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"permissionId": "permission-id"}'
```

## 📝 API Details

### Permission Grant Response
```json
{
  "permission": {
    "id": "uuid",
    "grantorId": "admin-uuid",
    "viewerId": "user-a-uuid",
    "subjectId": "user-b-uuid",
    "createdAt": "2026-05-20T19:10:24Z"
  }
}
```

### Updated Jobs Response
Jobs now include `userId` field to identify task owner:
```json
{
  "jobs": [
    {
      "id": "job-1",
      "userId": "current-user",
      "projectId": "...",
      "title": "My Task",
      ...
    },
    {
      "id": "job-2",
      "userId": "other-user",
      "projectId": "...",
      "title": "Shared Task",
      ...
    }
  ]
}
```

## 🔐 Security
- Only admins (role='admin') can manage permissions
- Users cannot grant themselves permission to view others' tasks
- Unique constraint prevents duplicate permissions
- All endpoints require authentication
- Foreign keys ensure referential integrity
