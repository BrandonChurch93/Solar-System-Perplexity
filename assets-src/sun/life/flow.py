"""A picture that shows flow, not change (mail 241, proof b).
The brightness along one path is read from every frame and the rows are stacked: the way along the
path runs across, time runs down. Something that flows along the path draws a slanted streak and the
slant is its speed; something that only flickers in place draws an upright one.

usage:
  python3 assets-src/sun/life/flow.py strand DIR OUT.png ARC FIRST LAST COORDS [COORDS ...]
  python3 assets-src/sun/life/flow.py line DIR OUT.png X0 Y0 X1 Y1 FIRST LAST

DIR holds draft frames fNNNNN.png drawn with assets-src/sun/life/freeze-90.patch applied (the camera
stands at the pose of frame 90, time runs).

strand: the path is one strand of the arcade. COORDS are flow views of the same frozen pose
(frames.ts --diag flow, files fNNNNN-flow.png): the loops write which strand a pixel belongs to in red
(the angle under which the two feet are seen, over pi), how far along the strand it is in green and
whether it is lit in blue. ARC picks the strand. The arcade grows and settles during the event, so
the path is taken from the nearest COORDS before and after each frame and mixed between them.
With ground=TEXELS.png as one more argument (the texel view of the same pose, green marks the ground)
only the part of the strand over the sky is used, where nothing else writes into the flow view.
line: the path is the straight line from X0 Y0 to X1 Y1 in pixels, for a fibre of the spot.

Both write OUT.png (one row per frame, drawn four rows high, ticks every 30 frames and every 100 px)
and print the length of the path and, per span of 30 frames, the shift in px per frame that best
carries one row onto the next (found by correlation, after what stands still at each place, the mean
of the span, is taken out of the rows), which is the speed of what flows there, and
per span of 30 frames the length of what moves (twice the lag at which a row, static part taken out,
stops matching itself by half), and per span of 90 frames the share of the light at a place that comes and goes: at every point of the
path the brightest (95th percentile) and the dimmest (10th) value over the span, and the part of the
brightest that the difference is. A strand whose light is carried by passing clumps is near 1 there."""
import sys
import re
import numpy as np
import cv2

ground = [a[7:] for a in sys.argv if a.startswith('ground=')]
sys.argv = [a for a in sys.argv if not a.startswith('ground=')]
mode, d, out = sys.argv[1], sys.argv[2], sys.argv[3]
SKY = cv2.imread(ground[0])[..., 1] < 128 if ground else None
UP = 4
ACROSS = 2


def read(f):
    im = cv2.imread('%s/f%05d.png' % (d, f))
    if im is None:
        raise SystemExit('no frame %d in %s' % (f, d))
    return im.astype(np.float32) @ np.array([0.114, 0.587, 0.299], np.float32)


def sample(lum, pts):
    """Brightness at the points of a path, averaged over a few pixels across it."""
    t = np.gradient(pts, axis=0)
    n = np.stack([-t[:, 1], t[:, 0]], 1)
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-6)
    row = np.zeros(len(pts), np.float32)
    for k in range(-ACROSS, ACROSS + 1):
        q = (pts + n * k).astype(np.float32)
        row += cv2.remap(lum, q[:, 0].reshape(1, -1), q[:, 1].reshape(1, -1), cv2.INTER_LINEAR).ravel()
    return row / (2 * ACROSS + 1)


def path_of(file, arc):
    """The strand with this angle in one flow view: 256 points from the left foot to the right."""
    c = cv2.imread(file)
    level = int(round(arc / np.pi * 255))
    band = np.abs(c[..., 2].astype(int) - level) <= 1
    if SKY is not None:
        band &= SKY
    ys, xs = np.nonzero(band)
    s = c[ys, xs, 1].astype(int)
    pts = np.full((256, 2), np.nan, np.float32)
    for g in range(256):
        m = s == g
        if m.sum() >= 2:
            pts[g] = (xs[m].mean(), ys[m].mean())
    ok = ~np.isnan(pts[:, 0])
    first, last = np.nonzero(ok)[0][[0, -1]]
    idx = np.arange(256)
    for k in range(2):
        pts[:, k] = np.interp(idx, idx[ok], pts[ok, k])
    pts = pts[first:last + 1]
    ker = np.ones(5, np.float32) / 5
    for k in range(2):
        pts[:, k] = np.convolve(np.pad(pts[:, k], 2, mode='edge'), ker, mode='valid')
    return pts, first, last


def speed(rows, reach=45):
    """The shift in px per frame that best carries each row onto the next, both ways."""
    best = []
    for a, b in zip(rows[:-1], rows[1:]):
        a0 = a - cv2.blur(a.reshape(1, -1), (61, 1)).ravel()
        b0 = b - cv2.blur(b.reshape(1, -1), (61, 1)).ravel()
        score = []
        for sh in range(-reach, reach + 1):
            if sh >= 0:
                x, y = a0[:len(a0) - sh], b0[sh:]
            else:
                x, y = a0[-sh:], b0[:len(b0) + sh]
            score.append(float((x * y).sum() / max(np.sqrt((x * x).sum() * (y * y).sum()), 1e-6)))
        k = int(np.argmax(score))
        best.append((k - reach, score[k], score[reach]))
    return best


