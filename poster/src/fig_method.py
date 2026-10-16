"""Generates src/fig-method.svg, the system-architecture figure used in the Methodology section.

Run `python3 src/fig_method.py` after editing. Colors come from CSS custom properties on the page
(--ink, --muted, --teal, --rule, --sheet, ...), so each poster option restyles the figure.
"""
from pathlib import Path

W, H = 1000, 690
out = []


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def text(x, y, s, cls='t', anchor='start'):
    out.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{esc(s)}</text>')


def box(x, y, w, h, title, cls='box', note=None):
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" class="{cls}"/>')
    text(x + 18, y + 36, title, 'h')
    if note:
        text(x + w - 16, y + 36, note, 'tag', 'end')
    out.append(f'<line x1="{x + 18}" x2="{x + w - 16}" y1="{y + 52}" y2="{y + 52}" class="sep"/>')


def arrow(d, cls='flow'):
    out.append(f'<path d="{d}" class="{cls}" marker-end="url(#ah)"/>')


# Tier 1 -------------------------------------------------------------------
box(10, 40, 200, 290, 'Data inputs')
for i, t in enumerate(['Plant telemetry', 'Weather, irradiance', 'Clear-sky index', 'Shift events']):
    text(28, 128 + i * 42, t)

box(270, 40, 310, 290, 'Forecast engine')
for i, name in enumerate(['CDAN + LSTM + CSI', 'Transformer', 'Persistence']):
    yy = 84 + i * 76
    out.append(f'<rect x="288" y="{yy}" width="274" height="58" class="sub"/>')
    text(304, yy + 36, name)

box(640, 40, 350, 290, 'Trust monitor', cls='box key', note='proposed')
for i, t in enumerate(['Input feature shift', 'Model disagreement', 'Transfer risk score', 'Fallback when risk is high']):
    text(658, 128 + i * 52, t)

# Tier 2 -------------------------------------------------------------------
box(10, 420, 200, 260, 'Explanation', cls='box llm')
for i, t in enumerate(['LLM agent', 'Reads the evidence', 'log and writes the', 'decision trace.', 'Cannot change', 'numbers or limits.']):
    text(28, 500 + i * 30, t, 't small' if i else 't')

box(270, 420, 310, 260, 'Digital twin', cls='box twin', note='simulated')
for i, t in enumerate(['PV plant', 'Battery', 'Flexible load', 'Weather events']):
    text(288, 508 + i * 44, t)

box(640, 420, 350, 260, 'Energy optimizer')
for i, t in enumerate(['Goal: lowest operating cost', 'Battery charge limits', 'Battery power limits', 'Supply meets demand']):
    text(658, 508 + i * 44, t)

# Signals ------------------------------------------------------------------
arrow('M210 185 H264')
text(237, 172, 'data', 'lbl', 'middle')
arrow('M580 185 H634')
text(607, 172, 'output', 'lbl', 'middle')
arrow('M815 330 V414')
text(830, 368, 'selected forecast', 'lbl')
text(830, 388, 'and risk', 'lbl')
arrow('M640 550 H586')
text(613, 537, 'plan', 'lbl', 'middle')
arrow('M425 420 V375 H110 V336')
text(124, 366, 'measured output and battery state (feedback)', 'lbl')
arrow('M270 550 H216', cls='flow dash')
text(243, 537, 'log', 'lbl', 'middle')

svg = f'''<svg class="fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="System architecture of SolarTwin AI">
<style>
  .fig {{ display: block; width: 100%; height: auto; font-family: var(--sans); }}
  .fig .box {{ fill: var(--fig-box, var(--sheet)); stroke: var(--fig-line, var(--ink-2)); stroke-width: 1.6; }}
  .fig .box.key {{ stroke: var(--teal); stroke-width: 3; }}
  .fig .box.llm {{ fill: none; stroke-dasharray: 8 6; }}
  .fig .box.twin {{ fill: var(--fig-twin, var(--paper)); }}
  .fig .sub {{ fill: var(--fig-sub, var(--paper)); stroke: var(--fig-subline, var(--rule)); stroke-width: 1.2; }}
  .fig .sep {{ stroke: var(--fig-subline, var(--rule)); stroke-width: 1.2; }}
  .fig .h {{ font-size: 23px; font-weight: 700; fill: var(--ink); }}
  .fig .tag {{ font-size: 15px; font-weight: 600; fill: var(--muted); }}
  .fig .box.key + .h, .fig .key ~ .tag {{ }}
  .fig .t {{ font-size: 18px; fill: var(--ink-2); }}
  .fig .t.small {{ font-size: 16.5px; fill: var(--muted); }}
  .fig .lbl {{ font-size: 16px; fill: var(--muted); font-weight: 600; }}
  .fig .flow {{ fill: none; stroke: var(--ink-2); stroke-width: 1.8; }}
  .fig .flow.dash {{ stroke-dasharray: 7 5; }}
  .fig .ahead {{ fill: var(--ink-2); }}
</style>
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="ahead"/></marker></defs>
{chr(10).join(out)}
</svg>
'''
Path(__file__).with_name('fig-method.svg').write_text(svg)
print('wrote fig-method.svg')
