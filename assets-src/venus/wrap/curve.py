import sys
import cv2
import numpy as np
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/venus')
from geo import *

src = load(WORK + '/wrap/hero-clean.png')
h, w = src.shape[:2]
src = cv2.resize(src, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
h, w = src.shape[:2]
lin = scene(src)
d = rays(w, h)
ok, p = hit(d)
ndl = p @ SUN
mu = -(p * d).sum(-1)
m = ok & (mu > 0.45)
knots = np.linspace(-1, 1, 33)
med = np.full((33, 3), np.nan)
cnt = np.zeros(33)
for i, k in enumerate(knots):
    s = m & (np.abs(ndl - k) < 1 / 32)
    cnt[i] = s.sum()
    if cnt[i] > 4000:
        med[i] = np.median(lin[s], axis=0)
good = np.nonzero(~np.isnan(med[:, 0]))[0]
lo, hi = good.min(), good.max()
print('knots with data', knots[lo], knots[hi])
night = np.median(med[lo:lo + 6], axis=0)
for i in range(33):
    if i < lo + 4:
        med[i] = night
    if i > hi:
        med[i] = med[hi]
dark = knots < -0.25
med[dark] = night
for c in range(3):
    med[:, c] = np.maximum.accumulate(ndi.gaussian_filter1d(med[:, c], 0.7, mode='nearest'))
ref = m & (ndl > 0.6) & (ndl < 0.9)
day = np.median(lin[ref], axis=0)
top = med[np.argmin(np.abs(knots - 0.75))]
day = day * (top @ np.array([0.2126, 0.7152, 0.0722])) / (day @ np.array([0.2126, 0.7152, 0.0722]))
curve = med / day
np.set_printoptions(precision=4, suppress=True, linewidth=200)
print('day colour', day)
print(np.c_[knots, curve, cnt])
json.dump({'note': 'median of the scene values of the approved hero by cosine of the Sun angle, divided by the day colour; 33 knots from -1 to 1', 'dayColor': [round(float(v), 5) for v in day], 'curve': [[round(float(v), 5) for v in r] for r in curve]}, open('src/stops/venus/curve.json', 'w'), indent=1)
