import { getDatabaseUrlStatus, getDb } from './3d-jobs-web/src/lib/db';
import { sql } from 'drizzle-orm';

console.log('Starting test...');
async function test() {
  const status = getDatabaseUrlStatus();
  console.log('Database URL status:', JSON.stringify(status, null, 2));
  if (!status.configured) {
    console.log('Database URL is not configured.');
    return;
  }
  const db = getDb();
  try {
    const result = await db.execute(sql`select 1`);
    console.log('Database connection OK:', result);
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

test().then(() => console.log('Test finished.'));