import json, sys, numpy as np, cv2
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H, F, U, R, DIP
from viewer import load, pose, render
mode = sys.argv[1]
if mode == 'identity':
    up = cv2.imread('out/work/mars-upscaled.png').astype(np.float32) / 255
    Ls = load('full')
    mg = json.load(open('assets-src/mars/relief/relief.json')).get('margin', dict(left=0, right=0, bottom=0))
    ox = mg['left']
    acc = np.zeros((up.shape[0] + mg['bottom'], up.shape[1] + mg['left'] + mg['right'], 3), np.float32); cov = np.zeros(acc.shape[:2], np.float32)
    for L in Ls:
        x0, y0, x1, y1 = [int(v) for v in L['box']]
        x0 += ox; x1 += ox
        a = L['alpha'][..., None]
        acc[y0:y1, x0:x1] = acc[y0:y1, x0:x1] * (1 - a) + L['color'] * a
        cov[y0:y1, x0:x1] = cov[y0:y1, x0:x1] * (1 - a[..., 0]) + a[..., 0]
    if ox or mg['bottom']:
        cv2.imwrite('out/work/identity-ext.jpg', np.clip(acc * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
        extcov = cov.copy()
    acc = acc[:up.shape[0], ox:ox + up.shape[1]]; cov = cov[:up.shape[0], ox:ox + up.shape[1]]
    ground = cov > 0.999
    d = np.abs(acc - up)[ground] * 255
    res = dict(groundPixels=int(ground.sum()), meanAbs=float(d.mean()), p99=float(np.percentile(d, 99)), p999=float(np.percentile(d, 99.9)), max=float(d.max()),
               fracOver4=float((d.max(-1) > 4).mean()))
    a0 = cv2.resize(acc, (W, H), interpolation=cv2.INTER_AREA); o = cv2.imread('references/approved/mars-close.jpg').astype(np.float32) / 255
    g2 = cv2.resize(cov, (W, H), interpolation=cv2.INTER_AREA) > 0.999
    d2 = np.abs(a0 - o)[g2] * 255
    res['vsApprovedAt2816'] = dict(meanAbs=float(d2.mean()), p99=float(np.percentile(d2, 99)), psnr=float(10 * np.log10(255 ** 2 / np.mean(d2 ** 2))))
    print(json.dumps(res, indent=1))
    json.dump(res, open('out/work/identity.json', 'w'), indent=1)
    big = (np.abs(acc - up).max(-1) * 255 > 4) & ground
    cv2.imwrite('out/work/identity-diff.png', (cv2.resize(big.astype(np.float32), (W // 2, H // 2), interpolation=cv2.INTER_AREA) > 0) * 255)
    Ls2 = load('full')
    img, c, st = render(Ls2, np.zeros(3), np.eye(3), W)
    g3 = (c > 0.999)
    d3 = np.abs(img - o)[g3] * 255
    print('splat render at identity vs approved: mean', d3.mean(), 'psnr', 10 * np.log10(255 ** 2 / np.mean(d3 ** 2)), 'stretch', st)
else:
    Ls = load('full')
    out_w = int(sys.argv[2]) if len(sys.argv) > 2 else 1408
    rows = []
    sgn = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    for f in [float(v) for v in sys.argv[3].split(',')]:
        C, Rm = pose(forward=f, rise=0.3 * f, pan_deg=sgn * 3.0 * f)
        img, cov, st = render(Ls, C, Rm, out_w)
        out_h = img.shape[0]
        xx = (np.arange(out_w) + 0.5) * (W / out_w); yy = (np.arange(out_h) + 0.5) * (W / out_w)
        X, Y = np.meshgrid(xx, yy)
        d = np.stack([X - W / 2, -(Y - H / 2), -np.full_like(X, F)], -1); d /= np.linalg.norm(d, axis=-1, keepdims=True)
        h = 1 + float(C @ U)
        el = np.arcsin(np.clip((d @ Rm.T) @ U, -1, 1))
        dip = np.arccos(R / (R + h))
        need = el < -(dip + np.radians(0.6))
        holes = need & (cov < 0.98)
        n, lab, sts, _ = cv2.connectedComponentsWithStats(holes.astype(np.uint8), connectivity=8)
        edge_zone = np.zeros_like(holes); edge_zone[:, :3] = 1; edge_zone[:, -3:] = 1; edge_zone[-3:] = 1
        edge_zone |= cv2.dilate((~need).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & (cov < 0.5)
        ids = np.unique(lab[holes & edge_zone])
        exposed = np.isin(lab, ids[ids > 0])
        crack = holes & ~exposed
        rows.append(dict(forward=f, rise=round(0.3 * f, 4), panDeg=round(sgn * 3.0 * f, 4), exposedPx=int(exposed.sum()), crackPx=int(crack.sum()), longestCrack=int(max([max(sts[i, 2], sts[i, 3]) for i in range(1, n) if not np.isin(i, ids)] or [0])), stretchMax=st))
        print(rows[-1], flush=True)
        cv2.imwrite(f'out/work/view-{out_w}-{f:.2f}-{sgn:+.0f}.png', np.clip(img * 255, 0, 255).astype(np.uint8))
        cv2.imwrite(f'out/work/holes-{out_w}-{f:.2f}-{sgn:+.0f}.png', holes.astype(np.uint8) * 255)
    json.dump(rows, open(f'out/work/sweep-{out_w}-{sgn:+.0f}.json', 'w'), indent=1)
