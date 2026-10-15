import { ROOMS, TYPES, KIOSKS, BUILDING, SCALE } from './data.js';
import { route, ROOM_BY_ID, placePoint, dist, fmtDist, fmtTime } from './geo.js';
import { createMap } from './scene.js';
import { icon } from './icons.js';

// ------------------------------------------------------------ config (URL)
const q = new URLSearchParams(location.search);
const kioskId = KIOSKS[q.get('kiosk')] ? q.get('kiosk') : Object.keys(KIOSKS)[0];
const kiosk = KIOSKS[kioskId];
if (q.has('heading')) kiosk.heading = Number(q.get('heading'));
const IDLE_MS = (q.has('idle') ? Number(q.get('idle')) : 60) * 1000;

// ------------------------------------------------------------ state
const HERE = { kiosk: kioskId };
const state = {
  view: 'home',   // home | search | route | nav | arrived
  pick: 'to',     // which end the search panel is choosing
  filter: null,   // room type filter in search
  from: HERE,
  to: null,
  route: null,
  step: -1,
};

const $ = (s, el = document) => el.querySelector(s);
const ui = $('#ui');
const map = createMap($('#map'), { lite: q.has('lite') });
map.setNorth(kiosk.heading);
map.setYou(kiosk.at, kiosk.heading);
if (q.get('mode') === '2d') map.set3D(false, 0);

const placeName = (p) => (p.kiosk ? 'You are here' : ROOM_BY_ID.get(p.room).name);
const placeSub = (p) => (p.kiosk ? KIOSKS[p.kiosk].name : ROOM_BY_ID.get(p.room).t.single);
const same = (a, b) => a && b && a.kiosk === b.kiosk && a.room === b.room;
const walkFrom = (r) => dist(placePoint(state.from), r.center) * SCALE * 1.25;

const compassSvg = `<svg class="ic compass" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 3l3.2 9H8.8z" fill="#FF3B30"/><path d="M12 21l-3.2-9h6.4z" fill="#C7C7CC"/></svg>`;

// ------------------------------------------------------------ layout
ui.innerHTML = `
  <div class="top" id="top">
    <section class="card home" id="home">
      <button class="search-pill" id="searchBtn">${icon('search')}<span>Where to?</span></button>
      <div class="chips" id="chips"></div>
    </section>

    <section class="card panel" id="panel" hidden>
      <div class="search-row">
        ${icon('search')}
        <input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="Search">
        <button class="txt-btn" id="cancel">Cancel</button>
      </div>
      <div class="chips" id="panelChips"></div>
      <div class="results" id="results"></div>
    </section>

    <section class="card routecard" id="routeCard" hidden>
      <div class="ends">
        <div class="rail"><i class="dot-from"></i><i class="dots"></i>${icon('arrive', 'pin-ic')}</div>
        <button class="end" id="fromBtn"><b id="fromName"></b><small id="fromSub"></small></button>
        <button class="end" id="toBtn"><b id="toName"></b><small id="toSub"></small></button>
        <div class="end-actions">
          <button class="round ghost" id="closeRoute" aria-label="Close">${icon('close')}</button>
          <button class="round ghost" id="swap" aria-label="Swap">${icon('swap')}</button>
        </div>
      </div>
      <div class="summary">
        <div class="eta"><b id="eta"></b><small id="etaSub"></small></div>
        <div class="steps-mini" id="stepsMini"></div>
        <button class="primary" id="startBtn">${icon('play')}<span>Start</span></button>
      </div>
    </section>

    <section class="navwrap" id="nav" hidden>
      <div class="banner" id="banner">
        <div class="man" id="manIcon"></div>
        <div class="man-txt">
          <b id="manDist"></b>
          <span id="manText"></span>
        </div>
        <div class="progress"><i id="prog"></i></div>
      </div>
      <div class="navbar card">
        <div class="then" id="then"></div>
        <div class="nav-eta" id="navEta"></div>
        <button class="round" id="pauseBtn" aria-label="Pause">${icon('pause')}</button>
        <button class="round danger" id="exitBtn" aria-label="End">${icon('close')}</button>
      </div>
    </section>
  </div>

  <div class="ctrls" id="ctrls">
    <div class="fab floor"><small>${BUILDING.floor}</small></div>
    <button class="fab" id="btn3d"><b>2D</b></button>
    <button class="fab" id="btnCompass" aria-label="North">${compassSvg}</button>
    <button class="fab" id="btnLocate" aria-label="My location">${icon('locate')}</button>
    <div class="fab-group">
      <button class="fab" id="zoomIn" aria-label="Zoom in">${icon('plus')}</button>
      <button class="fab" id="zoomOut" aria-label="Zoom out">${icon('minus')}</button>
    </div>
  </div>
`;

// ------------------------------------------------------------ chips + results
const typeOrder = Object.keys(TYPES);
function chipsHTML(active) {
  return typeOrder.map((t) => `
    <button class="chip${active === t ? ' on' : ''}" data-type="${t}" style="--c:${TYPES[t].color}">
      <span class="chip-ic">${icon(TYPES[t].icon)}</span>${TYPES[t].label}
    </button>`).join('');
}
$('#chips').innerHTML = chipsHTML(null);

