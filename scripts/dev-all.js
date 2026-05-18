const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const rootDir = process.cwd();
const webDir = path.join(rootDir, '3d-jobs-web');
const mobileDir = path.join(rootDir, '3d-jobs-mobile');
const nextCli = path.join(webDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const expoCli = path.join(mobileDir, 'node_modules', 'expo', 'bin', 'cli');
const powershellCommand = 'powershell.exe';

function killPorts() {
  const result = spawnSync(powershellCommand, [
    '-NoProfile',
    '-Command',
    "Get-NetTCPConnection -LocalPort 3000,8081 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }",
  ], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function startProcess(label, args, cwd) {
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    const exitCode = typeof code === 'number' ? code : 1;
    console.error(`[${label}] exited with code ${exitCode}${signal ? ` (signal ${signal})` : ''}`);
    shutdown(exitCode);
  });

  return child;
}

function shutdown(code) {
  clearInterval(keepAlive);
  for (const child of children) {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  }

  process.exit(code);
}

let shuttingDown = false;
const children = [];
const keepAlive = setInterval(() => {}, 60 * 60 * 1000);

killPorts();
children.push(startProcess('web', [nextCli, 'dev'], webDir));
children.push(startProcess('mobile', [expoCli, 'start'], mobileDir));
process.stdin.resume();

process.on('SIGINT', () => {
  if (!shuttingDown) {
    shuttingDown = true;
    shutdown(0);
  }
});

process.on('SIGTERM', () => {
  if (!shuttingDown) {
    shuttingDown = true;
    shutdown(0);
  }
});
