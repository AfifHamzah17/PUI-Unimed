// Log JSON satu baris. Cloud Logging otomatis membaca field "severity" dan "message".
export function log(severity, message, extra = {}) {
  if (process.env.LOG_LEVEL === 'silent') return;
  const line = JSON.stringify({ severity, message, time: new Date().toISOString(), ...extra });
  (severity === 'ERROR' ? process.stderr : process.stdout).write(`${line}\n`);
}
