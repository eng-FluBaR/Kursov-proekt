#!/usr/bin/env node

/**
 * Database setup script: migrate then seed
 * Run with: node setup-db.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname);

console.log('🚀 3D Jobs Database Setup');
console.log('=======================\n');

function runCommand(command, args, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    console.log(`📍 [${path.relative(projectRoot, cwd)}] Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('error', (err) => {
      console.error(`❌ Error: ${err.message}`);
      reject(err);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function setup() {
  try {
    // Step 1: Run migrations
    console.log('\n📦 Step 1: Running database migrations...\n');
    await runCommand('npm', ['--workspace', '@3d-jobs/db', 'run', 'migrate']);

    // Step 2: Seed database
    console.log('\n\n🌱 Step 2: Seeding database...\n');
    await runCommand('npm', ['--workspace', '@3d-jobs/db', 'run', 'seed']);

    console.log('\n\n✅ Database setup completed successfully!');
    console.log('🎉 You can now start using the application.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
