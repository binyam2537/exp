/* Static charts, drawn once before the PDF is printed. Both show a simulated scenario. */
(function () {
  // Series colors come from CSS custom properties so each poster option can restyle the charts.
  const D = { ink: '#18212D', ink2: '#3A4350', muted: '#59626E', ochre: '#B07A1A', teal: '#00806A', brick: '#A23B2A', grid: '#E1E4E0', rule: '#CDD2CD', font: 'Public Sans' };
  const colors = node => { const cs = getComputedStyle(node), o = {}; for (const k in D) o[k] = cs.getPropertyValue('--c-' + k).trim().replace(/^"|"$/g, '') || D[k]; return o; };
  let C = D;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const txt = (p, x, y, s, a) => { const t = el('text', Object.assign({ x, y, 'font-family': C.font, fill: C.muted }, a || {}), p); t.textContent = s; return t; };
  const path = pts => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join(' ');
  const range = (a, b, s) => { const r = []; for (let t = a; t <= b + 1e-9; t += s) r.push(t); return r; };

  // Fig. 2: forecast vs observed
  (function () {
    const W = 640, H = 330, m = { l: 40, r: 10, t: 16, b: 34 };
    const host = document.getElementById('fc'); if (!host) return; C = colors(host);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }, host);
    const x0 = 6, x1 = 18, X = t => m.l + (t - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => H - m.b - v * (H - m.t - m.b);
    const bell = t => Math.max(0, Math.sin(Math.PI * (t - 6) / 12)) ** 1.25;
    const sig = z => 1 / (1 + Math.exp(-z));
    const obs = t => 0.74 * bell(t) * (1 - 0.05 * Math.sin(t * 3.1) * Math.sin(t * 1.7));
    const trn = t => 0.74 * bell(t) * (1 + 0.36 * sig((t - 10.3) * 2.4));
    const fb = t => 0.74 * bell(t) * (1 + 0.035 * Math.sin(t * 0.9 + 1));
    const ts = range(x0, x1, 0.05), ra = 10.67;
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: v ? C.grid : C.rule, 'stroke-width': 1 }, svg);
      txt(svg, m.l - 8, Y(v) + 4, v === 0 ? '0' : v.toFixed(2).replace(/0$/, ''), { 'font-size': 12, 'text-anchor': 'end' });
    });
    [6, 9, 12, 15, 18].forEach(t => txt(svg, X(t), H - m.b + 20, String(t).padStart(2, '0') + ':00', { 'font-size': 12, 'text-anchor': 'middle' }));
    txt(svg, m.l, m.t - 4, 'Output (p.u.)', { 'font-size': 12 });
    const line = (f, c, w, dash) => el('path', Object.assign({ d: path(ts.map(t => [X(t), Y(f(t))])), stroke: c, 'stroke-width': w, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, dash ? { 'stroke-dasharray': dash } : {}), svg);
    line(trn, C.ochre, 2.4, '7 5'); line(fb, C.teal, 2.4); line(obs, C.ink, 2);
    el('line', { x1: X(ra), x2: X(ra), y1: m.t + 6, y2: H - m.b, stroke: C.brick, 'stroke-width': 1.3 }, svg);
    txt(svg, X(ra) - 6, m.t + 14, 'Risk flag 10:40', { 'font-size': 12.5, 'font-weight': 700, fill: C.brick, 'text-anchor': 'end' });
    txt(svg, X(14.2) + 8, Y(trn(14.2)) - 6, 'Transferred (CDAN + LSTM)', { 'font-size': 13, 'font-weight': 700, fill: C.ink2 });
    txt(svg, X(15.0) - 10, Y(obs(15.0)) + 30, 'Observed', { 'font-size': 13, 'font-weight': 700, fill: C.ink2, 'text-anchor': 'end' });
    txt(svg, X(15.0) - 10, Y(obs(15.0)) + 47, 'Fallback (Transformer)', { 'font-size': 13, 'font-weight': 700, fill: C.teal, 'text-anchor': 'end' });
  })();

  // Fig. 1 inset: battery state of charge
  (function () {
    const W = 420, H = 175, m = { l: 46, r: 4, t: 12, b: 26 };
    const host = document.getElementById('soc'); if (!host) return; C = colors(host);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }, host);
    const x0 = 6, x1 = 24, X = t => m.l + (t - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => H - m.b - v / 100 * (H - m.t - m.b);
    const sm = (a, b, t) => { const z = Math.min(1, Math.max(0, (t - a) / (b - a))); return z * z * (3 - 2 * z); };
    const naive = t => 45 + 30 * sm(8, 14, t) - 66 * sm(16.5, 22.5, t);
    const smart = t => 45 + 26 * sm(8, 14.5, t) - 38 * sm(16.5, 23, t);
    const ts = range(x0, x1, 0.05);
    [0, 50, 100].forEach(v => { el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: v ? C.grid : C.rule }, svg); txt(svg, m.l - 6, Y(v) + 4, v + '%', { 'font-size': 12, 'text-anchor': 'end' }); });
    [6, 12, 18, 24].forEach(t => txt(svg, X(t), H - m.b + 16, String(t % 24).padStart(2, '0') + ':00', { 'font-size': 12, 'text-anchor': t === 24 ? 'end' : t === 6 ? 'start' : 'middle' }));
    el('line', { x1: m.l, x2: W - m.r, y1: Y(20), y2: Y(20), stroke: C.brick, 'stroke-width': 1, 'stroke-dasharray': '4 3' }, svg);
    txt(svg, m.l + 4, Y(20) - 6, 'Minimum 20%', { 'font-size': 12, 'font-weight': 700, fill: C.brick });
    el('path', { d: path(ts.map(t => [X(t), Y(naive(t))])), stroke: C.muted, 'stroke-width': 1.8, 'stroke-dasharray': '5 4', fill: 'none' }, svg);
    el('path', { d: path(ts.map(t => [X(t), Y(smart(t))])), stroke: C.teal, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }, svg);
    txt(svg, X(24), Y(47), 'With monitor', { 'font-size': 12.5, 'font-weight': 700, fill: C.teal, 'text-anchor': 'end' });
    txt(svg, X(15.6), Y(naive(15.6)) - 10, 'Without monitor', { 'font-size': 12.5, 'font-weight': 700, fill: C.muted, 'text-anchor': 'middle' });
  })();
})();

