const {copyFile, readFile, readdir, rm, stat, writeFile} = require('node:fs/promises');
const {createRequire} = require('node:module');
const path = require('node:path');

module.exports = async context => {
  const app = path.join(context.appOutDir, 'resources', 'app');
  const modules = path.join(app, 'node_modules');
  const required = new Set();

  async function retain(name, importer) {
    const folders = createRequire(importer).resolve.paths(name) ?? [];
    for (const folder of folders) {
      const manifest = path.join(folder, name, 'package.json');
      if (!manifest.startsWith(modules + path.sep)) continue;
      let metadata;
      try { metadata = JSON.parse(await readFile(manifest, 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      const root = path.dirname(manifest);
      if (required.has(root)) return true;
      required.add(root);
      for (const dependency of Object.keys(metadata.dependencies ?? {})) {
        if (!await retain(dependency, manifest)) throw Error('Dependência Windows ausente: ' + dependency);
      }
      for (const dependency of Object.keys(metadata.optionalDependencies ?? {})) await retain(dependency, manifest);
      return true;
    }
    return false;
  }

  const runtime = ['electron-updater', 'zod'];
  const manifest = path.join(app, 'package.json');
  for (const name of runtime) {
    if (!await retain(name, manifest)) throw Error('Dependência Windows ausente: ' + name);
  }

  async function bytes(folder) {
    let total = 0;
    for (const entry of await readdir(folder, {withFileTypes:true})) {
      const item = path.join(folder, entry.name);
      if (entry.isDirectory()) total += await bytes(item);
      else if (entry.isFile()) total += (await stat(item)).size;
    }
    return total;
  }

  const removed = [];
  const before = await bytes(modules);
  async function prune(folder) {
    for (const entry of await readdir(folder, {withFileTypes:true})) {
      if (!entry.isDirectory()) continue;
      const item = path.resolve(folder, entry.name);
      if (!item.startsWith(modules + path.sep)) throw Error('Diretório fora do pacote Windows.');
      if (entry.name.startsWith('@')) await prune(item);
      else if (!required.has(item)) {
        removed.push(path.relative(modules, item));
        await rm(item, {recursive:true});
      } else if (await stat(path.join(item, 'node_modules')).then(value => value.isDirectory(), () => false)) {
        await prune(path.join(item, 'node_modules'));
      }
    }
  }
  await prune(modules);
  await copyFile(path.join(context.packager.projectDir, 'node_modules/exceljs/dist/exceljs.min.js'), path.join(app, 'electron', 'exceljs.cjs'));
  const after = await bytes(modules);
  const inventory = {dependencyBytesBefore:before, dependencyBytesAfter:after, removed};
  console.log(JSON.stringify(inventory));
  await writeFile(path.join(path.dirname(context.appOutDir), 'package-audit.json'), JSON.stringify(inventory,null,2));
};
