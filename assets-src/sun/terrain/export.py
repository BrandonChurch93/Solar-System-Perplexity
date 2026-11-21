import json
from common import LEFT, TOP, SPAN, CANVAS, PLATE_TOP, LOOPS_BOX, FEET, VFOV, fit

f = fit()
out = {
    'vfovDeg': VFOV,
    'down': [round(v, 6) for v in f['down']],
    'alphaDeg': round(f['alphaDeg'], 4),
    'radius': round(f['radius'], 4),
    'canvas': {'left': LEFT, 'top': TOP, 'span': SPAN, 'width': CANVAS[0], 'height': CANVAS[1], 'plateTop': PLATE_TOP},
    'loopsBox': list(LOOPS_BOX),
    'feet': [list(f) for f in FEET],
    'spot': [0.5237, 0.609],
    'umbra': [0.0616, 0.0303],
    'glow': json.load(open('assets-src/sun/terrain/glow.json')),
}
json.dump(out, open('src/stops/sun/terrain.json', 'w'), indent=2)
print(out)
