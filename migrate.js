#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname);
const dbPackagePath = path.join(projectRoot, 'packages', 'db');
const envPath = path.join(projectRoot, '.env');

console.log('🔍 Migration Runner');
console.log('📍 Project root:', projectRoot);
console.log('📦 DB package:', dbPackagePath);
console.log('');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at', envPath);
  console.log('   Available files:', fs.readdirSync(projectRoot).filter(f => f.startsWith('.')));
  process.exit(1);
}

console.log('✅ Found .env file');
console.log('');
console.log('🚀 Running: npm --workspace @3d-jobs/db run migrate');
console.log('');

exec('npm --workspace @3d-jobs/db run migrate', {
  cwd: projectRoot,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env },
}, (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  
  if (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Migration completed successfully!');
  process.exit(0);
});
