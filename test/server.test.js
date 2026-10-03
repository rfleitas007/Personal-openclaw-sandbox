import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer, resolvePath } from '../server.js';

let server;
let base;

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

test('serves index.html with security headers', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.match(await res.text(), /PAII Decision Brief Generator/);
});

test('serves engine modules as JavaScript', async () => {
  const res = await fetch(`${base}/engine/generate.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/javascript/);
});

test('returns 404 for missing files and 405 for writes', async () => {
  assert.equal((await fetch(`${base}/nope.js`)).status, 404);
  assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 405);
});

test('resolvePath refuses to escape the public directory', () => {
  assert.equal(resolvePath('/%2e%2e/package.json'), null);
  assert.equal(resolvePath('/../server.js'), null);
  assert.equal(resolvePath('/%E0%A4%A'), null);
  assert.equal(resolvePath('/a%00b'), null);
  assert.equal(path.basename(resolvePath('/')), 'index.html');
});
