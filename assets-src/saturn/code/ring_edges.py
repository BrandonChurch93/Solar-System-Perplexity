# ring_edges.py LENS.json REF A B STEP SRC [OUT.json]: by film frame, the px by which three edges of the rings leave true
# circles about the axis, read from the picture itself through that frame's own lens.
#   The three: the B ring's inner edge (zone 1.40 to 1.66 radii), the B ring's outer edge at the Cassini division (1.84 to
#   2.06), the rings' outer edge (2.20 to 2.46).
#   One frame: every pixel is laid back onto the ring plane (radius, azimuth). In sectors of azimuth (every 10 degrees, 3
#   to either side; not where the globe hides the plane, not where the globe's shadow lies on it, not under 300 px) the
#   mean luma by radius. SHAPE: the shift in radius that lays a sector's profile on the middle profile of all sectors of
#   that frame (the peak of the normalised correlation of the two slopes, to a part of a step by a parabola; kept if the
#   correlation is 0.6 or more), in px on screen at that azimuth. A true circle about the axis gives 0 at every azimuth.
#   SIZE: the radius of the edge on the middle profile (its steepest change), less the radius of that edge on the body
#   (REF "r1,r2,r3", or "find": the median over the frames given, printed), in px at the widest part of the ring.
# SRC: a folder of fNNNN.jpg, or a pattern with %d.
import sys, json, os, numpy as np
from PIL import Image
PLANE_H = float(os.environ.get('PLANE_H', '0'))   # a test only: the height over the ring plane at which the edges are read
ZONES = [('B inner', +1, 1.40, 1.66), ('B outer', -1, 1.84, 2.06), ('outer', -1, 2.20, 2.46)]
STEP = 0.001; REACH = 0.10
def rotq(q, v):
    u = np.array(q[:3]); t = 2 * np.cross(u, v); return v + q[3] * t + np.cross(u, t)
def proj(s, p):
    q = np.array(s['q']); qi = [-q[0], -q[1], -q[2], q[3]]
    c = rotq(qi, p - np.array(s['eye'])); th = np.tan(np.radians(s['vfov']) / 2); zz = -c[..., 2]
    return 960 + c[..., 0] / (zz * th) * 540, 540 - c[..., 1] / (zz * th) * 540
def ring_pt(az, r):
    a = np.radians(np.asarray(az, float)); return np.stack([r * np.cos(a), 0 * a + PLANE_H, r * np.sin(a)], -1)
def blocked(o, d, pol):
    sc = np.array([1, 1 / pol, 1]); oo = o * sc; dd = d * sc; ln = np.linalg.norm(dd, axis=-1); dn = dd / ln[..., None]
    b = (dn * oo).sum(-1); disc = b * b - ((oo * oo).sum(-1) - 1); t = -b - np.sqrt(np.maximum(disc, 0))
    return (disc > 0) & (t > 0), t, ln
