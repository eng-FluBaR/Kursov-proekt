#!/usr/bin/env node

/**
 * Manual migration runner that connects directly to Neon database
 */

import path from 'node:path';
import { readFileSync } from 'node:fs';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables
[
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env'),
].forEach((envPath) => {
  try {
    dotenv.config({ path: envPath, override: false });
  } catch (e) {
    // ignore
  }
});

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required in .env file');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('📦 Running migration: 0002_add_jobs_table.sql');
    
    // Read migration file
    const migrationPath = path.resolve('./drizzle/0002_add_jobs_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split by statement breakpoints and execute each
    const statements = migrationSQL
      .split('-->')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.startsWith('statement-breakpoint')) continue;
      
      console.log(`  ├─ Executing: ${statement.substring(0, 50)}...`);
      try {
        await sql(statement);
      } catch (e) {
        // Some statements might fail if already applied (e.g., CREATE INDEX IF NOT EXISTS)
        console.log(`  │  ⚠️  ${(e as Error).message}`);
      }
    }
    
    console.log('✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
