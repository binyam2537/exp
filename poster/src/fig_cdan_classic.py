"""Generates src/fig-cdan-classic.svg: the colleague's CDAN + LSTM + CSI diagram redrawn as vectors (option E).

Same boxes, colors and arrows as the original poster, only sharper. Run `python3 src/fig_cdan_classic.py` after editing.
"""
from pathlib import Path

W, H = 2000, 600
TEAL, INK, WHITE = '#17646F', '#0B1F3A', '#FFFFFF'
out = []


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def text(x, y, s, size=30, fill=WHITE, weight=400, anchor='middle'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{esc(s)}</text>')


def line(x, y, parts, size=30, fill=WHITE, anchor='middle'):
    """parts: (string, role); role: t sans text, b bold sans, i math italic, o math upright, sub, subr (upright subscript)."""
    spans = []
    for s, role in parts:
        if role in ('sub', 'subr'):
            fam = 'mi' if role == 'sub' else 'mo'
            spans.append(f'<tspan class="{fam}" font-size="{size * .66:.1f}" baseline-shift="-25%">{esc(s)}</tspan>')
        elif role == 'sup':
            spans.append(f'<tspan class="mo" font-size="{size * .66:.1f}" baseline-shift="40%">{esc(s)}</tspan>')
        else:
            cls = {'t': '', 'b': ' font-weight="700"', 'i': ' class="mi"', 'o': ' class="mo"'}[role]
            spans.append(f'<tspan{cls}>{esc(s)}</tspan>')
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}">{"".join(spans)}</text>')


def box(x, y, w, h, fill=TEAL, stroke=None, sw=2.5, rx=16):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{st}/>')


def docs(x, y, w, h):
    """Stack of three pages with a wavy bottom edge, as in the original."""
    for k in (2, 1, 0):
        ox, oy = x + 14 * k, y - 14 * k
        d = (f'M{ox} {oy} H{ox + w} V{oy + h - 18} C{ox + w * .75} {oy + h - 46} {ox + w * .5} {oy + h + 8} '
             f'{ox + w * .25} {oy + h - 4} S{ox} {oy + h - 30} {ox} {oy + h - 18} Z')
        out.append(f'<path d="{d}" fill="#C9D9DF" stroke="{INK}" stroke-width="2.5"/>')


def arrow(d, dash=False):
    out.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="3"{" stroke-dasharray=&quot;9 6&quot;" if dash else ""} marker-end="url(#ahk)"/>')


# Inputs
docs(20, 60, 230, 170)
line(135, 132, [('Source Data', 'b')], 31, INK)
line(135, 180, [('D', 'i'), ('S', 'sub'), (' (', 'o'), ('X', 'i'), ('S', 'sub'), (', ', 'o'), ('Y', 'i'), ('S', 'sub'), (')', 'o')], 31, INK)
docs(20, 360, 230, 170)
line(135, 432, [('Target Data', 'b')], 31, INK)
line(135, 480, [('D', 'i'), ('T', 'sub'), (' (', 'o'), ('X', 'i'), ('T', 'sub'), (')', 'o')], 31, INK)

# Preprocessing
box(305, 45, 360, 170)
text(485, 100, 'Capacity Decoupling', 29)
line(485, 142, [('(', 'o'), ('y', 'i'), ('norm', 'subr'), (' = ', 'o'), ('Y', 'i'), ('S', 'sub'), ('/', 'o'), ('C', 'i'), ('S', 'sub'), (') &', 'o')], 29)
line(485, 184, [('CSI Stationarization (', 't'), ('k', 'i'), ('*', 'o'), (')', 't')], 29)
box(305, 365, 360, 130)
text(485, 420, 'Target Feature Eng. &', 29)
line(485, 462, [('CSI Stationarization (', 't'), ('k', 'i'), ('*', 'o'), (')', 't')], 29)

# Shared feature extractor
box(710, 40, 290, 480)
text(855, 222, 'Feature Extractor', 32, weight=700)
line(855, 266, [('G', 'i'), ('f', 'sub')], 32)
text(855, 310, '(2-Layer LSTM with')
text(855, 350, 'Shared Weights)')

# Task branch
box(1090, 40, 310, 130)
line(1245, 95, [('Task Predictor ', 'b'), ('G', 'i'), ('y', 'sub')], 31)
text(1245, 140, 'Regression Head')
box(1600, 20, 380, 120, '#D6E0E3', INK)
line(1790, 70, [('Huber Loss ', 't'), ('L', 'i'), ('task', 'subr')], 30, INK)
text(1790, 112, 'on Source Labels', 30, INK)
box(1560, 215, 420, 115)
line(1770, 263, [('Target Rescaling (', 't'), ('C', 'i'), ('T', 'sub'), (')', 't')])
text(1770, 305, '& Nocturnal Zero-Mask')

# Domain branch
box(1090, 360, 165, 165, '#F5CFC9', '#C8746A')
text(1172, 410, 'Gradient', 28, INK, 700)
text(1172, 444, 'Reversal', 28, INK, 700)
text(1172, 478, 'Layer', 28, INK, 700)
line(1172, 512, [('(GRL, −', 't'), ('λ', 'i'), ('I', 'i'), (')', 't')], 24, INK)
box(1300, 365, 290, 150, '#DCEFE6', TEAL)
line(1445, 415, [('Discriminator ', 'b'), ('G', 'i'), ('d', 'sub')], 30, INK)
text(1445, 452, 'Conditioning', 28, INK)
line(1445, 494, [('(', 'o'), ('f', 'i'), (' = ', 'o'), ('h', 'i'), (' ⊗ ', 'o'), ('ŷ', 'i'), ('norm', 'subr'), (')', 'o')], 28, INK)
box(1640, 395, 260, 90, '#D6E0E3', INK)
line(1770, 452, [('BCE Loss ', 't'), ('L', 'i'), ('domain', 'subr')], 30, INK)
text(1770, 540, 'Domain Classifier', 30, INK, 700)
line(1770, 580, [('(', 'o'), ('d', 'i'), (' ∈ {0, 1})', 'o')], 28, INK)

# Signals
arrow('M265 135 H297')
arrow('M265 430 H297')
arrow('M665 130 H702')
arrow('M665 430 H702')
out.append(f'<path d="M1000 280 H1040 M1040 105 V445" fill="none" stroke="{INK}" stroke-width="3"/>')
arrow('M1040 105 H1082')
arrow('M1040 445 H1082')
arrow('M1400 80 H1592')
line(1496, 66, [('y', 'i'), ('norm', 'subr')], 28, INK)
arrow('M1790 140 V207')
arrow('M1290 170 V272 H1552')
arrow('M1255 442 H1292')
arrow('M1590 440 H1632')

svg = f'''<svg class="fig cdan-classic" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="CDAN plus LSTM plus Clear-Sky Index architecture">
<style>
  .cdan-classic {{ display: block; width: 100%; height: auto; font-family: var(--sans); }}
  .cdan-classic .mi {{ font-family: "STIX Two Text", serif; font-style: italic; }}
  .cdan-classic .mo {{ font-family: "STIX Two Math", serif; }}
</style>
<defs><marker id="ahk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="{INK}"/></marker></defs>
{chr(10).join(out)}
</svg>
'''
Path(__file__).with_name('fig-cdan-classic.svg').write_text(svg)
print('wrote fig-cdan-classic.svg')
