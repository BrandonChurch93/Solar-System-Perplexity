"""The width of a cell in the lowest rows of a frame 90 still against the approved close image, in px of a 1920
frame. Two readings on the max channel between 3 px and 60 px of scale: the pitch of the rows' autocorrelation
(first peak past the first trough) and the mean way from lane to lane along a row (a lane: under the local mean by
half a standard deviation).
usage: python3 assets-src/sun/lab/size.py RENDER.png [FINEST_PX]"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

FINE = float(sys.argv[2]) if len(sys.argv) > 2 else 3


def read(im):
    im = im.convert('RGB').resize((1920, 1080), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32).max(axis=2) / 255
    band = gaussian_filter(a, FINE) - gaussian_filter(a, 60)
    out = []
    for y0, y1 in ((780, 880), (880, 980), (980, 1080)):
        rows = band[y0:y1, 100:1820]
        rows = rows - rows.mean(axis=1, keepdims=True)
        f = np.fft.rfft(rows, axis=1)
        ac = np.fft.irfft(f * np.conj(f), axis=1).mean(axis=0)
        ac = ac / ac[0]
        k = 1
        while k < 600 and ac[k + 1] < ac[k]:
            k += 1
        p = k
        while p < 800 and ac[p + 1] > ac[p]:
            p += 1
        low = rows < -0.5 * rows.std()
        starts = (low[:, 1:] & ~low[:, :-1]).sum()
        out.append((y0, y1, p, rows.shape[0] * rows.shape[1] / max(starts, 1)))
    return out


for name, im in (('approved', Image.open('references/approved/sun-close.jpg')), ('render', Image.open(sys.argv[1]))):
    for y0, y1, p, way in read(im):
        print(name, 'rows', y0, 'to', y1, 'pitch', p, 'px, lane to lane', round(float(way), 1), 'px')
