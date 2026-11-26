# ring_where.py LENS LABEL=IMG...: one frame (FRAME in the environment, 3465 if not given), the outer edge of the rings, the
# outer edge of the B ring and the inner edge of the B ring (ONLY in the environment picks one by the start of its name) by azimuth: the
# radius at which each picture has its steepest fall (rise for an inner edge) of luminance along the radial line of the
# ring plane at that azimuth (through the frame's own lens), and where that lies on screen. Px are screen px along the
# radial line at that azimuth, positive = further from Saturn than the true circle.
import sys, json, os, numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, gaussian_filter1d
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..')); sys.path.insert(0, HERE)
import ring_edges as e4
FRAME = os.environ.get('FRAME', '3465')
L = json.load(open(sys.argv[1])); s = L['frames'][FRAME]; pol = L['polar']; sun = np.array(L['sunL']); sun /= np.linalg.norm(sun)
items = [a.split('=', 1) for a in sys.argv[2:]]
lum = {}
for lab, p in items:
    im = Image.open(p).convert('RGB')
    if not (im.size == (1920, 1080)): im = im.resize((1920, 1080), Image.LANCZOS)
    lum[lab] = np.asarray(im, np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
e = np.array(s['eye'])
EDGES = [('outer edge', 2.3389, 2.20, 2.48, -1), ('B outer edge', 1.9545, 1.86, 2.05, -1), ('B inner edge', 1.5237, 1.44, 1.62, +1)]
if os.environ.get('ONLY'): EDGES = [e for e in EDGES if e[0].startswith(os.environ['ONLY'])]
for name, rt, r0, r1, sign in EDGES:
    print('== %s, true radius %.4f' % (name, rt))
    print('azimuth  screen x, y of the true circle   px per 0.01 radii   ' + '   '.join('%s: px off the true circle' % lab for lab, _ in items))
    for az in range(-180, 180, 10):
        rr = np.arange(r0, r1, 0.0005); pts = e4.ring_pt(np.full(len(rr), az), rr)
        x, y = e4.proj(s, pts)
        if x.min() < 2 or x.max() > 1917 or y.min() < 2 or y.max() > 1077: continue
        # hidden by the globe, or in the globe's shadow: not read
        d = pts - e; hid = e4.blocked(np.tile(e, (len(pts), 1)), d, pol); hidden = hid[0] & (hid[1] < hid[2])
        shade = e4.blocked(pts, np.tile(sun, (len(pts), 1)), pol)[0]
        if hidden.any() or shade.any(): continue
        xt, yt = e4.proj(s, e4.ring_pt(az, rt)); x2, y2 = e4.proj(s, e4.ring_pt(az, rt + 0.01)); ppr = float(np.hypot(x2 - xt, y2 - yt))
        out = []
        for lab, _ in items:
            v = map_coordinates(lum[lab], [y - 0.5, x - 0.5], order=1)
            g = gaussian_filter1d(v, 3.0 / (ppr * 0.05)) if ppr > 0 else v   # a blur of 3 px along the line
            dv = np.gradient(g) * sign
            k = int(np.argmax(dv)); out.append((rr[k] - rt) * 100 * ppr)
        print('%+5d    %7.1f, %6.1f                    %5.2f            ' % (az, xt, yt, ppr) + '   '.join('%+7.2f' % o for o in out))