def length_of(row):
    """How long the moving things in one row are: twice the lag at which the row stops matching itself by half."""
    r = row - row.mean()
    full = float((r * r).sum())
    if full <= 0:
        return 0.0
    last = 1.0
    for lag in range(1, len(r) // 2):
        c = float((r[:-lag] * r[lag:]).sum()) / full
        if c < 0.5:
            return 2 * (lag - 1 + (last - 0.5) / max(last - c, 1e-6))
        last = c
    return float(len(r))


if mode == 'strand':
    arc = float(sys.argv[4])
    first, last = int(sys.argv[5]), int(sys.argv[6])
    coords = sorted((int(re.search(r'f(\d+)-flow', f).group(1)), f) for f in sys.argv[7:])
    paths = [(n, *path_of(f, arc)) for n, f in coords]
    lo = max(p[2] for p in paths)
    hi = min(p[3] for p in paths)
    paths = [(n, p[lo - a:hi - a + 1]) for n, p, a, b in paths]
    rest = paths[-1][1]
    length = float(np.linalg.norm(np.diff(rest, axis=0), axis=1).sum())
    cols = int(round(length))
    at = np.linspace(0, len(rest) - 1, cols)

    def pts_at(f):
        before = [p for p in paths if p[0] <= f]
        after = [p for p in paths if p[0] >= f]
        a = before[-1] if before else after[0]
        b = after[0] if after else before[-1]
        w = 0 if a[0] == b[0] else (f - a[0]) / (b[0] - a[0])
        p = a[1] * (1 - w) + b[1] * w
        return np.stack([np.interp(at, np.arange(len(p)), p[:, k]) for k in range(2)], 1)

    print('strand at angle %.3f: %d points, %.0f px long at rest (part %.2f to %.2f of the strand), %d flow views' % (arc, len(rest), length, lo / 255, hi / 255, len(paths)))
else:
    x0, y0, x1, y1 = [float(v) for v in sys.argv[4:8]]
    first, last = int(sys.argv[8]), int(sys.argv[9])
    cols = int(round(np.hypot(x1 - x0, y1 - y0)))
    fixed = np.stack([np.linspace(x0, x1, cols), np.linspace(y0, y1, cols)], 1)

    def pts_at(f):
        return fixed

    print('line from %.0f %.0f to %.0f %.0f: %d px' % (x0, y0, x1, y1, cols))

rows = [sample(read(f), pts_at(f)) for f in range(first, last + 1)]
stack = np.stack(rows)
img = np.repeat(np.clip(stack, 0, 255).astype(np.uint8), UP, axis=0)
img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
pad = 44
canvas = np.zeros((img.shape[0] + 30, img.shape[1] + pad, 3), np.uint8)
canvas[30:, pad:] = img
for f in range(first, last + 1, 30):
    y = 30 + (f - first) * UP
    cv2.line(canvas, (pad - 8, y), (pad - 1, y), (255, 255, 255), 1)
    cv2.putText(canvas, str(f), (2, y + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
for x in range(0, cols, 100):
    cv2.line(canvas, (pad + x, 22), (pad + x, 29), (255, 255, 255), 1)
    cv2.putText(canvas, str(x), (pad + x + 3, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
cv2.imwrite(out, canvas)
print('frames\tshift px per frame (median)\tquarter and three quarters\tmatch at that shift\tmatch without shift')
for a in range(0, len(rows) - 1, 30):
    span = stack[a:a + 31]
    part = speed(list(span - span.mean(axis=0)))
    sh = np.array([p[0] for p in part])
    print('%d to %d\t%.0f\t%.0f to %.0f\t%.2f\t%.2f' % (first + a, first + a + len(part), np.median(sh), np.percentile(sh, 25), np.percentile(sh, 75), np.mean([p[1] for p in part]), np.mean([p[2] for p in part])))
print('frames\tlength of what moves in px (median over the rows)')
for a in range(0, len(rows) - 1, 30):
    span = stack[a:a + 31]
    print('%d to %d\t%.0f' % (first + a, first + a + len(span) - 1, float(np.median([length_of(r) for r in span - span.mean(axis=0)]))))
print('frames\tshare of the light at a place that comes and goes (median over the path)\tmean level')
for a in range(0, len(rows), 90):
    part = stack[a:a + 90]
    top = np.percentile(part, 95, axis=0)
    low = np.percentile(part, 10, axis=0)
    lit = top > 12
    print('%d to %d\t%.2f\t%.1f' % (first + a, first + a + len(part) - 1, float(np.median((top[lit] - low[lit]) / top[lit])), float(part.mean())))
