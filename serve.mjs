// node serve.mjs [port]
// Shows the built sites on this computer: http://localhost:4100/low/  /mid/  /high/
// It also answers other devices on the same Wi-Fi, so a phone can open it (the address is printed below).
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = +(process.argv[2] || process.env.PORT || 4100);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };

createServer((req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  let file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) { res.writeHead(301, { Location: path + '/' }).end(); return; }
    file = join(file, 'index.html');
  }
  if (!existsSync(file)) {
    // the tier's own "not found" page, where it has one
    const tier = path.split('/')[1], nf = join(ROOT, tier || '', '404.html');
    if (existsSync(nf)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); createReadStream(nf).pipe(res); return; }
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  const ext = extname(file), hashed = /\.[0-9a-f]{8}\.\w+$/.test(file);
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Content-Length': statSync(file).size, 'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  const lan = Object.values(networkInterfaces()).flat().find((n) => n && n.family === 'IPv4' && !n.internal)?.address;
  console.log(`\n  Showroom Kit demos\n\n  All three:   http://localhost:${PORT}/\n  Starter:     http://localhost:${PORT}/LowTier_CarDealership/\n  Business:    http://localhost:${PORT}/MidTier_CarDealership/\n  Signature:   http://localhost:${PORT}/HighTier_CarDealership/\n${lan ? `\n  On a phone (same Wi-Fi):  http://${lan}:${PORT}/\n` : ''}\n  Leave this window open. Close it to stop.\n`);
});
