import { DatabaseSync } from 'node:sqlite';
import { constants } from 'node:fs';
import { access, copyFile, mkdir, open, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { LOCAL_SCHEMA_VERSION } from './migrations.js';
import { validateLocalBackup } from './recovery.js';
import { openLocalDatabase } from './sqlite.js';
import { authenticateLocalUser } from './access.js';
import { authorizeLocalCatalog } from './catalog.js';

export async function inspectStartupDatabase(file: string) {
  const marker = path.join(path.dirname(file), 'recovery-pending.json');
  if (await access(marker).then(() => true, () => false)) throw new Error('Uma recuperação foi interrompida. Os arquivos anteriores foram guardados. Selecione um backup para concluir.');
  try { const info = await stat(file); if (!info.isFile() || !info.size) throw new Error('O arquivo de dados está vazio ou não pode ser lido.'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
  const engine = new DatabaseSync(file, { readOnly: true });
  try {
    const version = Number(engine.prepare('PRAGMA user_version').get()?.user_version);
    if (!Number.isInteger(version) || version < 0 || version > LOCAL_SCHEMA_VERSION) throw new Error('Esta base foi criada por outra versão do NEXO. Use uma versão compatível do programa.');
    if (!engine.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='local_companies'").get()) throw new Error('O arquivo não contém os dados esperados do NEXO.');
  } finally { engine.close(); }
}
async function syncFile(file: string) { const handle = await open(file, 'r+'); try { await handle.sync(); } finally { await handle.close(); } }
export async function stageStartupBackup(source: string, folder: string) {
  const staged = path.join(folder, 'recovery-candidate-' + randomUUID() + '.sqlite');
  try {
    await copyFile(source, staged, constants.COPYFILE_EXCL); await syncFile(staged); validateLocalBackup(staged);
    const engine = new DatabaseSync(staged, { readOnly: true });
    try {
      if (Number(engine.prepare('PRAGMA user_version').get()?.user_version) < 11) throw new Error('Use uma cópia com a senha do responsável configurada.');
      const users = engine.prepare("SELECT u.id,u.name FROM local_users u JOIN local_credentials c ON c.user_id=u.id WHERE u.active=1 AND EXISTS(SELECT 1 FROM local_memberships m WHERE m.user_id=u.id AND m.company_id='adega-jg' AND m.active=1 AND m.role='ADMIN') AND NOT EXISTS(SELECT 1 FROM local_companies company WHERE NOT EXISTS(SELECT 1 FROM local_memberships m WHERE m.user_id=u.id AND m.company_id=company.id AND m.active=1 AND m.role='ADMIN')) ORDER BY u.name").all() as { id: string; name: string }[];
      if (!users.length) throw new Error('A cópia não possui um responsável com senha e acesso ativo a toda a instalação.');
      return { staged, users };
    } finally { engine.close(); }
  } catch (error) { await unlink(staged).catch(() => undefined); throw error; }
}
export async function authorizeStartupBackup(staged: string, userId: string, password: unknown) {
  const database = openLocalDatabase(staged);
  try {
    const actor = await authenticateLocalUser(database, userId, password);
    await database.transaction(async tx => {
      const companies = await tx.query('SELECT id FROM local_companies');
      if (!companies.length) throw new Error('Cópia sem loja cadastrada.');
      for (const company of companies) await authorizeLocalCatalog(tx, actor.id, String(company.id), true);
    });
  } finally { await database.close(); }
}
/** Main-process only: database must be closed. Retain raw originals, including WAL. */
export async function installStartupBackup(activeFile: string, staged: string,
  move: typeof rename = rename) {
  const folder = path.resolve(path.dirname(activeFile));
  if (path.resolve(path.dirname(staged)) !== folder || !path.basename(staged).startsWith('recovery-candidate-')) throw new Error('Cópia de recuperação inválida.');
  validateLocalBackup(staged); await syncFile(staged);
  const retained = path.join(folder, 'recovery-saved-' + randomUUID()); await mkdir(retained);
  const marker = path.join(folder, 'recovery-pending.json');
  await writeFile(marker, JSON.stringify({ retained, staged: path.basename(staged), createdAt: new Date().toISOString() })); await syncFile(marker);
  const moved: { source: string; saved: string }[] = [];
  try {
    for (const suffix of ['', '-wal', '-shm', '-journal']) {
      const source = path.resolve(activeFile + suffix), saved = path.join(retained, path.basename(source));
      if (path.dirname(source) !== folder || path.dirname(saved) !== retained) throw new Error('Caminho de recuperação inválido.');
      try { await move(source, saved); moved.push({ source, saved }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    await move(staged, activeFile);
  } catch (error) {
    let restored = true;
    for (const file of moved.reverse()) { try { await rename(file.saved, file.source); } catch { restored = false; } }
    if (restored) await unlink(marker).catch(() => undefined);
    if (!restored) throw new Error('Não foi possível concluir. Os arquivos anteriores estão guardados em ' + retained + '. Selecione novamente um backup.');
    throw error;
  }
  await writeFile(path.join(retained, 'LEIA-ME.txt'), 'Arquivos anteriores à recuperação do NEXO. Preserve esta pasta. Ela pode conter uma base ilegível e arquivos auxiliares; não é um backup validado.').catch(() => undefined);
  // If this cleanup fails, keep the interruption guard rather than opening an empty installation.
  await unlink(marker);
  return { retained };
}
