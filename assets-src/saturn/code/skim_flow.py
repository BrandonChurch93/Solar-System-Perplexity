"""How fast things cross the frame in the skim: for a few places in the picture, the motion in pixels per frame
of the point of the ring plane under the pixel if the plane stood still, of the ice there on its own orbit, and
of stones that float above it at the heights of src/stops/saturn/ice.json. The camera is the one of skim.json
(the same construction as plan.ts), the orbital rate the one of ice.json and plan.ts. Nothing here is shipped.

  python3 skim_flow.py [FRAME]      FRAME counts from the first frame of the skim, 0 to 179, default 90
"""
import json
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
import skim_map

ICE = json.load(open(os.path.join(geom.STOP, 'ice.json')))
SPIN = float(re.search(r'spinDegPerSecond:\s*([0-9.]+)', open(os.path.join(geom.STOP, 'plan.ts')).read()).group(1))
FRAMES, FPS, W, H = 180, 30, 1920, 1080


def project(point, u):
    position, rot, vfov = skim_map.pose(u)
    c = (point - position) @ rot
    t = np.tan(np.radians(vfov) / 2)
    return np.array([(c[0] / -c[2] / (t * W / H) + 1) * W / 2, (1 - c[1] / -c[2] / t) * H / 2])


def orbit(point, seconds):
    """The same piece of ice a little later: it turns about the ring normal at the rate of its radius, toward
    decreasing atan2(z, x), as ice.ts turns its rows."""
    r = np.hypot(point[0], point[2])
    a = -np.radians(SPIN) * (ICE['orbit']['syncRadius'] / r) ** 1.5 * seconds
    return np.array([point[0] * np.cos(a) - point[2] * np.sin(a), point[1], point[0] * np.sin(a) + point[2] * np.cos(a)])


def main():
    frame = int(sys.argv[1]) if len(sys.argv) > 1 else FRAMES // 2
    u0 = frame / FRAMES - 0.5
    u1 = (frame + 1) / FRAMES - 0.5
    position, rot, vfov = skim_map.pose(u0)
    d = geom.rays(W, H, vfov) @ rot.T
    heights = sorted(set(h for h in ICE['stones']['height'] if h > 0))
    print('frame %d of the skim, camera height %.3f. Motion in pixels per frame as (right, down) and its length.' % (frame, position[1]))
    for name, (x, y) in {'A near left': (260, 930), 'A left': (120, 700), 'B near': (1100, 900), 'B low right': (1500, 1000), 'B mid': (900, 650), 'B far': (640, 470)}.items():
        ray = d[y, x]
        k = -position[1] / ray[1]
        ground = position + ray * k
        line = '%-12s (%4d, %4d) r %.3f' % (name, x, y, np.hypot(ground[0], ground[2]))
        still = project(ground, u1) - project(ground, u0)
        ice = project(orbit(ground, 1 / FPS), u1) - project(ground, u0)
        line += '   plane (%5.2f, %5.2f) %5.2f   ice (%5.2f, %5.2f) %5.2f' % (still[0], still[1], np.hypot(*still), ice[0], ice[1], np.hypot(*ice))
        for h in heights:
            p = position + ray * k * (1 - h / position[1])
            v = project(orbit(p, 1 / FPS), u1) - project(p, u0)
            line += '   %.3f: (%5.2f, %5.2f) %5.2f' % (h, v[0], v[1], np.hypot(*v))
        print(line)


if __name__ == '__main__':
    main()