// Evaluation protocol: one small diagram per demo scenario.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const D = { ink: '#18212D', muted: '#59626E', ochre: '#B07A1A', teal: '#00806A', brick: '#A23B2A', rule: '#CDD2CD', fill: 'rgba(162,59,42,0.14)' };
  const W = 200, H = 120, m = { l: 6, r: 6, t: 8, b: 10 };
  const X = t => m.l + (t - 5) / 16 * (W - m.l - m.r), Y = v => H - m.b - v * (H - m.t - m.b);
  const ts = []; for (let t = 5; t <= 21 + 1e-9; t += 0.05) ts.push(t);
  const bell = t => Math.max(0, Math.sin(Math.PI * (t - 6) / 12)) ** 1.25;
  const d = f => ts.map((t, i) => (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(f(t)).toFixed(1)).join(' ');
  document.querySelectorAll('.mini[data-scenario]').forEach(host => {
    const cs = getComputedStyle(host), C = {};
    for (const k in D) C[k] = cs.getPropertyValue('--c-' + k).trim() || D[k];
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }, host);
    el('line', { x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0), stroke: C.rule, 'stroke-width': 1.2 }, svg);
    const line = (f, c, w, dash) => el('path', Object.assign({ d: d(f), stroke: c, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, dash ? { 'stroke-dasharray': dash } : {}), svg);
    const kind = host.dataset.scenario;
    if (kind === 'normal') {
      line(t => 0.8 * bell(t), C.ochre, 2.4, '6 4');
      line(t => 0.8 * bell(t) * (1 - 0.04 * Math.sin(t * 2.3)), C.ink, 2.4);
    } else if (kind === 'cloud') {
      const dip = t => 1 - 0.55 * Math.exp(-((t - 12.6) ** 2) / 0.45);
      line(t => 0.8 * bell(t), C.ochre, 2.4, '6 4');
      line(t => 0.8 * bell(t) * dip(t), C.ink, 2.4);
    } else if (kind === 'shift') {
      const sig = z => 1 / (1 + Math.exp(-z));
      line(t => 0.62 * bell(t) * (1 + 0.5 * sig((t - 10.3) * 2.4)), C.ochre, 2.4, '6 4');
      line(t => 0.62 * bell(t), C.ink, 2.4);
      el('line', { x1: X(10.7), x2: X(10.7), y1: m.t, y2: Y(0), stroke: C.brick, 'stroke-width': 1.6 }, svg);
    } else if (kind === 'demand') {
      const solar = t => 0.8 * bell(t);
      const load = t => 0.35 + 0.5 * Math.exp(-((t - 18.6) ** 2) / 0.9);
      const gap = ts.filter(t => load(t) > solar(t) + 0.12 && t > 16);
      if (gap.length) el('path', { d: 'M' + gap.map(t => X(t).toFixed(1) + ' ' + Y(load(t)).toFixed(1)).join(' L') + ' L' + gap.slice().reverse().map(t => X(t).toFixed(1) + ' ' + Y(solar(t)).toFixed(1)).join(' L') + ' Z', fill: C.fill }, svg);
      line(solar, C.ink, 2.4);
      line(load, C.brick, 2.4);
    }
  });
})();
