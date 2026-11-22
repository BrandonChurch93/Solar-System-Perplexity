import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK  # noqa: E402

REF = ROOT / "references" / "approved" / "saturn-close.jpg"
APRON = WORK / "apron" / "apron-2k.png"
APRON_MASK = WORK / "apron" / "apron-2k-mask.png"
LEFT, RIGHT, BELOW = 0.75, 0.25, 1.0
FW, FH = 1920, 1080
LEVELS = 6
VIGNETTE = 0.45
SKY = (15.0, 10.0, 7.0)
SCALE = 4.0
SIZE = (960, 540)


def decode(v):
    c = v / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def encode(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055) * 255.0


def filmic(x):
    x = np.maximum(x, 0)
    return np.clip((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    k = 0.59 * y - 0.03
    return (-k - np.sqrt(np.maximum(k * k - 4 * (2.43 * y - 2.51) * 0.14 * y, 0))) / (2 * (2.43 * y - 2.51))


def vignette(w, h, x0, y0):
    xs = np.clip((np.arange(w) + 0.5 - x0) / FW, 0, 1) - 0.5
    ys = np.clip((np.arange(h) + 0.5 - y0) / FH, 0, 1) - 0.5
    r2 = (xs[None, :] * FW / FH) ** 2 + ys[:, None] ** 2
    return 1 + VIGNETTE * (1 / (1 + 0.9 * r2) ** 2 - 1)


def scene():
    w, h = int(round(FW * (1 + LEFT + RIGHT))), int(round(FH * (1 + BELOW)))
    x0 = int(round(FW * LEFT))
    apron = cv2.resize(cv2.imread(str(APRON)), (w, h), interpolation=cv2.INTER_AREA).astype(np.float32)
    mask = cv2.resize(cv2.imread(str(APRON_MASK), cv2.IMREAD_GRAYSCALE), (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    apron = apron * mask[..., None] + np.array(SKY, np.float32) * (1 - mask[..., None])
    ref = cv2.resize(cv2.imread(str(REF)), (FW, FH), interpolation=cv2.INTER_AREA).astype(np.float32)
    apron[0:FH, x0:x0 + FW] = ref
    lin = inverse_filmic(decode(apron[..., ::-1].astype(np.float64))) / vignette(w, h, x0, 0)[..., None]
    return lin.astype(np.float32), x0


def sample(img, u, v):
    h, w = img.shape[:2]
    return cv2.remap(img, (u * w - 0.5).astype(np.float32), (v * h - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def grid(w, h):
    u, v = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    return u.astype(np.float32), v.astype(np.float32)


def down(src, first):
    sh, sw = src.shape[:2]
    w, h = max(2, -(-sw // 2)), max(2, -(-sh // 2))
    if first:
        src = np.clip(src, 0, 64)
        src = src / (1 + src.max(axis=2, keepdims=True) * 0.02)
    u, v = grid(w, h)
    tx, ty = 1 / sw, 1 / sh
    taps = [((0, 0), 0.125)] + [((a, b), 0.03125) for a in (-2, 2) for b in (-2, 2)] + [((a, b), 0.0625) for a, b in ((0, 2), (-2, 0), (2, 0), (0, -2))] + [((a, b), 0.125) for a in (-1, 1) for b in (-1, 1)]
    out = np.zeros((h, w, 3), np.float32)
    for (a, b), k in taps:
        out += k * sample(src, u + a * tx, v + b * ty)
    return out


def up(acc, base):
    h, w = base.shape[:2]
    ah, aw = acc.shape[:2]
    u, v = grid(w, h)
    tx, ty = 1 / aw, 1 / ah
    s = np.zeros((h, w, 3), np.float32)
    for a in (-1, 0, 1):
        for b in (-1, 0, 1):
            s += (2 - abs(a)) * (2 - abs(b)) * sample(acc, u + a * tx, v + b * ty)
    return s / 16 + base


def bloom(lin):
    downs = []
    src = lin
    for i in range(LEVELS):
        src = down(src, i == 0)
        downs.append(src)
    acc = downs[-1]
    for i in range(LEVELS - 2, -1, -1):
        acc = up(acc, downs[i])
    return acc / LEVELS


def build():
    lin, x0 = scene()
    b = bloom(lin)
    np.save(str(WORK / "skim-bloom.npy"), b)
    small = cv2.resize(b, SIZE, interpolation=cv2.INTER_AREA)
    code = np.clip(np.sqrt(np.clip(small / SCALE, 0, 1)) * 255 + 0.5, 0, 255).astype(np.uint8)
    for key in ("full", "web"):
        cv2.imwrite(str(ROOT / "public" / "assets" / "saturn" / key / "skim-bloom.png"), code[..., ::-1], [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print("scene", lin.shape, "bloom", b.shape, "max", float(b.max()), "median over the frame", np.round(np.median(b[0:FH // 2, x0 // 2:(x0 + FW) // 2].reshape(-1, 3), axis=0), 4))
    (ROOT / "src/stops/saturn/bloom.json").write_text(json.dumps({"source": "assets-src/saturn/shot/skim_bloom.py, the glow the lens chain adds to the approved close image, computed with the chain's own filter", "file": "skim-bloom.png", "scale": SCALE, "levels": LEVELS}, indent=1) + "\n")


def check(with_bloom, without_bloom, strength=0.08):
    lin, x0 = scene()
    b = cv2.resize(np.load(str(WORK / "skim-bloom.npy")), (lin.shape[1], lin.shape[0]), interpolation=cv2.INTER_LINEAR)[0:FH, x0:x0 + FW]
    vig = vignette(FW, FH, 0, 0)[..., None]
    a = cv2.imread(str(with_bloom))[..., ::-1].astype(np.float64)
    n = cv2.imread(str(without_bloom))[..., ::-1].astype(np.float64)
    s = inverse_filmic(decode(n)) / vig
    pred = encode(filmic(((1 - strength) * s + strength * b) * vig))
    box = lambda x: cv2.blur(x, (9, 9))
    lum = n.mean(axis=2)
    for lo, hi in ((0, 12), (12, 30), (30, 60), (60, 120), (120, 200)):
        sel = (lum >= lo) & (lum < hi)
        sel[:560] = False
        print("levels", lo, hi, "pixels", int(sel.sum()), "measured lift", np.round((box(a) - box(n))[sel].mean(axis=0), 2), "predicted lift", np.round((box(pred) - box(n))[sel].mean(axis=0), 2))


if __name__ == "__main__":
    if sys.argv[1] == "build":
        build()
    elif sys.argv[1] == "check":
        check(Path(sys.argv[2]), Path(sys.argv[3]))
