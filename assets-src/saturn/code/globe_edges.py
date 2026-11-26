# globe_edges.py LENS.json A B STEP SRC [OUT.json]: by film frame, two readings of the globe through that frame's own lens.
#   LIMB: on rays of the screen from the disc's middle, every 3 degrees round it, the place of the steepest fall of
#   luma against the outline a true spheroid gives (equator 1, pole as fit.json): px outward. Read where the limb is lit
#   (luma inside over 40), not where the rings cross it. shape = the reading less its median over the frame.
#   BANDS: the picture laid back on the spheroid (eta = height over the equator by the polar radius, the longitude from
#   the lens's meridian). North of the ring plane only (no ring shadow there), day side, emission cosine over 0.15. By
#   sector of longitude (every 10 degrees) the profile of luma by eta; the shift in eta that lays a sector on the middle
#   of all sectors, in px on screen: 0 where the bands sit on their latitudes from the middle of the disc to the limb.
import sys, json, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ring_edges as e4
def rays(s, xs, ys):
    th = np.tan(np.radians(s['vfov']) / 2)
    d = np.stack([((xs - 960) / 540) * th, -((ys - 540) / 540) * th, -np.ones(np.shape(xs))], -1)
    return e4.rotq(s['q'], d.reshape(-1, 3))
def hit(e, d, pol):
    sc = np.array([1, 1 / pol, 1]); oo = e * sc; dd = d * sc; A = (dd * dd).sum(-1); B = (dd * oo).sum(-1); C = (oo * oo).sum(-1) - 1
    disc = B * B - A * C; t = (-B - np.sqrt(np.maximum(disc, 0))) / A
    return (disc > 0) & (t > 0), t
