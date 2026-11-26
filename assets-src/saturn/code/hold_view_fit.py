"""hold_view_fit.py OUT_PREFIX [lens=LENS.json] [free=0,1,2,3,4,5] [scan=1] [wl=1]: the view of the hold solved against
the approved hero (references/approved/saturn-hero.png, read at 1920 x 1080).
The rings are one rigid body: true circles about the globe's axis. This reads where the ring edges (ring_edges.py, in
sectors of 5 degrees: the C ring's inner edge, the B ring's inner edge, the B ring's outer edge at the Cassini division,
the rings' outer edge) and the lit limb (globe_edges.py) lie in the approved hero, as points of the picture, and solves
the view that lays the true circles of the body on those edge points and the true spheroid's outline on the limb.
Free values, in the frame of src/stops/saturn/fit.json (the camera looks down its own -z, the globe at the origin):
  0, 1, 2  the camera's place (x and y: where it looks; z: its distance)
  3        the lens (vertical field of view, degrees)
  4, 5     the tilt of the globe's axis toward the camera (the height over the ring plane) and sideways (the roll)
  6        the turn about the globe's own axis (not seen by circles or by the outline: left at 0 unless asked)
  7 to 10  the radius on the body of each of the four edges, less its radius today (C inner, B inner, B outer, outer)
It prints the solved view in the words of fit.json, what is left in px by edge and by azimuth, a free ellipse through
each edge's points beside the ellipse the solved circle draws, and writes OUT_PREFIX-full.jpg and OUT_PREFIX-parts.jpg
(the approved with the circles of today's view, top or left, and of the solved view) and OUT_PREFIX.json (the two
views as the eleven values above, and the points read: edge, azimuth, x, y; limb: screen angle, x, y).
More: scan=1 holds the lens at steps and solves the rest; wl=W weights the limb; est=1 makes the estimate (the approved
laid straight on the rigid body, OUT_PREFIX-laid-*.jpg) and its plain number; best=1 searches the view of least plain;
frame=LABEL:PNG,... splits a real frame's plain number the same way. It writes nothing into the film."""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.optimize import least_squares
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..')); sys.path.insert(0, HERE)
os.environ.setdefault('SECTOR_STEP', '5'); os.environ.setdefault('R_LOW', '1.05')
import ring_edges as e4
import globe_edges as ge
ARG = dict(a.split('=', 1) for a in sys.argv[2:]); OUT = sys.argv[1]
HERO = os.path.join(ROOT, 'references', 'approved', 'saturn-hero.png')
FIT = json.load(open(os.path.join(ROOT, 'src', 'stops', 'saturn', 'fit.json')))
G0 = np.array(FIT['globe']['quaternion'], float); C0 = np.array(FIT['camera']['position'], float); V0 = float(FIT['vfovDeg'])
POL = float(FIT['globe']['scale'][1])
e4.ZONES = [('C inner', +1, 1.17, 1.33), ('B inner', +1, 1.40, 1.66), ('B outer', -1, 1.84, 2.06), ('outer', -1, 2.20, 2.46)]
REF = np.array([float(FIT['rings']['inner']), 1.5237, 1.9545, 2.3389])
COL = [(255, 160, 0), (0, 255, 0), (255, 0, 255), (0, 255, 255)]
NP = 11


def qmul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return np.array([aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz])


def qconj(q):
    return np.array([-q[0], -q[1], -q[2], q[3]])


N0 = e4.rotq(G0, np.array([0.0, 1.0, 0.0]))
E1 = np.array([0.0, 0.0, 1.0]) - N0[2] * N0; E1 /= np.linalg.norm(E1); E2 = np.cross(N0, E1)
SUN = e4.rotq(qconj(G0), np.array(FIT['sunDir'], float)); SUN /= np.linalg.norm(SUN)
if 'lens' in ARG:
    SUN = np.array(json.load(open(ARG['lens']))['sunL'], float); SUN /= np.linalg.norm(SUN)


