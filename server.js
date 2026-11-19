'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, 'public');
const FIXTURES = path.join(__dirname, 'fixtures');
const ANALYZER = path.join(__dirname, 'src', 'analyzer.js');
const WORKSHEET = path.join(__dirname, 'src', 'worksheet.js');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function safeFile(base, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const normalized = path.normalize(decoded).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '');
  const file = path.resolve(base, `.${path.sep}${normalized}`);
  return file.startsWith(`${path.resolve(base)}${path.sep}`) ? file : null;
}

const server = http.createServer((req, res) => {
  const method = req.method || 'GET';
  if (!['GET', 'HEAD'].includes(method)) {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET, HEAD' });
    return res.end('Method not allowed');
  }

  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const base = url.pathname.startsWith('/fixtures/') ? FIXTURES : ROOT;
  const relativePath = url.pathname.startsWith('/fixtures/') ? url.pathname.slice('/fixtures/'.length) : (url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
  const file = url.pathname === '/analyzer.js' ? ANALYZER : (url.pathname === '/worksheet.js' ? WORKSHEET : safeFile(base, relativePath));
  if (!file) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad request');
  }

  fs.stat(file, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const headers = {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      'Cache-Control': 'no-store'
    };
    res.writeHead(200, headers);
    if (method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`CartShield Preflight running locally at http://${HOST}:${PORT}`);
  console.log('Local static server only: no scanning, telemetry, or external requests.');
});

function stop() { server.close(() => process.exit(0)); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
