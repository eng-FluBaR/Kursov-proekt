const fs = require('fs');
const path = require('path');

// Create directory structure in the CORRECT location
const dbPath = path.join(__dirname, 'packages', 'db');
const srcPath = path.join(dbPath, 'src');
const scriptsPath = path.join(dbPath, 'scripts');

fs.mkdirSync(srcPath, { recursive: true });
fs.mkdirSync(scriptsPath, { recursive: true });

console.log('✓ Directories created in correct location');

// Create package.json
const packageJson = {
  "name": "@3d-jobs/db",
  "version": "1.0.0",
  "description": "Database layer with Drizzle ORM",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "studio": "drizzle-kit studio",
    "seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "drizzle-orm": "^0.35.1",
    "@neondatabase/serverless": "^0.10.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.25.0",
    "@types/bcryptjs": "^2.4.2",
    "tsx": "^4.7.0",
    "typescript": "^5"
  }
};

fs.writeFileSync(path.join(dbPath, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log('✓ package.json created');

// Create tsconfig.json
const tsconfigJson = {
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
};

fs.writeFileSync(path.join(dbPath, 'tsconfig.json'), JSON.stringify(tsconfigJson, null, 2));
console.log('✓ tsconfig.json created');

// Create drizzle.config.ts
const drizzleConfig = `import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/3djobs',
  },
} satisfies Config;`;

fs.writeFileSync(path.join(dbPath, 'drizzle.config.ts'), drizzleConfig);
console.log('✓ drizzle.config.ts created');

// Create schema.ts
const schemaContent = `import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index, serial, foreignKey, pgEnum } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['user', 'admin']);
export const fileTypeEnum = pgEnum('file_type', ['image', 'model', 'document', 'other']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  color: varchar('color', { length: 7 }).default('#6366f1'),
  description: text('description'),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_projects_user_id').on(table.userId),
}));

// Task types table
export const taskTypes = pgTable('task_types', {
  id: uuid('id').primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  name: varchar('name', { length: 100 }).unique().notNull(),
  icon: varchar('icon', { length: 50 }),
});

// Time entries table
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  taskTypeId: uuid('task_type_id').references(() => taskTypes.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  durationMinutes: integer('duration_minutes'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_time_entries_user_id').on(table.userId),
  projectIdIdx: index('idx_time_entries_project_id').on(table.projectId),
  startedAtIdx: index('idx_time_entries_started_at').on(table.startedAt),
}));

// Entry files table
export const entryFiles = pgTable('entry_files', {
  id: uuid('id').primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  timeEntryId: uuid('time_entry_id').notNull().references(() => timeEntries.id, { onDelete: 'cascade' }),
  fileType: fileTypeEnum('file_type'),
  storageKey: varchar('storage_key', { length: 512 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSizeBytes: integer('file_size_bytes'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
}, (table) => ({
  timeEntryIdIdx: index('idx_entry_files_time_entry_id').on(table.timeEntryId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  timeEntries: many(timeEntries),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  timeEntries: many(timeEntries),
}));

export const taskTypesRelations = relations(taskTypes, ({ many }) => ({
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
}));`;

fs.writeFileSync(path.join(srcPath, 'schema.ts'), schemaContent);
console.log('✓ src/schema.ts created');

// Create seed.ts
const seedContent = `import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, projects, taskTypes, timeEntries, entryFiles } from '../src/schema';

const sql = neon(process.env.DATABASE_URL || 'postgresql://localhost/3djobs');
const db = drizzle(sql);

const TASK_TYPE_SEEDS = [
  '3D Scanning',
  '3D Printing',
  '3D Modelling',
  'Post-processing',
  'CAD Design',
  'Rendering',
  'Client review',
  'Research',
  'Admin',
  'Other',
];

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Seed task types (skip if exist)
    console.log('📝 Seeding task types...');
    for (const taskTypeName of TASK_TYPE_SEEDS) {
      const existing = await db
        .select()
        .from(taskTypes)
        .where({ name: taskTypeName })
        .limit(1);

      if (existing.length === 0) {
        await db.insert(taskTypes).values({
          name: taskTypeName,
          icon: null,
        });
      }
    }
    console.log('✓ Task types seeded');

    // Create admin user (skip if exist)
    console.log('👤 Creating admin user...');
    const adminEmailCheck = await db
      .select()
      .from(users)
      .where({ email: 'admin@tasktimer.app' })
      .limit(1);

    let adminUserId: string;
    if (adminEmailCheck.length === 0) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await db
        .insert(users)
        .values({
          email: 'admin@tasktimer.app',
          passwordHash: hashedAdminPassword,
          role: 'admin',
        })
        .returning();
      adminUserId = adminUser[0].id;
    } else {
      adminUserId = adminEmailCheck[0].id;
    }
    console.log('✓ Admin user ready');

    // Create demo user (skip if exist)
    console.log('👤 Creating demo user...');
    const demoEmailCheck = await db
      .select()
      .from(users)
      .where({ email: 'demo@tasktimer.app' })
      .limit(1);

    let demoUserId: string;
    if (demoEmailCheck.length === 0) {
      const hashedDemoPassword = await bcrypt.hash('demo123', 10);
      const demoUser = await db
        .insert(users)
        .values({
          email: 'demo@tasktimer.app',
          passwordHash: hashedDemoPassword,
          role: 'user',
        })
        .returning();
      demoUserId = demoUser[0].id;
    } else {
      demoUserId = demoEmailCheck[0].id;
    }
    console.log('✓ Demo user ready');

    // Create demo project for admin
    console.log('📋 Creating demo project...');
    const existingProject = await db
      .select()
      .from(projects)
      .where({ userId: adminUserId })
      .limit(1);

    if (existingProject.length === 0) {
      await db.insert(projects).values({
        userId: adminUserId,
        name: 'Demo Project',
        color: '#6366f1',
        description: 'A demo project for testing',
        archived: false,
      });
    }
    console.log('✓ Demo project created');

    // Get all task types for random selection
    const allTaskTypes = await db.select().from(taskTypes);

    // Seed 10,000 time entries in batches of 500
    console.log('⏱️ Seeding 10,000 time entries...');
    const adminProject = (
      await db.select().from(projects).where({ userId: adminUserId }).limit(1)
    )[0];

    const batchSize = 500;
    const totalEntries = 10000;

    for (let batch = 0; batch < totalEntries / batchSize; batch++) {
      const entries = [];
      for (let i = 0; i < batchSize; i++) {
        const daysAgo = Math.floor(Math.random() * 365);
        const minutesAgo = Math.floor(Math.random() * 1440);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        startDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        const duration = Math.floor(Math.random() * 171) + 10; // 10-180 minutes
        const randomTaskType = allTaskTypes[Math.floor(Math.random() * allTaskTypes.length)];

        entries.push({
          userId: adminUserId,
          projectId: adminProject.id,
          taskTypeId: randomTaskType.id,
          startedAt: startDate,
          endedAt: new Date(startDate.getTime() + duration * 60000),
          durationMinutes: duration,
          note: \\\`Test entry \${batch * batchSize + i + 1}\\\`,
        });
      }

      await db.insert(timeEntries).values(entries);
      console.log(\\\`  ✓ Batch \${batch + 1}/\${Math.ceil(totalEntries / batchSize)} completed\\\`);
    }

    console.log('✅ Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();`;

fs.writeFileSync(path.join(scriptsPath, 'seed.ts'), seedContent);
console.log('✓ scripts/seed.ts created');

console.log('✅ All files created successfully in correct location!');