def view(x):
    c = C0 + np.array(x[0:3]); v = V0 + x[3]
    n = N0 + x[4] * E1 + x[5] * E2; n /= np.linalg.norm(n)
    ax = np.cross(N0, n); dq = np.array([ax[0], ax[1], ax[2], 1 + float(N0 @ n)]); dq /= np.linalg.norm(dq)
    g = qmul(dq, G0)
    if abs(x[6]) > 0:
        g = qmul(np.array([n[0] * np.sin(x[6] / 2), n[1] * np.sin(x[6] / 2), n[2] * np.sin(x[6] / 2), np.cos(x[6] / 2)]), g)
    return {'eye': e4.rotq(qconj(g), c), 'q': qconj(g), 'vfov': v}, c, g, v, n


def ring_res(s, P, R):
    th = np.tan(np.radians(s['vfov']) / 2)
    d = np.stack([((P[:, 0] - 960) / 540) * th, -((P[:, 1] - 540) / 540) * th, -np.ones(len(P))], -1)
    d = e4.rotq(s['q'], d); e = np.array(s['eye'])
    with np.errstate(divide='ignore', invalid='ignore'):
        t = -e[1] / d[:, 1]
    bad = ~np.isfinite(t) | (t <= 0); t = np.where(bad, 1.0, t)
    p = e + d * t[:, None]; r = np.hypot(p[:, 0], p[:, 2]); az = np.degrees(np.arctan2(p[:, 2], p[:, 0]))
    x0, y0 = e4.proj(s, e4.ring_pt(az, R)); x1, y1 = e4.proj(s, e4.ring_pt(az + 0.05, R))
    tx, ty = x1 - x0, y1 - y0; tn = np.maximum(np.hypot(tx, ty), 1e-9); tx, ty = tx / tn, ty / tn
    ox, oy = P[:, 0] - x0, P[:, 1] - y0
    res = np.sign(r - R) * np.abs(ox * ty - oy * tx)
    return np.where(bad, 1000.0, res), az


def limb_res(s, P):
    e = np.array(s['eye']); cx, cy = e4.proj(s, np.zeros((1, 3))); cx = float(cx[0]); cy = float(cy[0])
    dx, dy = P[:, 0] - cx, P[:, 1] - cy; dist = np.hypot(dx, dy); ca, sa = dx / dist, dy / dist
    lo = np.zeros(len(P)); hi = np.full(len(P), 2500.0)
    for _ in range(40):
        m = (lo + hi) / 2; h, _t = ge.hit(e[None, :], ge.rays(s, cx + m * ca, cy + m * sa), POL)
        lo = np.where(h, m, lo); hi = np.where(h, hi, m)
    return dist - lo


def read_hero():
    s = view(np.zeros(NP))[0]
    out = e4.read(s, POL, SUN, HERO); pts = []
    for zi, (name, sign, lo, hi) in enumerate(e4.ZONES):
        v = out.get(name)
        if not v or not v['by'] or not np.isfinite(v['radius']):
            print('edge', name, ': not read'); continue
        r0 = (lo + hi) / 2
        for a, spx, peak in v['by']:
            x0, y0 = e4.proj(s, e4.ring_pt([float(a)], r0)); x1, y1 = e4.proj(s, e4.ring_pt([float(a)], r0 + 0.01))
            ppr = float(np.hypot(x1 - x0, y1 - y0)[0]) / 0.01
            x, y = e4.proj(s, e4.ring_pt([float(a)], v['radius'] + spx / ppr))
            if 0 <= x[0] <= 1920 and 0 <= y[0] <= 1080: pts.append((zi, float(a), float(x[0]), float(y[0])))
        print('edge %-8s middle radius %.4f (body %.4f), sectors read %d, dropped %s' % (name, v['radius'], REF[zi], len(v['by']), v.get('dropped')))
    lm = ge.read(s, POL, SUN, HERO)['limb']
    cx, cy = e4.proj(s, np.zeros((1, 3))); cx = float(cx[0]); cy = float(cy[0])
    lp = [(float(ang), cx + (rho + off) * np.cos(np.radians(ang)), cy + (rho + off) * np.sin(np.radians(ang))) for ang, off, rho in lm]
    print('limb: %d points read, screen angles %s' % (len(lp), ' '.join('%d' % a[0] for a in lp)))
    return np.array(pts), np.array(lp)


