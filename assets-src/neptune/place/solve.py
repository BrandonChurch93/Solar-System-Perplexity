"""S1: carry the camera of the approved close image onto the globe.

The close scene lives in the frame of its fitted camera (close.json): camera at
the origin, x right, y up, looking down -z, the cloud deck a sphere of radius R
camera heights at C = nadir * (R + 1). A point X of that scene sits on the unit
globe at Q * (X - C) / R, Q a rotation with three free values. They are set by:
the centre of the close storm lands on the spot of the globe (patches.json), and
the line from under the camera to the storm arrives there on a chosen heading.
Writes src/stops/neptune/place.json.
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import geo  # noqa: E402
import pgeo  # noqa: E402

HEADING_AT_STORM_DEG = float(sys.argv[1]) if len(sys.argv) > 1 else -30.0
OUT = 'src/stops/neptune/place.json'
# The globe's own flows (look.ts: storm, stream, clouds.shear) stand still from 4.2 s after the middle of the hold
# (frame 4731) on: storm 2.5 deg per second times 3.4 s, stream 1.5 deg per second times 3.4 s. The plates are baked
# for that rest state, so the place is drawn where place.json says from frame 4731 to the end of the stop.
REST = {'stormLonDeg': -0.25, 'stormLatDeg': -18.8, 'stormRadiusDeg': 7.0, 'stormTurnDeg': 8.5, 'streamDeg': 5.1, 'shear': 0.35, 'shearBands': 5.0, 'fromFrame': 4731}


def basis(lon, lat):
    n = np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])
    e = np.cross([0, 1, 0], n)
    e /= np.linalg.norm(e)
    return n, e, np.cross(n, e)


def lonlat(n):
    return float(np.degrees(np.arctan2(n[0], n[2]))), float(np.degrees(np.arcsin(n[1])))


def azimuth(v, at):
    n, e, u = basis(*np.radians(lonlat(at)))
    return float(np.degrees(np.arctan2(v @ e, v @ u)))


def main():
    close = json.load(open('src/stops/neptune/closeup.json'))
    patches = json.load(open('src/stops/neptune/patches.json'))
    spot = patches['spot']
    ns, ok = pgeo.ground(*close['storm'])
    ea = pgeo.AHEAD - (pgeo.AHEAD @ ns) * ns
    ea /= np.linalg.norm(ea)
    er = np.cross(ea, ns)
    n, e, u = basis(np.radians(spot['lon']), np.radians(spot['lat']))
    h = np.radians(HEADING_AT_STORM_DEG)
    ahead = u * np.cos(h) + e * np.sin(h)
    right = np.cross(ahead, n)
    src = np.stack([er, ns, ea], 1)
    dst = np.stack([right, n, ahead], 1)
    qb = dst @ src.T
    body = geo.rotation()
    qw = body @ qb
    under = qb @ pgeo.UP
    sun = geo.SUN @ body
    look = qb @ np.array([0.0, 0.0, -1.0])
    twin = qw @ (-pgeo.C) / pgeo.R
    pitch = float(np.degrees(np.arcsin(-(np.array([0.0, 0.0, -1.0]) @ pgeo.UP))))
    out = {
        'how': 'assets-src/neptune/place/solve.py: the fitted camera of references/approved/neptune-close.jpg (close.json: field of view, nadir, radius from the dip and curve of its horizon) is carried onto the unit globe by X -> Q (X - C) / R. Q puts the centre of the close storm on the spot of the patch pyramid and sets the heading of the line from under the camera to the storm; the heading was chosen so the cirrus banks of the close image run east to west like the cirrus of the hero and the Sun of the globe stands ahead and to the right, where the close image is bright.',
        'storm': {'pixel': close['storm'], 'lonDeg': spot['lon'], 'latDeg': spot['lat'], 'arcFromUnderCameraDeg': float(np.degrees(np.arccos(ns @ pgeo.UP))), 'headingDeg': HEADING_AT_STORM_DEG},
        'camera': {
            'lonDeg': lonlat(under)[0], 'latDeg': lonlat(under)[1],
            'height': 1 / pgeo.R,
            'headingDeg': azimuth(qb @ pgeo.AHEAD, under),
            'pitchDownDeg': pitch,
            'rollDeg': json.load(open('src/stops/neptune/close.json'))['rollDeg'],
            'vfovDeg': json.load(open('src/stops/neptune/close.json'))['vfovDeg'],
            'dipDeg': float(np.degrees(np.arccos(pgeo.R / (pgeo.R + 1)))),
        },
        'radius': pgeo.R,
        'centre': pgeo.C.tolist(),
        'toBody': geo.quat_from_matrix(qb),
        'toWorld': geo.quat_from_matrix(qw),
        'twin': {'position': twin.tolist(), 'quaternion': geo.quat_from_matrix(qw)},
        'sun': {
            'azimuthAtStormDeg': azimuth(sun, n), 'elevationAtStormDeg': float(np.degrees(np.arcsin(sun @ n))),
            'fromHeadingDeg': azimuth(sun, n) - HEADING_AT_STORM_DEG,
            'inCloseFrame': (qw.T @ geo.SUN).tolist(),
        },
    }
    out['rest'] = REST
    json.dump(out, open(OUT, 'w'), indent=1)
    print(json.dumps(out, indent=1))
    print('look dir azimuth at camera', azimuth(look - (look @ under) * under, under))


main()
