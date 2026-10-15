// Plan geometry, walking graph, shortest path and turn-by-turn steps.
import { SCALE, NODES, PATHS, ROOMS, KIOSKS, TYPES } from './data.js';

export const WALK_SPEED = 1.2; // m/s

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}

export function pointInPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function projectOnSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  const q = [a[0] + t * dx, a[1] + t * dy];
  return { t, q, d: dist(p, q) };
}

export function distToPolyEdge(p, poly) {
  let m = Infinity;
  for (let i = 0; i < poly.length; i++) m = Math.min(m, projectOnSegment(p, poly[i], poly[(i + 1) % poly.length]).d);
  return m;
}

// ---------------------------------------------------------------- graph

const nodes = new Map(); // id -> [x, y]
const adj = new Map();   // id -> Set(id)
let edges = [];          // [a, b]

function addNode(id, p) { nodes.set(id, p); if (!adj.has(id)) adj.set(id, new Set()); }
function addEdge(a, b) { edges.push([a, b]); adj.get(a).add(b); adj.get(b).add(a); }
function removeEdge(a, b) {
  edges = edges.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)));
  adj.get(a).delete(b); adj.get(b).delete(a);
}

// Attach a point (door or kiosk) to the nearest corridor segment.
function attach(id, p, linkId) {
  addNode(id, p);
  if (linkId) { addEdge(id, linkId); return; }
  let best = null;
  for (const [a, b] of edges) {
    if (a.startsWith('door:') || b.startsWith('door:')) continue;
    const r = projectOnSegment(p, nodes.get(a), nodes.get(b));
    if (!best || r.d < best.d) best = { ...r, a, b };
  }
  const segLen = dist(nodes.get(best.a), nodes.get(best.b));
  let hub;
  if (best.t * segLen < 1) hub = best.a;
  else if ((1 - best.t) * segLen < 1) hub = best.b;
  else {
    hub = `j:${id}`;
    addNode(hub, best.q);
    removeEdge(best.a, best.b);
    addEdge(best.a, hub);
    addEdge(hub, best.b);
  }
  if (hub !== id) addEdge(id, hub);
}

for (const [id, p] of Object.entries(NODES)) addNode(id, p);
for (const chain of PATHS) for (let i = 1; i < chain.length; i++) addEdge(chain[i - 1], chain[i]);

export const ROOM_BY_ID = new Map();
for (const r of ROOMS) {
  r.center = centroid(r.poly);
  r.t = TYPES[r.type];
  ROOM_BY_ID.set(r.id, r);
  r.doors.forEach((d, i) => attach(`door:${r.id}:${i}`, d, r.link));
}
for (const [id, k] of Object.entries(KIOSKS)) attach(`kiosk:${id}`, k.at);

export const graph = { nodes, edges: () => edges };

// Dijkstra; the graph is tiny so a linear scan for the minimum is fine.
function shortest(from, targets) {
  const d = new Map([[from, 0]]), prev = new Map(), done = new Set();
  while (true) {
    let u = null, best = Infinity;
    for (const [k, v] of d) if (!done.has(k) && v < best) { best = v; u = k; }
    if (u === null) return null;
    if (targets.has(u)) {
      const ids = [u];
      while (prev.has(ids[0])) ids.unshift(prev.get(ids[0]));
      return ids;
    }
    done.add(u);
    for (const v of adj.get(u)) {
      const nd = best + dist(nodes.get(u), nodes.get(v));
      if (nd < (d.get(v) ?? Infinity)) { d.set(v, nd); prev.set(v, u); }
    }
  }
}

// A place is either { kiosk: id } or { room: id }.
const nodesOf = (place) => place.kiosk
  ? [`kiosk:${place.kiosk}`]
  : ROOM_BY_ID.get(place.room).doors.map((_, i) => `door:${place.room}:${i}`);

export function placePoint(place) {
  return place.kiosk ? KIOSKS[place.kiosk].at : ROOM_BY_ID.get(place.room).center;
}

