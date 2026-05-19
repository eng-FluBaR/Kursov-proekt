import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Config } from 'drizzle-kit';

function loadEnvFile(filePath: string) {
  try {
    const fileContents = readFileSync(filePath, 'utf8');

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
    // Fall back to the next possible env location.
  }
}

[
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env'),
].forEach(loadEnvFile);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add your Neon connection string to the root .env file.');
}

export default {
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
