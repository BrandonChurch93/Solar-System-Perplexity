# globe_rigid.py LENS.json A B STEP SRC [OUT.json]: by film frame, the cloud pattern of the frame against the same wrap
# map laid RIGIDLY on the true spheroid through that frame's own lens (this file's own arithmetic, no shader).
# In patches of 64 px on the day side clear of the rings and their shadow: the shift in px (along the bands, across
# them) that lays the frame's pattern on the rigid map's. From all patches one linear map of the shifts: its two
# stretches (1.000 = the frame's pattern has the rigid map's scale in that direction) and its turn.
import sys, json, os, numpy as np, importlib.util
from PIL import Image
from scipy.ndimage import gaussian_filter
Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..')); sys.path.insert(0, HERE)
import globe_edges as g4
M = None
def rigid(s, pol, sun):
    global M
    if M is None: M = np.asarray(Image.open(os.path.join(ROOT, 'public', 'assets', 'saturn', 'full', 'wrap-color.jpg')).convert('RGB')).astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    H, W = M.shape; e = np.array(s['eye']); acc = np.zeros(1080 * 1920, np.float32); geo = None
    for ox, oy in ((0.25, 0.25), (0.75, 0.75), (0.5, 0.5)):
        ys, xs = np.mgrid[0:1080, 0:1920]; d = g4.rays(s, xs + ox, ys + oy); h, t = g4.hit(e[None, :], d, pol)
        P = e + d * np.where(h, t, 0)[:, None]; eta = np.clip(P[:, 1] / pol, -1, 1); phi = np.arctan2(P[:, 0], P[:, 2]) - s['spin']
        u = (phi / (2 * np.pi) + 0.5) % 1.0; v = np.arcsin(eta) / np.pi + 0.5
        x = u * W - 0.5; y = (1 - v) * H - 0.5; x0 = np.floor(x).astype(int); y0 = np.clip(np.floor(y).astype(int), 0, H - 2); fx = x - x0; fy = np.clip(y - y0, 0, 1)
        xa = x0 % W; xb = (x0 + 1) % W
        acc += ((M[y0, xa] * (1 - fx) + M[y0, xb] * fx) * (1 - fy) + (M[y0 + 1, xa] * (1 - fx) + M[y0 + 1, xb] * fx) * fy) * h / 3
        if (ox, oy) == (0.5, 0.5):
            n = P * np.array([1, 1 / (pol * pol), 1]); n /= np.maximum(np.linalg.norm(n, axis=-1), 1e-9)[:, None]
            mu = -(n * (d / np.linalg.norm(d, axis=-1)[:, None])).sum(-1); ndl = (n * sun).sum(-1)
            with np.errstate(divide='ignore', invalid='ignore'):
                tp = np.where(np.abs(d[:, 1]) > 1e-9, -e[1] / d[:, 1], -1.0)
            rr = np.hypot(e[0] + d[:, 0] * tp, e[2] + d[:, 2] * tp); front = (tp > 0) & (tp < np.where(h, t, 1e9)) & (rr > 1.2) & (rr < 2.45)
            # the rings' shadow on the globe: the way from the point to the Sun crosses the ring plane inside the rings
            with np.errstate(divide='ignore', invalid='ignore'):
                ts = np.where(np.abs(sun[1]) > 1e-9, -P[:, 1] / sun[1], -1.0)
            rs = np.hypot(P[:, 0] + sun[0] * ts, P[:, 2] + sun[2] * ts); shade = (ts > 0) & (rs > 1.2) & (rs < 2.40)
            geo = dict(ok=(h & (mu > float(os.environ.get("MU", "0.2"))) & (ndl > 0.2) & ~front & ~shade).reshape(1080, 1920), eta=eta.reshape(1080, 1920), mu=mu.reshape(1080, 1920))
    return acc.reshape(1080, 1920), geo
