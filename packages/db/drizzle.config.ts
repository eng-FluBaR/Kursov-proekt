import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Config } from 'drizzle-kit';

const envPath = path.resolve(process.cwd(), '../../.env');

try {
  const fileContents = readFileSync(envPath, 'utf8');
  for (const line of fileContents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const value = trimmedLine.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
} catch {
  // Fall back to process.env when the root .env file is unavailable.
}

export default {
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost/3djobs',
  },
} satisfies Config;
