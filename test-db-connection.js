const { getDb } = require('./3d-jobs-web/src/lib/db');
const { sql } = require('drizzle-orm');

(async () => {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    console.log('SUCCESS: Database connection is working');
  } catch (err) {
    console.error('ERROR: Database connection failed:', err);
  }
})();