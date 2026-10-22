# NEECON 2026 poster: three design options (A0 portrait)

| Option | Look | Print file |
|---|---|---|
| A | Minimal: hairline rules, serif headings | `SolarTwin-AI_NEECON2026_A0_option-A.pdf` |
| B | Colored containers, navy title band, condensed headings | `SolarTwin-AI_NEECON2026_A0_option-B.pdf` |
| C | Color-blocked: teal header, tinted sidebar, conclusion band | `SolarTwin-AI_NEECON2026_A0_option-C.pdf` |

`options-side-by-side.png` shows all three. `preview-a/b/c.png` are full-size previews.

All three follow the official NEECON 2026 poster template order (header with conference and
partner logos; title and authors; Abstract, Problem Statement & Objectives, Related Literature,
Methodology, Design & Validation, Results & Analysis, Conclusion; References & Contact; footer).

## Second poster: "Learning When to Transfer" (option D)

A colleague's paper, restyled in the option B look: `src/option-d.html` ->
`Learning-When-to-Transfer_NEECON2026_A0.pdf` and `preview-d.png`.
`src/fig_cdan.py` -> `src/fig-cdan.svg` draws the CDAN + LSTM + CSI architecture.
The 48-hour tracking figure is a placeholder until the original plot from the paper is added.

## Source

- `src/option-a.html`, `src/option-b.html`, `src/option-c.html`: one page per option
  (`src/option-d.html` is the second poster).
- `src/charts.js`: the charts and the four scenario diagrams (shared).
- `src/fig_method.py` -> `src/fig-method.svg`: the system-architecture figure (shared).
  Run `python3 src/fig_method.py` after editing it.

## Rebuild

```sh
npm install
npm run build
```

Set `PAPER_ID` and `CONTACT_EMAIL` at the top of `build.mjs` to show them on the posters.
Figures 2 and 3 and the scenario diagrams show a simulated scenario; replace them with
measured results when available.

## Editable Canva version

`export-layout.mjs` exports option B as text boxes, shapes and image crops (`layout.json` + `img/`),
and `canva_ops.py` turns that into Canva edit operations. The editable design in Canva is named
"SolarTwin AI - NEECON 2026 Poster (Option B, editable)".
Option D was exported the same way (`node export-layout.mjs <out-dir> option-d.html`) into a copy of
that design, named "Learning When to Transfer - NEECON 2026 Poster (editable)".
