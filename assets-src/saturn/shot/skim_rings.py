import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.interpolate import PchipInterpolator

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, calm, lum  # noqa: E402

REF = ROOT / "references" / "approved" / "saturn-close.jpg"
SRC = {"full": WORK / "close-x2.png", "web": REF}
JPTS = np.array([[1383, 718], [1400, 724.5], [1425, 735], [1450, 745.5], [1475, 757], [1500, 768], [1550, 782], [1600, 795], [1650, 806], [1700, 815.5], [1800, 838], [1900, 858], [2000, 877.5], [2100, 895.5], [2200, 912.5], [2300, 928], [2400, 942.5], [2500, 955.5], [2600, 967.5], [2700, 978], [2816, 989]], np.float64)
HEAD = [[1392, 687], [1389, 700], [1385, 711]]
LUM = (45.0, 85.0)
RISE = 60.0
BELOW = 6
ABOVE = 12
RUN = 160
UNDER = 3
OUT = 3
TOP = 1.0
GHOST = [[1380, 730], [1375, 760], [1369, 795], [1362, 833]]
ZONE = (50.0, 230.0)
VEIL = (46.0, 62.0, 84.0)
VEIL_RUN = 20
VEIL_MAX = 0.5
VEIL_LEFT = 150.0
VEIL_LIMB = (22.0, 80.0)


