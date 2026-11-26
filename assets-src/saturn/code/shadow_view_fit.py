# shadow_view_fit.py [OUT.jpg]: the direction of the Sun that the approved picture of the hold shows twice, read
# through the view of fit.json: once by the edges of the globe's shadow on the rings, once by the terminator on
# the globe. Run from the repo root: python3 assets-src/saturn/code/shadow_view_fit.py [OUT.jpg]
#
# The rings are true circles about the axis and the globe is the spheroid of fit.json, both as the film draws
# them. Frame of the body: y along the axis (the ring's normal), azimuth = atan2(z, x), elevation over the ring
# plane. The shadow on the ring is cast as src/stops/saturn/kept/rings.ts casts it: a point of the ring plane is
# half lit where its distance from the line through the centre along the Sun (the globe brought to a sphere) is
# the middle of the look's penumbra (kept/look.ts rings.penumbra and penumbraFar, read here from the text).
# 1. Edges of the shadow: on circles of the B and the A ring the two azimuths at which the approved's light falls
#    to half of the lit ring beside it; the two angles of the Sun that put the cast edges on them (least squares
#    in px along the circle).
# 2. Terminator: on circles of latitude of the globe the longitude at which the approved's light falls to a
#    share of the day's most on that circle; the Sun as the axis of the small circle through those points.
# It prints the Sun of fit.json, the direction of shadow.json and the two fitted directions, each with what is
# left in px on the edges of the shadow. Measures and prints only: the film does not run it.
import sys, os, json, re
import numpy as np
from PIL import Image, ImageDraw
from scipy.optimize import least_squares
from scipy.ndimage import map_coordinates, uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
STOP = os.path.join(ROOT, 'src', 'stops', 'saturn')
FIT = json.load(open(os.path.join(STOP, 'fit.json'))); SHADOW = json.load(open(os.path.join(STOP, 'shadow.json')))
LOOK = open(os.path.join(STOP, 'kept', 'look.ts')).read()
PEN = [float(v) for v in re.search(r'\n  penumbra: \[([^\]]+)\]', LOOK).group(1).split(',')]
PENFAR = [float(v) for v in re.search(r'\n  penumbraFar: \[([^\]]+)\]', LOOK).group(1).split(',')]
G = np.array(FIT['globe']['quaternion'], float); C = np.array(FIT['camera']['position'], float); V = float(FIT['vfovDeg'])
POL = float(FIT['globe']['scale'][1]); T = np.tan(np.radians(V) / 2)


def rotq(q, v):
    u = np.array(q[:3]); v = np.asarray(v, float)
    return v + 2 * np.cross(u, np.cross(u, v) + q[3] * v)


def conj(q): return np.array([-q[0], -q[1], -q[2], q[3]])


EYE = rotq(conj(G), C)
SUN = rotq(conj(G), np.array(FIT['sunDir'], float)); SUN /= np.linalg.norm(SUN)
im = Image.open(os.path.join(ROOT, 'references', 'approved', 'saturn-hero.png')).convert('RGB')
K = im.size[0] / 1920.0
A = np.asarray(im).astype(float) / 255
A = np.where(A <= 0.04045, A / 12.92, ((A + 0.055) / 1.055) ** 2.4)
LUM = 0.2126 * A[..., 0] + 0.7152 * A[..., 1] + 0.0722 * A[..., 2]


def proj(p):
    w = rotq(G, p) - C
    return 960 + 960 * w[..., 0] / (-w[..., 2] * T * 16 / 9), 540 - 540 * w[..., 1] / (-w[..., 2] * T)


def read(x, y):
    return map_coordinates(LUM, [(y + 0.5) * K - 0.5, (x + 0.5) * K - 0.5], order=1, mode='nearest')


def hidden(p):
    # is the globe between the lens and the point (the globe brought to a sphere)
    e = EYE * np.array([1, 1 / POL, 1]); q = p * np.array([1, 1 / POL, 1]); d = q - e; n = np.linalg.norm(d, axis=-1, keepdims=True); d = d / n
    b = d @ e; disc = b * b - (e @ e - 1)
    return (disc > 0) & (-b - np.sqrt(np.maximum(disc, 0)) < n[..., 0]) & (-b + np.sqrt(np.maximum(disc, 0)) > 0)


def angles(s): return np.degrees(np.arctan2(s[2], s[0])), np.degrees(np.arcsin(s[1] / np.linalg.norm(s)))


