import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDatabaseUrlStatus, getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const databaseUrlStatus = getDatabaseUrlStatus();

    if (!databaseUrlStatus.configured) {
      return NextResponse.json(
        {
          ok: false,
          error: 'DATABASE_URL is not configured.',
          checkedFiles: databaseUrlStatus.checkedFiles,
        },
        { status: 500 },
      );
    }

    const db = getDb();
    await db.execute(sql`select 1`);

    return NextResponse.json({ ok: true, source: databaseUrlStatus.source });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
