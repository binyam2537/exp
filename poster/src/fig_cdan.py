"""Generates src/fig-cdan.svg, the CDAN + LSTM + CSI architecture figure for option D.

Run `python3 src/fig_cdan.py` after editing. Colors come from CSS custom properties on the page.
"""
from pathlib import Path

W, H = 2000, 640
out = []


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def text(x, y, s, cls='t', anchor='start'):
    out.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{esc(s)}</text>')


def math(x, y, parts, anchor='start', size=24):
    """parts: (string, role); role: i italic, r upright, o operator, sub, subr (upright subscript)."""
    spans = []
    for s, role in parts:
        if role in ('sub', 'subr'):
            cls = 'mi' if role == 'sub' else 'mr'
            spans.append(f'<tspan class="{cls}" font-size="{size * .68:.1f}" baseline-shift="-28%">{esc(s)}</tspan>')
        elif role == 'sup':
            spans.append(f'<tspan class="mr" font-size="{size * .68:.1f}" baseline-shift="40%">{esc(s)}</tspan>')
        else:
            spans.append(f'<tspan class="{ {"i": "mi", "r": "mr", "o": "mo"}[role] }">{esc(s)}</tspan>')
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{"".join(spans)}</text>')


def box(x, y, w, h, cls='box'):
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" class="{cls}"/>')


def arrow(d, cls='flow'):
    out.append(f'<path d="{d}" class="{cls}" marker-end="url(#ah)"/>')


YN = [('y', 'i'), ('norm', 'subr')]
YHAT = [('ŷ', 'i'), ('norm', 'subr')]

# Inputs ---------------------------------------------------------------------
box(10, 40, 250, 150, 'box src')
text(135, 100, 'Source data', 'h', 'middle')
math(135, 150, [('D', 'i'), ('S', 'sub'), (' (', 'o'), ('X', 'i'), ('S', 'sub'), (', ', 'o'), ('Y', 'i'), ('S', 'sub'), (')', 'o')], 'middle')

box(10, 440, 250, 150, 'box tgt')
text(135, 500, 'Target data', 'h', 'middle')
math(135, 550, [('D', 'i'), ('T', 'sub'), (' (', 'o'), ('X', 'i'), ('T', 'sub'), (')', 'o')], 'middle')
text(135, 620, 'no target labels', 'note', 'middle')

# Physics-guided preprocessing ------------------------------------------------
box(320, 40, 400, 150, 'box key')
text(520, 90, 'Capacity decoupling', 'h', 'middle')
math(520, 132, YN + [(' = ', 'o'), ('Y', 'i'), ('S', 'sub'), (' / ', 'o'), ('C', 'i'), ('S', 'sub')], 'middle')
text(520, 172, 'and CSI stationarization k*', 't', 'middle')

box(320, 440, 400, 150, 'box key')
text(520, 490, 'Target feature engineering', 'h', 'middle')
text(520, 532, 'and CSI stationarization k*', 't', 'middle')
text(520, 570, 'same transform as source', 'note', 'middle')

# Shared feature extractor -------------------------------------------------
box(790, 40, 300, 550, 'box core')
text(940, 270, 'Feature extractor', 'h', 'middle')
math(940, 318, [('G', 'i'), ('f', 'sub')], 'middle', 30)
text(940, 362, '2-layer LSTM', 't', 'middle')
text(940, 396, 'shared weights', 't', 'middle')

# Task branch --------------------------------------------------------------
box(1170, 40, 330, 150)
text(1335, 92, 'Task predictor', 'h', 'middle')
math(1335, 136, [('G', 'i'), ('y', 'sub')], 'middle', 28)
text(1335, 172, 'regression head', 't', 'middle')

box(1590, 20, 400, 110)
text(1790, 66, 'Huber loss', 'h', 'middle')
math(1790, 106, [('L', 'i'), ('task', 'subr'), ('  on source labels', 'r')], 'middle', 22)

box(1590, 160, 400, 130)
text(1790, 204, 'Target rescaling', 'h', 'middle')
math(1790, 242, [('× ', 'o'), ('C', 'i'), ('T', 'sub'), ('  and nocturnal', 'r')], 'middle', 22)
text(1790, 274, 'zero-mask', 't', 'middle')