PTS, LIMB = read_hero()
K = PTS[:, 0].astype(int); P = PTS[:, 2:4]; LP = LIMB[:, 1:3]
WL = float(ARG.get('wl', '1'))
SCALE = np.array([0.05, 0.05, 0.5, 2.0, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02])


def resid(x, free, base):
    full = base.copy(); full[free] = x
    s = view(full)[0]
    return np.concatenate([ring_res(s, P, REF[K] + full[7 + K])[0], WL * limb_res(s, LP)])


def solve(free, base=None):
    base = np.zeros(NP) if base is None else base.copy()
    free = np.array(free, int)
    r = least_squares(resid, base[free], args=(free, base), x_scale=SCALE[free], method='trf', loss='soft_l1', f_scale=4.0, max_nfev=400)
    full = base.copy(); full[free] = r.x
    return full


def stats(full):
    s = view(full)[0]; rr, az = ring_res(s, P, REF[K] + full[7 + K]); lr = limb_res(s, LP)
    row = []
    for zi in range(4):
        m = K == zi
        row.append((float(np.sqrt((rr[m] ** 2).mean())), float(np.abs(rr[m]).max()), int(m.sum())) if m.any() else (float('nan'), float('nan'), 0))
    row.append((float(np.sqrt((lr ** 2).mean())), float(np.abs(lr).max()), len(lr)))
    allr = np.concatenate([rr, lr])
    return row, float(np.sqrt((allr ** 2).mean())), rr, az, lr


def words(full, label):
    s, c, g, v, n = view(full); e = np.array(s['eye']); cx, cy = e4.proj(s, np.zeros((1, 3)))
    row, rms, rr, az, lr = stats(full)
    th = np.tan(np.radians(v) / 2); disc = 540 / th / np.sqrt(max(np.linalg.norm(e) ** 2 - 1, 1e-9))
    print('%s: distance %.4f radii, lens %.3f degrees, height over the ring plane %.3f degrees (eye y %.4f), roll of the axis %.3f degrees, globe centre at %.1f, %.1f px, disc about %.1f px' % (
        label, np.linalg.norm(e), v, np.degrees(np.arcsin(e[1] / np.linalg.norm(e))), e[1], np.degrees(np.arctan2(n[0], n[1])), float(cx[0]), float(cy[0]), disc))
    print('   camera.position %s vfovDeg %.4f globe.quaternion %s rings.normal %s' % (np.round(c, 6).tolist(), v, np.round(g, 7).tolist(), np.round(n, 6).tolist()))
    print('   radii of the edges on the body: ' + ', '.join('%s %.4f (%+.4f)' % (e4.ZONES[i][0], REF[i] + full[7 + i], full[7 + i]) for i in range(4)))
    print('   left in px, rms and largest (points): ' + '; '.join('%s %.2f, %.2f (%d)' % (nm, a, b, k) for nm, (a, b, k) in zip([z[0] for z in e4.ZONES] + ['limb'], row)) + '; all %.2f' % rms)
    return row, rms


def by_azimuth(full, label):
    row, rms, rr, az, lr = stats(full)
    print(label + ', px outward of the true circle by azimuth:')
    for zi in range(4):
        m = np.flatnonzero(K == zi)
        if len(m): print('   %-8s ' % e4.ZONES[zi][0] + ' '.join('%d:%+.1f' % (round(PTS[i, 1]), rr[i]) for i in m))
    print('   limb (screen angle)  ' + ' '.join('%d:%+.1f' % (LIMB[i, 0], lr[i]) for i in range(len(lr))))


def conic(x, y):
    mx, my = x.mean(), y.mean(); sc = max(x.std(), y.std()); u, w = (x - mx) / sc, (y - my) / sc
    D = np.stack([u * u, u * w, w * w, u, w, np.ones(len(u))], 1)
    _, _, vt = np.linalg.svd(D); a, b, c, d, e, f = vt[-1]
    if b * b - 4 * a * c >= 0: return None
    den = b * b - 4 * a * c; x0 = (2 * c * d - b * e) / den; y0 = (2 * a * e - b * d) / den
    f0 = a * x0 * x0 + b * x0 * y0 + c * y0 * y0 + d * x0 + e * y0 + f
    M = np.array([[a, b / 2], [b / 2, c]]) / (-f0); ev, evec = np.linalg.eigh(M)
    if ev.min() <= 0: return None
    ax = 1 / np.sqrt(ev); ang = np.degrees(np.arctan2(evec[1, 0], evec[0, 0]))
    g = D @ vt[-1]; gx = 2 * a * u + b * w + d; gy = b * u + 2 * c * w + e
    dist = np.abs(g) / np.maximum(np.hypot(gx, gy), 1e-12) * sc
    return x0 * sc + mx, y0 * sc + my, ax[0] * sc, ax[1] * sc, ((ang + 90) % 180) - 90, float(np.sqrt((dist ** 2).mean())), float(dist.max())


