import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, '/home/user/workspace/repo/tools/measure')
from toprows import read, NAMED
import numpy as np, cv2
from PIL import Image
from g17 import luma
AP = '/home/user/workspace/repo/references/approved/neptune-close.jpg'
a, _ = read(AP, (1920, 1080)); ya = luma(AP, (1920, 1080))
def rgb(path, size=None):
    im = Image.open(path).convert('RGB')
    if size:
        w, h = im.size; s = max(size[0] / w, size[1] / h); im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
        w, h = im.size; l = (w - size[0]) // 2; t = (h - size[1]) // 2; im = im.crop((l, t, l + size[0], t + size[1]))
    return np.asarray(im).astype(float) / 255
ra = rgb(AP, (1920, 1080))
def lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def col(c, tag):
    h, w, _ = c.shape; out = []; srgb = []
    for i, j in NAMED:
        t = c[j * h // 8:(j + 1) * h // 8, i * w // 12:(i + 1) * w // 12]
        out.append(lin(t).reshape(-1, 3).mean(0)); srgb.append(np.median(t.reshape(-1, 3), 0))
    m = np.mean(out, 0); s = np.mean(srgb, 0) * 255
    print(f'{tag}: mean linear RGB of the 13 tiles {m[0]:.4f} {m[1]:.4f} {m[2]:.4f}, R/G {m[0]/m[1]:.2f}, B/G {m[2]/m[1]:.2f} | median display RGB (8 bit, the floor) {s[0]:.1f} {s[1]:.1f} {s[2]:.1f}')
if __name__ == '__main__':
    col(ra, 'approved')
    for f in sys.argv[1:]:
        o, _ = read(f)
        r = np.array([o[t][1] / a[t][1] for t in NAMED]); l = np.array([o[t][0] / a[t][0] for t in NAMED])
        print(f, '\n  energy ratio:', ' '.join(f'{v:.2f}' for v in r), '| inside 0.6 to 2.0:', int(((r >= 0.6) & (r <= 2)).sum()), 'median', round(float(np.median(r)), 2))
        print('  energy e-5:', ' '.join(f'{o[t][1]*1e5:.1f}' for t in NAMED)); print('  luma:', ' '.join(f'{o[t][0]:.3f}' for t in NAMED))
        print('  luma ratio:', ' '.join(f'{v:.2f}' for v in l))
        y = luma(f); c = rgb(f)
        print('  mean abs luma diff whole frame', round(float(np.abs(y - ya).mean()), 4), '| top two rows', round(float(np.abs(y - ya)[:270].mean()), 4), '| mean abs RGB diff (8 bit) whole', round(float(np.abs(c - ra).mean() * 255), 2), 'top two rows', round(float(np.abs(c - ra)[:270].mean() * 255), 2))
        col(c, '  ours')
        full = [(i, j) for j in range(8) for i in range(12)]
        oo, _ = read(f, named=full); aa, _ = read(AP, (1920, 1080), named=full)
        rr = np.array([oo[t][1] / aa[t][1] for t in full])
        print('  all 96 tiles inside 0.6 to 2.0:', int(((rr >= 0.6) & (rr <= 2)).sum()))
