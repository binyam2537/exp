// Exports a built poster page as a layout description (text boxes, shapes, images) for rebuilding
// it as an editable design in another tool (Canva, PowerPoint).
// Usage: node export-layout.mjs <out-dir> [page.html]   (default page: option-b.html)
// Elements marked data-img="name" are exported as images; otherwise the option B list is used.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(root, 'layout');
const pageFile = process.argv[3] || 'option-b.html';
mkdirSync(join(out, 'img'), { recursive: true });
const MM = 96 / 25.4, W = Math.round(841 * MM), H = Math.round(1189 * MM);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.goto('file://' + join(root, pageFile));
await page.evaluate(() => document.fonts.ready);

const layout = await page.evaluate(() => {
  const r = e => { const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, width: b.width, height: b.height }; };
  const hex = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); return '#' + m.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(); };
  const shapes = [];
  const add = (sel, kind) => document.querySelectorAll(sel).forEach(e => {
    const cs = getComputedStyle(e);
    shapes.push({ kind, ...r(e), color: hex(cs.backgroundColor), radius: parseFloat(cs.borderTopLeftRadius) || 0 });
  });
  add('.band', 'band'); add('section', 'box'); add('.bottom', 'band');
  document.querySelectorAll('.ph').forEach(e => {
    const cs = getComputedStyle(e);
    shapes.push({ kind: 'placeholder', ...r(e), color: hex(cs.backgroundColor), radius: parseFloat(cs.borderTopLeftRadius) || 0,
      stroke: hex(cs.borderTopColor), strokeWidth: parseFloat(cs.borderTopWidth) || 1 });
  });
  const texts = [];
  const sel = ['.top .conf', '.band h1', '.band .authors', 'section h2', '.sub-h', 'section > p:not(.note)', 'section .note',
    'ol.goals li', 'figcaption', 'th', 'td', '.metrics > div', '.concl h3', '.concl p', '.refs h2', '.refs p', '.bottom p',
    '.contrib .k', '.contrib h3', '.contrib p', 'section > h3', '.bul li', '.ph p'];
  document.querySelectorAll(sel.join(',')).forEach(e => {
    if (!e.innerText || !e.innerText.trim()) return;
    const cs = getComputedStyle(e);
    let text = e.innerText.replace(/ /g, ' ').trim();
    if (e.closest('[data-img]')) return;
    if (e.matches('ol.goals li')) text = (Array.from(e.parentNode.children).indexOf(e) + 1) + '. ' + text;
    if (e.matches('.bul li')) text = '• ' + text;
    if (cs.textTransform === 'uppercase') text = text.toUpperCase();
    texts.push({ ...r(e), text, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight) >= 600 ? 'bold' : 'normal',
      color: hex(cs.color), align: cs.textAlign === 'right' ? 'end' : cs.textAlign === 'center' ? 'center' : 'start',
      lineHeight: cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
      font: cs.fontFamily.split(',')[0].replace(/"/g, '') });
  });
  // dedupe: drop texts fully inside another text (e.g. small inside td)
  const bg = getComputedStyle(document.body).backgroundColor;
  return { width: innerWidth, height: innerHeight, background: hex(bg), shapes, texts };
});

// Images: hide text that is rebuilt as text boxes, then screenshot the graphic parts.
await page.addStyleTag({ content: '.scenarios figcaption { visibility: hidden !important; }' });
const marked = await page.evaluate(() => Array.from(document.querySelectorAll('[data-img]')).map(e => e.dataset.img));
const shots = marked.length ? marked.map(n => [n, `[data-img="${n}"]`]) : [
  ['logos-top', '.top > img'], ['logos-right', '.top .logos'], ['art', '.band .art'], ['console', 'figure .ui'],
  ['fig1', 'figure.method svg'], ['fig3', '#fc'], ['scenarios', '.scenarios'],
  ['icon-1', '.concl > div:nth-child(1) .ico'], ['icon-2', '.concl > div:nth-child(2) .ico'],
  ['icon-3', '.concl > div:nth-child(3) .ico'], ['icon-4', '.concl > div:nth-child(4) .ico'], ['logo-footer', '.bottom img'],
];
layout.images = [];
for (const [name, s] of shots) {
  const el = page.locator(s).first();
  const box = await el.boundingBox();
  await el.screenshot({ path: join(out, 'img', name + '.png') });
  layout.images.push({ name, file: `img/${name}.png`, ...box });
}
writeFileSync(join(out, 'layout.json'), JSON.stringify(layout, null, 1));
await browser.close();
console.log(`texts ${layout.texts.length}, shapes ${layout.shapes.length}, images ${layout.images.length}`);