# Domain branch ------------------------------------------------------------
box(1170, 440, 230, 150, 'box grl')
text(1285, 494, 'Gradient', 'h', 'middle')
text(1285, 526, 'reversal', 'h', 'middle')
math(1285, 568, [('(−', 'o'), ('λ', 'i'), (')', 'o')], 'middle', 24)

box(1470, 440, 300, 150)
text(1620, 488, 'Discriminator', 'h', 'middle')
math(1620, 528, [('G', 'i'), ('d', 'sub')], 'middle', 26)
math(1620, 570, [('f', 'i'), (' = ', 'o'), ('h', 'i'), (' ⊗ ', 'o')] + YHAT, 'middle', 22)

box(1830, 440, 160, 150)
text(1910, 490, 'BCE loss', 'h', 'middle')
math(1910, 530, [('L', 'i'), ('domain', 'subr')], 'middle', 22)
math(1910, 568, [('d', 'i'), (' ∈ {0, 1}', 'o')], 'middle', 20)

# Signals ------------------------------------------------------------------
arrow('M260 115 H314')
arrow('M260 515 H314')
arrow('M720 115 H784')
arrow('M720 515 H784')
arrow('M1090 115 H1164')
math(1127, 100, [('h', 'i')], 'middle', 22)
arrow('M1090 515 H1164')
math(1127, 500, [('h', 'i')], 'middle', 22)
arrow('M1500 90 H1584')
arrow('M1500 150 H1545 V225 H1584')
math(1512, 335, YHAT, 'end', 22)
arrow('M1500 170 H1525 V434', 'flow dash')
arrow('M1400 515 H1464')
arrow('M1770 515 H1824')

svg = f'''<svg class="fig cdan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="CDAN plus LSTM plus Clear-Sky Index architecture">
<style>
  @font-face {{ font-family: "STIX Two Text"; font-style: italic; font-weight: 400; src: url(assets/fonts/stix-text-latin-400i.woff2) format("woff2"); unicode-range: U+0000-00FF,U+2000-206F,U+2212; }}
  @font-face {{ font-family: "STIX Two Text"; font-style: italic; font-weight: 400; src: url(assets/fonts/stix-text-latinext-400i.woff2) format("woff2"); unicode-range: U+0100-02BA; }}
  @font-face {{ font-family: "STIX Two Text"; font-style: italic; font-weight: 400; src: url(assets/fonts/stix-text-greek-400i.woff2) format("woff2"); unicode-range: U+0370-03FF; }}
  @font-face {{ font-family: "STIX Two Math"; font-weight: 400; src: url(assets/fonts/stix-math-400.woff2) format("woff2"); }}
  .cdan {{ display: block; width: 100%; height: auto; font-family: var(--sans); }}
  .cdan .box {{ fill: #F8FAFB; stroke: var(--ink-2); stroke-width: 1.8; }}
  .cdan .box.key {{ stroke: var(--teal); stroke-width: 3; }}
  .cdan .box.core {{ fill: #E3E9EE; stroke: var(--navy); stroke-width: 3; }}
  .cdan .box.grl {{ stroke: var(--brick); stroke-width: 3; }}
  .cdan .box.tgt {{ stroke-dasharray: 9 6; }}
  .cdan .h {{ font-size: 27px; font-weight: 700; fill: var(--ink); }}
  .cdan .t {{ font-size: 22px; fill: var(--ink-2); }}
  .cdan .note {{ font-size: 19px; fill: var(--muted); }}
  .cdan .mi {{ font-family: "STIX Two Text", serif; font-style: italic; fill: var(--ink); }}
  .cdan .mr {{ font-family: "STIX Two Math", serif; fill: var(--ink); }}
  .cdan .mo {{ font-family: "STIX Two Math", serif; fill: var(--ink); }}
  .cdan .flow {{ fill: none; stroke: var(--ink-2); stroke-width: 2; }}
  .cdan .flow.dash {{ stroke-dasharray: 8 6; }}
  .cdan .ahead {{ fill: var(--ink-2); }}
</style>
<defs><marker id="ahc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="ahead"/></marker></defs>
{chr(10).join(out).replace('url(#ah)', 'url(#ahc)')}
</svg>
'''
Path(__file__).with_name('fig-cdan.svg').write_text(svg)
print('wrote fig-cdan.svg')