def hp(a): q = np.log(np.maximum(a, 2.0)); return gaussian_filter(q, 1.2) - gaussian_filter(q, 7.0)
def read(s, pol, sun, file, n=int(os.environ.get("PATCH", "64")), step=int(os.environ.get("STEP", "32")), reach=10):
    im = Image.open(file).convert('RGB')
    if not (im.size == (1920, 1080)): im = im.resize((1920, 1080), Image.LANCZOS)
    F = np.asarray(im, np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    S, geo = rigid(s, pol, sun); a = hp(F); b = hp(S); win = np.outer(np.hanning(n), np.hanning(n)); rows = []
    gy, gx = np.gradient(geo['eta'])
    for y in range(0, 1080 - n, step):
        for x in range(0, 1920 - n, step):
            if geo['ok'][y:y + n, x:x + n].mean() < 0.98: continue
            A = a[y:y + n, x:x + n]; B = b[y:y + n, x:x + n]; A = (A - A.mean()) * win; B = (B - B.mean()) * win
            den = np.sqrt((A * A).sum() * (B * B).sum())
            if den < 1e-9: continue
            c = np.fft.fftshift(np.fft.irfft2(np.fft.rfft2(A) * np.conj(np.fft.rfft2(B)), s=(n, n))) / den
            c0 = c[n // 2 - reach:n // 2 + reach + 1, n // 2 - reach:n // 2 + reach + 1]; j, i = np.unravel_index(int(c0.argmax()), c0.shape)
            if not (0 < i < 2 * reach and 0 < j < 2 * reach): continue
            def sub(m1, m0, p1): dd = m1 - 2 * m0 + p1; return 0.5 * (m1 - p1) / dd if dd < 0 else 0.0
            dx = i - reach + sub(c0[j, i - 1], c0[j, i], c0[j, i + 1]); dy = j - reach + sub(c0[j - 1, i], c0[j, i], c0[j + 1, i])
            g = np.array([gx[y + n // 2, x + n // 2], gy[y + n // 2, x + n // 2]]); g /= max(np.linalg.norm(g), 1e-12)
            rows.append((x + n // 2, y + n // 2, float(dx), float(dy), float(c0[j, i]), float(dx * g[0] + dy * g[1]), float(-dx * g[1] + dy * g[0]), float(geo['mu'][y + n // 2, x + n // 2])))
    return rows
def line(f, rows, peak=0.35):
    r = np.array([x for x in rows if x[4] >= peak])
    if len(r) < 6: return '%d | %3d of %3d patches read' % (f, len(r), len(rows)), None
    mag = np.hypot(r[:, 2], r[:, 3]); X = np.column_stack([r[:, 0] - r[:, 0].mean(), r[:, 1] - r[:, 1].mean(), np.ones(len(r))])
    cx, *_ = np.linalg.lstsq(X, r[:, 2], rcond=None); cy, *_ = np.linalg.lstsq(X, r[:, 3], rcond=None)
    J = np.eye(2) + np.array([[cx[0], cx[1]], [cy[0], cy[1]]]); sv = np.linalg.svd(J, compute_uv=False); turn = np.degrees(np.arctan2(J[1, 0] - J[0, 1], J[0, 0] + J[1, 1]))
    limb = r[r[:, 7] < 0.5]
    txt = '%d | %3d of %3d | shift px: median %.2f, nine in ten under %.2f, most %.2f | across the bands: median %+.2f, most %.2f | along: median %+.2f, most %.2f | stretches %.4f %.4f, turn %+.3f deg | near the limb (%d): most %.2f' % (
        f, len(r), len(rows), np.median(mag), np.percentile(mag, 90), mag.max(), np.median(r[:, 5]), np.abs(r[:, 5]).max(), np.median(r[:, 6]), np.abs(r[:, 6]).max(), sv[0], sv[1], turn, len(limb), np.hypot(limb[:, 2], limb[:, 3]).max() if len(limb) else 0)
    return txt, dict(n=len(r), median=float(np.median(mag)), p90=float(np.percentile(mag, 90)), most=float(mag.max()), stretch=[float(sv[0]), float(sv[1])], turn=float(turn))
if __name__ == '__main__':
    L = json.load(open(sys.argv[1])); pol = L['polar']; sun = np.array(L['sunL']); sun = sun / np.linalg.norm(sun)
    a, b, st, src = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]; out = {}
    for f in range(a, b + 1, st):
        file = (src % f) if '%' in src else os.path.join(src, 'f%04d.jpg' % f); s = L['frames'].get(str(f))
        if s is None or 'eye' not in s or not os.path.exists(file): continue
        rows = read(s, pol, sun, file); txt, d = line(f, rows); print(txt, flush=True); out[f] = dict(rows=rows, sum=d)
    if len(sys.argv) > 6: json.dump(out, open(sys.argv[6], 'w'))
