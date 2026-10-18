import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
const evidence = path.resolve('artifacts', `reevaluation-startup-2026-10-18-${Date.now()}`);
await mkdir(evidence, { recursive: true });
const results = [];
for (const scenario of ['invalid-file', 'newer-version']) {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-startup-review-'));
  try {
    const data = path.join(folder, 'NEXO'); await mkdir(data);
    const file = path.join(data, 'nexo.sqlite');
    if (scenario === 'invalid-file') await writeFile(file, 'BASE FICTICIA INVALIDA - TESTE DE ABERTURA');
    else { const db = new DatabaseSync(file); db.exec('PRAGMA user_version=12'); db.close(); }
    const before = createHash('sha256').update(await readFile(file)).digest('hex');
    const started = Date.now();
    const child = spawn(process.env.NEXO_VERIFY_EXECUTABLE, [], { cwd: folder, windowsHide: true,
      env: { ...process.env, LOCALAPPDATA: folder, NEXO_TEST_HIDE_WINDOW: '1', PATH: `${process.env.SystemRoot}\\System32;${process.env.SystemRoot}`, NODE_PATH: '', NODE_OPTIONS: '' } });
    let stderr = '', stdout = '';
    child.stderr.on('data', bytes => { stderr = (stderr + bytes).slice(-16000); }); child.stdout.on('data', bytes => { stdout = (stdout + bytes).slice(-16000); });
    const timer = setTimeout(() => child.kill(), 20000);
    const exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); }); clearTimeout(timer);
    assert.match(stderr, /Falha ao abrir NEXO/);
    const after = createHash('sha256').update(await readFile(file)).digest('hex');
    if (scenario === 'invalid-file') assert.equal(before, after);
    results.push({ scenario, exitCode, elapsedMs: Date.now() - started, stderr: stderr.trim(), stdout: stdout.trim(), inputUnchanged: before === after });
  } finally {
    const resolved = path.resolve(folder); if (!resolved.startsWith(path.resolve(tmpdir()) + path.sep)) throw new Error('Pasta fora do ambiente temporário.');
    await rm(resolved, { recursive: true, force: true });
  }
}
await writeFile(path.join(evidence, 'result.json'), JSON.stringify({ results, temporaryData: true }, null, 2));
console.log(JSON.stringify({ evidence, results }, null, 2));
