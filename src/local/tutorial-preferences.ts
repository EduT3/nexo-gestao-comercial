import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';
import { newTutorialPreference, tutorialPreferenceSchema } from '../shared/tutorial.js';

/** UI preferences only: no schema migration, commercial writes or credentials. */
export function createTutorialPreferences(db: LocalDatabase, dataFolder: string) {
  const directory = path.join(dataFolder, 'tutorial-preferences');
  let queue = Promise.resolve();
  function enqueue<T>(action: () => Promise<T>): Promise<T> {
    const result = queue.then(action);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }
  async function location(userId: string, company: unknown) {
    const companyId = z.string().min(1).max(100).parse(company);
    await authorizeLocalCatalog(db, userId, companyId, false);
    const scope = createHash('sha256').update(JSON.stringify([userId, companyId])).digest('hex');
    return path.join(directory, `${scope}.json`);
  }
  return {
    read(userId: string, company: unknown) {
      return enqueue(async () => {
        const file = await location(userId, company);
        try { return tutorialPreferenceSchema.parse(JSON.parse(await readFile(file, 'utf8'))); }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return newTutorialPreference();
          throw new Error('Não foi possível ler a preferência do tutorial. Você pode continuar usando o NEXO.');
        }
      });
    },
    write(userId: string, company: unknown, input: unknown) {
      return enqueue(async () => {
        const preference = tutorialPreferenceSchema.parse(input);
        const file = await location(userId, company);
        await mkdir(directory, { recursive: true });
        await writeFile(`${file}.tmp`, JSON.stringify(preference), 'utf8');
        await rename(`${file}.tmp`, file);
        return preference;
      });
    },
  };
}
