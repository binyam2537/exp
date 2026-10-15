// Builds dist/index.html: one self-contained file (no server needed, works from file://,
// USB stick or any static host). Run: npm install && npm run build
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const vendor = resolve('vendor/three');
const threeAlias = {
  name: 'three-vendor',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: `${vendor}/three.module.min.js` }));
    b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: `${vendor}/addons/${a.path.slice('three/addons/'.length)}` }));
  },
};

const out = await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  plugins: [threeAlias],
  legalComments: 'none',
});

const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8')
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}</style>`)
  .replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '')
  .replace(/<script type="module" src="src\/app.js"><\/script>/, () => `<script>/* three.js © three.js authors, MIT */\n${js}</script>`);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);
console.log(`dist/index.html  ${(html.length / 1024).toFixed(0)} KB`);
