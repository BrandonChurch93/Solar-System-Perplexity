import json
import sys
import cv2
import numpy as np

W = 'out/work/venus/relief/'
MX, MB = 352, 792
AW, AH = 2816, 1584
CW, CH = AW + 2 * MX, AH + MB


def lum(a):
    return cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255


def fit(template, image, mask, scale=0.25, blur=6):
    small = lambda v: cv2.resize(cv2.GaussianBlur(lum(v), (0, 0), blur), None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    warp = np.eye(2, 3, dtype=np.float32)
    m = (cv2.resize(mask, None, fx=scale, fy=scale) > 0.99).astype(np.uint8)
    cc, warp = cv2.findTransformECC(small(template), small(image), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), m, 5)
    warp[:, 2] /= scale
    return cc, warp


def lab_match(src, ref, mask):
    a = cv2.cvtColor(src.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)
    b = cv2.cvtColor(ref.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)
    k = mask > 0.5
    for i in range(3):
        a[..., i] = (a[..., i] - a[..., i][k].mean()) * (b[..., i][k].std() / max(a[..., i][k].std(), 1e-4)) + b[..., i][k].mean()
    return np.clip(cv2.cvtColor(a, cv2.COLOR_Lab2BGR) * 255, 0, 255)


def local_match(src, ref, mask, sigma=60):
    out = src.astype(np.float32)
    k = mask.astype(np.float32)
    soft = cv2.GaussianBlur(k, (0, 0), sigma)
    for i in range(3):
        a = cv2.GaussianBlur(out[..., i] * k, (0, 0), sigma) / np.maximum(soft, 1e-3)
        b = cv2.GaussianBlur(ref[..., i].astype(np.float32) * k, (0, 0), sigma) / np.maximum(soft, 1e-3)
        gain = np.clip((b + 4) / (a + 4), 0.6, 1.6)
        gain = gain * np.clip(soft * 4, 0, 1) + 1 - np.clip(soft * 4, 0, 1)
        out[..., i] *= gain
    return np.clip(out, 0, 255)


def main(ext_name, clean_name):
    A = cv2.imread('references/approved/venus-close.jpg')
    canvas = np.zeros((CH, CW, 3), np.uint8)
    canvas[:AH, MX:MX + AW] = A
    core = np.zeros((CH, CW), np.float32)
    core[:AH, MX:MX + AW] = 1
    G = cv2.imread(W + ext_name)
    G = cv2.resize(G, (CW, round(G.shape[0] * CW / G.shape[1])), interpolation=cv2.INTER_CUBIC)
    G = G[:CH] if G.shape[0] >= CH else cv2.copyMakeBorder(G, 0, CH - G.shape[0], 0, 0, cv2.BORDER_REFLECT)
    cc, warp = fit(canvas, G, core)
    print('ext fit', round(float(cc), 4), warp.round(4).tolist())
    Gw = cv2.warpAffine(G, warp, (CW, CH), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    Gm = lab_match(Gw, canvas, core)
    Gm = local_match(Gm, canvas, core)
    inner = cv2.erode(core, np.ones((3, 3), np.uint8), iterations=14)
    w = cv2.GaussianBlur(inner, (0, 0), 7)
    w = np.clip(w * 1.02, 0, 1)
    w[:AH - 40, MX + 40:MX + AW - 40] = np.maximum(w[:AH - 40, MX + 40:MX + AW - 40], 1)
    w[:40, MX:MX + AW] = np.maximum(w[:40, MX:MX + AW], np.clip((np.arange(AW)[None, :] - 0) / 40, 0, 1) * np.clip((AW - 1 - np.arange(AW)[None, :]) / 40, 0, 1))
    out = canvas * w[..., None] + Gm * (1 - w[..., None])
    cv2.imwrite(W + 'ext-3520.png', np.clip(out + 0.5, 0, 255).astype(np.uint8))
    cv2.imwrite(W + 'ext-weight.png', (w * 255).astype(np.uint8))

    C = cv2.imread(W + clean_name)
    C = cv2.resize(C, (AW, AH), interpolation=cv2.INTER_CUBIC)
    keep = np.ones((AH, AW), np.float32)
    keep[700:1100, 1250:2150] = 0
    cc, warp = fit(A, C, keep)
    print('clean fit', round(float(cc), 4), warp.round(4).tolist())
    Cw = cv2.warpAffine(C, warp, (AW, AH), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    Cm = lab_match(Cw, A, keep)
    Cm = local_match(Cm, A, keep, 40)
    cv2.imwrite(W + 'clean-2816.png', np.clip(Cm + 0.5, 0, 255).astype(np.uint8))
    json.dump({'marginX': MX, 'marginBottom': MB, 'approved': [AW, AH], 'canvas': [CW, CH]}, open(W + 'ext.json', 'w'))


main(sys.argv[1], sys.argv[2])
