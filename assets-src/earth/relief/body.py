import json, os, sys
import numpy as np, cv2
from scipy import ndimage as ndi
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geom
import pack

W, H = 2816, 1584
WORK = 'out/work/earth/relief'
PUB = 'public/assets/earth'
STOP = 'src/stops/earth'
MATTE = 'matte-t1'
DEPTH = 1.0
ROUND = 4.0
EDGE = [0.9, 1.0]
CUT = 0.5
RANGE = 0.5
STRETCH = 8
LIT_SHARE = 0.1
FACE = [0.0, 1.0]
THIN = 0.008
STEP = 2


def support():
    m = cv2.imread(f'{WORK}/{MATTE}-aligned.png', cv2.IMREAD_GRAYSCALE)
    if m is None:
        raise SystemExit('missing matte')
    b = ndi.binary_fill_holes((m > 127).astype(np.uint8)).astype(np.uint8)
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(b)
    keep = np.zeros_like(b)
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if a >= 300 and x > 8 and y > 8 and x + w < W - 8 and y + h < H - 8:
            keep[lbl == i] = 1
    solid = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    alpha = cv2.GaussianBlur(solid.astype(np.float32), (0, 0), 1.2)
    return alpha >= EDGE[0]


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    rel = json.load(open(f'{STOP}/relief.json'))
    x0, y0, bw, bh = rel['towers']['box']
    dw, dh = rel['towers']['distSize']
    if (bw // STEP, bh // STEP) != (dw, dh):
        raise SystemExit('box and distSize disagree')
    on = support()
    inside = ndi.distance_transform_edt(on).astype(np.float32)
    n, groups = cv2.connectedComponents(on.astype(np.uint8))
    widest = ndi.maximum(inside, groups, index=np.arange(n)).astype(np.float32)
    r = np.zeros_like(inside)
    for rho in range(1, int(np.ceil(inside.max())) + 1):
        core = (inside >= rho).astype(np.uint8)
        if not core.any():
            break
        r[cv2.distanceTransform(1 - core, cv2.DIST_L2, 5) <= rho] = rho
    r = np.maximum(cv2.GaussianBlur(r, (0, 0), ROUND), inside)
    t = np.clip(inside / np.maximum(r, 1e-6), 0, 1)
    half = r * t * t * (3 - 2 * t) * on
    px = 2 * np.tan(np.radians(geom.VFOV) / 2) / H
    share = (DEPTH * half * px).astype(np.float32)
    body = cv2.resize(share[y0:y0 + bh, x0:x0 + bw], (dw, dh), interpolation=cv2.INTER_AREA).astype('<f4')
    print('bodies: %d, inscribed radius px: median %.1f, largest %.1f; half depth as share of the distance: largest %.4f' % (n - 1, float(np.median(widest[1:])), float(widest.max()), float(body.max())))
    tex = cv2.imread(f'{PUB}/full/' + rel['towers']['file'], cv2.IMREAD_UNCHANGED)
    solid = tex[..., 3] >= EDGE[0] * 255
    colour = tex[..., 2::-1][solid].astype(np.float32) / tex[..., 3:4][solid].astype(np.float32)
    luma = colour @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    lit = [round(float(v), 3) for v in colour[luma >= np.percentile(luma, 100 * (1 - LIT_SHARE))].mean(0)]
    print('lit tone of the towers: mean colour of the brightest %.2f of their closed texels:' % LIT_SHARE, lit)
    if out:
        os.makedirs(out, exist_ok=True)
        pack.write(f'{out}/relief-body.bin', body)
        view = np.clip(share / max(float(share.max()), 1e-6) * 255, 0, 255).astype(np.uint8)
        cv2.imwrite(f'{out}/relief-body.jpg', cv2.resize(cv2.applyColorMap(view, cv2.COLORMAP_INFERNO), (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
        return
    for key in ('full', 'web'):
        pack.write(f'{PUB}/{key}/relief-body.bin', body)
        print(f'{PUB}/{key}/relief-body.bin', body.shape[::-1], round(os.path.getsize(f'{PUB}/{key}/relief-body.bin') / 1e6, 2), 'MB')
    rel['towers']['body'] = 'relief-body.bin'
    rel['towers']['edge'] = EDGE
    rel['towers']['cut'] = CUT
    rel['towers']['range'] = RANGE
    rel['towers']['stretch'] = STRETCH
    rel['towers']['lit'] = lit
    rel['towers']['face'] = FACE
    rel['towers']['thin'] = THIN
    json.dump(rel, open(f'{STOP}/relief.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
