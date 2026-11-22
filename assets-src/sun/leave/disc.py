import json, cv2, numpy as np
tex = cv2.imread('public/assets/mercury/full/sun-plate.webp')[..., :3].astype(np.float32)
b = cv2.GaussianBlur(tex[..., 0], (0, 0), 1.5)
c = np.array([1069.5, 981.0])
for it in range(4):
    pts = []
    rr = np.arange(440, 600, 0.5)
    for a in np.linspace(0, 2 * np.pi, 1440, endpoint=False):
        x = c[0] + rr * np.cos(a); y = c[1] + rr * np.sin(a)
        v = cv2.remap(b, x.astype(np.float32)[None], y.astype(np.float32)[None], cv2.INTER_LINEAR)[0]
        d = v[:-16] - v[16:]
        i = int(np.argmax(d)) + 8
        low = np.nonzero(v < 0.8 * np.median(v[:60]))[0]
        if len(low) and abs(rr[low[0]] - rr[i]) < 9: pts.append((x[i], y[i], a))
    q = np.array(pts)
    bins = np.floor(q[:, 2] / (2 * np.pi) * 24).astype(int)
    w = 1 / np.bincount(bins, minlength=24)[bins]
    p = q[:, :2]
    for k in range(6):
        A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))] * w[:, None]
        s = np.linalg.lstsq(A, (p ** 2).sum(axis=1) * w, rcond=None)[0]
        c = s[:2]; R = np.sqrt(s[2] + c @ c)
        res = np.abs(np.hypot(p[:, 0] - c[0], p[:, 1] - c[1]) - R)
        keep = res < max(2.5 * np.median(res), 2.0)
        p = p[keep]; w = w[keep]
    print(f'pass {it}: centre {c[0]:.1f}, {c[1]:.1f} radius {R:.1f} px of 2048 ({len(p)} of 1440 rays in {len(set(bins))} of 24 sectors, median residual {np.median(res):.2f} px)')
x = p[:, 0] / 2048 - 0.5; y = 0.5 - p[:, 1] / 2048
for k in range(5):
    e = np.linalg.lstsq(np.c_[x * x, x * y, y * y, x, y] * w[:, None], w, rcond=None)[0]
    f = np.c_[x * x, x * y, y * y, x, y] @ e - 1
    g = np.hypot(2 * e[0] * x + e[1] * y + e[3], e[1] * x + 2 * e[2] * y + e[4])
    res = np.abs(f / g) * 2048
    keep = res < max(2.5 * np.median(res), 2.0)
    x = x[keep]; y = y[keep]; w = w[keep]
print(f'conic about the picture centre, y up: {e.round(5).tolist()} ({len(x)} rays, median residual {np.median(res):.2f} px)')
json.dump({'centre': [round(float(c[0] / 2048), 5), round(float(1 - c[1] / 2048), 5)], 'radius': round(float(R / 2048), 5), 'conic': [round(float(v), 6) for v in e]}, open('assets-src/sun/leave/disc.json', 'w'))
