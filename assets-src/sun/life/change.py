"""How much the picture changes from one frame to the next with the camera frozen.
usage: python3 assets-src/sun/life/change.py DIR TEXELS.png FIRST LAST [FIRST LAST ...]
DIR holds consecutive draft frames fNNNNN.png drawn with assets-src/sun/life/freeze-90.patch applied
(the camera stands at the pose of frame 90, time runs). TEXELS.png is the texel view of one of them
(frames.ts --diag texels): its green channel marks the ground. Ground: green above one half.
Loops: not ground, and the mean of the frames brighter than 30 of 255 (the arcade and the fringe
against the dark sky). Prints, per run of frames, the mean absolute difference between frame n and
n + 1 in levels of 0 to 255, over the ground, over the loops and over the whole frame, and the same
after a blur of 1.5 px, which leaves out grain and single pixel flicker.
With mask=FILE.png as one more argument the loops mask is written to FILE.png if it is not there and
read from it if it is, so that a before and an after are measured over the same pixels."""
import sys
import numpy as np
import cv2

import os

keep = [a[5:] for a in sys.argv if a.startswith('mask=')]
sys.argv = [a for a in sys.argv if not a.startswith('mask=')]
d = sys.argv[1]
tex = cv2.imread(sys.argv[2])
ground = tex[..., 1] > 127
runs = [(int(sys.argv[i]), int(sys.argv[i + 1])) for i in range(3, len(sys.argv) - 1, 2)]
def read(f):
    im = cv2.imread('%s/f%05d.png' % (d, f))
    if im is None:
        raise SystemExit('no frame %d in %s' % (f, d))
    return im.astype(np.float32)


# first pass: the mean of all frames of the runs marks the loops; second pass: the differences
total = np.zeros(tex.shape[:2], np.float64)
count = 0
for a, b in runs:
    for f in range(a, b + 1):
        total += read(f).mean(-1)
        count += 1
mean = total / count
loops = (~ground) & (mean > 30)
if keep and os.path.exists(keep[0]):
    loops = cv2.imread(keep[0], cv2.IMREAD_GRAYSCALE) > 127
elif keep:
    cv2.imwrite(keep[0], loops.astype(np.uint8) * 255)
print('ground pixels %d, loops pixels %d of %d' % (ground.sum(), loops.sum(), ground.size))
print('run\tground\tloops\tall\tground soft\tloops soft')
tot = []
for a, b in runs:
    rows = []
    x = read(a)
    xs = cv2.GaussianBlur(x, (0, 0), 1.5)
    for f in range(a, b):
        y = read(f + 1)
        ys = cv2.GaussianBlur(y, (0, 0), 1.5)
        dd = np.abs(x - y).mean(-1)
        ds = np.abs(xs - ys).mean(-1)
        rows.append((dd[ground].mean(), dd[loops].mean(), dd.mean(), ds[ground].mean(), ds[loops].mean()))
        x, xs = y, ys
    r = np.mean(rows, axis=0)
    tot.append(r)
    print('%d to %d\t%.3f\t%.3f\t%.3f\t%.3f\t%.3f' % (a, b, *r))
r = np.mean(tot, axis=0)
print('mean\t%.3f\t%.3f\t%.3f\t%.3f\t%.3f' % tuple(r))