def ellipses(full, label):
    s = view(full)[0]; azs = np.arange(-180, 180, 1.0)
    print(label + ': the free ellipse through the hero edge points beside the ellipse of the true circle (centre x, y, half axes, angle of the long axis)')
    for zi in range(4):
        m = K == zi
        if m.sum() < 6: continue
        h = conic(P[m, 0], P[m, 1]); x, y = e4.proj(s, e4.ring_pt(azs, np.full(len(azs), REF[zi] + full[7 + zi]))); c = conic(x, y)
        if h is None or c is None: print('   %-8s no ellipse' % e4.ZONES[zi][0]); continue
        print('   %-8s hero %.1f, %.1f; %.1f, %.1f; %.2f deg (points off it: rms %.2f, most %.2f px) | circle %.1f, %.1f; %.1f, %.1f; %.2f deg' % ((e4.ZONES[zi][0],) + h + c[:5]))


def draw(im, full, dash=True):
    s = view(full)[0]; d = ImageDraw.Draw(im); az = np.arange(-180, 180.01, 0.25)
    for zi in range(4):
        x, y = e4.proj(s, e4.ring_pt(az, np.full(len(az), REF[zi] + full[7 + zi]))); pts = list(zip(x.tolist(), y.tolist()))
        for i in range(len(pts) - 1):
            if (not dash) or i % 8 < 4: d.line([pts[i], pts[i + 1]], fill=COL[zi], width=1)
    e = np.array(s['eye']); cx, cy = e4.proj(s, np.zeros((1, 3))); cx = float(cx[0]); cy = float(cy[0]); ang = np.radians(np.arange(0, 360.01, 0.5))
    lo = np.zeros(len(ang)); hi = np.full(len(ang), 2500.0)
    for _ in range(40):
        m = (lo + hi) / 2; h, _t = ge.hit(e[None, :], ge.rays(s, cx + m * np.cos(ang), cy + m * np.sin(ang)), POL)
        lo = np.where(h, m, lo); hi = np.where(h, hi, m)
    pts = list(zip((cx + lo * np.cos(ang)).tolist(), (cy + lo * np.sin(ang)).tolist()))
    for i in range(len(pts) - 1):
        if i % 8 < 4: d.line([pts[i], pts[i + 1]], fill=(255, 255, 0), width=1)
    for i in range(len(P)): d.ellipse([P[i, 0] - 2, P[i, 1] - 2, P[i, 0] + 2, P[i, 1] + 2], outline=(255, 0, 0))
    for i in range(len(LP)): d.ellipse([LP[i, 0] - 2, LP[i, 1] - 2, LP[i, 0] + 2, LP[i, 1] + 2], outline=(255, 0, 0))
    return im


def pictures(now, new, label_now, label_new):
    hero = Image.open(HERO).convert('RGB').resize((1920, 1080), Image.LANCZOS)
    a = draw(hero.copy(), now); b = draw(hero.copy(), new)
    ImageDraw.Draw(a).text((8, 6), label_now, fill=(255, 255, 0)); ImageDraw.Draw(b).text((8, 6), label_new, fill=(255, 255, 0))
    sh = Image.new('RGB', (1920, 2166), (40, 0, 60)); sh.paste(a, (0, 0)); sh.paste(b, (0, 1086)); sh.save(OUT + '-full.jpg', quality=90)
    boxes = [(0, 560, 940, 1080), (1380, 380, 1920, 900), (0, 60, 940, 580)]
    w = sum(2 * (x1 - x0) + 12 for x0, y0, x1, y1 in boxes[:1]); rows = []
    for x0, y0, x1, y1 in boxes:
        t = Image.new('RGB', (2 * (x1 - x0) + 6, y1 - y0), (40, 0, 60)); t.paste(a.crop((x0, y0, x1, y1)), (0, 0)); t.paste(b.crop((x0, y0, x1, y1)), (x1 - x0 + 6, 0)); rows.append(t)
    sh = Image.new('RGB', (max(t.size[0] for t in rows), sum(t.size[1] + 6 for t in rows)), (40, 0, 60)); y = 0
    for t in rows:
        sh.paste(t, (0, y)); y += t.size[1] + 6
    sh.save(OUT + '-parts.jpg', quality=92); print('pictures:', OUT + '-full.jpg', OUT + '-parts.jpg', sh.size)


