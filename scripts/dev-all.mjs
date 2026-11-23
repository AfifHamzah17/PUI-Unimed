// `npm run dev:all`: menjalankan backend lokal (port 8080) dan Vite sekaligus. Tanpa dependensi tambahan.
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

const backendEnv = 'backend/.env';
if (!existsSync(backendEnv) && existsSync('backend/.env.example')) {
  copyFileSync('backend/.env.example', backendEnv);
  console.log('[dev:all] backend/.env dibuat dari .env.example');
}
const isWin = process.platform === 'win32';
const run = (name, cmd, args, cwd) => {
  const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  p.on('exit', (code) => {
    console.log(`[dev:all] ${name} berhenti (kode ${code})`);
    stop();
  });
  return p;
};
const procs = [
  run('backend', isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], 'backend'),
  run('frontend', isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], '.'),
];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  procs.forEach((p) => p.kill());
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
