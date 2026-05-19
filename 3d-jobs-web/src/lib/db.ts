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

const checkedEnvFiles = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
];

export function getDatabaseUrlStatus() {
  const envDatabaseUrl = process.env.DATABASE_URL;

  if (envDatabaseUrl) {
    return {
      configured: true,
      source: 'process.env.DATABASE_URL',
      checkedFiles: checkedEnvFiles,
    };
  }

  for (const filePath of checkedEnvFiles) {
    if (readDatabaseUrlFromEnvFile(filePath)) {
      return {
        configured: true,
        source: filePath,
        checkedFiles: checkedEnvFiles,
      };
    }
  }

  return {
    configured: false,
    source: null,
    checkedFiles: checkedEnvFiles,
  };
}

function getDatabaseUrl() {
  const status = getDatabaseUrlStatus();

  if (status.source === 'process.env.DATABASE_URL') {
    return process.env.DATABASE_URL;
  }

  if (status.source) {
    return readDatabaseUrlFromEnvFile(status.source);
  }

  return (
    undefined
  );
}

export function getDb() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  return drizzle(neon(databaseUrl));
}