def sun_of(az, el):
    a, e = np.radians(az), np.radians(el)
    return np.array([np.cos(e) * np.cos(a), np.sin(e), np.cos(e) * np.sin(a)])


def cast(s, p):
    # signed: under 0 inside the shadow as the ring shader casts it, 0 on the half lit line
    ss = np.array([s[0], s[1] / POL, s[2]]); ss /= np.linalg.norm(ss)
    along = p @ ss; miss = np.linalg.norm(p - along[..., None] * ss, axis=-1); m = np.maximum(-along, 0)
    half = 0.5 * (PEN[0] + PEN[1] + PEN[2] * m + PENFAR[1] * np.maximum(m - PENFAR[0], 0))
    return np.where(along > 0, 1.0, miss - half)


AZ = np.arange(-100, 150, 0.05)
RADII = [r for r in np.arange(1.56, 2.31, 0.02) if not 1.93 < r < 2.05]


def circle(r): return np.stack([r * np.cos(np.radians(AZ)), np.zeros_like(AZ), r * np.sin(np.radians(AZ))], -1)


def edges_of(s, r):
    c = cast(s, circle(r)); sg = np.sign(c); k = np.nonzero(sg[1:] * sg[:-1] < 0)[0]
    return [AZ[i] + 0.05 * c[i] / (c[i] - c[i + 1]) for i in k]


# 1. the edges of the shadow in the approved
MEAS = []
for r in RADII:
    p = circle(r); x, y = proj(p); ok = (~hidden(p)) & (x > 2) & (x < 1917) & (y > 2) & (y < 1077)
    L = uniform_filter1d(read(x, y), 5)
    for a0 in edges_of(SUN, r):
        w = (np.abs(AZ - a0) < 16) & ok
        if w.sum() < 200: continue
        la = AZ[w]; ll = L[w]
        lit = np.percentile(ll, 90); dark = np.percentile(ll, 5)
        if lit < 0.08 or dark > 0.35 * lit: continue
        t = 0.5 * (lit + dark); sg = np.sign(ll - t); k = np.nonzero(sg[1:] * sg[:-1] < 0)[0]
        k = [i for i in k if la[i + 1] - la[i] < 0.06]
        if not len(k) == 1: continue
        i = k[0]; a = la[i] + 0.05 * (ll[i] - t) / (ll[i] - ll[i + 1])
        px = np.hypot(*[np.diff(v)[0] for v in proj(np.array([[r * np.cos(np.radians(a + d)), 0, r * np.sin(np.radians(a + d))] for d in (-0.5, 0.5)]))])
        MEAS.append((r, a, 1 if a > a0 - 90 and a0 > angles(SUN)[0] + 180 else 0, px, a0))
MEAS = np.array(MEAS)
side = np.where(MEAS[:, 4] > angles(SUN)[0] + 180, 1, 0)


def left(s):
    out = []
    for (r, a, _, px, a0), sd in zip(MEAS, side):
        e = edges_of(s, r)
        if not e: out.append(40.0); continue
        out.append((min(e, key=lambda v: abs(v - a)) - a) * px)
    return np.array(out)


def words(name, s):
    d = left(s); az, el = angles(s)
    print('%-34s azimuth %8.3f, elevation %6.3f deg: edges of the shadow in px along the circle: rms %.2f, mean %+.2f, largest %.2f; edge toward the far side (%d points) mean %+.2f, edge on the near ring (%d points) mean %+.2f' % (
        name, az, el, np.sqrt(np.mean(d * d)), d.mean(), np.abs(d).max(), (side == 0).sum(), d[side == 0].mean() if (side == 0).any() else 0, (side == 1).sum(), d[side == 1].mean() if (side == 1).any() else 0))
    return d


print('view of fit.json: lens %.4f, eye in the frame of the body %s' % (V, np.round(EYE, 4).tolist()))
print('edges read in the approved: %d points on %d circles' % (len(MEAS), len(set(MEAS[:, 0]))))
words('Sun of fit.json (the globe\'s)', SUN)
SH = np.array(SHADOW['local'], float); SH /= np.linalg.norm(SH)
words('shadow.json as it stands', SH)
a0, e0 = angles(SUN)
fit = least_squares(lambda v: left(sun_of(v[0], v[1])), [a0, e0], x_scale=[1, 1], diff_step=1e-3)
SF = sun_of(*fit.x); words('fitted to the edges of the shadow', SF)
print('   the fitted direction stands %.3f deg from the Sun of fit.json and %.3f deg from shadow.json' % (np.degrees(np.arccos(np.clip(SF @ SUN, -1, 1))), np.degrees(np.arccos(np.clip(SF @ SH, -1, 1)))))

