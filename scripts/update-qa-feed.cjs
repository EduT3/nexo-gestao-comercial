// Test-only feed for installed-app QA. Serves explicit distribution files on loopback.
const { createServer } = require('node:http');
const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');
const path = require('node:path');

async function startUpdateQaFeed(directory, filenames) {
  const files = new Map();
  for (const name of filenames) {
    if (name !== path.basename(name)) throw Error('Invalid update fixture filename');
    const file = path.join(directory, name);
    const info = await stat(file);
    if (!info.isFile() || info.size === 0) throw Error('Invalid update fixture: ' + name);
    files.set('/' + encodeURIComponent(name), { file, size: info.size });
  }
  const requests = [];
  let interruptedPath;
  const server = createServer((request, response) => {
    const pathname = request.url.split('?')[0];
    requests.push({ method: request.method, pathname });
    const entry = files.get(pathname);
    if (!entry || !['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(404).end();
      return;
    }
    if (pathname === interruptedPath) response.setHeader('Connection', 'close');
    // Serving full responses also exercises the updater's full-download fallback.
    response.writeHead(200, { 'Content-Length': entry.size, 'Content-Type': 'application/octet-stream' });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    if (pathname === interruptedPath) {
      requests.at(-1).interrupted = true;
      const partial = createReadStream(entry.file, { end: 65535 });
      partial.on('error', () => response.destroy());
      response.on('close', () => partial.destroy());
      partial.on('data', chunk => response.write(chunk));
      partial.on('end', () => response.end());
      return;
    }
    const stream = createReadStream(entry.file);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    url: 'http://127.0.0.1:' + server.address().port + '/',
    requests,
    interruptDownload(name) {
      const pathname = name === null ? undefined : '/' + encodeURIComponent(name);
      if (pathname && !files.has(pathname)) throw Error('Update fixture is not configured');
      interruptedPath = pathname;
    },
    async setManifest(file) {
      const entry = files.get('/latest.yml');
      if (!entry) throw Error('Update manifest is not configured');
      const info = await stat(file);
      if (!info.isFile() || info.size === 0) throw Error('Invalid update manifest');
      files.set('/latest.yml', { file, size: info.size });
    },
    async close() {
      await new Promise(resolve => {
        server.close(resolve);
        server.closeAllConnections();
      });
    },
  };
}

module.exports = { startUpdateQaFeed };
