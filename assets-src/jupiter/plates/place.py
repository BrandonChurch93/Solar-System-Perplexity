import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import globe as G
from globe import geom, ROOT, STOP

OUT = os.path.join(STOP, 'place.json')
SHOW = json.load(open(os.path.join(ROOT, 'config', 'showcase.json')))
SPIN_DEG = float(__import__('re').search(r'spinDegPerSecond:\s*([0-9.]+)', open(os.path.join(STOP, 'plan.ts')).read()).group(1))


def segment(kind):
    return next(s for s in SHOW['segments'] if s['id'] == 'jupiter.' + kind)


def solve(cfg):
    hold, dive = segment('hold'), segment('dive')
    hold_mid = (hold['start'] + hold['end']) / 2
    freeze = cfg['freeze']
    e1 = dive['start'] - hold_mid + freeze['afterDiveStart']
    local = float(G.settle(e1 + freeze['easeSeconds'] / 2, G.FLOW['settle']))
    t = dive['start'] + cfg['handover']['dive']['at'] * (dive['end'] - dive['start'])
    spin = np.radians(SPIN_DEG) * (t - hold_mid)
    n = G.direction(cfg['oval']['lon'], cfg['oval']['lat'])
    n, east, north = G.frame(n)
    sun = G.spin_y(G.FITQ.T @ G.SUN, spin)
    az = np.degrees(np.arctan2(sun @ north, sun @ east))
    el = np.degrees(np.arcsin(sun @ n))
    light = json.load(open(os.path.join(STOP, 'deck.json')))['light']['azimuthDeg']
    x_az = np.radians(az - light)
    ex = np.cos(x_az) * east + np.sin(x_az) * north
    ey = np.cross(n, ex)
    cx, cy = cfg['vortex']
    c = geom.from_chart(np.array(cx), np.array(cy)) - geom.CENTRE
    up = c / np.linalg.norm(c)
    ax = geom.EX - up * (geom.EX @ up)
    ax /= np.linalg.norm(ax)
    ay = np.cross(up, ax)
    close = np.stack([ax, ay, up], 1)
    body = np.stack([ex, ey, n], 1)
    q = body @ close.T
    origin = q @ ((geom.S - geom.CENTRE) / geom.R)
    return dict(local=local, spinDeg=float(np.degrees(spin)), handoverTime=t, sunAzimuthDeg=float(az), sunElevationDeg=float(el), headingDeg=float(az - light + 90), toSurface=[[float(v) for v in row] for row in q], n=[float(v) for v in origin], e=[float(v) for v in q @ geom.EX], u=[float(v) for v in q @ geom.EY], radiusUnits=float(geom.R), twinHeight=float(1 / geom.R))


def surface(gx, gy, place):
    p = (geom.from_chart(gx, gy) - geom.CENTRE) / geom.R
    return p @ np.array(place['solved']['toSurface']).T


if __name__ == '__main__':
    cfg = json.load(open(OUT))
    cfg['solved'] = solve(cfg)
    json.dump(cfg, open(OUT, 'w'), indent=2)
    open(OUT, 'a').write('\n')
    s = cfg['solved']
    print({k: (round(v, 4) if isinstance(v, float) else v) for k, v in s.items() if k not in ('toSurface',)})
    lon, lat = G.lonlat(np.array(s['n']))
    print('chart origin on the surface: lon', round(float(lon), 3), 'lat', round(float(lat), 3))
    for name, (x, y) in {'vortex': cfg['vortex'], 'camera 3150': (0, -3.834), 'ahead 20': (0, 16), 'right 20': (20, -3.8), 'left 20': (-20, -3.8)}.items():
        d = surface(np.array(float(x)), np.array(float(y)), cfg)
        lon, lat = G.lonlat(d)
        print(name, 'lon', round(float(lon), 3), 'lat', round(float(lat), 3))
