"""Heights by code for ground the close view's meshes do not have, read from the light in a plate.

  python3 assets-src/mars/place/shadeheights.py --base out/work/place/height/f1.6 --seen out/work/place/height/h1.6 \
      --picture assets-src/mars/place/takes/p16-take6.png --width-deg 1.6 --out out/work/place/height/c1.6
The plates are painted with one Sun, low in the south south east. A slope towards the Sun is bright and a slope away
from it is dark, so the brightness is, to first order, the slope of the ground along the Sun's direction on the map.
That slope is integrated in the frequency domain (each wave of the brightness is divided by its own wave number along
the Sun, held down where that number is small against the wave's whole number, so nothing is drawn out into streaks
along the Sun), in a band between --fine-deg and --broad-deg. The gain (km of height per unit of log brightness) is
not a taste: it is fitted on the ground the picture's eye did see, where the meshes give the true height and the
picture laid at its true place gives the brightness, and the fit and its correlation are printed.
The result is added to the base (fillheights.py: mesh heights, holes hung between them, plateau far out) with a
weight that is 0 on the seen ground and rises to 1 over --join-deg, so the meshes stay what they are.
Written: OUT-height.npy, OUT-look.jpg (the plate's colour lit by nothing, beside the heights as shaded relief).
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--base', required=True, help='prefix of fillheights.py: heights without holes')
ap.add_argument('--seen', required=True, help='prefix of heights.py: heights with nan where unseen, and the colour at its true place')
ap.add_argument('--picture', required=True, help='the plate as painted, north up, the same width')
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--sun', default='0.38,-0.92', help='where the light comes from on the map: east, north')
ap.add_argument('--fine-deg', type=float, default=0.0, help='waves shorter than this are left out (0: none)')
ap.add_argument('--broad-deg', type=float, default=0.25, help='waves longer than this are left to the base')
ap.add_argument('--hold', type=float, default=0.35, help='how hard waves across the Sun are held down')
ap.add_argument('--join-deg', type=float, default=0.02)
ap.add_argument('--gain-km', type=float, default=None, help='km per unit of log brightness times degree; fitted when not given')
ap.add_argument('--out', required=True)
a = ap.parse_args()

KM = 3389.5
base = np.load(a.base + '-height.npy')
true = np.load(a.seen + '-height.npy')
seen = np.isfinite(true)
N = base.shape[0]
deg = a.width_deg / N
sun = np.array([float(x) for x in a.sun.split(',')])
sun /= np.linalg.norm(sun)


def light(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    return np.log(np.maximum(g, 0.02))


def relief(L):
    """Integrates brightness as slope along the Sun. Returned in units of log brightness times degree."""
    L = L - cv2.GaussianBlur(L, (0, 0), a.broad_deg / deg / 2)
    pad = N // 4
    Lp = cv2.copyMakeBorder(L, pad, pad, pad, pad, cv2.BORDER_REFLECT)
    M = Lp.shape[0]
    win = np.hanning(M)
    f = np.fft.fft2(Lp)
    k = np.fft.fftfreq(M, d=deg) * 2 * np.pi
    kx, ky = np.meshgrid(k, k)
    ks = kx * sun[0] - ky * sun[1]  # image row runs south
    kk = kx * kx + ky * ky
    band = 1 - np.exp(-kk * (a.broad_deg / (2 * np.pi)) ** 2 * 4)
    if a.fine_deg > 0:
        band *= np.exp(-kk * (a.fine_deg / (2 * np.pi)) ** 2)
    H = f * (-1j * ks) / (ks * ks + a.hold * kk + 1e-9) * band
    H[0, 0] = 0
    return np.real(np.fft.ifft2(H))[pad:pad + N, pad:pad + N].astype(np.float32)


# the fit: the picture at its true place on the seen ground against the true height, same band
col = cv2.imread(a.seen + '-colour.png')
if col.shape[0] != N:
    col = cv2.resize(col, (N, N), interpolation=cv2.INTER_AREA)
Lt = light(col)
mean = Lt[seen].mean()
Lt = np.where(seen, Lt, mean)
soft = cv2.GaussianBlur(Lt, (0, 0), 6)
Lt = np.where(seen, Lt, soft)
rt = relief(Lt)
th = np.where(seen, true, base) * KM
th = th - cv2.GaussianBlur(th, (0, 0), a.broad_deg / deg / 2)
inner = cv2.erode(seen.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
x, y = rt[inner], th[inner]
fit = float((x * y).sum() / max((x * x).sum(), 1e-12))
corr = float(np.corrcoef(x, y)[0, 1])
gain = a.gain_km if a.gain_km is not None else fit

pic = cv2.imread(a.picture)
pic = cv2.resize(pic, (N, N), interpolation=cv2.INTER_AREA)
r = relief(light(pic)) * gain / KM
far = cv2.distanceTransform((~seen).astype(np.uint8), cv2.DIST_L2, 5) * deg
w = np.clip(far / a.join_deg, 0, 1)
w = w * w * (3 - 2 * w)
out = base + r * w
np.save(a.out + '-height.npy', out.astype(np.float32))

gy, gx = np.gradient(out, np.radians(deg))
s3 = np.array([sun[0], sun[1], 0.38])
s3 /= np.linalg.norm(s3)
nrm = np.dstack([-gx, gy, np.ones_like(gx)])
nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
shade = np.clip(nrm @ s3, 0, 1) / s3[2] * 0.6
lo, hi = np.percentile(out, [1, 99])
grey = 0.35 + 0.65 * np.clip((out - lo) / max(hi - lo, 1e-9), 0, 1)
look = np.clip(np.dstack([grey * shade] * 3), 0, 1)
side = np.hstack([pic, np.round(look * 255).astype(np.uint8)])
cv2.imwrite(a.out + '-look.jpg', np.ascontiguousarray(side), [cv2.IMWRITE_JPEG_QUALITY, 90])
made = r[~seen] * KM
print('%g deg: fit on the seen ground %.3f km per unit (correlation %.3f over %d texels); gain used %.3f; relief made outside the seen ground %.2f to %.2f km (rms %.3f km); height %.2f to %.2f km' % (
    a.width_deg, fit, corr, int(inner.sum()), gain, made.min(), made.max(), float(np.sqrt((made ** 2).mean())), out.min() * KM, out.max() * KM))
