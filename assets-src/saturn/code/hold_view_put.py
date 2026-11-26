"""hold_view_put.py FIT.json OUT.json HOME RADIUS PLACE LENS TURN: the solved view of the hold (hold_view_fit.py)
written into a copy of fit.json. FIT.json is the fit as it stands; HOME is the moon's home of look.ts (x,y,z) and
RADIUS its radius; PLACE is the solved camera's place (x,y,z), LENS the solved vertical field of view in degrees and
TURN the solved quaternion of the globe (x,y,z,w), all as hold_view_fit.py prints them in the words of fit.json.
The body keeps its Sun (the Sun's direction in the frame of the globe stays, so sunDir and the rings' normal turn
with the globe), and the moon stays on its pixel at its size: its new home is printed (for look.ts and
kept/look.ts) and the fit's moon moves with it. Prints the numbers and writes OUT.json; it writes nothing into
the film."""
import sys, json
import numpy as np
SRC, OUT = sys.argv[1], sys.argv[2]
f = json.load(open(SRC))
def rotq(q, v):
    x, y, z, w = q; u = np.array([x, y, z]); v = np.array(v, float)
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)
def conj(q): return np.array([-q[0], -q[1], -q[2], q[3]])
q0 = np.array(f['globe']['quaternion'], float); c0 = np.array(f['camera']['position'], float); v0 = float(f['vfovDeg'])
q1 = np.array([float(x) for x in sys.argv[7].split(",")]); q1 /= np.linalg.norm(q1)
c1 = np.array([float(x) for x in sys.argv[5].split(",")]); v1 = float(sys.argv[6])
sunL = rotq(conj(q0), f['sunDir']); sunL /= np.linalg.norm(sunL)
sun1 = rotq(q1, sunL)
n1 = rotq(q1, [0, 1, 0])
print('sun in the body frame', np.round(sunL, 6).tolist(), 'elevation over the ring plane %.3f deg, azimuth %.3f deg' % (np.degrees(np.arcsin(sunL[1])), np.degrees(np.arctan2(sunL[2], sunL[0]))))
print('new sunDir', np.round(sun1, 6).tolist(), 'new normal', np.round(n1, 6).tolist())
home = np.array([float(x) for x in sys.argv[3].split(',')])
def px(c, v, p):
    t = np.tan(np.radians(v) / 2); r = np.array(p, float) - c
    return 960 + 960 * r[0] / (-r[2] * t * 16 / 9), 540 - 540 * r[1] / (-r[2] * t)
def size(c, v, p, rad, n=720):
    # the outline of the sphere as seen from c: mean radius in px about the projected centre
    r = np.array(p, float) - c; d = np.linalg.norm(r); a = r / d
    e1 = np.cross(a, [0, 1, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(a, e1)
    s = rad / d; k = np.sqrt(1 - s * s)
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    pts = c + (d * k * k) * a + (rad * k) * (np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2)
    t = np.tan(np.radians(v) / 2); rr = pts - c
    X = 960 + 960 * rr[:, 0] / (-rr[:, 2] * t * 16 / 9); Y = 540 - 540 * rr[:, 1] / (-rr[:, 2] * t)
    area = 0.5 * abs(np.sum(X * np.roll(Y, -1) - np.roll(X, -1) * Y))
    return np.sqrt(area / np.pi), X.mean(), Y.mean()
rad = float(sys.argv[4])
sx, sy = px(c0, v0, home); r0, mx, my = size(c0, v0, home, rad)
print('moon today: centre %.2f %.2f, outline mean %.2f %.2f, radius %.3f px, from the lens %.4f, from the globe %.4f' % (sx, sy, mx, my, r0, np.linalg.norm(home - c0), np.linalg.norm(home)))
t1 = np.tan(np.radians(v1) / 2)
ray = np.array([(sx - 960) / 960 * t1 * 16 / 9, -(sy - 540) / 540 * t1, -1.0]); ray /= np.linalg.norm(ray)
lo, hi = 5.0, 60.0
for _ in range(80):
    mid = (lo + hi) / 2
    if size(c1, v1, c1 + mid * ray, rad)[0] > r0: lo = mid
    else: hi = mid
h1 = c1 + lo * ray
sx1, sy1 = px(c1, v1, h1); r1, mx1, my1 = size(c1, v1, h1, rad)
print('moon in the new view: home', np.round(h1, 6).tolist(), 'centre %.2f %.2f, outline mean %.2f %.2f, radius %.3f px, from the lens %.4f, from the globe %.4f' % (sx1, sy1, mx1, my1, r1, lo, np.linalg.norm(h1)))
f['vfovDeg'] = v1
f['camera']['position'] = [round(float(x), 6) for x in c1]
f['globe']['quaternion'] = [round(float(x), 7) for x in q1]
f['rings']['normal'] = [round(float(x), 6) for x in n1]
f['sunDir'] = [round(float(x), 6) for x in sun1]
old = np.array(f['moons'][0]['position'], float)
f['moons'][0]['position'] = [round(float(x), 6) for x in (h1 + (old - home) * lo / np.linalg.norm(home - c0))]
print('fit moon', f['moons'][0]['position'])
json.dump(f, open(OUT, 'w'), indent=2); open(OUT, 'a').write('\n')
