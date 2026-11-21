import sys
import cv2
import numpy as np

FILM = sys.argv[1]
WINDOWS = [(1180, 720, 96), (1300, 840, 96), (1450, 900, 96), (1000, 860, 96), (820, 800, 96), (1600, 980, 96), (700, 950, 96), (1250, 620, 64)]


def split(g):
    g = g.astype(np.float32)
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    ang = 0.5 * np.arctan2(2 * (gx * gy).mean(), (gx * gx).mean() - (gy * gy).mean())
    n = g.shape[0]
    m = cv2.getRotationMatrix2D((n / 2, n / 2), np.degrees(ang) - 90, 1.0)
    r = cv2.warpAffine(g, m, (n, n), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    c = n // 6
    r = r[c:-c, c:-c]
    along = cv2.GaussianBlur(r, (0, 0), sigmaX=4, sigmaY=0.01)
    lines = along - cv2.GaussianBlur(along, (0, 0), 6)
    fine = along - cv2.GaussianBlur(along, (0, 0), 1.5)
    rest = r - along
    f = np.abs(np.fft.fft2(rest)) ** 2
    ac = np.real(np.fft.ifft2(f))
    ac /= ac[0, 0]
    return np.degrees(ang), g.mean(), lines.std(), fine.std(), rest.std(), ac[0, 1], ac[1, 0], ac[0, 2], ac[2, 0]


ap = cv2.resize(cv2.imread("references/approved/saturn-close.jpg"), (1920, 1080), interpolation=cv2.INTER_AREA)
fm = cv2.imread(FILM)
print("window        | angle mean lines(hp6) lines(hp1.5) grain  ac along1 across1 along2 across2")
tot = np.zeros((2, 3))
for x, y, n in WINDOWS:
    out = []
    for k, im in enumerate((ap, fm)):
        g = cv2.cvtColor(im[y - n // 2:y + n // 2, x - n // 2:x + n // 2], cv2.COLOR_BGR2GRAY)
        v = split(g)
        tot[k] += v[2:5]
        out.append(" ".join(f"{q:6.2f}" for q in v))
    print(f"{x:4d} {y:4d} {n:3d} | approved {out[0]}\n              | film     {out[1]}")
tot /= len(WINDOWS)
print("mean approved lines", np.round(tot[0], 2), "film", np.round(tot[1], 2), "ratio", np.round(tot[1] / tot[0], 2))
