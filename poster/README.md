# SolarTwin AI — NEECON 2026 poster (A0 portrait)

- `SolarTwin-AI_NEECON2026_A0.pdf` — print file (841 × 1189 mm, one page)
- `preview.png` — screen preview
- `src/poster.html` — the source (edit the text here)

Structure follows the official NEECON 2026 poster template: master header,
title/authors/affiliation, Abstract, Problem & Objectives, Methodology,
Results & Analysis, Conclusions, References & Contact, master footer.

## Rebuild

```sh
npm install
npm run build
```

Set `PAPER_ID` and `CONTACT_EMAIL` at the top of `build.mjs` to show them on the poster.
The console mockup and both charts show a simulated scenario; replace them with
measured results when available.
