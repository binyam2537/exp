// Builds the poster: inlines icons into src/poster.html -> index.html,
// then renders an A0 PDF and a PNG preview with Chromium (Playwright).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(fileURLToPath(import.meta.url));

// Optional fields. Leave empty to hide them on the poster.
const PAPER_ID = '';       // e.g. '1571234567'
const CONTACT_EMAIL = '';  // corresponding author's email

const lucide = name => {
  const f = join(root, 'node_modules/lucide-static/icons', `${name}.svg`);
  if (!existsSync(f)) throw new Error(`Unknown lucide icon: ${name}`);
  return readFileSync(f, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(width|height|class)="[^"]*"/g, '')
    .replace('<svg', '<svg class="i" aria-hidden="true"')
    .trim();
};
const simple = name => {
  const f = join(root, 'node_modules/simple-icons/icons', `${name}.svg`);
  if (!existsSync(f)) throw new Error(`Unknown simple-icon: ${name}`);
  return readFileSync(f, 'utf8').replace('<svg', '<svg aria-hidden="true"');
};

let html = readFileSync(join(root, 'src/poster.html'), 'utf8')
  .replace(/\{\{icon:([a-z0-9-]+)\}\}/g, (_, n) => lucide(n))
  .replace(/\{\{si:([a-z0-9-]+)\}\}/g, (_, n) => simple(n))
  .replace('{{PAPER_ID}}', PAPER_ID ? `Paper ID ${PAPER_ID} · ` : '')
  .replace('{{CONTACT}}', CONTACT_EMAIL ? `<p>Contact: <strong>${CONTACT_EMAIL}</strong></p>` : '');
writeFileSync(join(root, 'index.html'), html);

const MM = 96 / 25.4;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.round(841 * MM), height: Math.round(1189 * MM) } });
await page.goto('file://' + join(root, 'index.html'));
await page.evaluate(() => document.fonts.ready);

// Layout guard: nothing may spill past the page.
const overflow = await page.evaluate(() => {
  const c = document.querySelector('.content');
  return { scroll: c.scrollHeight, client: c.clientHeight };
});
if (overflow.scroll > overflow.client + 1) console.warn('WARNING: content overflows by', overflow.scroll - overflow.client, 'px');

await page.pdf({ path: join(root, 'SolarTwin-AI_NEECON2026_A0.pdf'), width: '841mm', height: '1189mm', printBackground: true, preferCSSPageSize: true });
await page.screenshot({ path: join(root, 'preview.png'), scale: 'css' });
await browser.close();
console.log('Built index.html, SolarTwin-AI_NEECON2026_A0.pdf, preview.png');