export function route(from, to) {
  let best = null;
  for (const start of nodesOf(from)) {
    const ids = shortest(start, new Set(nodesOf(to)));
    if (!ids) continue;
    const pts = ids.map((id) => nodes.get(id));
    const len = pathLength(pts);
    if (!best || len < best.len) best = { ids, pts, len };
  }
  if (!best) return null;
  let pts = best.pts.slice();
  // Step through the door into the room, and out of the start room.
  if (to.room) pts.push(stepInside(pts[pts.length - 1], ROOM_BY_ID.get(to.room)));
  if (from.room) pts.unshift(stepInside(pts[0], ROOM_BY_ID.get(from.room)));
  const hub = to.room && best.ids.length > 1 ? nodes.get(best.ids[best.ids.length - 2]) : null;
  pts = simplify(pts);
  const metres = pathLength(pts) * SCALE;
  return { from, to, pts, metres, seconds: metres / WALK_SPEED, steps: steps(pts, from, to, hub) };
}

function stepInside(door, room) {
  const v = [room.center[0] - door[0], room.center[1] - door[1]];
  const l = Math.hypot(...v) || 1;
  const k = Math.min(14, l * 0.5);
  return [door[0] + (v[0] / l) * k, door[1] + (v[1] / l) * k];
}

export function pathLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

function simplify(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    if (dist(a, b) < 0.5) continue;
    if (Math.abs(turnAngle(a, b, c)) > 4) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// Signed turn in degrees. Positive = right turn (y grows downward on the plan).
export function turnAngle(a, b, c) {
  const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
  let d = ((h2 - h1) * 180) / Math.PI;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function turnKind(a) {
  const m = Math.abs(a), side = a > 0 ? 'right' : 'left';
  if (m < 25) return null;
  if (m < 60) return `slight-${side}`;
  if (m < 140) return side;
  return 'uturn';
}

const TURN_TEXT = {
  left: 'Turn left', right: 'Turn right', 'slight-left': 'Keep left', 'slight-right': 'Keep right', uturn: 'Turn around',
};

function landmarkNear(p, exclude) {
  let best = null;
  for (const r of ROOMS) {
    if (exclude.includes(r.id)) continue;
    const d = Math.min(...r.doors.map((q) => dist(p, q)));
    if (d < 45 && (!best || d < best.d)) best = { d, r };
  }
  return best?.r ?? null;
}

const wrap = (d) => ((d % 360) + 540) % 360 - 180;
const heading = (a, b) => (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI; // 0 = north

// Build the list of manoeuvres. Each step has: kind, text, sub, at (plan units along path).
function steps(pts, from, to, hub) {
  const dest = to.room ? ROOM_BY_ID.get(to.room) : null;
  const out = [];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1];

  // Start
  let startText = 'Follow the blue line';
  const h0 = from.kiosk ? KIOSKS[from.kiosk].heading : undefined;
  if (h0 != null && pts.length > 1) {
    const rel = turnKind(wrap(heading(pts[0], pts[1]) - h0));
    startText = { null: 'Walk straight ahead', left: 'Head to your left', right: 'Head to your right',
      'slight-left': 'Walk ahead, keep left', 'slight-right': 'Walk ahead, keep right', uturn: 'Turn around and walk' }[rel];
  } else if (from.room) {
    startText = `Leave ${ROOM_BY_ID.get(from.room).name}`;
  }
  out.push({ kind: 'straight', text: startText, at: 0 });

  // The turn off the corridor toward the door becomes part of the arrival message.
  let arriveSide = '';
  let last = pts.length - 1;
  const h = hub ? pts.indexOf(hub) : -1;
  if (h > 0 && h < pts.length - 1) {
    const a = turnAngle(pts[h - 1], pts[h], pts[h + 1]);
    if (turnKind(a)) {
      arriveSide = a > 0 ? 'On your right' : 'On your left';
      last = h;
    }
  }

  for (let i = 1; i < last; i++) {
    const kind = turnKind(turnAngle(pts[i - 1], pts[i], pts[i + 1]));
    if (!kind) continue;
    const lm = landmarkNear(pts[i], [dest?.id, from.room]);
    out.push({ kind, text: TURN_TEXT[kind], sub: lm ? `at ${lm.name}` : '', at: cum[i] });
  }

  const name = dest ? dest.name : KIOSKS[to.kiosk].name;
  out.push({ kind: 'arrive', text: name, sub: arriveSide || 'Ahead', at: arriveSide ? cum[last] : total });

  if (out.length === 2) out[0].sub = `to ${name}`;
  return out;
}

export function fmtDist(m) {
  if (m < 20) return `${Math.max(1, Math.round(m))} m`;
  return `${Math.round(m / 5) * 5} m`;
}

export function fmtTime(s) {
  return `${Math.max(1, Math.ceil(s / 60))} min`;
}
