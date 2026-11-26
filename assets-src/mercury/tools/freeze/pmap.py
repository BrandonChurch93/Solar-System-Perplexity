import sys, json, os
import numpy as np
sys.path.insert(0, 'tools/img')
import smooth as S
POSES = json.load(open(os.environ.get('POSES', '/tmp/m/poses-m5.json')))
d, k0, k1, step, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
ks = list(range(k0, k1 + 1, step))
paths = [f'{d}/k{k:06d}.png' for k in ks]
r = 2 // step
maps = []
orig = S.reading
def spy(onward, back, scale):
    res = orig(onward, back, scale)
    maps.append((onward[0].copy(), None if back is None else back[0].copy(), None if back is None else (back[3][0].copy(), back[3][1].copy()), res))
    return res
S.reading = spy
job = {'op': 'pictures', 'paths': paths, 'poses': [POSES[str(k)] for k in ks], 'scale': 0.25, 'window': 16 * r, 'floor': 0.25, 'grid': [16, 9],
       'changeFrames': 8 * r, 'changeBlur': 20, 'patternPx': 40, 'patternFloor': 1, 'first': 0, 'total': len(ks), 'own': [0, len(ks)], 'lead': 0, 'tail': 0}
n = S.pictures(job)
save = {}
for i, (on, bk, way, res) in enumerate(maps):
    save[f'on{i}'] = on
    if bk is not None:
        save[f'bk{i}'] = bk; save[f'bx{i}'] = way[0]; save[f'by{i}'] = way[1]
np.savez_compressed(out, **save)
json.dump({'ks': ks, **{k: n[k] for k in n.keys() if isinstance(n[k], list)}}, open(out + '.json', 'w'))
print(sorted(n.keys()))
for i, k in enumerate(ks):
    p = n['pattern'][i]
    print(f"{k/2:7.1f} pattern {'none' if p is None else round(p, 4)} at {n['patternAt'][i]} share {n['patternShare'][i]} band {n['patternBand'][i]} pop {n['pop'][i]} change {n['change'][i]} at {n['changeAt'][i]} level step {n['levelStep'][i]}")
print('maps', len(maps))
