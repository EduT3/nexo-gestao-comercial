const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFile, stat } = require('node:fs/promises');
const path = require('node:path');
const yaml = require('js-yaml');

async function main() {
  const root = path.resolve('artifacts/installer');
  const metadata = JSON.parse(await readFile('package.json', 'utf8'));
  const version = metadata.version;
  assert.match(version, /^\d+\.\d+\.\d+$/);
  const name = `NEXO-Setup-${version}.exe`;
  const update = yaml.load(await readFile(path.join(root, 'latest.yml'), 'utf8'));
  assert.equal(update.version, version, 'Versão no manifesto difere do package.json');
  assert.equal(update.path, name, 'Caminho do instalador no manifesto é inválido');
  assert.ok(Array.isArray(update.files));
  const entry = update.files.find(file => file.url === name);
  assert.ok(entry, 'Instalador ausente da lista do manifesto');
  const bytes = await readFile(path.join(root, name));
  const sha512 = createHash('sha512').update(bytes).digest('base64');
  assert.equal(update.sha512, sha512, 'SHA-512 principal divergente');
  assert.equal(entry.sha512, sha512, 'SHA-512 do instalador divergente');
  assert.equal(entry.size, bytes.length, 'Tamanho do instalador divergente');
  assert.ok((await stat(path.join(root, name + '.blockmap'))).size > 0, 'Blockmap vazio');
  const audit = JSON.parse(await readFile(path.join(root, 'package-audit.json'), 'utf8'));
  assert.ok(audit.dependencyBytesBefore >= audit.dependencyBytesAfter);
  const build = JSON.parse(await readFile(path.join(root, 'win-unpacked/resources/app/dist/build-info.json'), 'utf8'));
  assert.equal(build.productVersion, version, 'Versão da aplicação empacotada divergente');
  console.log(JSON.stringify({version, installer:name, bytes:bytes.length, sha512, build:build.id}));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
