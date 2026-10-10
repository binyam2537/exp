import * as THREE from 'three';

const $ = s => document.querySelector(s);
const post = (p, b) => fetch(p, { method: 'POST', body: JSON.stringify(b) }).then(r => r.json());
let S = { id: null, case: null, cur: null, ledger: {}, discovered: [], busy: false };

// ---------------- 3D scene ----------------
const renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x060504); scene.fog = new THREE.FogExp2(0x060504, 0.05);
const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 50); cam.position.set(0, 1.5, 2.7);

// venetian-blind light: striped spotlight map
const blind = document.createElement('canvas'); blind.width = blind.height = 256;
{ const c = blind.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#fff'; for (let y = 8; y < 256; y += 32) c.fillRect(0, y, 256, 14); }
const spot = new THREE.SpotLight(0xffc27a, 90, 14, 0.55, 0.6, 1.6);
spot.position.set(-3.2, 3.2, 1.5); spot.target.position.set(0, 1.1, -0.8); spot.map = new THREE.CanvasTexture(blind); spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024); scene.add(spot, spot.target);
const lamp = new THREE.PointLight(0xffb45c, 14, 5, 1.8); lamp.position.set(0.9, 1.5, 0.4); lamp.castShadow = true; scene.add(lamp);
scene.add(new THREE.HemisphereLight(0x2a3340, 0x0a0806, 0.5));

const mat = (c, r = .8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const add = (g, m, x, y, z, parent = scene) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
// room
add(new THREE.BoxGeometry(10, .1, 10), mat(0x1b1510, .6), 0, 0, -2);
add(new THREE.BoxGeometry(10, 5, .1), mat(0x2a2620, .95), 0, 2.5, -3.6);
add(new THREE.BoxGeometry(.1, 5, 10), mat(0x2a2620, .95), -4, 2.5, -2);
// table, lamp, props
add(new THREE.BoxGeometry(2.8, .08, 1.2), mat(0x3b2a1a, .45), 0, .92, .1);
for (const [x, z] of [[-1.3, -.4], [1.3, -.4], [-1.3, .6], [1.3, .6]]) add(new THREE.BoxGeometry(.08, .9, .08), mat(0x2a1d12), x, .45, z);
const lampBase = add(new THREE.CylinderGeometry(.12, .15, .05, 16), mat(0x222, .4, .8), .9, .98, .4);
add(new THREE.CylinderGeometry(.015, .015, .5, 8), mat(0x222, .4, .8), .9, 1.22, .4);
add(new THREE.ConeGeometry(.2, .2, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1c5a3a, side: THREE.DoubleSide, emissive: 0x3a2a08 }), .9, 1.5, .4);
add(new THREE.CylinderGeometry(.06, .07, .1, 16), mat(0xc8b074, .3, .9), -.5, 1.01, .3);           // the trophy
add(new THREE.BoxGeometry(.4, .01, .28), mat(0xd9cfb4, .9), .1, .97, .5).rotation.y = .3;                // case file
const ash = add(new THREE.CylinderGeometry(.09, .08, .03, 14), mat(0x555, .4, .6), -.9, .98, .35);
// dust motes
const motes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(Array.from({ length: 450 }, (_, i) => i % 3 === 0 ? (Math.random() - .5) * 6 : i % 3 === 1 ? Math.random() * 3.5 : Math.random() * -3)), 3)),
  new THREE.PointsMaterial({ color: 0xffd59a, size: .015, transparent: true, opacity: .55 })); scene.add(motes);
// chair for detective foreground
add(new THREE.BoxGeometry(2.8, .5, .4), mat(0x0a0807), 0, .25, 3.0);