def layback(s, pts):
    th = np.tan(np.radians(s['vfov']) / 2)
    d = np.stack([((pts[:, 0] - 960) / 540) * th, -((pts[:, 1] - 540) / 540) * th, -np.ones(len(pts))], -1)
    d = e4.rotq(s['q'], d); e = np.array(s['eye'])
    with np.errstate(divide='ignore', invalid='ignore'):
        t = np.where(np.abs(d[:, 1]) > 1e-9, -e[1] / d[:, 1], -1.0)
    p = e + d * t[:, None]
    return np.hypot(p[:, 0], p[:, 2]), np.degrees(np.arctan2(p[:, 2], p[:, 0])), t, d


def edge_radius(c, azdeg):
    """The distance from the globe's axis to a circle of the ring plane with its own centre (cx, cz) and radius, by azimuth."""
    u = np.stack([np.cos(np.radians(azdeg)), np.sin(np.radians(azdeg))], -1); b = u @ np.array(c[:2])
    return b + np.sqrt(np.maximum(c[2] ** 2 - (c[0] ** 2 + c[1] ** 2) + b * b, 0))


def circ_res(s, pts, c):
    """Px by which points of the picture leave a circle of the ring plane with its own centre and radius (c: cx, cz,
    radius, and if given the tilt of its plane about the x and the z axis in degrees, the plane through the centre of
    the globe), across the edge, outward positive."""
    e = np.array(s['eye']); th = np.tan(np.radians(s['vfov']) / 2)
    d = np.stack([((pts[:, 0] - 960) / 540) * th, -((pts[:, 1] - 540) / 540) * th, -np.ones(len(pts))], -1); d = e4.rotq(s['q'], d)
    tx, tz = (np.radians(c[3]), np.radians(c[4])) if len(c) > 3 else (0.0, 0.0)
    n = np.array([np.sin(tz), 1.0, -np.sin(tx)]); n /= np.linalg.norm(n)
    u = np.array([1.0, 0, 0]) - n[0] * n; u /= np.linalg.norm(u); v = np.cross(u, n); v = v if v[2] > 0 else -v
    t = -(e @ n) / (d @ n); p = e + d * t[:, None]; qx, qz = p @ u - c[0], p @ v - c[1]; ph = np.arctan2(qz, qx); rad = np.hypot(qx, qz)
    def at(phi): return e4.proj(s, (c[0] + c[2] * np.cos(phi))[:, None] * u + (c[1] + c[2] * np.sin(phi))[:, None] * v)
    x0, y0 = at(ph); x1, y1 = at(ph + 1e-3); ax, ay = x1 - x0, y1 - y0; an = np.maximum(np.hypot(ax, ay), 1e-9)
    return np.sign(rad - c[2]) * np.abs((pts[:, 0] - x0) * ay / an - (pts[:, 1] - y0) * ax / an)


