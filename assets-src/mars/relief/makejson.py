import json, sys
sys.path.insert(0, 'assets-src/mars/relief')
from geom import CF, W, H
meta = json.load(open('out/work/build-meta.json'))
safe = json.load(open('out/work/safe.json')) if len(sys.argv) > 1 else None
layers = {}
for k, m in meta.items():
    x0, y0, x1, y1 = m['box']
    layers[k] = dict(
        files={s: dict(color=f'public/assets/mars/{s}/relief-{k}-color.jpg', alpha=f'public/assets/mars/{s}/relief-{k}-alpha.png', dist=f'public/assets/mars/{s}/relief-{k}-dist.bin') for s in ('full', 'web')},
        box=dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0),
        colorSize=dict(full=[x1 - x0, y1 - y0], web=[(x1 - x0) // 2, (y1 - y0) // 2]),
        distSize=dict(full=m['distSize'], web=[m['distSize'][0] // 2, m['distSize'][1] // 2]),
        distRange=[round(m['distRange'][0], 4), round(m['distRange'][1], 4)])
order = ['L0', 'L2', 'L1']
out = dict(
    source='references/approved/mars-close.jpg',
    imageSize=dict(full=[2 * W, 2 * H], web=[W, H], approved=[W, H]),
    boxUnits='full-set pixels, origin top-left of the close image',
    distFormat='raw little-endian float32, row-major from top-left, no header; distance from the image camera along the pixel ray; unit = camera height above the rim plateau',
    camera=dict(vfovDeg=CF['vfovDeg'], focalPxFull=2 * CF['focalPx'], pitchDeg=round(CF['pitchDownDeg'], 3), pitchNote='negative looks below level', rollDeg=round(CF['rollDeg'], 3),
                principalPointFull=[W, H], looksAlong='-Z, +Y image up, pitch applied about camera X',
                horizonLineFull=[[0, round(2 * CF['horizonLinePx'][0][1], 1)], [2 * W, round(2 * CF['horizonLinePx'][1][1], 1)]],
                horizonApexFull=[round(2 * CF['horizonApexPx'][0], 1), round(2 * CF['horizonApexPx'][1], 1)],
                horizonDipDeg=round(CF['dipDeg'], 3), groundModel=dict(kind='sphere below camera', radius=round(CF['planetRadius'], 2), cameraHeight=1.0),
                horizonDistance=round(CF['horizonDistance'], 3)),
    drawOrder=order,
    layers={k: layers[k] for k in order},
    masks=dict(full='public/assets/mars/full/relief-masks.png', web='public/assets/mars/web/relief-masks.png', size=dict(full=[W, H], web=[W // 2, H // 2]),
               channels=dict(r='mist on the canyon floor, may drift', g='thin dust haze in the air, catches the low sun', b='unused, 0')),
    mistDriftImageDir=[0.899, 0.438],
    mistDriftNote='unit vector in image space (x right, y down) along the canyon floor, pointing down-canyon toward the lower right',
    safeMove=safe)
json.dump(out, open('assets-src/mars/relief/relief.json', 'w'), indent=1)
