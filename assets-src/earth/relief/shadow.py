import json, os, sys
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geom
import body

W, H = 2816, 1584
STEP = 4
SURROUND = 40
AREA = 1500
FOOT = 0.12
SWEEP = 70
WING = 20
REACH = 2.5
CONTRAST = 0.03
DRAW = 2


def main():
    out = sys.argv[1]
    suns = {}
    for item in sys.argv[2:]:
        frame, x, y, z = item.split(',')
        suns[frame] = np.array([float(x), float(y), float(z)])
    on = body.support()
    image = cv2.imread('references/approved/earth-close.jpg')
    small = cv2.resize(image, (W // STEP, H // STEP), interpolation=cv2.INTER_AREA)
    grey = small.astype(np.float32).mean(-1)
    level = grey / np.maximum(cv2.GaussianBlur(grey, (0, 0), SURROUND), 1)
    tower = cv2.dilate(cv2.resize(on.astype(np.uint8), (W // STEP, H // STEP), interpolation=cv2.INTER_AREA), np.ones((3, 3), np.uint8)) > 0
    level[tower] = np.nan
    f = (H / 2) / np.tan(np.radians(geom.VFOV) / 2)

    def pixel(p):
        return p[..., 0] / -p[..., 2] * f + W / 2, H / 2 - p[..., 1] / -p[..., 2] * f

    def onsea(x, y):
        d = geom.rays(np.atleast_1d(x), np.atleast_1d(y), W, H)
        t, hit, _ = geom.ground(d)
        return d * t[..., None], hit

    n, groups, stats, _ = cv2.connectedComponentsWithStats(on.astype(np.uint8))
    rows = []
    view = cv2.resize(image, (W // DRAW, H // DRAW), interpolation=cv2.INTER_AREA)
    turns = np.radians(np.arange(-SWEEP, SWEEP + 0.5, 1.0))
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < AREA:
            continue
        ys, xs = np.where(groups[y:y + h, x:x + w] == i)
        low = ys >= h * (1 - FOOT)
        fx, fy = x + xs[low].mean(), y + ys[low].max()
        ends, hit = onsea(np.array([fx, x + xs[low].min(), x + xs[low].max()]), np.array([fy, fy, fy]))
        if not hit.all():
            continue
        F = ends[0]
        width = float(np.linalg.norm(ends[2] - ends[1]))
        up = F - geom.CENTRE
        up /= np.linalg.norm(up)
        found = {}
        for frame, sun in suns.items():
            flat = -(sun - (sun @ up) * up)
            flat /= np.linalg.norm(flat)
            side = np.cross(up, flat)
            score = np.full(len(turns), np.nan)
            for k, a in enumerate(turns):
                along = np.cos(a) * flat + np.sin(a) * side
                across = np.cross(up, along)
                pts = F + np.linspace(0.4, REACH, 36)[:, None, None] * width * along + np.linspace(-0.3, 0.3, 7)[None, :, None] * width * across
                u, v = pixel(pts)
                inside = (u > 2) & (u < W - 2) & (v > 2) & (v < H - 2)
                if inside.mean() < 0.8:
                    continue
                got = cv2.remap(level, (u / STEP - 0.5).astype(np.float32), (v / STEP - 0.5).astype(np.float32), cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=float('nan'))
                if np.isfinite(got).mean() < 0.6:
                    continue
                score[k] = 1 - float(np.nanmean(got))
            if np.isfinite(score).sum() < len(turns) * 0.6:
                continue
            ridge = np.full(len(turns), np.nan)
            ridge[WING:-WING] = score[WING:-WING] - 0.5 * (score[:-2 * WING] + score[2 * WING:])
            if not np.isfinite(ridge).any():
                continue
            best = int(np.nanargmax(ridge))
            found[frame] = (float(np.degrees(turns[best])), float(score[best]), float(ridge[best]), flat, side)
        if len(found) < len(suns):
            continue
        first = next(iter(found.values()))
        if first[2] < CONTRAST:
            continue
        rows.append((int(area), fx, fy, width, {k: v[0] for k, v in found.items()}, first[1], first[2]))
        a = np.radians(first[0])
        px, py = pixel(F + (np.cos(a) * first[3] + np.sin(a) * first[4]) * width * REACH)
        cx, cy = pixel(F + first[3] * width * REACH)
        cv2.arrowedLine(view, (int(fx / DRAW), int(fy / DRAW)), (int(cx / DRAW), int(cy / DRAW)), (0, 0, 255), 2, cv2.LINE_AA, tipLength=0.12)
        cv2.arrowedLine(view, (int(fx / DRAW), int(fy / DRAW)), (int(px / DRAW), int(py / DRAW)), (0, 255, 0), 2, cv2.LINE_AA, tipLength=0.12)
        cv2.circle(view, (int(fx / DRAW), int(fy / DRAW)), 4, (0, 255, 255), -1)
    rows.sort(key=lambda r: -r[0])
    print('bodies over %d px: %d; with a painted shadow found at the foot (darker than the lines to either side by over %.2f): %d' % (AREA, int((stats[1:, 4] >= AREA).sum()), CONTRAST, len(rows)))
    for frame in suns:
        a = np.array([r[4][frame] for r in rows])
        print('frame %s: painted shadow against the cast direction, degrees, positive to the left of the cast: median %.1f, mean %.1f, mean of the size %.1f, quartiles %.1f to %.1f, least %.1f, most %.1f' % (frame, float(np.median(a)), float(a.mean()), float(np.abs(a).mean()), float(np.percentile(a, 25)), float(np.percentile(a, 75)), float(a.min()), float(a.max())))
    for r in rows:
        print('  body %6d px, foot %4d %4d, darkness on the line %.2f, over the lines to either side %.2f: %s' % (r[0], r[1], r[2], r[5], r[6], ' '.join('%s %+.0f' % (k, v) for k, v in r[4].items())))
    cv2.imwrite(out, view, [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == '__main__':
    main()