def third_kind(now):
    """Each ring edge a circle of its own (its own centre in the ring plane and its own radius; then also its own
    plane), solved to the approved's edge points through the view of today. Prints what is left and the estimate."""
    s = view(now)[0]; H = np.asarray(Image.open(HERO).convert('RGB').resize((1920, 1080), Image.LANCZOS)).astype(np.float32)
    circ = {}; tilt = {}; print('THIRD KIND, the view of today, each edge a circle of its own in the ring plane (centre x, z and radius, in radii), and with its own plane:')
    for zi in range(4):
        m = K == zi
        if m.sum() < 6: continue
        r0 = REF[zi] + now[7 + zi]
        a = least_squares(lambda c: circ_res(s, P[m], c), [0.0, 0.0, r0], loss='soft_l1', f_scale=4.0, x_scale=[0.02, 0.02, 0.02]).x
        b = least_squares(lambda c: circ_res(s, P[m], c), [a[0], a[1], a[2], 0.0, 0.0], loss='soft_l1', f_scale=4.0, x_scale=[0.02, 0.02, 0.02, 0.3, 0.3]).x
        ra = circ_res(s, P[m], a); rb = circ_res(s, P[m], b); z0 = circ_res(s, P[m], [0.0, 0.0, r0]); circ[zi] = a; tilt[zi] = b
        print('   %-8s centre %+.4f, %+.4f (%.4f off the axis toward azimuth %.0f), radius %.4f (body %.4f): left rms %.2f, largest %.2f px (about the axis: %.2f, %.2f) | own plane too: centre %+.4f, %+.4f, radius %.4f, tilt %+.3f, %+.3f degrees: left %.2f, %.2f' % (
            e4.ZONES[zi][0], a[0], a[1], np.hypot(a[0], a[1]), np.degrees(np.arctan2(a[1], a[0])), a[2], r0, np.sqrt((ra ** 2).mean()), np.abs(ra).max(), np.sqrt((z0 ** 2).mean()), np.abs(z0).max(),
            b[0], b[1], b[2], b[3], b[4], np.sqrt((rb ** 2).mean()), np.abs(rb).max()))
    allr = np.concatenate([circ_res(s, P[K == zi], circ[zi]) for zi in circ]); print('   all ring points: rms %.2f px in the ring plane; %.2f with own planes' % (np.sqrt((allr ** 2).mean()), np.sqrt((np.concatenate([circ_res(s, P[K == zi], tilt[zi]) for zi in tilt]) ** 2).mean())))
    g = np.arange(0.0, 360.0, 30.0)
    for zi in circ: print('   %-8s the edge off the axis by azimuth (0, 30 ... 330): ' % e4.ZONES[zi][0] + ' '.join('%.3f' % v for v in edge_radius(circ[zi], g)))
    zs = tuple(z for z in (0, 2, 3) if z in circ)
    out, ring, glob, lost = laid_straight(now, H, zones=zs, circ=circ); d = np.abs(out - H)
    print('ESTIMATE, the approved laid on the third kind of body (circles of their own in the ring plane) through the view of today: plain %.4f (the ring pixels give %.4f of it, the limb zone %.4f)' % (d.mean(), d[ring].sum() / d.size, d[glob].sum() / d.size))
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(OUT + '-laid-third.jpg', quality=92)
    json.dump({str(k): v.tolist() for k, v in circ.items()}, open(OUT + '-third.json', 'w'))
    return circ