function renderResults() {
  const term = $('#q').value.trim().toLowerCase();
  let rooms = ROOMS.filter((r) => !state.filter || r.type === state.filter);
  if (term) rooms = rooms.filter((r) => `${r.name} ${r.t.single} ${r.keywords || ''} ${r.id}`.toLowerCase().includes(term));
  rooms = rooms.filter((r) => !(state.pick === 'to' ? same(state.from, { room: r.id }) : same(state.to, { room: r.id })));
  rooms.sort((a, b) => walkFrom(a) - walkFrom(b));

  const here = state.pick === 'from' && !term && !state.filter
    ? `<button class="row" data-here><span class="ic-circle here"><i></i></span>
         <span class="row-main"><b>You are here</b><small>${kiosk.name}</small></span></button>` : '';
  $('#results').innerHTML = here + rooms.map((r) => `
    <button class="row" data-room="${r.id}">
      <span class="ic-circle" style="--c:${r.t.color}">${icon(r.t.icon)}</span>
      <span class="row-main"><b>${r.name}</b><small>${r.t.single}</small></span>
      <span class="row-meta">${fmtDist(walkFrom(r))}</span>
    </button>`).join('') + (rooms.length || here ? '' : `<div class="empty">${icon('search')}<span>No places found</span></div>`);
  $('#panelChips').innerHTML = chipsHTML(state.filter);
}

// ------------------------------------------------------------ views
function show(view) {
  state.view = view;
  $('#home').hidden = view !== 'home';
  $('#panel').hidden = view !== 'search';
  $('#routeCard').hidden = view !== 'route';
  $('#nav').hidden = !(view === 'nav' || view === 'arrived');
  $('#nav').classList.toggle('arrived', view === 'arrived');
  $('#ctrls').classList.toggle('hide', view === 'nav' || view === 'arrived');
  ui.dataset.view = view;
  requestAnimationFrame(updateInsets);
}

// Tell the map which part of the screen is covered, so it can centre content in the rest.
function updateInsets() {
  if (state.view === 'search') return;
  const top = $('#top').getBoundingClientRect();
  const W = innerWidth, H = innerHeight;
  const ctrls = state.view === 'nav' || state.view === 'arrived' ? 0 : $('#ctrls').offsetWidth + 20;
  const byTop = top.bottom * W, byLeft = top.right * H;
  if (byLeft < byTop && top.right < W * 0.5) map.setInsets({ top: 0, left: top.right + 12, right: ctrls });
  else map.setInsets({ top: top.bottom + 8, left: 0, right: ctrls });
}
addEventListener('resize', () => requestAnimationFrame(updateInsets));

function openSearch(pick = 'to', filter = null) {
  state.pick = pick;
  state.filter = filter;
  $('#q').value = '';
  $('#q').placeholder = pick === 'from' ? 'Choose starting point' : 'Search rooms, labs, restrooms';
  renderResults();
  show('search');
  if (!filter) setTimeout(() => $('#q').focus({ preventScroll: true }), 60);
}

function closeSearch() {
  $('#q').blur();
  show(state.to ? 'route' : 'home');
}

function choose(place) {
  if (state.pick === 'from') state.from = place;
  else state.to = place;
  $('#q').blur();
  if (state.to) planRoute();
  else show('home');
}

function planRoute() {
  const r = route(state.from, state.to);
  state.route = r;
  map.stopOrbit();
  map.select(state.to.room || null);
  map.placePin(placePoint(state.to));
  map.showRoute(r);

  $('#fromName').textContent = placeName(state.from);
  $('#fromSub').textContent = placeSub(state.from);
  $('#toName').textContent = placeName(state.to);
  $('#toSub').textContent = placeSub(state.to);
  $('#eta').textContent = fmtTime(r.seconds);
  $('#etaSub').textContent = fmtDist(r.metres);
  $('#stepsMini').innerHTML = r.steps.slice(1).map((s) =>
    `<span class="mini${s.kind === 'arrive' ? ' end' : ''}">${icon(s.kind)}</span>`).join(`<i class="sep"></i>`);
  $('#routeCard').querySelector('.dot-from').classList.toggle('room', !!state.from.room);
  show('route');
  requestAnimationFrame(() => requestAnimationFrame(() => map.frameRoute()));
}

function clearRoute() {
  state.to = null;
  state.route = null;
  state.from = HERE;
  map.stopPreview();
  map.stopOrbit();
  map.clearRoute();
  map.select(null);
  map.placePin(null);
  show('home');
  requestAnimationFrame(() => map.home());
}

// ------------------------------------------------------------ immersive preview
function startNav() {
  const r = state.route;
  state.step = -1;
  show('nav');
  setBanner(0);
  $('#pauseBtn').innerHTML = icon('pause');
  map.startPreview(r, { onProgress: setBanner, onArrive: arrive });
}

