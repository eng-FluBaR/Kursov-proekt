#!/usr/bin/env node

/**
 * Run database migrations using drizzle-kit
 * This is a workaround for shell limitations
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbPackagePath = path.join(__dirname, 'packages', 'db');

// Check if db package exists
if (!fs.existsSync(dbPackagePath)) {
  console.error('❌ Database package not found at', dbPackagePath);
  process.exit(1);
}

console.log('📦 Running database migrations...');
console.log('📍 Working directory:', dbPackagePath);

try {
  // Run migrate command
  execSync('npm run migrate', {
    cwd: dbPackagePath,
    stdio: 'inherit',
    shell: true,
  });
  
  console.log('✅ Migrations completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
