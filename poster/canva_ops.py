"""Turns layout.json (from export-layout.mjs) into Canva edit-design operations.

python3 canva_ops.py <layout-dir> <page_id>  -> writes ops-shapes.json, ops-images.json, ops-text.json
"""
import json, sys
from pathlib import Path

d = Path(sys.argv[1]); page = sys.argv[2]
L = json.loads((d / 'layout.json').read_text())
media = dict(line.split() for line in (d / 'media.txt').read_text().splitlines() if line.strip())
r = lambda v: round(v, 1)

def rect(x, y, w, h, color, radius=0, stroke=None, stroke_weight=0):
    extra = {'stroke_color': stroke, 'stroke_weight': round(stroke_weight, 1)} if stroke else {}
    return {**extra, 'type': 'insert_shape', 'page_id': page, 'left': r(x), 'top': r(y), 'width': r(w), 'height': r(h),
            'path': f'M0 0 H{r(w)} V{r(h)} H0 Z', 'view_box_width': r(w), 'view_box_height': r(h),
            'color': color, **({'corner_rounding': r(radius)} if radius else {})}

shapes = [rect(0, 0, L['width'], L['height'], L['background'])]
shapes += [rect(s['left'], s['top'], s['width'], s['height'], s['color'], s['radius'], s.get('stroke'), s.get('strokeWidth', 0)) for s in L['shapes']]
images = [{'type': 'insert_fill', 'page_id': page, 'asset_type': 'image', 'asset_id': media[i['name']],
           'alt_text': i['name'].replace('-', ' '), 'left': r(i['x']), 'top': r(i['y']),
           'width': r(i['width']), 'height': r(i['height'])} for i in L['images']]
texts = [{'type': 'add_text', 'page_id': page, 'text': t['text'], 'left': r(t['left']), 'top': r(t['top']),
          'width': r(t['width'] + 4)} for t in L['texts']]
(d / 'ops-shapes.json').write_text(json.dumps(shapes))
(d / 'ops-images.json').write_text(json.dumps(images))
(d / 'ops-text.json').write_text(json.dumps(texts))
print(len(shapes), len(images), len(texts))
