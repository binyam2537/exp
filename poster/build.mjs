// Builds the poster: inlines icons and fonts into src/poster.html -> index.html,
// then renders an A0 PDF and a PNG preview with Chromium (Playwright).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(fileURLToPath(import.meta.url));

// Optional fields. Leave empty to hide them on the poster.
const PAPER_ID = '';       // e.g. '1571234567'
const CONTACT_EMAIL = '';  // corresponding author's email

// Fonts: copy the used weights next to the page so index.html works on its own.
const fonts = {
  'newsreader-500.woff2': '@fontsource/newsreader/files/newsreader-latin-500-normal.woff2',
  'newsreader-600.woff2': '@fontsource/newsreader/files/newsreader-latin-600-normal.woff2',
  'public-sans-400.woff2': '@fontsource/public-sans/files/public-sans-latin-400-normal.woff2',
  'public-sans-600.woff2': '@fontsource/public-sans/files/public-sans-latin-600-normal.woff2',
  'public-sans-700.woff2': '@fontsource/public-sans/files/public-sans-latin-700-normal.woff2',
};
mkdirSync(join(root, 'assets/fonts'), { recursive: true });
for (const [out, src] of Object.entries(fonts)) copyFileSync(join(root, 'node_modules', src), join(root, 'assets/fonts', out));

const phosphor = name => {
  const f = join(root, 'node_modules/@phosphor-icons/core/assets/regular', `${name}.svg`);
  if (!existsSync(f)) throw new Error(`Unknown Phosphor icon: ${name}`);
  return readFileSync(f, 'utf8').replace('<svg', '<svg class="i" aria-hidden="true"');
};
const arrow = '<svg viewBox="0 0 8 18" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 1V16M1.5 13.5L4 16L6.5 13.5"/></svg>';

const html = readFileSync(join(root, 'src/poster.html'), 'utf8')
  .replace(/\{\{ph:([a-z0-9-]+)\}\}/g, (_, n) => phosphor(n))
  .replaceAll('{{arrow}}', arrow)
  .replace('{{PAPER_ID}}', PAPER_ID ? ` · Paper ID ${PAPER_ID}` : '')
  .replace('{{CONTACT}}', CONTACT_EMAIL ? `<p>Contact: ${CONTACT_EMAIL}</p>` : '');
writeFileSync(join(root, 'index.html'), html);

const MM = 96 / 25.4;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.round(841 * MM), height: Math.round(1189 * MM) } });
await page.goto('file://' + join(root, 'index.html'));
await page.evaluate(() => document.fonts.ready);

// Layout guard: report anything that spills out of its column or the page.
const issues = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.col, .poster').forEach(e => {
    if (e.scrollHeight > e.clientHeight + 1) out.push(`${e.className} overflows by ${e.scrollHeight - e.clientHeight}px`);
  });
  const fontsOk = ['Newsreader', 'Public Sans'].every(f => document.fonts.check(`16px "${f}"`));
  if (!fontsOk) out.push('a web font did not load');
  return out;
});
issues.forEach(i => console.warn('WARNING:', i));

await page.pdf({ path: join(root, 'SolarTwin-AI_NEECON2026_A0.pdf'), width: '841mm', height: '1189mm', printBackground: true, preferCSSPageSize: true });
await page.screenshot({ path: join(root, 'preview.png'), scale: 'css' });
await browser.close();
console.log('Built index.html, SolarTwin-AI_NEECON2026_A0.pdf, preview.png');