// suspect figure built from primitives
function makeSuspect(look) {
  const g = new THREE.Group(), skin = mat(look.skin, .6), coat = mat(look.coat, .75);
  const body = add(new THREE.CylinderGeometry(.27, .34, .8, 20), coat, 0, 1.0, 0, g);
  const neck = add(new THREE.CylinderGeometry(.07, .08, .12, 12), skin, 0, 1.46, 0, g);
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); g.add(head);
  add(new THREE.SphereGeometry(.17, 24, 20), skin, 0, 0, 0, head);
  const hair = add(new THREE.SphereGeometry(.185, 24, 16, 0, Math.PI * 2, 0, Math.PI * .55), mat(look.hair, .9), 0, .015, -.01, head);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x050403 });
  const eyes = [-.06, .06].map(x => add(new THREE.SphereGeometry(.02, 8, 8), eyeM, x, .02, .155, head));
  const mouth = add(new THREE.BoxGeometry(.07, .012, .01), mat(0x4a1c18), 0, -.07, .16, head);
  const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(.34 * s, 1.3, .02); g.add(a);
    add(new THREE.CylinderGeometry(.065, .06, .5, 10), coat, 0, -.2, .12, a).rotation.x = -.9; add(new THREE.SphereGeometry(.06, 10, 10), skin, 0, -.4, .38, a); return a; });
  g.userData = { head, mouth, arms, eyes, body };
  g.position.set(0, 0, -1.0); return g;
}
const figures = {}; let cur = null, mood = 'calm', talk = 0, slide = 0;
function showSuspect(id) {
  if (cur) scene.remove(cur);
  figures[id] ||= makeSuspect(S.case.suspects[id].look);
  cur = figures[id]; cur.position.x = 3; slide = 1; scene.add(cur);
}
function resize() { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta(), t = clock.elapsedTime;
  cam.position.x = Math.sin(t * .15) * .12; cam.position.y = 1.55 + Math.sin(t * .2) * .02; cam.lookAt(0, 1.2, -1);
  lamp.intensity = 14 + Math.sin(t * 23) * .5 + Math.sin(t * 7) * .6;
  motes.rotation.y = t * .01; motes.position.y = Math.sin(t * .3) * .05;
  if (cur) {
    const u = cur.userData; slide = Math.max(0, slide - .025); cur.position.x = slide * slide * 3;
    const nerv = mood === 'nervous' ? 1 : 0, ang = mood === 'angry' ? 1 : 0;
    u.body.scale.y = 1 + Math.sin(t * 1.6) * .008; u.body.position.y = 1.0 + Math.sin(t * 1.6) * .004;
    u.head.rotation.y = Math.sin(t * .5) * .12 + nerv * Math.sin(t * 11) * .05;
    u.head.rotation.x = (mood === 'sad' ? .3 : 0) + (talk > 0 ? Math.sin(t * 14) * .03 : 0) - ang * .1;
    cur.position.z = -1.0 + ang * .25 + (mood === 'cold' ? -.1 : 0);
    u.mouth.scale.y = talk > 0 ? 1 + Math.abs(Math.sin(t * 18)) * 3 : 1; talk = Math.max(0, talk - dt);
    u.arms.forEach((a, i) => { a.rotation.z = nerv * Math.sin(t * 13 + i) * .03; });
  }
  renderer.render(scene, cam);
});

// ---------------- UI ----------------
const log = $('#log');
function line(cls, text, n) { const d = document.createElement('div'); d.className = cls; if (n) d.dataset.n = n; d.textContent = text; log.append(d); log.scrollTop = 1e9; return d; }
const nameOf = id => S.case.suspects[id].name;

