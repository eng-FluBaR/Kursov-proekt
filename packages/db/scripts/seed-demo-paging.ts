import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { jobs, projects, taskTypes, timeEntries, users } from '../src/schema';

[
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env'),
].forEach((envPath) => dotenv.config({ path: envPath, override: false }));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add your Neon connection string to the root .env file.');
}

const db = drizzle(neon(process.env.DATABASE_URL));
const DEMO_EMAIL = process.env.DEMO_PAGING_EMAIL ?? 'demo@tasktimer.app';
const TARGET_JOB_COUNT = Number(process.env.DEMO_PAGING_JOB_COUNT ?? 75);
const TITLE_PREFIX = 'Demo paging task';

const TASK_TYPES = [
  { name: '3D Scanning', icon: 'scan' },
  { name: '3D Printing', icon: 'printer' },
  { name: '3D Modelling', icon: 'cube' },
  { name: 'Post-processing', icon: 'sparkles' },
  { name: 'CAD Design', icon: 'pen-tool' },
];

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function ensureDemoUser() {
  const [existingUser] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);

  if (existingUser) {
    return existingUser;
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash('demo123', 10),
      role: 'user',
    })
    .returning();

  return createdUser;
}

async function ensureTaskTypes() {
  for (const taskType of TASK_TYPES) {
    const [existing] = await db.select().from(taskTypes).where(eq(taskTypes.name, taskType.name)).limit(1);
    if (!existing) {
      await db.insert(taskTypes).values(taskType);
    }
  }

  return db.select().from(taskTypes);
}

async function ensureDemoProject(userId: string) {
  const [existingProject] = await db
    .select()
    .from(projects)
    .where(eq(projects.name, 'Demo Paging Validation'))
    .limit(1);

  if (existingProject) {
    return existingProject;
  }

  const [createdProject] = await db
    .insert(projects)
    .values({
      userId,
      name: 'Demo Paging Validation',
      color: '#22d3ee',
      description: 'Generated demo project used to validate paging with many visible tasks.',
    })
    .returning();

  return createdProject;
}

async function main() {
  console.log(`Preparing demo paging data for ${DEMO_EMAIL}...`);

  const demoUser = await ensureDemoUser();
  const allTaskTypes = await ensureTaskTypes();
  const demoProject = await ensureDemoProject(demoUser.id);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)` })
    .from(jobs)
    .where(sql`${jobs.userId} = ${demoUser.id} and ${jobs.title} like ${`${TITLE_PREFIX}%`}`);

  const existingCount = Number(countRow?.total ?? 0);
  const missingCount = Math.max(0, TARGET_JOB_COUNT - existingCount);

  if (missingCount === 0) {
    console.log(`Demo paging data already has ${existingCount} generated tasks. Nothing to add.`);
    return;
  }

  const nowCount = existingCount;
  const newJobs = Array.from({ length: missingCount }, (_, index) => {
    const taskNumber = nowCount + index + 1;
    const taskType = allTaskTypes[index % allTaskTypes.length];

    return {
      userId: demoUser.id,
      projectId: demoProject.id,
      taskTypeId: taskType.id,
      title: `${TITLE_PREFIX} ${String(taskNumber).padStart(3, '0')}`,
      description: `Generated demo task ${taskNumber} for paging and search validation.`,
      status: taskNumber % 10 === 0 ? 'completed' : taskNumber % 8 === 0 ? 'paused' : 'active',
    };
  });

  const insertedJobs = await db.insert(jobs).values(newJobs).returning();
  const entries = insertedJobs
    .filter((_, index) => index % 3 === 0)
    .map((job, index) => {
      const startedAt = hoursAgo(index + 1);
      const durationMinutes = 30 + (index % 6) * 15;

      return {
        userId: demoUser.id,
        projectId: demoProject.id,
        jobId: job.id,
        taskTypeId: job.taskTypeId,
        startedAt,
        endedAt: new Date(startedAt.getTime() + durationMinutes * 60000),
        durationMinutes,
        note: `Demo paging validation time entry ${index + 1}`,
      };
    });

  if (entries.length > 0) {
    await db.insert(timeEntries).values(entries);
  }

  console.log(`Added ${insertedJobs.length} demo paging tasks and ${entries.length} time entries.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Demo paging seed failed:', error);
    process.exit(1);
  });