def laid_straight(full, H, zones=(0, 2, 3), step=1, circ=None):
    """An estimate, not a frame of the film: the approved as a rigid body would show it through a view. Each pixel of
    the ring plane takes the approved's pixel of the same azimuth at the radius moved by what the approved's edges
    leave their true circles there (between the edges by a straight line in radius, held beyond them, to nothing at
    2.75 radii); the limb zone of the globe (0.6 to 1.15 of the outline's radius) takes the approved's pixel moved along
    the screen radius by what the approved's limb leaves the true outline. The rest is the approved itself."""
    from scipy.ndimage import map_coordinates
    s = view(full)[0]; e = np.array(s['eye'])
    ys, xs = np.mgrid[0:1080:step, 0:1920:step]; shape = xs.shape; pix = np.stack([xs.reshape(-1) + 0.5, ys.reshape(-1) + 0.5], 1)
    r, az, tp, d = layback(s, pix)
    hitg, tg = ge.hit(e[None, :], d, POL)
    ring = (tp > 0) & (r > 1.0) & (r < 2.75) & (~hitg | ((tp < tg) & (r > 1.45)))
    g = np.arange(0.0, 360.0, 1.0); knots = []; tab = []
    pr, pa, _t, _d = layback(s, P)
    for zi in zones:
        m = K == zi
        if m.sum() < 3: continue
        body = np.full(len(g), REF[zi] + full[7 + zi]) if circ is None else edge_radius(circ[zi], g)   # the body's edge by azimuth
        o = np.argsort(pa[m] % 360); knots.append(body); tab.append(np.interp(g, (pa[m] % 360)[o], (pr[m] - np.interp(pa[m] % 360, g, body, period=360))[o], period=360))
    knots = np.array(knots); tab = np.array(tab)
    i = np.flatnonzero(ring); a = az[i] % 360; a0 = np.floor(a).astype(int) % 360; a1 = (a0 + 1) % 360; fa = a - np.floor(a)
    wk = tab[:, a0] * (1 - fa) + tab[:, a1] * fa                      # by knot, at each pixel's azimuth
    kn = knots[:, a0] * (1 - fa) + knots[:, a1] * fa
    rr = r[i]; w = wk[0].copy()
    for j in range(len(knots) - 1):
        f = np.clip((rr - kn[j]) / (kn[j + 1] - kn[j]), 0, 1); w = np.where(rr > kn[j], wk[j] * (1 - f) + wk[j + 1] * f, w)
    w = w * np.clip((2.75 - rr) / (2.75 - 2.45), 0, 1)
    sx, sy = e4.proj(s, e4.ring_pt(az[i], rr + w))
    srcx = pix[:, 0].copy(); srcy = pix[:, 1].copy()
    ok = (sx >= 0.5) & (sx <= 1919.5) & (sy >= 0.5) & (sy <= 1079.5)
    srcx[i[ok]] = sx[ok]; srcy[i[ok]] = sy[ok]
    # the limb zone
    cx, cy = e4.proj(s, np.zeros((1, 3))); cx = float(cx[0]); cy = float(cy[0])
    ang = np.radians(np.arange(0, 360, 0.25)); lo = np.zeros(len(ang)); hi = np.full(len(ang), 2500.0)
    for _ in range(40):
        mm = (lo + hi) / 2; h, _t2 = ge.hit(e[None, :], ge.rays(s, cx + mm * np.cos(ang), cy + mm * np.sin(ang)), POL)
        lo = np.where(h, mm, lo); hi = np.where(h, hi, mm)
    lr = limb_res(s, LP); la = np.degrees(np.arctan2(LP[:, 1] - cy, LP[:, 0] - cx)) % 360; o = np.argsort(la)
    dxp = pix[:, 0] - cx; dyp = pix[:, 1] - cy; rho = np.hypot(dxp, dyp); thp = np.degrees(np.arctan2(dyp, dxp)) % 360
    rm = np.interp(thp, np.arange(0, 360, 0.25), lo, period=360); res = np.interp(thp, la[o], lr[o], period=360)
    q = rho / rm; fq = np.clip((q - 0.6) / 0.25, 0, 1) * np.clip((1.15 - q) / 0.10, 0, 1)
    glob = (~ring) & (q < 1.15) & (q > 0.6)
    k = 1 + res / rm * fq
    srcx = np.where(glob, cx + dxp * k, srcx); srcy = np.where(glob, cy + dyp * k, srcy)
    out = np.stack([map_coordinates(H[:, :, c], [srcy - 0.5, srcx - 0.5], order=1, mode='nearest') for c in range(3)], -1).reshape(shape + (3,))
    return out, ring.reshape(shape), glob.reshape(shape), int(len(i) - ok.sum())


def least_plain(start, H, step=3, nfev=500):
    """The view (the six free values) whose laid straight picture differs least from the approved by the plain number:
    a search by the simplex from a start, on every third pixel each way."""
    from scipy.optimize import minimize
    Hs = H[::step, ::step]; free = np.arange(6)
    def cost(x):
        full = start.copy(); full[free] = start[free] + x * SCALE[free]
        s = view(full)[0]
        if s['vfov'] < 8 or s['vfov'] > 80 or np.linalg.norm(s['eye']) < 2.6: return 1e3
        return float(np.abs(laid_straight(full, H, step=step)[0] - Hs).mean())
    r = minimize(cost, np.zeros(6), method='Nelder-Mead', options={'xatol': 0.01, 'fatol': 0.002, 'maxfev': nfev, 'initial_simplex': np.vstack([np.zeros(6), 0.5 * np.eye(6)])})
    full = start.copy(); full[free] = start[free] + r.x * SCALE[free]
    return full, float(r.fun), int(r.nfev)