function setBanner(s) {
  const r = state.route;
  const steps = r.steps;
  let i = steps.findIndex((st) => st.at > s + 0.5);
  if (i < 0) i = steps.length - 1;
  const showStart = s < 1;
  const cur = showStart ? steps[0] : steps[i];
  const key = showStart ? 'start' : i;
  const left = Math.max(0, (steps[i].at - s) * SCALE);
  $('#manDist').textContent = showStart ? cur.text : cur.kind === 'arrive' && left < 2 ? 'Arriving' : fmtDist(left);
  if (state.step !== key) {
    state.step = key;
    $('#manIcon').innerHTML = icon(cur.kind);
    $('#manText').textContent = showStart ? (cur.sub || `to ${placeName(state.to)}`) : `${cur.text}${cur.sub ? ` · ${cur.sub}` : ''}`;
    const next = showStart ? steps[1] : steps[i + 1];
    $('#then').innerHTML = next ? `<span>Then</span>${icon(next.kind)}` : `<span>${icon('arrive')}</span>`;
    $('#banner').classList.remove('pop');
    void $('#banner').offsetWidth;
    $('#banner').classList.add('pop');
  }
  const totalPlan = r.metres / SCALE;
  const remain = Math.max(0, (totalPlan - s) * SCALE);
  $('#navEta').innerHTML = `<b>${fmtTime(remain / 1.2)}</b><small>${fmtDist(remain)}</small>`;
  $('#prog').style.transform = `scaleX(${Math.min(1, s / totalPlan)})`;
}

function arrive() {
  if (state.view !== 'nav') return;
  const dest = state.to;
  const last = state.route.steps[state.route.steps.length - 1];
  show('arrived');
  $('#manIcon').innerHTML = icon('check');
  $('#manDist').textContent = placeName(dest);
  $('#manText').textContent = last.sub === 'Ahead' ? 'You have arrived' : `You have arrived · ${last.sub}`;
  $('#then').innerHTML = '';
  $('#navEta').innerHTML = `<button class="txt-btn" id="replay">Replay</button>`;
  $('#pauseBtn').innerHTML = icon('check');
  map.stopPreview();
  map.startOrbit(placePoint(dest));
}

function endNav() {
  map.stopPreview();
  map.stopOrbit();
  show('route');
  requestAnimationFrame(() => map.frameRoute());
}

// ------------------------------------------------------------ events
ui.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const id = b.id;
  if (b.dataset.type) {
    if (state.view === 'search') { state.filter = state.filter === b.dataset.type ? null : b.dataset.type; renderResults(); }
    else openSearch('to', b.dataset.type);
    return;
  }
  if (b.dataset.room) return choose({ room: b.dataset.room });
  if ('here' in b.dataset) return choose(HERE);
  switch (id) {
    case 'searchBtn': return openSearch('to');
    case 'cancel': return closeSearch();
    case 'fromBtn': return openSearch('from');
    case 'toBtn': return openSearch('to');
    case 'swap':
      if (state.from.kiosk && state.to.kiosk) return;
      [state.from, state.to] = [state.to, state.from];
      return planRoute();
    case 'closeRoute': return clearRoute();
    case 'startBtn': return startNav();
    case 'exitBtn': return state.view === 'arrived' ? clearRoute() : endNav();
    case 'pauseBtn':
      if (state.view === 'arrived') return clearRoute();
      map.pausePreview(map.previewPlaying);
      b.innerHTML = icon(map.previewPlaying ? 'pause' : 'play');
      return;
    case 'replay': return startNav();
    case 'btn3d':
      map.set3D(!map.is3D);
      b.innerHTML = `<b>${map.is3D ? '2D' : '3D'}</b>`;
      return;
    case 'btnCompass': return map.resetNorth();
    case 'btnLocate': return state.route ? map.frameRoute() : map.home();
    case 'zoomIn': return map.zoom(0.7);
    case 'zoomOut': return map.zoom(1.4);
  }
});
$('#q').addEventListener('input', renderResults);
$('#q').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('#results .row')?.click();
  if (e.key === 'Escape') closeSearch();
});

map.on('tap', (roomId) => {
  if (state.view === 'nav' || state.view === 'arrived') return;
  if (state.view === 'search') return closeSearch();
  if (!roomId || same(state.from, { room: roomId })) return;
  state.pick = 'to';
  choose({ room: roomId });
});
map.on('azimuth', (az) => { $('#btnCompass .compass').style.transform = `rotate(${az}rad)`; });

// ------------------------------------------------------------ idle reset (kiosk)
let idleTimer = 0;
function wake() {
  map.setAttract(false);
  clearTimeout(idleTimer);
  if (IDLE_MS > 0) idleTimer = setTimeout(sleep, IDLE_MS);
}
function sleep() {
  if (state.view === 'nav') { idleTimer = setTimeout(sleep, IDLE_MS); return; }
  $('#q').blur();
  clearRoute();
  map.setAttract(true);
}
map.on('interact', wake);
addEventListener('pointerdown', wake, true);
addEventListener('keydown', wake, true);
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ------------------------------------------------------------ go
show('home');
requestAnimationFrame(() => { updateInsets(); map.home(0); });
wake();