def slope(p, sig):
    k = np.arange(-int(4 * sig) - 1, int(4 * sig) + 2); g = np.exp(-0.5 * (k / sig) ** 2); g /= g.sum()
    return np.gradient(np.convolve(np.pad(p, len(k) // 2, mode='edge'), g, mode='valid'))
def ncc(a, b):
    a = a - a.mean(); b = b - b.mean(); d = np.sqrt((a * a).sum() * (b * b).sum())
    return float((a * b).sum() / d) if d > 0 else 0.0
def read(s, pol, sun, file):
    im = Image.open(file).convert('RGB')
    if not (im.size == (1920, 1080)): im = im.resize((1920, 1080), Image.LANCZOS)
    lum = (np.asarray(im, np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)).reshape(-1)
    ys, xs = np.mgrid[0:1080, 0:1920]
    th = np.tan(np.radians(s['vfov']) / 2)
    d = np.stack([((xs + 0.5 - 960) / 540) * th, -((ys + 0.5 - 540) / 540) * th, -np.ones(xs.shape)], -1).reshape(-1, 3)
    d = rotq(s['q'], d); e = np.array(s['eye'])
    with np.errstate(divide='ignore', invalid='ignore'):
        tp = np.where(np.abs(d[:, 1]) > 1e-9, (PLANE_H - e[1]) / d[:, 1], -1.0)
    p = e + d * tp[:, None]; r = np.hypot(p[:, 0], p[:, 2])
    keep = (tp > 0) & (r > 1.25) & (r < 2.62)
    idx = np.flatnonzero(keep); p = p[idx]; r = r[idx]; lum = lum[idx]
    az = np.degrees(np.arctan2(p[:, 2], p[:, 0]))
    hit, t, ln = blocked(e[None, :], p - e, pol); hid = hit & (t < ln)
    out = {}
    for zi, (name, sign, lo, hi) in enumerate(ZONES):
        r0 = (lo + hi) / 2; grid = np.arange(lo - REACH, hi + REACH + STEP / 2, STEP)
        secs = []
        for a in range(-180, 180, 10):
            rr = np.linspace(lo - REACH, hi + REACH, 7)
            pts = np.concatenate([ring_pt([a - 4.0, a, a + 4.0], x) for x in rr]) / 1.04   # the globe 4 percent larger: its penumbra too
            if blocked(pts, np.tile(sun, (len(pts), 1)), pol)[0].any(): continue    # the globe's shadow lies in this sector
            x0, y0 = proj(s, ring_pt([float(a)], r0)); x1, y1 = proj(s, ring_pt([float(a)], r0 + 0.01))
            ppr = float(np.hypot(x1 - x0, y1 - y0)[0]) / 0.01
            if not np.isfinite(ppr) or ppr < 15: continue
            bw = max(STEP, 0.5 / ppr)
            m = (np.abs(((az - a + 180) % 360) - 180) < 3) & ~hid & (r > grid[0] - bw) & (r < grid[-1] + bw)
            if m.sum() < 300: continue
            nb = int(np.ceil((grid[-1] - grid[0] + 2 * bw) / bw)); bi = np.clip(((r[m] - (grid[0] - bw)) / bw).astype(int), 0, nb - 1)
            cnt = np.bincount(bi, minlength=nb); sm = np.bincount(bi, weights=lum[m], minlength=nb); ok = cnt > 1
            if ok.sum() < 0.9 * nb: continue
            rc = grid[0] - bw + (np.arange(nb) + 0.5) * bw
            prof = np.interp(grid, rc[ok], sm[ok] / cnt[ok])
            sig = max(1.0 / ppr, 0.003) / STEP                                       # a px, or 0.003 radii, in steps
            secs.append((a, ppr, prof, sig))
        if len(secs) < 3: out[name] = None; continue
        sig = max(x[3] for x in secs)
        G = np.array([slope(x[2] / max(x[2].mean(), 1e-3), sig) for x in secs])
        n0 = int(round(REACH / STEP)); core = slice(n0, len(grid) - n0)
        shifts = np.zeros(len(secs)); peak = np.zeros(len(secs))
        for it in range(3):
            al = np.array([np.interp(grid, grid - shifts[i] * STEP, G[i]) for i in range(len(secs))])
            mid = np.median(al, 0)
            for i in range(len(secs)):
                best = (-2, 0)
                cs = []
                for k in range(-n0, n0 + 1):
                    c = ncc(G[i][n0 + k: len(grid) - n0 + k], mid[core]); cs.append(c)
                cs = np.array(cs); j = int(cs.argmax())
                off = 0.0
                if 0 < j < len(cs) - 1:
                    den = cs[j - 1] - 2 * cs[j] + cs[j + 1]; off = 0.5 * (cs[j - 1] - cs[j + 1]) / den if den < 0 else 0.0
                shifts[i] = (j - n0 + off); peak[i] = cs[j]
            good = peak >= 0.6
            if good.sum() >= 3: shifts -= np.median(shifts[good])
        # the edge's radius on the middle profile: profiles laid on each other, their middle, its steepest change
        al = np.array([np.interp(grid, grid - shifts[i] * STEP, secs[i][2] / max(secs[i][2].mean(), 1e-3)) for i in range(len(secs)) if good[i]]) if good.sum() >= 3 else None
        rad = float('nan')
        if al is not None:
            g = sign * slope(np.median(al, 0), sig); w = np.flatnonzero((grid >= lo + 0.02) & (grid <= hi - 0.02)); i = w[g[w].argmax()]
            den = g[i - 1] - 2 * g[i] + g[i + 1]; rad = grid[i] + (0.5 * (g[i - 1] - g[i + 1]) / den if den < 0 else 0.0) * STEP
        out[name] = {'radius': rad, 'ppr': max(x[1] for x in secs), 'by': [(secs[i][0], round(float(shifts[i] * STEP * secs[i][1]), 2), round(float(peak[i]), 2)) for i in range(len(secs)) if good[i]], 'dropped': int((~good).sum())}
    return out
if __name__ == '__main__':
    L = json.load(open(sys.argv[1])); pol = L['polar']; F = L['frames']; sun = np.array(L['sunL']); sun = sun / np.linalg.norm(sun)
    ref = None if sys.argv[2] == 'find' else [float(x) for x in sys.argv[2].split(',')]
    a, b, st = int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]); src = sys.argv[6]
    rows = {}
    for f in range(a, b + 1, st):
        file = (src % f) if '%' in src else os.path.join(src, 'f%04d.jpg' % f)
        s = F.get(str(f))
        if s is None or 'none' in s or not os.path.exists(file): continue
        rows[f] = read(s, pol, sun, file)
    if ref is None:
        ref = []
        for z in ZONES:
            v = [r[z[0]]['radius'] for r in rows.values() if r.get(z[0]) and np.isfinite(r[z[0]]['radius'])]
            ref.append(float(np.median(v)) if v else float('nan'))
        print('radii found (median over the frames):', ' '.join('%.4f' % x for x in ref))
    print('frame | ' + ' | '.join('%-8s n  shape: most px (az)  size px' % z[0] for z in ZONES))
    for f, rd in rows.items():
        line = '%d' % f
        for zi, z in enumerate(ZONES):
            v = rd.get(z[0])
            if not v or not v['by']: line += ' | %-8s  0        .                .   ' % ''; continue
            dv = np.array([x[1] for x in v['by']]); j = int(np.abs(dv).argmax())
            v['shape'] = float(dv[j]); v['shapeAz'] = v['by'][j][0]; v['size'] = float((v['radius'] - ref[zi]) * v['ppr'])
            line += ' | %-8s %2d  %+6.2f (%4d)         %+6.2f' % ('', len(dv), dv[j], v['by'][j][0], v['size'])
        print(line)
    if len(sys.argv) > 7: json.dump({'ref': ref, 'frames': rows}, open(sys.argv[7], 'w'))