def estimate(now, new):
    H = np.asarray(Image.open(HERO).convert('RGB').resize((1920, 1080), Image.LANCZOS)).astype(np.float32)
    rows = []; views = [('today', now), ('solved', new)]
    if ARG.get('best') == '1':
        b, f, n = least_plain(new, H); print('the least plain by the simplex from the solved view: %.4f on every third pixel, %d pictures tried' % (f, n))
        words(b, 'LEAST PLAIN'); by_azimuth(b, 'LEAST PLAIN'); views.append(('least', b)); json.dump({'least': b.tolist()}, open(OUT + '-least.json', 'w'))
    for lab, full in views:
        out, ring, glob, lost = laid_straight(full, H)
        d = np.abs(out - H); n = d.size
        print('ESTIMATE, the approved laid straight on the rigid body through the view of %s: plain %.4f (the ring pixels give %.4f of it, their own mean %.3f, share of the frame %.4f; the limb zone gives %.4f; %d ring pixels take their source from outside the frame and are left as they are)' % (
            lab, d.mean(), d[ring].sum() / n, d[ring].mean(), ring.mean(), d[glob].sum() / n, lost))
        Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(OUT + '-laid-' + lab + '.jpg', quality=92)
        rows.append((lab, ring, d))
    if 'frame' in ARG:
        for item in ARG['frame'].split(','):
            lab, path = item.split(':', 1)
            F = np.asarray(Image.open(path).convert('RGB')).astype(np.float32); d = np.abs(F - H); ring = rows[0][1]
            print('REAL FRAME %s: plain %.4f (the ring pixels of the view of today give %.4f of it, their own mean %.3f; the rest gives %.4f)' % (lab, d.mean(), d[ring].sum() / d.size, d[ring].mean(), d[~ring].sum() / d.size))


if __name__ == '__main__':
    free = [int(v) for v in ARG.get('free', '0,1,2,3,4,5').split(',')]
    nuis = [7, 8]                                            # the two inner edges: a double step, the radius read is not the body's
    now = solve(nuis); words(now, 'TODAY (fit.json as it stands; the radii of the two inner edges as the reading gives them)'); by_azimuth(now, 'TODAY')
    new = solve(free + nuis, now); words(new, 'SOLVED (free %s)' % ','.join(str(v) for v in free)); by_azimuth(new, 'SOLVED')
    ellipses(new, 'SOLVED')
    allr = solve(free + [7, 8, 9, 10], new); words(allr, 'SOLVED, every radius free too')
    if ARG.get('scan') == '1':
        print('the lens held, the other values solved:')
        for v in (12, 16, 20, 24, 27, 30, 33, 36, 40, 46, 52):
            b = now.copy(); b[3] = v - V0; b[2] = (C0[2] * np.tan(np.radians(V0) / 2) / np.tan(np.radians(v) / 2)) - C0[2]
            x = solve([f for f in free if not f == 3] + nuis, b); row, rms, rr, az, lr = stats(x); s = view(x)[0]
            print('   lens %5.1f: distance %.3f, height %.2f deg, left rms: %s, all %.3f' % (v, np.linalg.norm(s['eye']), np.degrees(np.arcsin(s['eye'][1] / np.linalg.norm(s['eye']))), ' '.join('%.2f' % a for a, b2, k in row), rms))
    pictures(now, new, 'the approved hero, the true circles and outline through the view of today (fit.json); red rings: the edge points read', 'the approved hero, the true circles and outline through the solved view')
    json.dump({'today': now.tolist(), 'solved': new.tolist(), 'free': free, 'zones': [z[0] for z in e4.ZONES], 'radii': REF.tolist(),
               'edgePoints': [[e4.ZONES[int(p[0])][0], p[1], round(p[2], 2), round(p[3], 2)] for p in PTS.tolist()],
               'limbPoints': [[p[0], round(p[1], 2), round(p[2], 2)] for p in LIMB.tolist()]}, open(OUT + '.json', 'w'), indent=0)
    if ARG.get('est') == '1': estimate(now, new)
    if ARG.get('third') == '1': third_kind(now)
