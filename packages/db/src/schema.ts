import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const fileTypeEnum = pgEnum('file_type', ['image', 'model', 'document', 'other']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 7 }).notNull(),
    description: text('description'),
    archived: boolean('archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_projects_user_id').on(table.userId),
  }),
);

export const taskTypes = pgTable('task_types', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull().unique(),
  icon: varchar('icon', { length: 100 }),
});

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    taskTypeId: uuid('task_type_id').references(() => taskTypes.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_jobs_user_id').on(table.userId),
    projectIdIdx: index('idx_jobs_project_id').on(table.projectId),
  }),
);

export const timeEntries = pgTable(
  'time_entries',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
    taskTypeId: uuid('task_type_id').references(() => taskTypes.id, { onDelete: 'set null' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationMinutes: integer('duration_minutes'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_time_entries_user_id').on(table.userId),
    projectIdIdx: index('idx_time_entries_project_id').on(table.projectId),
    jobIdIdx: index('idx_time_entries_job_id').on(table.jobId),
    startedAtIdx: index('idx_time_entries_started_at').on(table.startedAt),
  }),
);

export const entryFiles = pgTable(
  'entry_files',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    timeEntryId: uuid('time_entry_id')
      .notNull()
      .references(() => timeEntries.id, { onDelete: 'cascade' }),
    fileType: fileTypeEnum('file_type').notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }),
    fileSizeBytes: integer('file_size_bytes'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    timeEntryIdIdx: index('idx_entry_files_time_entry_id').on(table.timeEntryId),
  }),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  jobs: many(jobs),
  timeEntries: many(timeEntries),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  jobs: many(jobs),
  timeEntries: many(timeEntries),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [jobs.projectId],
    references: [projects.id],
  }),
  taskType: one(taskTypes, {
    fields: [jobs.taskTypeId],
    references: [taskTypes.id],
  }),
  timeEntries: many(timeEntries),
}));

export const taskTypesRelations = relations(taskTypes, ({ many }) => ({
  jobs: many(jobs),
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  job: one(jobs, {
    fields: [timeEntries.jobId],
    references: [jobs.id],
  }),
  taskType: one(taskTypes, {
    fields: [timeEntries.taskTypeId],
    references: [taskTypes.id],
  }),
  files: many(entryFiles),
}));

export const entryFilesRelations = relations(entryFiles, ({ one }) => ({
  timeEntry: one(timeEntries, {
    fields: [entryFiles.timeEntryId],
    references: [timeEntries.id],
  }),
}));

export const taskVisibilityPermissions = pgTable(
  'task_visibility_permissions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    grantorId: uuid('grantor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    viewerId: uuid('viewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    grantorIdIdx: index('idx_permissions_grantor_id').on(table.grantorId),
    viewerIdIdx: index('idx_permissions_viewer_id').on(table.viewerId),
    subjectIdIdx: index('idx_permissions_subject_id').on(table.subjectId),
    uniquePermissionIdx: index('idx_permissions_unique').on(table.viewerId, table.subjectId),
  }),
);

export const taskVisibilityPermissionsRelations = relations(taskVisibilityPermissions, ({ one }) => ({
  grantor: one(users, {
    fields: [taskVisibilityPermissions.grantorId],
    references: [users.id],
  }),
  viewer: one(users, {
    fields: [taskVisibilityPermissions.viewerId],
    references: [users.id],
  }),
  subject: one(users, {
    fields: [taskVisibilityPermissions.subjectId],
    references: [users.id],
  }),
}));