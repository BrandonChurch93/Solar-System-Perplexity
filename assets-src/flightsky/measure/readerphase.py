import sys, numpy as np, cv2
from PIL import Image
sys.path.insert(0, 'tools/img')
import smooth as S
base = '/home/user/workspace/scratch/m1012/'
def lum(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float64) @ S.LUMA
a = lum(base + sys.argv[1] + '/k005482.png'); b = lum(base + sys.argv[1] + '/k005483.png')
sa, sb = S.small(a, 0.25), S.small(b, 0.25)
fw = S.motion(sa, sb); h, w = sa.shape
f = fw[:, int(w * 1260 / 1920):].reshape(-1, 2); f = f[np.isfinite(f).all(axis=1)]
v = np.median(f, axis=0) * 4; n = np.linalg.norm(v); u = v / n
print('motion of the sky from 2741 to the next half frame, px of the master:', np.round(v, 2), 'length', round(float(n), 2))
H, W = a.shape; fy = np.fft.fftfreq(H)[:, None]; fx = np.fft.fftfreq(W)[None, :]; A = np.fft.fft2(a)
out = []
for d in np.arange(1.0, 9.01, 0.5):
    dx, dy = u * d
    s = np.real(np.fft.ifft2(A * np.exp(-2j * np.pi * (fx * dx + fy * dy))))
    ss = S.small(np.clip(s, 0, 255), 0.25)
    f1, b1 = S.motion(sa, ss), S.motion(ss, sa)
    dd, m, _ = S.left(sa, ss, f1, b1, False)
    out.append((d, float(np.nanmean(dd)), float(np.nanmean(dd[:, int(w * 1260 / 1920):]))))
print('one picture (2741) against itself moved by d px along that line, no other change; the reader\'s left, whole picture and right of the globe:')
for d, l, r in out: print(f'  d {d:.1f}: {l:.2f} {r:.2f}')