function renderBook(newFacts = []) {
  const f = $('#facts'); f.innerHTML = '';
  for (const id of S.discovered) {
    const d = document.createElement('div'); d.className = 'fact' + (newFacts.includes(id) ? ' new' : '');
    d.textContent = S.case.facts[id];
    if (S.cur) { const b = document.createElement('button'); b.textContent = `Present to ${nameOf(S.cur).split(' ')[0]}`; b.onclick = () => present(id); d.append(document.createElement('br'), b); }
    f.append(d);
  }
  const st = $('#stmts'); st.innerHTML = '';
  for (const [sid, l] of Object.entries(S.ledger)) {
    const claims = l.filter(e => e.says !== 'unknown'); if (!claims.length) continue;
    const box = document.createElement('div'); box.className = 'st'; box.innerHTML = `<h4>${nameOf(sid)}</h4>`;
    const ul = document.createElement('ul'); ul.style.padding = 0;
    const latest = {}; claims.forEach(e => latest[e.fact] = e);
    claims.forEach(e => { const li = document.createElement('li'); li.className = e.says === 'false' ? 'f' : 't';
      const superseded = latest[e.fact] !== e; li.innerHTML = superseded ? `<s></s>` : ''; (superseded ? li.firstChild : li).textContent = (e.says === 'false' ? '“' + e.text + '”' : e.text) + (superseded ? '' : '');
      ul.append(li);
      if (!superseded && claims.some(o => o.fact === e.fact && o !== e)) li.textContent += '  ← STORY CHANGED'; });
    box.append(ul); st.append(box);
  }
}
function apply(r) {
  S.ledger = r.ledger; S.discovered = r.discovered; renderBook(r.changes?.newFacts);
  for (const c of r.changes?.changedStory ?? []) line('note flip', `Their story just changed: ${c.now}`);
  for (const id of r.changes?.newFacts ?? []) line('note', `Notebook: ${S.case.facts[id]}`);
}
async function respond(p) {
  S.busy = true; const nm = nameOf(S.cur), wait = line('them', '…', nm);
  const r = await p; S.busy = false;
  if (r.error) { wait.textContent = r.error; return; }
  wait.textContent = r.speech; mood = r.mood; talk = Math.min(4, r.speech.length / 25); apply(r);
}
async function present(fact) { if (S.busy) return; line('me', `[presents] ${S.case.facts[fact]}`); respond(post('/api/present', { id: S.id, suspect: S.cur, fact })); }
$('#form').onsubmit = e => { e.preventDefault(); const q = $('#q').value.trim(); if (!q || S.busy) return; $('#q').value = ''; line('me', q); respond(post('/api/ask', { id: S.id, suspect: S.cur, question: q })); };
function pick(id) {
  S.cur = id; mood = 'calm'; showSuspect(id); log.innerHTML = '';
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  $('#who').innerHTML = `${nameOf(id)}<small>${S.case.suspects[id].role}</small>`;
  line('note', `${nameOf(id)} sits down across the table.`); renderBook();
}
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button,.pane').forEach(x => x.classList.remove('on')); b.classList.add('on'); $('#' + b.dataset.t).classList.add('on'); });
$('#accuse').onclick = async () => {
  const who = prompt('Who did it? Type a first name:\n' + Object.values(S.case.suspects).map(s => s.name).join(', ')); if (!who) return;
  const id = Object.keys(S.case.suspects).find(k => nameOf(k).toLowerCase().startsWith(who.trim().toLowerCase())); if (!id) return alert('No such suspect.');
  const r = await post('/api/accuse', { id: S.id, suspect: id });
  $('#end').classList.remove('hidden'); $('#endT').textContent = r.correct ? 'Case closed.' : 'Wrong person.';
  $('#endP').textContent = r.correct ? (r.confessed ? 'You broke their story and got the confession. Perfect.' : 'Right suspect — but without a confession it may not hold up in court.') : `It was ${nameOf(r.solution)}. An innocent person walks out of this room under suspicion.`;
};
$('#start').onclick = async () => {
  const r = await post('/api/new', {}); S.id = r.id; S.case = r.case; S.ledger = r.ledger; S.discovered = r.discovered;
  $('#intro').classList.add('hidden');
  for (const [id, s] of Object.entries(r.case.suspects)) { const b = document.createElement('button'); b.textContent = s.name; b.dataset.id = id; b.onclick = () => pick(id); $('#suspects').append(b); }
  pick(Object.keys(r.case.suspects)[0]);
};
fetch('/api/new', { method: 'POST', body: '{}' }).then(r => r.json()).then(r => { $('#introText').textContent = r.case.intro;
  $('#mode').textContent = r.live ? 'Suspects are voiced live by Claude, validated against the case file on every line.' : 'Offline mode: set ANTHROPIC_API_KEY for free-form Claude-voiced answers. Scripted keyword answers are used until then.'; });
