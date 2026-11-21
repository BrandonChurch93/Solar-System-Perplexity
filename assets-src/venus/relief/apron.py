import json
import subprocess
import sys
import cv2
import numpy as np

sys.path.insert(0, 'assets-src/venus/relief')
from cam import *

OUT = 'public/assets/venus/'
NEW, CTX, Y0 = 1296, 672, 900
REACH, OV, AY = 1760, 160, 648
K = 2
AWID, AHGT = REACH + OV, CH - AY


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def gray(a):
    return cv2.GaussianBlur(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, (0, 0), 1.5)


def side(name, take_path, canvas, d0):
    left = name == 'l'
    fw, fh = NEW + CTX, CH - Y0
    take = cv2.resize(cv2.imread(take_path), (fw, fh), interpolation=cv2.INTER_AREA)
    ref = np.zeros_like(take)
    mask = np.zeros((fh, fw), np.uint8)
    if left:
        ref[:, NEW:] = canvas[Y0:, :CTX]
        mask[:, NEW + 24:fw - 8] = 255
    else:
        ref[:, :CTX] = canvas[Y0:, CW - CTX:]
        mask[:, 8:CTX - 24] = 255
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(gray(ref), gray(take), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), mask, 5)
    take = cv2.warpAffine(take, warp, (fw, fh), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    near = np.zeros((fh, fw), bool)
    if left:
        near[:, NEW + 8:NEW + 420] = True
    else:
        near[:, CTX - 420:CTX - 8] = True
    tl = cv2.cvtColor(take.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)
    rl = cv2.cvtColor(ref.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)
    gains = []
    for c in range(3):
        mt, st, mr, sr = tl[..., c][near].mean(), tl[..., c][near].std(), rl[..., c][near].mean(), rl[..., c][near].std()
        g = float(np.clip(sr / max(st, 1e-3), 0.75, 1.3))
        tl[..., c] = (tl[..., c] - mt) * g + mr
        gains.append([round(float(mt), 2), round(float(mr), 2), round(g, 3)])
    take = np.clip(cv2.cvtColor(tl, cv2.COLOR_Lab2BGR), 0, 1) * 255
    err = float(np.abs(take - ref.astype(np.float32))[near].mean())
    print(name, 'ecc', round(float(cc), 4), 'lab mean take, canvas, gain', gains, 'context mean abs diff', round(err, 2))

    ap = np.zeros((AHGT, AWID, 3), np.float32)
    fill = np.zeros_like(ap)
    if left:
        fill[:, :REACH] = canvas[AY:, :REACH][:, ::-1]
        fill[:, REACH:] = canvas[AY:, :OV]
    else:
        fill[:, OV:] = canvas[AY:, CW - REACH:][:, ::-1]
        fill[:, :OV] = canvas[AY:, CW - OV:]
    body = np.zeros_like(ap)
    y = Y0 - AY
    extra = REACH - NEW
    if left:
        body[y:, extra:] = take[:, :NEW + OV]
        body[y:, :extra] = take[:, :extra][:, ::-1]
    else:
        body[y:, :OV + NEW] = take[:, CTX - OV:]
        body[y:, OV + NEW:] = take[:, fw - extra:][:, ::-1]
    rows = np.arange(AHGT, dtype=np.float32)[:, None, None]
    w = smooth(y + 8, y + 150, rows)
    ap = fill * (1 - w) + body * w
    p1 = W + f'apron-{name}-1x.png'
    p2 = W + f'apron-{name}-2x.png'
    cv2.imwrite(p1, np.clip(ap + 0.5, 0, 255).astype(np.uint8))
    if not DIST_ONLY:
        subprocess.run(['python3', 'tools/ml/upscale.py', '--in', p1, '--out', p2, '--width', str(AWID * K)], check=True)
        big = cv2.imread(p2)
        cv2.imwrite(f'{OUT}full/relief-A{name}-color.jpg', big, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(f'{OUT}web/relief-A{name}-color.jpg', cv2.resize(big, (AWID, AHGT), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])

    x0 = -REACH if left else CW - OV
    yy, xx = np.mgrid[AY:CH, x0:x0 + AWID].astype(np.float32)
    S, hit = sphere(rays(xx + 0.5, yy + 0.5))
    el = elevation(rays(xx + 0.5, yy + 0.5))
    Ss = np.where(hit, S, HORIZON)
    cols = slice(0, 12) if left else slice(CW - 12, CW)
    ey, ex = np.mgrid[AY:CH, cols].astype(np.float32)
    Se, he = sphere(rays(ex + 0.5, ey + 0.5))
    rho = np.where(he, d0[AY:, cols] / np.where(he, Se, 1), 1).mean(1)
    rho = cv2.GaussianBlur(rho.astype(np.float32)[:, None], (0, 0), 24)[:, 0]
    far = cv2.GaussianBlur(rho[:, None], (0, 0), 160)[:, 0]
    rbar = float(np.median(far))
    beyond = (-xx - 0.5) if left else (xx + 0.5 - CW)
    t = smooth(0, 500, beyond)
    D = (1 - (1 - (rho[:, None] * (1 - t) + far[:, None] * t)) * (1 - smooth(-3.0, -0.8, el) * t)) * Ss
    inside = beyond < 0
    xi = np.clip(xx.astype(np.int64), 0, CW - 1)
    D = np.where(inside, d0[yy.astype(np.int64), xi], D)
    D = np.where(hit & (el < -0.03), D, HORIZON).astype(np.float32)
    for key, size in (('full', (AWID // 2, AHGT // 2)), ('web', (AWID // 4, AHGT // 4))):
        cv2.resize(D, size, interpolation=cv2.INTER_AREA).astype('<f4').tofile(f'{OUT}{key}/relief-A{name}-dist.bin')
    print(name, 'edge ratio median', round(rbar, 3), 'dist', float(D.min()), float(D.max()))
    return {'box': [(x0 - MX) * K, AY * K, AWID * K, AHGT * K], 'distSize': {'full': [AWID // 2, AHGT // 2], 'web': [AWID // 4, AHGT // 4]}, 'alpha': False, 'under': True}


def main(lt, rt):
    canvas = cv2.imread(W + 'canvas-1x.png')
    d0 = np.load(W + 'd0.npy')
    layers = {'Al': side('l', lt, canvas, d0), 'Ar': side('r', rt, canvas, d0)}
    json.dump({'order': ['Al', 'Ar'], 'edge': [OV / CW, OV / CW], 'layers': layers}, open('src/stops/venus/aprons.json', 'w'), indent=1)
    print(json.dumps(layers))


DIST_ONLY = len(sys.argv) > 3 and sys.argv[3] == 'dist'
main(sys.argv[1], sys.argv[2])
