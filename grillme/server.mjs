import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASE } from './case.mjs';
import { newGame, ask, commit, present } from './engine.mjs';
import { fallback } from './fallback.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const sessions = new Map();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' };

const publicCase = () => ({
  title: CASE.title, intro: CASE.intro,
  facts: Object.fromEntries(Object.entries(CASE.facts).map(([k, v]) => [k, v.text])),
  suspects: Object.fromEntries(Object.entries(CASE.suspects).map(([k, s]) => [k, { name: s.name, role: s.role, look: s.look }])),
});
const snapshot = g => ({
  discovered: [...g.discovered],
  ledger: Object.fromEntries(Object.entries(g.ledger).map(([s, l]) => [s, l.map(e => ({ ...e,
    text: e.says === 'true' ? CASE.facts[e.fact].text : e.says === 'false' ? CASE.suspects[s].positions[e.fact].lie : null }))])),
});

async function api(path, body) {
  if (path === '/api/new') {
    const id = randomUUID(); sessions.set(id, newGame());
    return { id, case: publicCase(), live: !!process.env.ANTHROPIC_API_KEY, ...snapshot(sessions.get(id)) };
  }
  const g = sessions.get(body.id); if (!g) return { error: 'unknown session' };
  if (!CASE.suspects[body.suspect]) return { error: 'unknown suspect' };
  if (path === '/api/ask') {
    const q = String(body.question || '').slice(0, 500); if (!q.trim()) return { error: 'empty question' };
    const { reply, usedFallback } = await ask(g, body.suspect, q, fallback);
    const changes = commit(g, body.suspect, reply);
    return { speech: reply.speech, mood: reply.mood || 'calm', usedFallback, changes, ...snapshot(g) };
  }
  if (path === '/api/present') {
    const r = present(g, body.suspect, body.fact); if (!r.ok) return { error: r.error };
    const q = `I'm putting this in front of you: ${CASE.facts[body.fact]} What do you say to that?`;
    const { reply, usedFallback } = await ask(g, body.suspect, q, (a, b, c) => fallback(a, b, c, [body.fact]));
    const changes = commit(g, body.suspect, reply, r.flipped);
    return { speech: reply.speech, mood: reply.mood || 'nervous', usedFallback, changes, ...snapshot(g) };
  }
  if (path === '/api/accuse') {
    const correct = body.suspect === CASE.solution;
    const confessed = g.broken[CASE.solution].has('F_CLOAK');
    return { correct, confessed, solution: CASE.solution };
  }
  return { error: 'not found' };
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'POST') {
      let raw = ''; for await (const c of req) raw += c;
      const out = await api(url.pathname, raw ? JSON.parse(raw) : {});
      res.writeHead(out.error ? 400 : 200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(out));
    }
    let p = url.pathname === '/' ? '/public/index.html' : '/public' + url.pathname;
    if (p === '/public/vendor/three.js') p = '/node_modules/three/build/three.module.js';
    if (p === '/public/vendor/three.core.js') p = '/node_modules/three/build/three.core.js';
    if (!/^\/(public|node_modules\/three\/build)/.test(p) || normalize(p).includes('..')) { res.writeHead(404); return res.end('nope'); }
    const data = await readFile(join(root, p));
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(data);
  } catch (e) { res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e.message)); }
}).listen(process.env.PORT || 3000, () => console.log(`grillme on :${process.env.PORT || 3000} (${process.env.ANTHROPIC_API_KEY ? 'live Claude' : 'offline fallback'})`));
