import sys, numpy as np, cv2
from PIL import Image
def lum(p):
    return (np.asarray(Image.open(p).convert('RGB')).astype(np.float64) / 255) @ np.array([0.2126, 0.7152, 0.0722])
def measure(y, box, lo=0.08, sep=10, R=12, ring=(1.5, 4.5), seed=1):
    x0, y0, x1, y1 = box
    med = cv2.medianBlur((np.clip(y, 0, 1) * 255).astype(np.uint8), 31).astype(float) / 255
    mx = cv2.dilate(y, np.ones((2 * sep + 1, 2 * sep + 1)))
    pk = (y >= mx) & (y - med > lo)
    near = cv2.dilate(((y - med) > 0.03).astype(np.uint8), np.ones((2 * R + 1, 2 * R + 1)))
    inb = np.zeros_like(pk); inb[y0 + R + 2:y1 - R - 2, x0 + R + 2:x1 - R - 2] = True
    yy, xx = np.mgrid[-R:R + 1, -R:R + 1]; rr = np.hypot(xx, yy)
    rg = (rr >= ring[0]) & (rr < ring[1]); bgm = (rr >= 8) & (rr <= 12)
    def stat(pts):
        out = []
        for yv, x in pts:
            w = y[yv - R:yv + R + 1, x - R:x + R + 1]; b = np.median(w[bgm])
            v = np.sort(w[rg])
            out.append((v[0] - b, v[:4].mean() - b, b, w[R, R] - b, w[rg].mean() - b))
        return np.array(out)
    sp = np.argwhere(pk & inb); s = stat(sp)
    rng = np.random.default_rng(seed); cp = np.argwhere((near == 0) & inb); cp = cp[rng.choice(len(cp), min(len(cp), 2000), replace=False)]; c = stat(cp)
    return s, c
def line(tag, s, c):
    f = np.median(s[:, 2])
    print(f'{tag}: stars {len(s)}, floor {f:.4f}, peak over floor {np.median(s[:, 3]):.3f}')
    print(f'   deepest ring pixel minus floor, median: at stars {np.median(s[:, 0]):+.4f} ({np.median(s[:, 0] / np.maximum(s[:, 2], 1e-3)) * 100:+.0f} percent of the floor), in open sky {np.median(c[:, 0]):+.4f} ({np.median(c[:, 0] / np.maximum(c[:, 2], 1e-3)) * 100:+.0f} percent)')
    print(f'   mean of the four deepest: at stars {np.median(s[:, 1]):+.4f} ({np.median(s[:, 1] / np.maximum(s[:, 2], 1e-3)) * 100:+.0f} percent), in open sky {np.median(c[:, 1]):+.4f} ({np.median(c[:, 1] / np.maximum(c[:, 2], 1e-3)) * 100:+.0f} percent)')
    print(f'   stars with a ring pixel under 0.4 of the floor: {(s[:, 0] < -0.6 * s[:, 2]).mean() * 100:.0f} percent, open sky points {(c[:, 0] < -0.6 * c[:, 2]).mean() * 100:.0f} percent | ring pixels at code 3 or under (stars) {((s[:, 0] + s[:, 2]) <= 3.5 / 255).mean() * 100:.0f} percent')
    return dict(pit=float(np.median(s[:, 0])), open=float(np.median(c[:, 0])), floor=float(f))
if __name__ == '__main__':
    box = [int(v) for v in sys.argv[1].split(',')]; lo = float(sys.argv[2])
    for p in sys.argv[3:]:
        s, c = measure(lum(p), box, lo); line(p.split('/')[-1], s, c)
