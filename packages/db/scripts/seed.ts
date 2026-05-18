import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, projects, taskTypes, timeEntries, entryFiles } from '../src/schema';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const sql = neon(process.env.DATABASE_URL || 'postgresql://localhost/3djobs');
const db = drizzle(sql);

const TASK_TYPE_SEEDS = [
  { name: '3D Scanning', icon: 'scan' },
  { name: '3D Printing', icon: 'printer' },
  { name: '3D Modelling', icon: 'cube' },
  { name: 'Post-processing', icon: 'sparkles' },
  { name: 'CAD Design', icon: 'pen-tool' },
  { name: 'Rendering', icon: 'image' },
  { name: 'Client review', icon: 'messages' },
  { name: 'Research', icon: 'search' },
];

const USER_SEEDS = [
  { email: 'admin@tasktimer.app', password: 'admin123', role: 'admin' as const },
  { email: 'demo@tasktimer.app', password: 'demo123', role: 'user' as const },
  { email: 'maker@tasktimer.app', password: 'maker123', role: 'user' as const },
  { email: 'studio@tasktimer.app', password: 'studio123', role: 'user' as const },
  { email: 'ops@tasktimer.app', password: 'ops123', role: 'user' as const },
];

const PROJECT_SEEDS = [
  { name: 'Demo Production Line', color: '#6366f1', description: 'Default admin project' },
  { name: 'Architectural Model', color: '#0ea5e9', description: 'House and interior work' },
  { name: 'Prototype Lab', color: '#14b8a6', description: 'Hardware concepts and prints' },
  { name: 'Client Review Queue', color: '#f97316', description: 'Feedback and revisions' },
  { name: 'Research Sprint', color: '#8b5cf6', description: 'Materials and process experiments' },
];

const FILE_TYPES = ['image', 'model', 'document', 'other'] as const;

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    console.log('🧹 Clearing existing demo data...');
    await db.delete(entryFiles);
    await db.delete(timeEntries);
    await db.delete(projects);
    await db.delete(users);
    await db.delete(taskTypes);

    console.log('📝 Seeding task types...');
    await db.insert(taskTypes).values(TASK_TYPE_SEEDS);
    const seededTaskTypes = await db.select().from(taskTypes);

    console.log('👤 Seeding users...');
    const seededUsers = [];
    for (const userSeed of USER_SEEDS) {
      const [user] = await db
        .insert(users)
        .values({
          email: userSeed.email,
          passwordHash: await bcrypt.hash(userSeed.password, 10),
          role: userSeed.role,
        })
        .returning();
      seededUsers.push(user);
    }

    console.log('📋 Seeding projects...');
    const seededProjects = [];
    for (let index = 0; index < PROJECT_SEEDS.length; index += 1) {
      const owner = seededUsers[index % seededUsers.length];
      const projectSeed = PROJECT_SEEDS[index];
      const [project] = await db
        .insert(projects)
        .values({
          userId: owner.id,
          name: projectSeed.name,
          color: projectSeed.color,
          description: projectSeed.description,
          archived: index === PROJECT_SEEDS.length - 1,
        })
        .returning();
      seededProjects.push(project);
    }

    console.log('⏱️ Seeding time entries...');
    const timeEntrySeeds = [
      { user: seededUsers[0], project: seededProjects[0], taskType: seededTaskTypes[0], hours: 2, durationMinutes: 95, note: 'Morning scan prep' },
      { user: seededUsers[1], project: seededProjects[1], taskType: seededTaskTypes[1], hours: 6, durationMinutes: 120, note: 'Print started successfully' },
      { user: seededUsers[2], project: seededProjects[2], taskType: seededTaskTypes[2], hours: 10, durationMinutes: null, note: 'Modeling session still running' },
      { user: seededUsers[3], project: seededProjects[3], taskType: seededTaskTypes[6], hours: 18, durationMinutes: 45, note: 'Client feedback review' },
      { user: seededUsers[4], project: seededProjects[4], taskType: seededTaskTypes[7], hours: 24, durationMinutes: 75, note: 'Research on resin settings' },
      { user: seededUsers[0], project: seededProjects[1], taskType: seededTaskTypes[3], hours: 32, durationMinutes: 60, note: 'Post-processing cleanup' },
      { user: seededUsers[1], project: seededProjects[2], taskType: seededTaskTypes[4], hours: 40, durationMinutes: 110, note: 'CAD redesign pass' },
      { user: seededUsers[2], project: seededProjects[0], taskType: seededTaskTypes[5], hours: 52, durationMinutes: 50, note: 'Render preview export' },
    ];

    const seededTimeEntries = [];
    for (const seedItem of timeEntrySeeds) {
      const startedAt = hoursAgo(seedItem.hours);
      const [timeEntry] = await db
        .insert(timeEntries)
        .values({
          userId: seedItem.user.id,
          projectId: seedItem.project.id,
          taskTypeId: seedItem.taskType.id,
          startedAt,
          endedAt: seedItem.durationMinutes === null ? null : new Date(startedAt.getTime() + seedItem.durationMinutes * 60000),
          durationMinutes: seedItem.durationMinutes,
          note: seedItem.note,
        })
        .returning();
      seededTimeEntries.push(timeEntry);
    }

    console.log('📎 Seeding entry files...');
    await db.insert(entryFiles).values([
      {
        timeEntryId: seededTimeEntries[0].id,
        fileType: FILE_TYPES[0],
        storageKey: 'uploads/scan-prep-001.png',
        originalName: 'scan-prep-001.png',
        mimeType: 'image/png',
        fileSizeBytes: 245678,
      },
      {
        timeEntryId: seededTimeEntries[1].id,
        fileType: FILE_TYPES[2],
        storageKey: 'uploads/print-job-001.pdf',
        originalName: 'print-job-001.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 145223,
      },
      {
        timeEntryId: seededTimeEntries[2].id,
        fileType: FILE_TYPES[1],
        storageKey: 'uploads/model-v2.step',
        originalName: 'model-v2.step',
        mimeType: 'application/step',
        fileSizeBytes: 982341,
      },
      {
        timeEntryId: seededTimeEntries[3].id,
        fileType: FILE_TYPES[2],
        storageKey: 'uploads/review-notes.docx',
        originalName: 'review-notes.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSizeBytes: 56342,
      },
      {
        timeEntryId: seededTimeEntries[4].id,
        fileType: FILE_TYPES[3],
        storageKey: 'uploads/research-log.txt',
        originalName: 'research-log.txt',
        mimeType: 'text/plain',
        fileSizeBytes: 8421,
      },
    ]);

    console.log('✅ Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();