def read(s, pol, sun, file):
    im = Image.open(file).convert('RGB')
    if not (im.size == (1920, 1080)): im = im.resize((1920, 1080), Image.LANCZOS)
    lum = np.asarray(im, np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    e = np.array(s['eye'])
    cx, cy = e4.proj(s, np.zeros((1, 3))); cx = float(cx[0]); cy = float(cy[0])
    out = {'limb': [], 'bands': []}
    # the limb
    for ang in range(0, 360, 3):
        ca, sa = np.cos(np.radians(ang)), np.sin(np.radians(ang))
        lo, hi = 0.0, 2500.0
        for _ in range(40):
            m = (lo + hi) / 2; h, _t = hit(e[None, :], rays(s, np.array([cx + m * ca]), np.array([cy + m * sa])), pol)
            if h[0]: lo = m
            else: hi = m
        rho = lo; x0, y0 = cx + rho * ca, cy + rho * sa
        if not (30 < x0 < 1890 and 30 < y0 < 1050): continue
        t = np.arange(-14, 14.01, 0.5); px = x0 + t * ca; py = y0 + t * sa
        xi = np.clip(px, 0, 1918.999); yi = np.clip(py, 0, 1078.999); x1 = xi.astype(int); y1 = yi.astype(int); fx = xi - x1; fy = yi - y1
        v = lum[y1, x1] * (1 - fx) * (1 - fy) + lum[y1, x1 + 1] * fx * (1 - fy) + lum[y1 + 1, x1] * (1 - fx) * fy + lum[y1 + 1, x1 + 1] * fx * fy
        if v[:8].mean() < 40 or v[-8:].mean() > 0.5 * v[:8].mean(): continue      # the limb is dark here, or something lies beyond it
        k = np.arange(-4, 5); g = np.exp(-0.5 * (k / 1.5) ** 2); g /= g.sum()
        gr = -np.gradient(np.convolve(np.pad(v, 4, mode='edge'), g, mode='valid')); i = int(gr[2:-2].argmax()) + 2
        den = gr[i - 1] - 2 * gr[i] + gr[i + 1]; off = 0.5 * (gr[i - 1] - gr[i + 1]) / den if den < 0 else 0.0
        out['limb'].append((ang, round(float(t[i] + off * 0.5), 2), round(float(rho), 1)))
    # the bands
    ys, xs = np.mgrid[0:1080, 0:1920]; d = rays(s, xs + 0.5, ys + 0.5); h, t = hit(e[None, :], d, pol)
    idx = np.flatnonzero(h); P = e + d[idx] * t[idx, None]; L = lum.reshape(-1)[idx]
    n = P * np.array([1, 1 / (pol * pol), 1]); n /= np.linalg.norm(n, axis=-1)[:, None]
    mu = -(n * (d[idx] / np.linalg.norm(d[idx], axis=-1)[:, None])).sum(-1); ndl = (n * sun).sum(-1)
    eta = P[:, 1] / pol; lon = np.degrees(np.arctan2(P[:, 2], P[:, 0])); lon0 = np.degrees(np.arctan2(e[2], e[0])); rel = ((lon - lon0 + 180) % 360) - 180
    with np.errstate(divide='ignore', invalid='ignore'):
        tp = np.where(np.abs(d[idx, 1]) > 1e-9, -e[1] / d[idx, 1], -1.0)
    rr = np.hypot(e[0] + d[idx, 0] * tp, e[2] + d[idx, 2] * tp); ringfront = (tp > 0) & (tp < t[idx]) & (rr > 1.2) & (rr < 2.45)
    ok = (eta > 0.06) & (eta < 0.94) & (mu > 0.15) & (ndl > 0.2) & ~ringfront
    grid = np.arange(0.08, 0.92001, 0.002); n0 = 20; secs = []
    for a in range(-90, 91, 10):
        m = ok & (np.abs(rel - a) < 5)
        if m.sum() < 2000: continue
        bi = np.clip(((eta[m] - grid[0]) / 0.002 + 0.5).astype(int), 0, len(grid) - 1)
        cnt = np.bincount(bi, minlength=len(grid)); sm = np.bincount(bi, weights=L[m], minlength=len(grid)); good = cnt > 3
        if good.sum() < 0.6 * len(grid): continue
        lo_i, hi_i = np.flatnonzero(good)[[0, -1]]
        prof = np.interp(grid, grid[good], sm[good] / cnt[good])
        # px per unit of eta at this sector, at its middle
        j = np.flatnonzero(m)[np.argsort(np.abs(eta[m] - np.median(eta[m])))[:50]]
        Pm = P[j].mean(0); lat_e = Pm[1] / pol; lonm = np.arctan2(Pm[2], Pm[0])
        def pt(x): c = np.sqrt(max(1 - x * x, 0)); return np.array([[c * np.cos(lonm), x * pol, c * np.sin(lonm)]])
        xa, ya = e4.proj(s, pt(lat_e)); xb, yb = e4.proj(s, pt(lat_e + 0.01)); ppe = float(np.hypot(xb - xa, yb - ya)[0]) / 0.01
        secs.append((a, ppe, prof, lo_i, hi_i, float(np.median(mu[m]))))
    if len(secs) >= 3:
        lo_i = max(x[3] for x in secs) + n0; hi_i = min(x[4] for x in secs) - n0
        if hi_i - lo_i > 60:
            def flat(p):
                # the light falls off toward the night and the limb: the log of the profile less its own wide mean keeps the bands alone
                q = np.log(np.maximum(p, 1.0)); k = np.arange(-90, 91); g = np.exp(-0.5 * (k / 30.0) ** 2); g /= g.sum()
                return q - np.convolve(np.pad(q, 90, mode='edge'), g, mode='valid')
            G = np.array([e4.slope(flat(x[2]), 3.0) for x in secs]); shifts = np.zeros(len(secs)); peak = np.zeros(len(secs))
            for it in range(3):
                al = np.array([np.interp(grid, grid - shifts[i] * 0.002, G[i]) for i in range(len(secs))]); mid = np.median(al, 0)
                for i in range(len(secs)):
                    cs = np.array([e4.ncc(G[i][lo_i + k: hi_i + k], mid[lo_i:hi_i]) for k in range(-n0, n0 + 1)]); j = int(cs.argmax()); off = 0.0
                    if 0 < j < len(cs) - 1:
                        den = cs[j - 1] - 2 * cs[j] + cs[j + 1]; off = 0.5 * (cs[j - 1] - cs[j + 1]) / den if den < 0 else 0.0
                    shifts[i] = j - n0 + off; peak[i] = cs[j]
                g2 = peak >= 0.5
                if g2.sum() >= 3: shifts -= np.median(shifts[g2])
            out['bands'] = [(secs[i][0], round(float(shifts[i] * 0.002 * secs[i][1]), 2), round(float(peak[i]), 2), round(secs[i][5], 2)) for i in range(len(secs)) if peak[i] >= 0.5]
    return out
if __name__ == '__main__':
    L = json.load(open(sys.argv[1])); pol = L['polar']; F = L['frames']; sun = np.array(L['sunL']); sun = sun / np.linalg.norm(sun)
    a, b, st = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); src = sys.argv[5]; rows = {}
    print('frame | limb: rays, median px out, shape: half of the rays within px, nine in ten within px | bands: sectors, most px (longitude from the lens, its emission cosine)')
    for f in range(a, b + 1, st):
        file = (src % f) if '%' in src else os.path.join(src, 'f%04d.jpg' % f); s = F.get(str(f))
        if s is None or 'none' in s or not os.path.exists(file): continue
        rd = read(s, pol, sun, file); rows[f] = rd; line = '%d' % f
        if rd['limb']:
            v = np.array([x[1] for x in rd['limb']]); md = float(np.median(v)); dv = np.abs(v - md)
            line += ' | %3d  %+5.2f  %5.2f  %5.2f' % (len(v), md, np.percentile(dv, 50), np.percentile(dv, 90))
        else: line += ' |   0      .      .       '
        if rd['bands']:
            v = np.array([x[1] for x in rd['bands']]); j = int(np.abs(v).argmax()); line += ' | %2d  %+5.2f (%4d, %.2f)' % (len(v), v[j], rd['bands'][j][0], rd['bands'][j][3])
        else: line += ' |  0      .'
        print(line)
    if len(sys.argv) > 6: json.dump(rows, open(sys.argv[6], 'w'))