# 2. the terminator on the globe
PTS = []
LON = np.arange(-180, 180, 0.1)
for lat in list(range(-64, -28, 4)) + list(range(8, 76, 4)):
    la = np.radians(lat)
    p = np.stack([np.cos(la) * np.cos(np.radians(LON)), np.full_like(LON, POL * np.sin(la)), np.cos(la) * np.sin(np.radians(LON))], -1)
    n = p * np.array([1, 1 / (POL * POL), 1]); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    face = ((EYE - p) * n).sum(-1) / np.linalg.norm(EYE - p, axis=-1)
    # the rings in front of the point: the ray from the lens meets the ring plane inside the rings before the globe
    d = p - EYE; t = -EYE[1] / np.where(np.abs(d[:, 1]) > 1e-9, d[:, 1], 1e-9); hit = EYE + t[:, None] * d; rr = np.hypot(hit[:, 0], hit[:, 2])
    ring = (t > 0) & (t < 1) & (rr > float(FIT['rings']['inner']) - 0.02) & (rr < float(FIT['rings']['outer']) + 0.02)
    ok = (face > 0.12) & ~ring
    if ok.sum() < 300: continue
    x, y = proj(p); L = uniform_filter1d(read(x, y), 9)
    mu = n @ SUN
    day = np.percentile(L[ok & (mu > 0.3)], 90) if (ok & (mu > 0.3)).sum() > 50 else 0
    if day < 0.05: continue
    for share in (0.2,):
        t0 = share * day; w = ok & (np.abs(mu) < 0.45)
        idx = np.nonzero(w)[0]
        if len(idx) < 50: continue
        sg = np.sign(L[idx] - t0); k = np.nonzero((sg[1:] * sg[:-1] < 0) & (np.diff(idx) == 1))[0]
        if not len(k) == 1: continue
        i = idx[k[0]]; f = (L[i] - t0) / (L[i] - L[i + 1]); PTS.append(n[i] + f * (n[i + 1] - n[i]))
PTS = np.array(PTS); PTS /= np.linalg.norm(PTS, axis=1, keepdims=True)
print('terminator: %d circles of latitude read (light at a fifth of the day\'s most)' % len(PTS))
if len(PTS) >= 8:
    def small(v): return PTS @ sun_of(v[0], v[1]) - v[2]
    f2 = least_squares(small, [a0, e0, 0.1])
    ST = sun_of(f2.x[0], f2.x[1]); r2 = small(f2.x)
    words('fitted to the terminator', ST)
    print('   cosine of the Sun on that line %.4f; the points lie off the small circle by %.2f deg rms; they lie off the circle of the Sun of fit.json (its own best cosine) by %.2f deg rms' % (
        f2.x[2], np.degrees(np.sqrt(np.mean(r2 * r2))), np.degrees(np.std(PTS @ SUN))))
    print('   the Sun by the terminator stands %.3f deg from the Sun of fit.json and %.3f deg from the Sun by the shadow' % (np.degrees(np.arccos(np.clip(ST @ SUN, -1, 1))), np.degrees(np.arccos(np.clip(ST @ SF, -1, 1)))))
if len(sys.argv) > 1:
    pic = im.resize((1920, 1080), Image.LANCZOS); dr = ImageDraw.Draw(pic)
    for r, a, _, px, a0 in MEAS:
        x, y = proj(np.array([r * np.cos(np.radians(a)), 0, r * np.sin(np.radians(a))])); dr.ellipse((x - 3, y - 3, x + 3, y + 3), outline=(255, 255, 0))
    for s, col in ((SUN, (0, 255, 255)), (SH, (255, 0, 255)), (SF, (0, 255, 0))):
        for r in RADII:
            for a in edges_of(s, r):
                x, y = proj(np.array([r * np.cos(np.radians(a)), 0, r * np.sin(np.radians(a))]))
                if 0 < x < 1920 and 0 < y < 1080: dr.point((float(x), float(y)), fill=col); dr.point((float(x) + 1, float(y)), fill=col)
    pic.crop((1080, 560, 1920, 1080)).save(sys.argv[1], quality=92)
    print('picture: %s (x 1080 to 1920, y 560 to 1080; yellow the edges read, cyan the Sun of fit.json, magenta shadow.json, green the fit)' % sys.argv[1])
