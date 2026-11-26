# ring_rigid.py LENS.json A B STEP SRC [OUT.json]: is the ring a rigid body from one film frame to the next?
#   Every frame is laid back onto the ring plane through its own lens (as ring_edges.py does). In sectors of azimuth
#   (every 10 degrees, 3 to either side; not where the globe hides the plane, not where the globe's shadow lies on it)
#   the mean luma by radius, in three zones (1.40 to 1.66, 1.84 to 2.06, 2.20 to 2.46 radii). For each sector that two
#   frames STEP apart both hold: the shift in radius that lays this frame's profile on the other frame's (the peak of
#   the normalised correlation of the two slopes, to a part of a step by a parabola, kept if the correlation is 0.6 or
#   more), in px on screen at that azimuth in this frame. A body whose shape in its own plane does not change with the
#   camera gives 0 at every sector, whatever the camera does between the two frames.
#   Printed by frame and zone: sectors read, the middle of the absolute shift, the largest shift with its azimuth.
#   PLANE_H in the environment (a test, as in ring_edges.py): the height over the ring plane at which the picture is read.
# SRC: a folder of fNNNN.jpg, or a pattern with %d.
import sys, json, os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import ring_edges as e4
STEP = e4.STEP; REACH = 0.04
def sectors(s, pol, sun, file):
    im = Image.open(file).convert('RGB')
    if not (im.size == (1920, 1080)): im = im.resize((1920, 1080), Image.LANCZOS)
    lum = (np.asarray(im, np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)).reshape(-1)
    ys, xs = np.mgrid[0:1080, 0:1920]
    th = np.tan(np.radians(s['vfov']) / 2)
    d = np.stack([((xs + 0.5 - 960) / 540) * th, -((ys + 0.5 - 540) / 540) * th, -np.ones(xs.shape)], -1).reshape(-1, 3)
    d = e4.rotq(s['q'], d); e = np.array(s['eye'])
    with np.errstate(divide='ignore', invalid='ignore'):
        tp = np.where(np.abs(d[:, 1]) > 1e-9, (e4.PLANE_H - e[1]) / d[:, 1], -1.0)
    p = e + d * tp[:, None]; r = np.hypot(p[:, 0], p[:, 2])
    keep = (tp > 0) & (r > 1.25) & (r < 2.62)
    idx = np.flatnonzero(keep); p = p[idx]; r = r[idx]; lum = lum[idx]
    az = np.degrees(np.arctan2(p[:, 2], p[:, 0]))
    hit, t, ln = e4.blocked(e[None, :], p - e, pol); hid = hit & (t < ln)
    out = {}
    for name, sign, lo, hi in e4.ZONES:
        r0 = (lo + hi) / 2; grid = np.arange(lo - REACH, hi + REACH + STEP / 2, STEP)
        for a in range(-180, 180, 10):
            rr = np.linspace(lo - REACH, hi + REACH, 7)
            pts = np.concatenate([e4.ring_pt([a - 4.0, a, a + 4.0], x) for x in rr]) / 1.04
            if e4.blocked(pts, np.tile(sun, (len(pts), 1)), pol)[0].any(): continue
            x0, y0 = e4.proj(s, e4.ring_pt([float(a)], r0)); x1, y1 = e4.proj(s, e4.ring_pt([float(a)], r0 + 0.01))
            ppr = float(np.hypot(x1 - x0, y1 - y0)[0]) / 0.01
            if not np.isfinite(ppr) or ppr < 15: continue
            bw = max(STEP, 0.5 / ppr)
            m = (np.abs(((az - a + 180) % 360) - 180) < 3) & ~hid & (r > grid[0] - bw) & (r < grid[-1] + bw)
            if m.sum() < 300: continue
            nb = int(np.ceil((grid[-1] - grid[0] + 2 * bw) / bw)); bi = np.clip(((r[m] - (grid[0] - bw)) / bw).astype(int), 0, nb - 1)
            cnt = np.bincount(bi, minlength=nb); sm = np.bincount(bi, weights=lum[m], minlength=nb); ok = cnt > 1
            if ok.sum() < 0.9 * nb: continue
            rc = grid[0] - bw + (np.arange(nb) + 0.5) * bw
            out[(name, a)] = (ppr, np.interp(grid, rc[ok], sm[ok] / cnt[ok]), max(1.0 / ppr, 0.003) / STEP)
    return out
def shift(pa, pb, sig):
    ga = e4.slope(pa / max(pa.mean(), 1e-3), sig); gb = e4.slope(pb / max(pb.mean(), 1e-3), sig)
    n0 = int(round(REACH / STEP)); core = slice(n0, len(ga) - n0)
    cs = np.array([e4.ncc(ga[n0 + k: len(ga) - n0 + k], gb[core]) for k in range(-n0, n0 + 1)]); j = int(cs.argmax()); off = 0.0
    if 0 < j < len(cs) - 1:
        den = cs[j - 1] - 2 * cs[j] + cs[j + 1]; off = 0.5 * (cs[j - 1] - cs[j + 1]) / den if den < 0 else 0.0
    return (j - n0 + off) * STEP, float(cs[j])
if __name__ == '__main__':
    L = json.load(open(sys.argv[1])); pol = L['polar']; F = L['frames']; sun = np.array(L['sunL']); sun = sun / np.linalg.norm(sun)
    a, b, st = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); src = sys.argv[5]; rows = {}
    def path(f): return src % f if '%' in src else os.path.join(src, 'f%d.jpg' % f)
    print('frame | ' + ' | '.join('%-8s n  middle px  most px (az)' % z[0] for z in e4.ZONES))
    prev = None
    for f in range(a, b + 1, st):
        if not os.path.exists(path(f)) or str(f) not in F: prev = None; continue
        cur = sectors(F[str(f)], pol, sun, path(f))
        if prev is not None:
            cells = []; rows[f] = {}
            for name, _s, _lo, _hi in e4.ZONES:
                got = []
                for (nm, az), (ppr, prof, sig) in cur.items():
                    if nm == name and (nm, az) in prev:
                        dr, c = shift(prof, prev[(nm, az)][1], max(sig, prev[(nm, az)][2]))
                        if c >= 0.6: got.append((az, round(dr * ppr, 2), round(c, 2)))
                rows[f][name] = got
                if not got: cells.append('%-8s 0      .            .       ' % ''); continue
                ab = np.abs([g[1] for g in got]); k = int(ab.argmax())
                cells.append('%-8s%2d   %5.2f     %+6.2f (%4d)' % ('', len(got), float(np.median(ab)), got[k][1], got[k][0]))
            print('%d | ' % f + ' | '.join(cells)); sys.stdout.flush()
        prev = cur
    if len(sys.argv) > 6: json.dump(rows, open(sys.argv[6], 'w'))
