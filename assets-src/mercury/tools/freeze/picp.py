import sys, json, os
sys.path.insert(0, 'tools/img')
import smooth as S
POSES = json.load(open(__import__('os').environ.get('POSES', '/tmp/m/poses-m4.json')))
d, k0, k1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ks = list(range(k0, k1 + 1))
paths = [f'{d}/k{k:06d}.png' for k in ks]
miss = [p for p in paths if not os.path.exists(p)]
if miss:
    print('missing', len(miss), miss[:3]); sys.exit(1)
job = {'op': 'pictures', 'paths': paths, 'poses': [POSES[str(k)] for k in ks], 'scale': 0.25, 'window': 32, 'floor': 0.25, 'grid': [16, 9],
       'changeFrames': 16, 'changeBlur': 20, 'patternPx': 40, 'patternFloor': 1, 'first': 0, 'total': len(ks), 'own': [0, len(ks)], 'lead': 0, 'tail': 0}
n = S.pictures(job)
out = {'ks': ks, **{k: n[k] for k in ('pattern', 'patternAt', 'patternShare', 'patternBand', 'pop', 'change', 'changeAt', 'levelStep', 'popAll', 'popCarried', 'popBlock', 'popBlockAt', 'residual', 'base', 'level')}}
json.dump(out, open(sys.argv[4], 'w'))
over = 0
for i, k in enumerate(ks):
    p = n['pattern'][i]
    if p is None: continue
    over += p > 0.45
    print(f"{k/2:7.1f} pattern {p:.2f}{' *' if p > 0.45 else '  '} at {n['patternAt'][i]} share {n['patternShare'][i]:.2f} band {n['patternBand'][i]:.1f} pop {n['pop'][i] if n['pop'][i] is None else round(n['pop'][i], 2)}")
vals = [(p, k) for p, k in zip(n['pattern'], ks) if p is not None]
print('largest', max(vals), 'over the limit', over, 'of', len(vals))
