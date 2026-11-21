import json
import math
import sys

fit = json.load(open('out/work/jupiter/glow-fit.json'))
scale = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
path = 'src/stops/jupiter/haze.json'
haze = json.load(open(path))
t = math.radians(fit['theta0'])
direction = [round(math.cos(t), 5), round(math.sin(t), 5), 0]
shells = []
heights = sorted({layer['H'] for layer in fit['layers']})
for H in heights:
    broad = next(l for l in fit['layers'] if l['H'] == H and l['lobe'] == 'broad')
    narrow = next(l for l in fit['layers'] if l['H'] == H and l['lobe'] == 'narrow')
    depth = fit['tau'] / 2 / math.sqrt(1.5707963 / H)
    shells.append({
        'scaleHeight': H, 'depth': round(depth, 6), 'day': [round(v * scale, 5) for v in broad['day']], 'twilight': [0, 0, 0], 'night': [0, 0, 0],
        'dayFrom': fit['lobes']['broad'][0], 'dayTo': fit['lobes']['broad'][1], 'strength': 1, 'extinction': 1, 'forward': 0, 'top': 10 if H < 0.01 else 8 if H < 0.05 else 6,
        'core': {'scaleHeight': H, 'day': [round(v * scale, 5) for v in narrow['day']], 'dayFrom': fit['lobes']['narrow'][0], 'dayTo': fit['lobes']['narrow'][1]},
    })
out = {'ground': haze['ground'], 'shells': shells, 'glowDir': direction}
json.dump(out, open(path, 'w'), indent=1)
print(json.dumps(out)[:400])
