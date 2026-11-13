/*
 * Shared helper: copy the extension into a temp dir, optionally pre-grant host
 * access (headless Chromium cannot click Chrome's permission prompt), start a
 * local fake-internet proxy and launch Chromium with the unpacked extension.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = path.join(ROOT, 'src');

function fakePage(url) {
  return `<!doctype html><title>${url.hostname}</title>
<h1 id="origin">origin:${url.hostname}${url.pathname}</h1>
<a id="spa-shorts" href="/shorts/abc123" onclick="event.preventDefault();history.pushState({}, '', '/shorts/abc123');document.getElementById('origin').textContent='spa:'+location.pathname;">Shorts (SPA)</a>`;
}

/** Throwaway self-signed certificate, generated per run (never committed). */
function makeCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusfence-cert-'));
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
    '-days', '2', '-subj', '/CN=focusfence-test', '-addext', 'subjectAltName=DNS:*.test',
  ], { stdio: 'ignore' });
  const out = { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}

/**
 * A tiny "fake internet": an HTTP proxy that answers every request with a simple
 * page. CONNECT tunnels (https, incl. HSTS-preloaded hosts like reddit.com) are
 * terminated locally with a self-signed cert (Chromium runs with
 * --ignore-certificate-errors in tests).
 */
export async function startFakeInternet({ downHosts = [] } = {}) {
  const hits = [];
  const isDown = (host) => downHosts.some((d) => host === d || host.endsWith('.' + d));
  const handler = (scheme) => (req, res) => {
    let url;
    try {
      url = new URL(req.url, scheme + '://' + req.headers.host);
    } catch (e) {
      res.writeHead(400).end();
      return;
    }
    hits.push(url.href);
    if (isDown(url.hostname)) {
      req.socket.destroy(); // simulate "offline / service down"
      return;
    }
    if (url.pathname === '/favicon.ico') {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(fakePage(url));
  };
  const tls = https.createServer(makeCert(), handler('https'));
  const server = http.createServer(handler('http'));
  const sockets = new Set();
  server.on('connection', (s) => {
    sockets.add(s);
    s.on('close', () => sockets.delete(s));
  });
  server.on('connect', (req, socket, head) => {
    if (isDown(String(req.url).split(':')[0])) {
      hits.push('CONNECT ' + req.url);
      socket.destroy();
      return;
    }
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head && head.length) socket.unshift(head);
    tls.emit('connection', socket);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return {
    server,
    port: server.address().port,
    hits,
    close: () =>
      new Promise((r) => {
        for (const s of sockets) s.destroy();
        tls.close();
        server.close(() => r());
      }),
  };
}

export function prepareExtension({ grantAll = true, mutate, srcDir = SRC } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusfence-ext-'));
  fs.cpSync(srcDir, dir, { recursive: true });
  const mfPath = path.join(dir, 'manifest.json');
  const mf = JSON.parse(fs.readFileSync(mfPath, 'utf8'));
  if (grantAll) mf.host_permissions = ['<all_urls>'];
  if (mutate) mutate(mf, dir);
  fs.writeFileSync(mfPath, JSON.stringify(mf, null, 2));
  return dir;
}

export async function launchExtension({ grantAll = true, proxyPort, viewport, mutate, colorScheme, srcDir } = {}) {
  const extDir = prepareExtension({ grantAll, mutate, srcDir });
  const args = [
    `--disable-extensions-except=${extDir}`,
    `--load-extension=${extDir}`,
    '--disable-features=HttpsUpgrades,HttpsFirstBalancedModeAutoEnable',
    '--no-first-run',
  ];
  if (proxyPort) args.push('--ignore-certificate-errors');
  if (proxyPort) args.push(`--proxy-server=http://127.0.0.1:${proxyPort}`, '--proxy-bypass-list=<-loopback>');
  const env = Object.assign({}, process.env);
  if (process.env.FF_CHROME_LIBS) {
    env.LD_LIBRARY_PATH = [process.env.FF_CHROME_LIBS, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  }
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args,
    env,
    viewport: viewport || { width: 1280, height: 800 },
    colorScheme: colorScheme || 'light',
  });
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  const extId = sw.url().split('/')[2];
  const base = `chrome-extension://${extId}/`;
  // wait until the worker finished its first rule sync
  await sw.evaluate(() => self.queueSync && self.queueSync());
  return {
    context,
    sw,
    extId,
    base,
    extDir,
    async close() {
      await context.close();
      fs.rmSync(extDir, { recursive: true, force: true });
    },
  };
}