def disc(poly, w, h):
    globe = np.zeros((h * 4, w * 4), np.uint8)
    cv2.fillPoly(globe, [np.round(poly * 4).astype(np.int32)], 255)
    return cv2.resize(globe, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def scene(v):
    c = v / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    y = np.clip(c, 0, 0.985)
    k = 0.59 * y - 0.03
    return (-k - np.sqrt(np.maximum(k * k - 4 * (2.43 * y - 2.51) * 0.14 * y, 0))) / (2 * (2.43 * y - 2.51))


def fill(img, known, k=1.0):
    col = img.astype(np.float32) * known[..., None]
    acc = known.copy()
    for s in (2, 5, 12, 30, 70):
        blur = cv2.GaussianBlur(col, (0, 0), s * k)
        wb = cv2.GaussianBlur(acc, (0, 0), s * k)
        hole = (acc < 0.5) & (wb > 0.02)
        col[hole] = blur[hole] / wb[hole][:, None]
        acc[hole] = 1
    return col


def veil(img, alpha, line, globe):
    h, w = img.shape[:2]
    n = len(line)
    d = np.arange(-4, VEIL[2] + 1, dtype=np.float32)
    mx = np.tile(np.arange(n, dtype=np.float32), (len(d), 1))
    my = line[None, :].astype(np.float32) - d[:, None]
    grey = lambda a: lum(scene(a[..., ::-1].astype(np.float64))).astype(np.float32)
    strip = cv2.remap(grey(img), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    body = cv2.remap(globe, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    strip[body > 0.02] = np.nan
    pad = np.pad(strip, ((0, 0), (VEIL_RUN, VEIL_RUN)), constant_values=np.nan)
    calm = np.nanmedian(np.stack([pad[:, i:i + n] for i in range(2 * VEIL_RUN + 1)]), axis=0)
    calm = np.where(np.isnan(calm), 0, calm)
    sky = np.median(calm[(d >= VEIL[1]) & (d <= VEIL[2])], axis=0)
    sky = cv2.GaussianBlur(sky.reshape(1, -1), (0, 0), 12, borderType=cv2.BORDER_REPLICATE).ravel()
    ring = cv2.remap(grey(fill(img, (alpha > 0.6).astype(np.float32))), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    a = np.clip((calm - sky[None, :]) / np.maximum(ring - sky[None, :], 1e-4), 0, VEIL_MAX)
    top = np.clip((VEIL[1] - d) / (VEIL[1] - VEIL[0]), 0, 1)[:, None]
    foot = np.clip(d / 4.0, 0, 1)[:, None]
    side = np.clip(np.arange(n) / VEIL_LEFT, 0, 1)[None, :]
    ease = lambda t: t * t * (3 - 2 * t)
    away = cv2.remap(cv2.distanceTransform((globe < 0.5).astype(np.uint8), cv2.DIST_L2, 5), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    a = cv2.GaussianBlur(a * ease(top) * ease(foot) * ease(side) * ease(np.clip((away - VEIL_LIMB[0]) / (VEIL_LIMB[1] - VEIL_LIMB[0]), 0, 1)), (0, 0), 0.7)
    rows = np.arange(h, dtype=np.float32)[:, None]
    out = np.zeros((h, w), np.float32)
    out[:, :n] = cv2.remap(a, np.tile(np.arange(n, dtype=np.float32), (h, 1)), line[None, :].astype(np.float32) - rows + 4, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    print("veil above the ring horizon: alpha median, p90, max", [round(float(v), 3) for v in (np.median(a[a > 0.004]), np.percentile(a[a > 0.004], 90), a.max())], "sky level by column 100, 700, 1300:", [round(float(sky[x]), 4) for x in (100, 700, 1300)])
    return out


def ring_alpha():
    img = cv2.imread(str(REF))
    h, w = img.shape[:2]
    limb = np.load(WORK / "close-limb.npy")
    jx = np.arange(JPTS[0, 0], JPTS[-1, 0] + 1, 4.0)
    line = np.stack([jx, PchipInterpolator(JPTS[:, 0], JPTS[:, 1])(jx)], -1)
    junction = np.concatenate([HEAD, line])
    poly = np.concatenate([limb, junction, [[w, 0], [limb[0, 0], 0]]])
    push = lambda p: p + np.stack([UNDER * np.clip((p[:, 1] - 540) / 60, 0, 1), np.zeros(len(p))], -1)
    foot = np.array([[JPTS[0, 0] + UNDER, float(PchipInterpolator(JPTS[:, 0], JPTS[:, 1])(JPTS[0, 0] + UNDER))]])
    globe = disc(np.concatenate([push(limb), push(np.array(HEAD, np.float64)), foot, line[line[:, 0] > JPTS[0, 0] + UNDER], [[w, 0], [limb[0, 0], 0]]]), w, h)
    pull = lambda p: p - np.stack([OUT * np.clip((p[:, 1] - 540) / 60, 0, 1), np.zeros(len(p))], -1)
    under = disc(np.concatenate([pull(limb), pull(np.array(HEAD, np.float64)), line, [[w, 0], [limb[0, 0], 0]]]), w, h) * (1 - globe)
    y = lum(cv2.GaussianBlur(img, (0, 0), 0.8)[..., ::-1].astype(np.float32))
    wide = cv2.blur(y, (1, 12), anchor=(0, 0))
    left = int(JPTS[0, 0])
    horizon = np.full(w, -1.0)
    for x in range(left):
        hit = np.nonzero((y[480:760, x] > RISE) & (wide[480:760, x] > RISE + 10))[0]
        horizon[x] = 480 + hit[0] if len(hit) else np.nan
    idx = np.arange(left)
    good = ~np.isnan(horizon[:left])
    line = np.interp(idx, idx[good], horizon[:left][good])
    line = np.array([np.median(line[max(i - 6, 0):i + 7]) for i in range(left)])
    horizon[:left] = cv2.GaussianBlur(line.reshape(1, -1).astype(np.float32), (0, 0), 4).ravel()
    rows = np.arange(h, dtype=np.float32)[:, None]
    soft = np.clip((y - LUM[0]) / (LUM[1] - LUM[0]), 0, 1)
    soft = soft * soft * (3 - 2 * soft)
    edge = horizon[None, :]
    alpha = np.where(rows > edge + BELOW, 1.0, np.where(rows > edge - ABOVE, soft, 0.0))
    base = PchipInterpolator(JPTS[:, 0], JPTS[:, 1])(np.arange(left, w) + 0.5)
    fit = np.polyfit(idx[left - RUN:left - 8], horizon[left - RUN:left - 8], 1)
    reach = np.arange(left, int(limb[:, 0].min()) + 40)
    carried = np.polyval(fit, reach)[None, :]
    wedge = np.clip(rows - carried - TOP, 0, 1)
    alpha[:, left:] = (rows > base[None, :] - 1.0).astype(np.float32)
    alpha[:, reach] = np.maximum(alpha[:, reach], wedge)
    alpha = np.maximum(alpha, veil(img, alpha, np.concatenate([horizon[:left], np.polyval(fit, reach)]), globe)) * (1 - globe)
    edge = np.concatenate([limb[limb[:, 1] > 520], np.array(HEAD, np.float64), JPTS[:1]])
    edge = edge[np.argsort(edge[:, 1])]
    trace = np.concatenate([edge[edge[:, 1] > float(np.polyval(fit, JPTS[0, 0])) - ABOVE], GHOST])
    canvas = np.full((h, w), 255, np.uint8)
    cv2.polylines(canvas, [np.round(trace).astype(np.int32)], False, 0, 1)
    far = cv2.distanceTransform(canvas, cv2.DIST_L2, 5)
    zone = np.clip((far - ZONE[0]) / (ZONE[1] - ZONE[0]), 0, 1)
    zone = 1 - zone * zone * (3 - 2 * zone)
    print("ring horizon at x 50, 300, 700, 1000, 1200, 1350:", [round(float(horizon[x]), 1) for x in (50, 300, 700, 1000, 1200, 1350)], "ring share", round(float((alpha > 0.5).mean()), 3))
    print("under zone pixels", int((under > 0.5).sum()), "of them ring", int(((under > 0.5) & (alpha > 0.5)).sum()))
    return alpha.astype(np.float32), zone.astype(np.float32), under.astype(np.float32)


def build(key, alpha, zone, under):
    src = SRC[key] if SRC[key].exists() else REF
    img = cv2.imread(str(src), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    k = w / alpha.shape[1]
    a = cv2.resize(alpha, (w, h), interpolation=cv2.INTER_LINEAR) if k > 1 else alpha
    ring = cv2.GaussianBlur(cv2.erode((a > 0.98).astype(np.uint8), np.ones((int(4 * k) | 1,) * 2, np.uint8)).astype(np.float32), (0, 0), 2 * k)
    img, share = calm(img, ring, k)
    print(key, "share of ring texels calmed", round(share, 4))
    col = fill(img, (a > 0.6).astype(np.float32), k)
    out = np.clip(np.where((a > 0.6)[..., None], img.astype(np.float32), col), 0, 255).astype(np.uint8)
    dst = ROOT / "public" / "assets" / "saturn" / key
    cv2.imwrite(str(dst / "skim-rings.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    mask = np.zeros(alpha.shape + (3,), np.uint8)
    mask[..., 2] = np.clip(alpha * 255 + 0.5, 0, 255)
    mask[..., 1] = np.clip(255 - 127 * under + 0.5, 0, 255)
    mask[..., 0] = np.clip(zone * 255 + 0.5, 0, 255)
    cv2.imwrite(str(dst / "skim-rings-mask.png"), mask, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    view = cv2.resize(np.concatenate([out, cv2.resize(mask, (w, h))], axis=1), None, fx=1408 / w, fy=1408 / w, interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(WORK / f"skim-rings-{key}.jpg"), view)
    print(key, src.name, w, h)


if __name__ == "__main__":
    alpha, zone, under = ring_alpha()
    for key in sys.argv[1:] or ["full", "web"]:
        build(key, alpha, zone, under)
