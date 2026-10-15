// Three.js indoor map: building model, labels, route, pins and camera moves.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SCALE, OUTLINE, VOIDS, CANOPY, ROOMS } from './data.js';
import { pointInPoly, distToPolyEdge, projectOnSegment, dist } from './geo.js';
import { icon } from './icons.js';

const WALL_H = 2.1;
const WALL_T = 0.16;
const DOOR_W = 1.4;
const BLUE = '#007AFF';
const RED = '#FF3B30';
const POLAR_3D = 0.92;
const POLAR_2D = 0.0001;
const MAX_POLAR = 1.25;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerpAngle = (a, b, t) => a + (Math.atan2(Math.sin(b - a), Math.cos(b - a))) * t;
const tint = (hex, k) => new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k);

export function createMap(container, { lite = false } = {}) {
  // ------------------------------------------------------------ coordinates
  const xs = OUTLINE.map((p) => p[0]), ys = OUTLINE.map((p) => p[1]);
  const CX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const CY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const W = (p, y = 0) => new THREE.Vector3((p[0] - CX) * SCALE, y, (p[1] - CY) * SCALE);
  const shape = (poly) => new THREE.Shape(poly.map((p) => new THREE.Vector2((p[0] - CX) * SCALE, -(p[1] - CY) * SCALE)));
  const flat = (geo) => geo.rotateX(-Math.PI / 2);
  const buildingPts = OUTLINE.map((p) => W(p));

  // ------------------------------------------------------------ renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !lite;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'labels';
  container.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#EEF0F4');
  scene.fog = new THREE.Fog('#EEF0F4', 140, 320);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 900);
  const controls = new MapControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 6;
  controls.maxDistance = 190;
  controls.maxPolarAngle = MAX_POLAR;
  controls.zoomToCursor = true;
  controls.rotateSpeed = 0.6;

  // ------------------------------------------------------------ lights
  scene.add(new THREE.HemisphereLight('#ffffff', '#d5d9e2', 2.1));
  const sun = new THREE.DirectionalLight('#ffffff', 1.5);
  sun.position.set(-28, 60, 34);
  sun.castShadow = !lite;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 40, bottom: -40, near: 10, far: 160 });
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // ------------------------------------------------------------ ground, slab, canopy
  const ground = new THREE.Mesh(flat(new THREE.CircleGeometry(320, 64)), new THREE.MeshStandardMaterial({ color: '#E4E7EC', roughness: 1 }));
  ground.position.y = -0.4;
  ground.receiveShadow = true;
  scene.add(ground);

  const slabShape = shape(OUTLINE);
  for (const v of VOIDS) slabShape.holes.push(new THREE.Path(shape(v).getPoints()));
  const slab = new THREE.Mesh(
    flat(new THREE.ExtrudeGeometry(slabShape, { depth: 0.36, bevelEnabled: false })).translate(0, -0.36, 0),
    new THREE.MeshStandardMaterial({ color: '#FBFBFD', roughness: 0.95 }),
  );
  slab.receiveShadow = true;
  scene.add(slab);

  for (const v of VOIDS) {
    const m = new THREE.Mesh(flat(new THREE.ShapeGeometry(shape(v))), new THREE.MeshStandardMaterial({ color: '#D3D8E1', roughness: 1 }));
    m.position.y = -0.38;
    m.receiveShadow = true;
    scene.add(m);
  }

  const glass = new THREE.MeshStandardMaterial({ color: '#B9D3EC', transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false });
  const wallBox = (a, b, h, t, mat, y0 = 0) => {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len + t, h, t), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.position.y = y0 + h / 2;
    m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    return m;
  };
  // Glass facade and atrium railing
  const facade = new THREE.Group();
  OUTLINE.forEach((p, i) => facade.add(wallBox(W(p), W(OUTLINE[(i + 1) % OUTLINE.length]), WALL_H + 0.5, 0.08, glass)));
  for (const v of VOIDS) v.forEach((p, i) => facade.add(wallBox(W(p), W(v[(i + 1) % v.length]), 1.05, 0.06, glass)));
  scene.add(facade);

  const canopy = new THREE.Mesh(flat(new THREE.ShapeGeometry(shape(CANOPY.poly))),
    new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
  canopy.position.y = 3.4;
  scene.add(canopy);
  const colGeo = new THREE.CylinderGeometry(0.28, 0.28, 3.8, 20);
  const colMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
  for (const c of CANOPY.columns) {
    const m = new THREE.Mesh(colGeo, colMat);
    m.position.copy(W(c, 1.5));
    m.castShadow = !lite;
    scene.add(m);
  }

  // ------------------------------------------------------------ rooms
  const stripes = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#e9e4da'; g.fillRect(0, 0, 64, 10); g.fillRect(0, 32, 64, 10);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  const pickables = [];
  const roomViews = new Map();
  const wallSide = new THREE.MeshStandardMaterial({ color: '#E9EBF0', roughness: 0.85 });
  const furnitureMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 });

  for (const r of ROOMS) {
    const group = new THREE.Group();
    const color = r.t.color;
    const floorMat = new THREE.MeshStandardMaterial({ color: tint(color, 0.9), roughness: 0.95 });
    if (r.type === 'stairs') { floorMat.map = stripes; floorMat.color = tint(color, 0.55); }
    const floor = new THREE.Mesh(flat(new THREE.ShapeGeometry(shape(r.poly))), floorMat);
    floor.position.y = 0.015;
    floor.receiveShadow = true;
    floor.userData.room = r.id;
    group.add(floor);
    pickables.push(floor);

    // Walls with gaps at doors
    const capMat = new THREE.MeshStandardMaterial({ color: '#C3C8D2', roughness: 0.8 });
    const mats = [wallSide, wallSide, capMat, wallSide, wallSide, wallSide];
    r.poly.forEach((a, i) => {
      const b = r.poly[(i + 1) % r.poly.length];
      const len = dist(a, b);
      const gap = (DOOR_W / SCALE) / len / 2;
      const cuts = r.doors
        .map((d) => projectOnSegment(d, a, b))
        .filter((p) => p.d < 4)
        .map((p) => [p.t - gap, p.t + gap])
        .sort((m, n) => m[0] - n[0]);
      let t0 = 0;
      for (const [c0, c1] of [...cuts, [1, 1]]) {
        if (c0 - t0 > 0.01) {
          const pa = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0];
          const pb = [a[0] + (b[0] - a[0]) * c0, a[1] + (b[1] - a[1]) * c0];
          const w = wallBox(W(pa), W(pb), WALL_H, WALL_T, mats);
          w.castShadow = !lite;
          w.userData.room = r.id;
          group.add(w);
          pickables.push(w);
        }
        t0 = c1;
      }
    });

    if (r.type === 'lift') {
      const shaft = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(shape(r.poly), { depth: WALL_H + 0.8, bevelEnabled: false })),
        new THREE.MeshStandardMaterial({ color: tint(color, 0.5), transparent: true, opacity: 0.55, roughness: 0.3 }));
      shaft.userData.room = r.id;
      group.add(shaft);
      pickables.push(shaft);
    }

    addFurniture(r, group);
    scene.add(group);

    // Label
    // CSS2DRenderer owns the wrapper's transform, so styling goes on the inner element.
    const el = document.createElement('div');
    el.className = 'lbl-wrap';
    el.style.setProperty('--c', color);
    el.innerHTML = `<div class="lbl${r.t.iconOnly ? ' icon-only' : ''}"><span class="lbl-dot">${icon(r.t.icon)}</span>${r.t.iconOnly ? '' : `<span class="lbl-txt">${r.name}</span>`}</div>`;
    const label = new CSS2DObject(el);
    label.position.copy(W(r.center, 1.2));
    label.center.set(0.5, 0.5);
    scene.add(label);

    roomViews.set(r.id, { floorMat, capMat, label, el, color, base: floorMat.color.clone() });
  }

  function addFurniture(r, group) {
    const spec = {
      classroom: { w: 1.3, d: 0.6, h: 0.74, su: 1.75, sv: 1.6, inset: 1.6 },
      lab: { w: 2.8, d: 0.75, h: 0.9, su: 3.4, sv: 2.2, inset: 1.6 },
      lecture: { w: 6.5, d: 0.5, h: 0.6, su: 7.2, sv: 1.15, inset: 1.2 },
      office: { w: 1.5, d: 0.75, h: 0.74, su: 2.6, sv: 2.4, inset: 1.4 },
    }[r.type];
    if (!spec) return;
    const [a, b] = r.poly;
    const ul = dist(a, b);
    let u = [(b[0] - a[0]) / ul, (b[1] - a[1]) / ul];
    let v = [-u[1], u[0]];
    const toC = [r.center[0] - a[0], r.center[1] - a[1]];
    if (toC[0] * v[0] + toC[1] * v[1] < 0) v = [-v[0], -v[1]];
    const pu = r.poly.map((p) => p[0] * u[0] + p[1] * u[1]);
    const pv = r.poly.map((p) => p[0] * v[0] + p[1] * v[1]);
    const S = 1 / SCALE;
    const spots = [];
    const u0 = Math.min(...pu), u1 = Math.max(...pu), v0 = Math.min(...pv), v1 = Math.max(...pv);
    const nu = Math.floor((u1 - u0 - 2 * spec.inset * S) / (spec.su * S)) + 1;
    const nv = Math.floor((v1 - v0 - 2 * spec.inset * S) / (spec.sv * S)) + 1;
    const startU = (u0 + u1) / 2 - ((nu - 1) * spec.su * S) / 2;
    const startV = (v0 + v1) / 2 - ((nv - 1) * spec.sv * S) / 2 + 0.4 * S;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const su = startU + i * spec.su * S, sv = startV + j * spec.sv * S;
      const p = [su * u[0] + sv * v[0], su * u[1] + sv * v[1]];
      if (pointInPoly(p, r.poly) && distToPolyEdge(p, r.poly) > (Math.max(spec.w, spec.d) / 2 + 0.5) * S) spots.push(p);
    }
    if (!spots.length) return;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(spec.w, spec.h, spec.d), furnitureMat, spots.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(u[1], u[0]));
    spots.forEach((p, i) => mesh.setMatrixAt(i, m.compose(W(p, spec.h / 2), q, new THREE.Vector3(1, 1, 1))));
    mesh.castShadow = !lite;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // ------------------------------------------------------------ markers
  const you = new THREE.Group();
  {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.14, 40), new THREE.MeshStandardMaterial({ color: '#ffffff' }));
    base.position.y = 0.1;
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 40), new THREE.MeshBasicMaterial({ color: BLUE }));
    dot.position.y = 0.12;
    base.castShadow = !lite;
    const pulse = new THREE.Mesh(flat(new THREE.CircleGeometry(1, 48)), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.25, depthWrite: false }));
    pulse.position.y = 0.06;
    const cone = new THREE.Mesh(flat(new THREE.CircleGeometry(3.2, 32, Math.PI / 2 - 0.5, 1)), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.16, depthWrite: false }));
    cone.position.y = 0.05;
    cone.visible = false;
    const tag = document.createElement('div');
    tag.className = 'you-tag';
    tag.textContent = 'You are here';
    const tagObj = new CSS2DObject(tag);
    tagObj.position.y = 0.2;
    tagObj.center.set(0.5, 1.9);
    you.add(base, dot, pulse, cone, tagObj);
    you.userData = { pulse, cone };
  }
  scene.add(you);

  const pin = new THREE.Group();
  {
    const pts = [new THREE.Vector2(0, 0)];
    for (let a = -55; a <= 90; a += 5) {
      const t = (a * Math.PI) / 180;
      pts.push(new THREE.Vector2(0.62 * Math.cos(t), 1.75 + 0.62 * Math.sin(t)));
    }
    const head = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshStandardMaterial({ color: RED, roughness: 0.35 }));
    head.castShadow = !lite;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    eye.position.y = 1.75;
    eye.scale.z = 0.2;
    const ring = new THREE.Mesh(flat(new THREE.RingGeometry(0.55, 0.85, 48)), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.35, depthWrite: false }));
    ring.position.y = 0.06;
    const body = new THREE.Group();
    body.add(head, eye);
    pin.add(body, ring);
    pin.userData = { body, ring, eye };
  }
  pin.visible = false;
  scene.add(pin);

  const puck = new THREE.Group();
  {
    const arrow = new THREE.Shape([new THREE.Vector2(0, 1), new THREE.Vector2(0.75, -0.7), new THREE.Vector2(0, -0.3), new THREE.Vector2(-0.75, -0.7)]);
    const outline = new THREE.Shape([new THREE.Vector2(0, 1.35), new THREE.Vector2(1.05, -0.95), new THREE.Vector2(0, -0.55), new THREE.Vector2(-1.05, -0.95)]);
    const top = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(arrow, { depth: 0.22, bevelEnabled: false })), new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.4 }));
    const under = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(outline, { depth: 0.16, bevelEnabled: false })), new THREE.MeshStandardMaterial({ color: '#ffffff' }));
    top.position.y = 0.1;
    under.position.y = 0.06;
    puck.scale.setScalar(0.8);
    under.castShadow = !lite;
    puck.add(under, top);
  }
  puck.visible = false;
  scene.add(puck);

  // ------------------------------------------------------------ route
  const routeGroup = new THREE.Group();
  scene.add(routeGroup);
  const routeMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 1 });
  const casingMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1 });
  const doneMat = new THREE.MeshBasicMaterial({ color: '#9AA3B2' });
  let flow = null;
  let routePts = null, routeCum = null, routeLen = 0;

  function ribbon(pts, width, mat, y) {
    const g = new THREE.Group();
    for (let i = 0; i < pts.length; i++) {
      const c = new THREE.Mesh(flat(new THREE.CircleGeometry(width / 2, 24)), mat);
      c.position.copy(pts[i]).setY(y);
      g.add(c);
      if (i === 0) continue;
      const a = pts[i - 1], b = pts[i];
      const s = new THREE.Mesh(flat(new THREE.PlaneGeometry(a.distanceTo(b), width)), mat);
      s.position.copy(a).add(b).multiplyScalar(0.5).setY(y);
      s.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      g.add(s);
    }
    return g;
  }

  function pointAt(s) {
    s = Math.max(0, Math.min(routeLen, s));
    let i = 1;
    while (i < routeCum.length - 1 && routeCum[i] < s) i++;
    const a = routePts[i - 1], b = routePts[i];
    const t = (s - routeCum[i - 1]) / (routeCum[i] - routeCum[i - 1] || 1);
    return { p: a.clone().lerp(b, t), dir: b.clone().sub(a).normalize(), i };
  }

  let doneRibbon = null;
  function setDone(s) {
    if (doneRibbon) { routeGroup.remove(doneRibbon); doneRibbon = null; }
    if (s <= 0.05) return;
    const { p, i } = pointAt(s);
    doneRibbon = ribbon([...routePts.slice(0, i), p], 0.86, doneMat, 0.075);
    routeGroup.add(doneRibbon);
  }

  function showRoute(r) {
    clearRoute();
    routePts = r.pts.map((p) => W(p));
    routeCum = [0];
    for (let i = 1; i < routePts.length; i++) routeCum.push(routeCum[i - 1] + routePts[i - 1].distanceTo(routePts[i]));
    routeLen = routeCum[routeCum.length - 1];
    routeGroup.add(ribbon(routePts, 1.25, casingMat, 0.05), ribbon(routePts, 0.85, routeMat, 0.07));
    // Turn markers
    for (const st of r.steps.slice(1, -1)) {
      const { p } = pointAt(st.at * SCALE);
      const m = new THREE.Mesh(flat(new THREE.CircleGeometry(0.2, 20)), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      m.position.copy(p).setY(0.09);
      routeGroup.add(m);
    }
    const n = Math.max(1, Math.floor(routeLen / 1.6));
    flow = new THREE.InstancedMesh(flat(new THREE.CircleGeometry(0.11, 12)), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }), n);
    flow.userData.n = n;
    routeGroup.add(flow);
    routeMat.opacity = 0;
    routeT0 = performance.now();
  }
  let routeT0 = 0;

  function clearRoute() {
    routeGroup.clear();
    flow = null;
    doneRibbon = null;
    routePts = null;
  }

  // ------------------------------------------------------------ selection
  let selected = null;
  function select(id) {
    if (selected) {
      const v = roomViews.get(selected);
      v.floorMat.color.copy(v.base);
      v.capMat.color.set('#C3C8D2');
      v.el.classList.remove('sel');
      v.label.position.y = 1.2;
    }
    selected = id;
    if (!id) { pin.visible = false; return; }
    const v = roomViews.get(id);
    v.floorMat.color.copy(tint(v.color, 0.62));
    v.capMat.color.set(v.color);
    v.el.classList.add('sel');
    v.label.position.y = 4.4; // float above the destination pin
  }
  function placePin(p) {
    pin.visible = !!p;
    if (p) { pin.position.copy(W(p)); pinT0 = performance.now(); }
  }
  let pinT0 = 0;

  function setYou(p, headingDeg) {
    you.position.copy(W(p));
    you.userData.cone.visible = headingDeg != null;
    if (headingDeg != null) you.rotation.y = (-headingDeg * Math.PI) / 180;
  }

  // ------------------------------------------------------------ camera
  const sph = new THREE.Spherical();
  const tmp = new THREE.Vector3();
  let insets = { top: 0, right: 0, bottom: 0, left: 0 };
  let size = { w: 1, h: 1 };
  let anim = null;
  let mode3D = true;
  let northAz = 0;
  let autoTurn = true;

  function getCam() {
    sph.setFromVector3(tmp.copy(camera.position).sub(controls.target));
    return { target: controls.target.clone(), dist: sph.radius, polar: sph.phi, az: sph.theta };
  }
  function setCam(c) {
    controls.target.copy(c.target);
    sph.set(c.dist, Math.max(POLAR_2D, c.polar), c.az);
    camera.position.setFromSpherical(sph).add(c.target);
    camera.lookAt(c.target);
  }
  function flyTo(to, ms = 1100, done) {
    const from = getCam();
    to = { ...from, ...to };
    anim = { from, to, t0: performance.now(), ms: Math.max(1, ms), done };
    controls.enabled = false;
  }
  function stepAnim(now) {
    const k = Math.min(1, (now - anim.t0) / anim.ms), e = ease(k);
    const { from: f, to: t } = anim;
    setCam({
      target: f.target.clone().lerp(t.target, e),
      dist: Math.exp(Math.log(f.dist) + (Math.log(t.dist) - Math.log(f.dist)) * e),
      polar: f.polar + (t.polar - f.polar) * e,
      az: lerpAngle(f.az, t.az, e),
    });
    if (k >= 1) {
      const done = anim.done;
      anim = null;
      if (mode !== 'preview' && mode !== 'orbit') controls.enabled = true;
      done?.();
    }
  }

  // Camera that frames a set of world points inside the free (non-UI) part of the screen.
  // Projects the points for real, so perspective and tilt are handled exactly.
  const probe = new THREE.PerspectiveCamera();
  const ndc = new THREE.Vector3();
  function frame(points, polar, az, pad = 1.08) {
    const pts = points.flatMap((p) => [p.clone().setY(0), p.clone().setY(WALL_H)]);
    const box = new THREE.Box3().setFromPoints(pts);
    const target = box.getCenter(new THREE.Vector3()).setY(0);
    const fx0 = -1 + (2 * insets.left) / size.w, fx1 = 1 - (2 * insets.right) / size.w;
    const fy0 = -1 + (2 * insets.bottom) / size.h, fy1 = 1 - (2 * insets.top) / size.h;
    const fcx = (fx0 + fx1) / 2, fcy = (fy0 + fy1) / 2;
    const hw = (fx1 - fx0) / 2 / pad, hh = (fy1 - fy0) / 2 / pad;
    const measure = (r) => {
      sph.set(r, Math.max(POLAR_2D, polar), az);
      probe.position.setFromSpherical(sph).add(target);
      probe.up.set(0, 1, 0);
      probe.lookAt(target);
      probe.updateMatrixWorld();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of pts) {
        ndc.copy(p).applyMatrix4(probe.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
        x0 = Math.min(x0, ndc.x); x1 = Math.max(x1, ndc.x); y0 = Math.min(y0, ndc.y); y1 = Math.max(y1, ndc.y);
      }
      return { x0, x1, y0, y1 };
    };
    const fits = (r) => {
      const m = measure(r);
      return (m.x1 - m.x0) / 2 <= hw && (m.y1 - m.y0) / 2 <= hh;
    };
    const search = () => {
      let lo = controls.minDistance, hi = controls.maxDistance;
      for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
      return hi;
    };
    const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    const fwd = new THREE.Vector3(-Math.sin(az), 0, -Math.cos(az));
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    let r = search();
    for (let it = 0; it < 3; it++) {
      const m = measure(r);
      const dx = (m.x0 + m.x1) / 2 - fcx, dy = (m.y0 + m.y1) / 2 - fcy;
      target.addScaledVector(right, dx * r * tan * camera.aspect).addScaledVector(fwd, (dy * r * tan) / Math.max(0.35, Math.cos(polar)));
      r = search();
    }
    return { target, dist: r, polar, az };
  }

  function applyInsets() {
    const { w, h } = size;
    const dx = (insets.left - insets.right) / 2, dy = (insets.top - insets.bottom) / 2;
    const fullW = w + 2 * Math.abs(dx), fullH = h + 2 * Math.abs(dy);
    camera.aspect = fullW / fullH;
    camera.setViewOffset(fullW, fullH, dx > 0 ? 0 : 2 * Math.abs(dx), dy > 0 ? 0 : 2 * Math.abs(dy), w, h);
    camera.updateProjectionMatrix();
  }

  function resize() {
    size = { w: container.clientWidth || 1, h: container.clientHeight || 1 };
    renderer.setSize(size.w, size.h);
    labels.setSize(size.w, size.h);
    applyInsets();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // On a tall screen the wide building is turned 90° so it fills the height.
  const portrait = () => size.h > size.w * 1.15;
  const baseAz = () => northAz + (portrait() && autoTurn ? -Math.PI / 2 : 0);
  const home = () => frame(buildingPts, mode3D ? (portrait() ? 0.4 : POLAR_3D) : POLAR_2D, baseAz(), 1.03);
  setCam(home());

  // ------------------------------------------------------------ modes
  let mode = 'map'; // map | preview | orbit
  let preview = null;
  let orbit = null;
  let attract = false;

  function startPreview(route, { onProgress, onArrive } = {}) {
    if (!routePts) showRoute(route);
    mode = 'preview';
    controls.enabled = false;
    const { p, dir } = pointAt(0);
    preview = { s: 0, playing: false, fwd: dir.clone(), onProgress, onArrive, speed: 3 };
    puck.visible = true;
    puck.position.copy(p);
    const pose = immersivePose(p, dir);
    flyTo(pose, 1500, () => { if (preview) preview.playing = true; });
  }

  // Follow camera behind the puck. Distance adapts to the screen shape so that
  // about 20 m of corridor is visible across, also on a narrow portrait screen.
  function immersivePose(p, fwd) {
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const dist = Math.min(70, Math.max(24, 10 / (tan * Math.min(1, camera.aspect))));
    const polar = 0.86;
    const target = p.clone().addScaledVector(fwd, dist * 0.12);
    return { target, dist, polar, az: Math.atan2(-fwd.x, -fwd.z) };
  }

  function stepPreview(dt) {
    const pv = preview;
    if (pv.playing) {
      // Slow down close to turns.
      let near = Infinity;
      for (let i = 1; i < routeCum.length - 1; i++) near = Math.min(near, Math.abs(routeCum[i] - pv.s));
      const k = near < 2.5 ? 0.55 + 0.45 * (near / 2.5) : 1;
      pv.s = Math.min(routeLen, pv.s + pv.speed * k * dt);
    }
    const { p, dir } = pointAt(pv.s);
    const ahead = pointAt(pv.s + 2.5).p.sub(p);
    const want = ahead.lengthSq() > 0.01 ? ahead.normalize() : dir;
    pv.fwd.lerp(want, 1 - Math.exp(-dt * 2.6)).normalize();
    puck.position.copy(p);
    puck.rotation.y = Math.atan2(-dir.x, -dir.z);
    if (!anim) setCam(immersivePose(p, pv.fwd));
    setDone(pv.s);
    pv.onProgress?.(pv.s / SCALE);
    if (pv.s >= routeLen && pv.playing) {
      pv.playing = false;
      const cb = pv.onArrive;
      setTimeout(() => cb?.(), 350);
    }
  }

  function stopPreview() {
    preview = null;
    puck.visible = false;
    if (doneRibbon) { routeGroup.remove(doneRibbon); doneRibbon = null; }
    mode = 'map';
    controls.enabled = true;
  }

  // Slow orbit around a point (arrival view / idle attract mode).
  function startOrbit(p, { polar = 0.9 } = {}) {
    mode = 'orbit';
    controls.enabled = false;
    const az = getCam().az;
    orbit = { az };
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const dist = Math.min(80, Math.max(26, 13 / (tan * Math.min(1, camera.aspect))));
    flyTo({ target: W(p), dist, polar, az }, 1400);
  }
  function stopOrbit() { orbit = null; mode = 'map'; controls.enabled = true; }

  // ------------------------------------------------------------ input
  let down = null;
  const listeners = { tap: () => {}, interact: () => {}, azimuth: () => {} };
  renderer.domElement.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    listeners.interact();
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 450;
    down = null;
    if (moved > 10 || !quick || mode === 'preview') return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    listeners.tap(hit?.object.userData.room ?? null);
  });
  controls.addEventListener('start', () => listeners.interact());
  renderer.domElement.addEventListener('wheel', () => listeners.interact(), { passive: true });

  // Keep the target over the building.
  const bounds = new THREE.Box3().setFromPoints(buildingPts).expandByScalar(8);
  controls.addEventListener('change', () => controls.target.clamp(bounds.min.setY(0), bounds.max.setY(0)));

  // ------------------------------------------------------------ loop
  const clock = new THREE.Clock();
  let lastAz = null;
  const m4 = new THREE.Matrix4();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    const now = performance.now();

    if (anim) stepAnim(now);
    if (mode === 'preview' && preview) stepPreview(dt);
    if (mode === 'orbit' && orbit && !anim) {
      orbit.az += dt * 0.12;
      const c = getCam();
      setCam({ ...c, az: orbit.az });
    }
    if (attract && mode === 'map' && !anim) {
      const c = getCam();
      setCam({ ...c, az: c.az + dt * 0.04 });
    }
    if (controls.enabled) controls.update();

    // You-are-here pulse
    const k = (t * 0.6) % 1;
    you.userData.pulse.scale.setScalar(1 + k * 2.4);
    you.userData.pulse.material.opacity = 0.32 * (1 - k);

    // Pin drop + bob
    if (pin.visible) {
      const pinDrop = Math.min(1, (now - pinT0) / 550);
      const drop = 1 - Math.pow(1 - pinDrop, 3);
      pin.userData.body.position.y = (1 - drop) * 6 + Math.sin(t * 2.4) * 0.12 + 0.12;
      const rk = (t * 0.8) % 1;
      pin.userData.ring.scale.setScalar(1 + rk * 1.6);
      pin.userData.ring.material.opacity = 0.4 * (1 - rk);
      const eye = pin.userData.eye;
      tmp.copy(camera.position).sub(pin.position);
      tmp.y -= pin.userData.body.position.y + 1.75;
      tmp.normalize();
      eye.position.set(0, 1.75, 0).addScaledVector(tmp, 0.55);
      eye.lookAt(camera.position);
    }

    // Route fade-in and moving dots
    if (routePts) {
      routeMat.opacity = Math.min(1, (now - routeT0) / 450);
      if (flow) {
        const n = flow.userData.n, step = routeLen / n;
        for (let i = 0; i < n; i++) {
          const s = (i * step + t * 2.2) % routeLen;
          m4.makeTranslation(pointAt(s).p.setY(0.085));
          flow.setMatrixAt(i, m4);
        }
        flow.instanceMatrix.needsUpdate = true;
      }
    }

    // Labels: in preview only show those near the puck
    for (const [id, v] of roomViews) {
      let show = true;
      if (mode === 'preview') show = id === selected || v.label.position.distanceTo(puck.position) < 22;
      v.el.classList.toggle('far', !show);
    }

    renderer.render(scene, camera);
    labels.render(scene, camera);

    const az = getCam().az;
    if (lastAz === null || Math.abs(az - lastAz) > 0.002) { lastAz = az; listeners.azimuth(az); }
  });

  // ------------------------------------------------------------ API
  return {
    on(name, fn) { listeners[name] = fn; },
    setInsets(i) { insets = { ...insets, ...i }; applyInsets(); },
    setNorth(deg) { autoTurn = deg == null; northAz = (-(deg || 0) * Math.PI) / 180; },
    get is3D() { return mode3D; },
    set3D(on, ms = 900) {
      mode3D = on;
      if (on) controls.maxPolarAngle = MAX_POLAR;
      const c = getCam();
      flyTo({ polar: on ? POLAR_3D : POLAR_2D, dist: on ? c.dist : c.dist * 1.08 }, ms, () => {
        controls.maxPolarAngle = on ? MAX_POLAR : POLAR_2D;
      });
    },
    home(ms = 1100) { flyTo(home(), ms); },
    resetNorth() { flyTo({ az: baseAz() }, 700); },
    zoom(f) { const c = getCam(); flyTo({ dist: Math.min(controls.maxDistance, Math.max(controls.minDistance, c.dist * f)) }, 350); },
    focusRoom(id, ms = 1100) {
      const r = ROOMS.find((x) => x.id === id);
      const pts = [...r.poly.map((p) => W(p)), you.position.clone()];
      flyTo(frame(pts, mode3D ? POLAR_3D : POLAR_2D, getCam().az, 1.25), ms);
    },
    frameRoute(ms = 1200) {
      if (!routePts) return;
      flyTo(frame(routePts, mode3D ? 0.82 : POLAR_2D, getCam().az, 1.3), ms);
    },
    select,
    placePin,
    setYou,
    showRoute,
    clearRoute,
    startPreview,
    stopPreview,
    pausePreview(p) { if (preview) preview.playing = !p; },
    restartPreview() { if (preview) { preview.s = 0; preview.playing = true; } },
    get previewPlaying() { return !!preview?.playing; },
    startOrbit,
    stopOrbit,
    setAttract(on) { attract = on; },
    get busy() { return !!anim; },
  };
}
