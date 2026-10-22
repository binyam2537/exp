// Builds every poster option: src/option-<x>.html -> option-<x>.html (icons and charts inlined),
// then renders an A0 PDF and a PNG preview of each with Chromium (Playwright).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
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
  'barlow-condensed-600.woff2': '@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2',
  'barlow-condensed-700.woff2': '@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2',
  'schibsted-grotesk-700.woff2': '@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-700-normal.woff2',
  'stix-text-latin-400i.woff2': '@fontsource/stix-two-text/files/stix-two-text-latin-400-italic.woff2',
  'stix-text-latinext-400i.woff2': '@fontsource/stix-two-text/files/stix-two-text-latin-ext-400-italic.woff2',
  'stix-text-greek-400i.woff2': '@fontsource/stix-two-text/files/stix-two-text-greek-400-italic.woff2',
  'stix-math-400.woff2': '@fontsource/stix-two-math/files/stix-two-math-latin-400-normal.woff2',
  'schibsted-grotesk-800.woff2': '@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-800-normal.woff2',
};
mkdirSync(join(root, 'assets/fonts'), { recursive: true });
for (const [out, src] of Object.entries(fonts)) copyFileSync(join(root, 'node_modules', src), join(root, 'assets/fonts', out));

const phosphor = name => {
  const f = join(root, 'node_modules/@phosphor-icons/core/assets/regular', `${name}.svg`);
  if (!existsSync(f)) throw new Error(`Unknown Phosphor icon: ${name}`);
  return readFileSync(f, 'utf8').replace('<svg', '<svg class="i" aria-hidden="true"');
};
const arrow = '<svg viewBox="0 0 8 18" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 1V16M1.5 13.5L4 16L6.5 13.5"/></svg>';

const charts = readFileSync(join(root, 'src/charts.js'), 'utf8');
const inline = src => src
  .replace(/\{\{ph:([a-z0-9-]+)\}\}/g, (_, n) => phosphor(n))
  .replaceAll('{{arrow}}', arrow)
  .replace('{{charts}}', charts)
  .replace('{{fig:method}}', readFileSync(join(root, 'src/fig-method.svg'), 'utf8'))
  .replace('{{fig:cdan}}', readFileSync(join(root, 'src/fig-cdan.svg'), 'utf8'))
  .replace('{{PAPER_ID}}', PAPER_ID ? ` · Paper ID ${PAPER_ID}` : '')
  .replace('{{CONTACT}}', CONTACT_EMAIL ? `<p>Contact: ${CONTACT_EMAIL}</p>` : '');

const MM = 96 / 25.4;
const browser = await chromium.launch();
const options = readdirSync(join(root, 'src')).filter(f => /^option-[a-z]\.html$/.test(f)).sort();
for (const file of options) {
  const id = file.match(/option-([a-z])/)[1];
  const out = `option-${id}.html`;
  writeFileSync(join(root, out), inline(readFileSync(join(root, 'src', file), 'utf8')));

  const page = await browser.newPage({ viewport: { width: Math.round(841 * MM), height: Math.round(1189 * MM) } });
  await page.goto('file://' + join(root, out));
  await page.evaluate(() => document.fonts.ready);

  // Layout guard: report anything that spills out of its column or the page, and missing glyphs.
  const issues = await page.evaluate(() => {
    const res = [];
    document.querySelectorAll('.col, .poster, .box').forEach(e => {
      if (e.scrollHeight > e.clientHeight + 1) res.push(`${e.className} overflows by ${e.scrollHeight - e.clientHeight}px`);
    });
    return res;
  });
  issues.forEach(i => console.warn(`WARNING [${id.toUpperCase()}]:`, i));

  // A page can name its own print file with <meta name="pdf-name">; otherwise it is an option of the SolarTwin poster.
  const pdfName = await page.evaluate(() => document.querySelector('meta[name="pdf-name"]')?.content);
  await page.pdf({ path: join(root, pdfName || `SolarTwin-AI_NEECON2026_A0_option-${id.toUpperCase()}.pdf`), width: '841mm', height: '1189mm', printBackground: true, preferCSSPageSize: true });
  await page.screenshot({ path: join(root, `preview-${id}.png`), scale: 'css' });
  await page.close();
  console.log(`Built option ${id.toUpperCase()}`);
}
await browser.close();
