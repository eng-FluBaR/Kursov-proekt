import { readFileSync } from 'node:fs';
import path from 'node:path';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

function readDatabaseUrlFromEnvFile(filePath: string) {
  try {
    const fileContents = readFileSync(filePath, 'utf8');
    const databaseUrlLine = fileContents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith('DATABASE_URL='));

    if (!databaseUrlLine) {
      return undefined;
    }

    return databaseUrlLine.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return undefined;
  }
}

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    readDatabaseUrlFromEnvFile(path.resolve(process.cwd(), '.env.local')) ??
    readDatabaseUrlFromEnvFile(path.resolve(process.cwd(), '.env')) ??
    readDatabaseUrlFromEnvFile(path.resolve(process.cwd(), '..', '.env'))
  );
}

export function getDb() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  return drizzle(neon(databaseUrl));
}
