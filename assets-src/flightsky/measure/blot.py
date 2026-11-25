import sys, numpy as np, cv2
from PIL import Image
def measure(p, box, s1=2.0, s2=6.0):
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float64) / 255
    x0, y0, x1, y1 = box
    y = a @ np.array([0.2126, 0.7152, 0.0722]); cb = a[..., 2] - y; cr = a[..., 0] - y
    med = cv2.medianBlur((np.clip(y, 0, 1) * 255).astype(np.uint8), 31).astype(float) / 255
    open_ = cv2.dilate(((y - med) > 0.03).astype(np.uint8), np.ones((9, 9))) == 0
    w = open_.astype(np.float64)
    def band(v):
        def nb(s): return cv2.GaussianBlur(v * w, (0, 0), s) / np.maximum(cv2.GaussianBlur(w, (0, 0), s), 1e-3)
        return nb(s1) - nb(s2)
    m = np.zeros_like(open_); m[y0:y1, x0:x1] = True; m &= open_
    fine = y - cv2.GaussianBlur(y, (0, 0), 1.0)
    return dict(luma=float(band(y)[m].std()), blue=float(band(cb)[m].std()), red=float(band(cr)[m].std()), fine=float(fine[m].std()), floor=float(np.median(y[m])), open=float(m.sum() / ((y1 - y0) * (x1 - x0))))
if __name__ == '__main__':
    box = [int(v) for v in sys.argv[1].split(',')]; k = float(sys.argv[2])
    for p in sys.argv[3:]:
        r = measure(p, box, 2.0 * k, 6.0 * k)
        print(f"{p.split('/')[-1]}: blotch band (blur {2.0 * k:.1f} minus {6.0 * k:.1f} px) in open sky, standard deviation: luma {r['luma']:.5f}, blue minus luma {r['blue']:.5f}, red minus luma {r['red']:.5f} | fine (under 1 px) {r['fine']:.5f} | floor {r['floor']:.4f} | open share {r['open']:.2f}")
