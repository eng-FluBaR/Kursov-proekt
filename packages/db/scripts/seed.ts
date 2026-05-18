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
          note: \`Test entry ${batch * batchSize + i + 1}\`,
        });
      }

      await db.insert(timeEntries).values(entries);
      console.log(\`  ✓ Batch ${batch + 1}/${Math.ceil(totalEntries / batchSize)} completed\`);
    }

    console.log('✅ Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();