import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.interpolate import PchipInterpolator

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, lum  # noqa: E402

REF = ROOT / "references" / "approved" / "saturn-close.jpg"
SRC = {"full": WORK / "close-x2.png", "web": REF}
JPTS = np.array([[1383, 718], [1400, 724.5], [1425, 735], [1450, 745.5], [1475, 757], [1500, 768], [1550, 782], [1600, 795], [1650, 806], [1700, 815.5], [1800, 838], [1900, 858], [2000, 877.5], [2100, 895.5], [2200, 912.5], [2300, 928], [2400, 942.5], [2500, 955.5], [2600, 967.5], [2700, 978], [2816, 989]], np.float64)
HEAD = [[1392, 687], [1389, 700], [1385, 711]]
LUM = (45.0, 85.0)
RISE = 60.0
BELOW = 6
ABOVE = 12
RUN = 160
UNDER = 18
STEP = 6
TOP = 1.0
GHOST = [[1380, 730], [1375, 760], [1369, 795], [1362, 833]]
ZONE = (50.0, 230.0)


def disc(poly, w, h):
    globe = np.zeros((h * 4, w * 4), np.uint8)
    cv2.fillPoly(globe, [np.round(poly * 4).astype(np.int32)], 255)
    return cv2.resize(globe, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def ring_alpha():
    img = cv2.imread(str(REF))
    h, w = img.shape[:2]
    limb = np.load(WORK / "close-limb.npy")
    jx = np.arange(JPTS[0, 0], JPTS[-1, 0] + 1, 4.0)
    line = np.stack([jx, PchipInterpolator(JPTS[:, 0], JPTS[:, 1])(jx)], -1)
    junction = np.concatenate([HEAD, line])
    poly = np.concatenate([limb, junction, [[w, 0], [limb[0, 0], 0]]])
    seen = disc(poly, w, h)
    push = lambda p: p + np.stack([UNDER * np.clip((p[:, 1] - 540) / 60, 0, 1), np.zeros(len(p))], -1)
    foot = np.array([[JPTS[0, 0] + UNDER, float(PchipInterpolator(JPTS[:, 0], JPTS[:, 1])(JPTS[0, 0] + UNDER))]])
    globe = disc(np.concatenate([push(limb), push(np.array(HEAD, np.float64)), foot, line[line[:, 0] > JPTS[0, 0] + UNDER], [[w, 0], [limb[0, 0], 0]]]), w, h)
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
    alpha = alpha * (1 - globe)
    edge_y = np.concatenate([limb[limb[:, 1] > 520][:, 1], np.array(HEAD, np.float64)[:, 1], [JPTS[0, 1]]])
    edge_x = np.concatenate([limb[limb[:, 1] > 520][:, 0], np.array(HEAD, np.float64)[:, 0], [JPTS[0, 0]]])
    order = np.argsort(edge_y)
    carry = {"y": edge_y[order], "x": edge_x[order], "slope": float(fit[0]), "zone": (seen > 0.02) & (globe < 0.98) & (rows > 540) & (rows < JPTS[0, 1] + 12)}
    trace = np.concatenate([np.stack([edge_x[order], edge_y[order]], -1)[edge_y[order] > float(np.polyval(fit, JPTS[0, 0])) - ABOVE], GHOST])
    canvas = np.full((h, w), 255, np.uint8)
    cv2.polylines(canvas, [np.round(trace).astype(np.int32)], False, 0, 1)
    far = cv2.distanceTransform(canvas, cv2.DIST_L2, 5)
    zone = np.clip((far - ZONE[0]) / (ZONE[1] - ZONE[0]), 0, 1)
    zone = 1 - zone * zone * (3 - 2 * zone)
    print("ring horizon at x 50, 300, 700, 1000, 1200, 1350:", [round(float(horizon[x]), 1) for x in (50, 300, 700, 1000, 1200, 1350)], "ring share", round(float((alpha > 0.5).mean()), 3))
    return alpha.astype(np.float32), zone.astype(np.float32), carry


def carried(img, carry, k):
    h, w = img.shape[:2]
    rows = np.arange(h, dtype=np.float32)
    limb_x = np.interp((rows + 0.5) / k, carry["y"], carry["x"]).astype(np.float32) * k
    xs, ys = np.meshgrid(np.arange(w, dtype=np.float32), rows)
    from_x = limb_x[:, None] - STEP * k
    reach = np.maximum(xs - from_x, 0)
    src_y = ys - reach * carry["slope"]
    src_x = np.interp(src_y.ravel() / k, carry["y"], carry["x"]).reshape(h, w).astype(np.float32) * k - STEP * k
    filled = cv2.remap(img, src_x, src_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    zone = cv2.resize(carry["zone"].astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST) > 0 if k > 1 else carry["zone"]
    take = zone & (xs >= from_x)
    return np.where(take[..., None], filled, img)


def build(key, alpha, zone, carry):
    src = SRC[key] if SRC[key].exists() else REF
    img = cv2.imread(str(src), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    k = w / alpha.shape[1]
    img = carried(img, carry, k)
    a = cv2.resize(alpha, (w, h), interpolation=cv2.INTER_LINEAR) if k > 1 else alpha
    known = (a > 0.6).astype(np.float32)
    col = img.astype(np.float32) * known[..., None]
    acc = known.copy()
    for s in (2, 5, 12, 30):
        blur = cv2.GaussianBlur(col, (0, 0), s * k)
        wb = cv2.GaussianBlur(acc, (0, 0), s * k)
        fill = (acc < 0.5) & (wb > 0.02)
        col[fill] = blur[fill] / wb[fill][:, None]
        acc[fill] = 1
    out = np.clip(np.where((a > 0.6)[..., None], img.astype(np.float32), col), 0, 255).astype(np.uint8)
    dst = ROOT / "public" / "assets" / "saturn" / key
    cv2.imwrite(str(dst / "skim-rings.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    mask = np.zeros(alpha.shape + (3,), np.uint8)
    mask[..., 2] = np.clip(alpha * 255 + 0.5, 0, 255)
    mask[..., 1] = 255
    mask[..., 0] = np.clip(zone * 255 + 0.5, 0, 255)
    cv2.imwrite(str(dst / "skim-rings-mask.png"), mask, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    view = cv2.resize(np.concatenate([out, cv2.resize(mask, (w, h))], axis=1), None, fx=1408 / w, fy=1408 / w, interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(WORK / f"skim-rings-{key}.jpg"), view)
    print(key, src.name, w, h)


if __name__ == "__main__":
    alpha, zone, carry = ring_alpha()
    for key in sys.argv[1:] or ["full", "web"]:
        build(key, alpha, zone, carry)
