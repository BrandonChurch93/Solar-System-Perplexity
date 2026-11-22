import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import geo

LOOK = geo.ROOT / "src" / "stops" / "earth"
FILL = geo.WORK / "sky" / "fill-t1.png"
PA = (2.0, 92.0)
LOW, TOP = -0.03, 0.27
W, H = 2048, 448
FLOOR = 0.004
RAY = 23
ANGLES = (-60, -45, -30, -15, 0, 15, 30)
GREEN_RED = 0.2
LEAN = ((500, 0.15), (1450, 0.95))
RED_TINT = (1.0, 0.12, 0.10)
RED_SOFT = (6, 14)
TINT = (0.2, 1.0, 0.25)
OVER = 1.08
COVER = (0.007, 0.35, 0.02, 0.6)


def glow(look, h, at, turn):
    x = np.clip((at @ np.asarray(look["dir"]) - look["dayFrom"]) / (1 - look["dayFrom"]), 0, 1)
    out = np.zeros(h.shape + (3,))
    for c, hh, p in zip(look["colors"], look["heights"], look["powers"]):
        out += np.asarray(c) * (x ** p * np.exp(-h / hh))[..., None]
    rows = look["mapRows"]
    m = cv2.imread(str(geo.ROOT / "public" / "assets" / "earth" / "full" / "air-glow.png"), cv2.IMREAD_UNCHANGED)[..., [2, 1, 0, 3]].astype(np.float32) / 255 * 4
    m = m[: rows[0]]
    mw = m.shape[1]
    wide = np.concatenate([m[:, -1:], m, m[:, :1]], 1)
    mx = ((turn % 1.0) * mw + 0.5).astype(np.float32)
    my = (np.clip(np.sqrt(np.clip(h / look["top"], 0, 1)), 0.008, 0.992) * rows[0] - 0.5).astype(np.float32)
    seen = cv2.remap(wide, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    lw = (h - look["lineAt"]) / look["lineWidth"]
    line = np.asarray(look["line"]) * (x ** look["linePower"] * np.exp(-lw * lw) * seen[..., 3])[..., None]
    return out * seen[..., :3] + line


def segment(length, deg):
    k = np.zeros((length, length), np.uint8)
    c = (length - 1) / 2
    t = np.radians(deg)
    dx, dy = np.sin(t) * c, np.cos(t) * c
    cv2.line(k, (int(round(c - dx)), int(round(c - dy))), (int(round(c + dx)), int(round(c + dy))), 1, 1)
    return k


def unroll():
    look = json.loads((LOOK / "air.json").read_text())
    hero1 = geo.decode(geo.read(geo.HERO)[..., :3].astype(np.float64))
    fill = geo.decode(geo.read(FILL)[..., :3].astype(np.float64))
    g = geo.hero_geometry(1)
    c = geo.FIT["circle"]
    py, px = np.mgrid[0:hero1.shape[0], 0:hero1.shape[1]].astype(np.float64) + 0.5
    pa1 = np.degrees(np.arctan2(px - c["cx"], -(py - c["cy"]))) % 360
    far = (g["rt"] - 1 > 0.3) & (pa1 > 80) & (pa1 < 170) & (np.hypot(px - 2509, py - 226) > 95) & (px > 40) & (px < hero1.shape[1] - 40) & (py > 30) & (py < hero1.shape[0] - 30)
    offset = np.median((hero1 - fill)[far], axis=0)
    del g, hero1
    hero = geo.decode(geo.hero(2)[..., :3].astype(np.float64)).astype(np.float32)
    o = geo.SHAPE_INV @ geo.CAM.pos
    r0 = np.linalg.norm(o)
    axis = o / r0
    right, up = geo.CAM.R[:, 0], geo.CAM.R[:, 1]
    u = (np.arange(W) + 0.5) / W
    v = (np.arange(H) + 0.5) / H
    pa = np.radians(PA[0] + u * (PA[1] - PA[0]))
    h = (LOW + v * (TOP - LOW))[:, None] * np.ones(W)[None, :]
    ring = np.sin(pa)[:, None] * right[None, :] + np.cos(pa)[:, None] * up[None, :]
    ring -= (ring @ axis)[:, None] * axis[None, :]
    ring /= np.linalg.norm(ring, axis=1, keepdims=True)
    s = (1 + h) / r0
    at = ring[None, :, :] * np.sqrt(1 - s * s)[..., None] + axis[None, None, :] * s[..., None]
    P = (at * (1 + h)[..., None]) @ geo.SHAPE.T
    qx, qy, _ = geo.CAM.project(P)
    turn = np.arctan2(at @ right, at @ up) / (2 * np.pi)
    seen = cv2.remap(hero, (qx * 2 - 0.5).astype(np.float32), (qy * 2 - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    back = cv2.remap(fill.astype(np.float32), (qx - 0.5).astype(np.float32), (qy - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    back = cv2.GaussianBlur(np.minimum(back, cv2.GaussianBlur(back, (0, 0), 4)), (0, 0), 8)
    air = glow(look, np.maximum(h, 0), at, turn)
    inside = (qx > 2) & (qx < geo.CAM.w - 2) & (qy > 2) & (qy < geo.CAM.h - 2)
    return seen, back, air.astype(np.float32), offset, inside, h[:, 0], u, v, o


def above(res, hh):
    k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    closed = np.stack([cv2.morphologyEx(res[..., i], cv2.MORPH_CLOSE, k5) for i in range(3)], -1)
    opened = np.zeros_like(res)
    for a in ANGLES:
        k = segment(RAY, a)
        for i in range(3):
            opened[..., i] = np.maximum(opened[..., i], cv2.morphologyEx(closed[..., i], cv2.MORPH_OPEN, k))
    clean = np.minimum(closed, opened)
    pure = np.maximum(clean[..., 0] - GREEN_RED * clean[..., 1], 0)
    x = np.arange(W, dtype=np.float32)
    lean = np.interp(x, [LEAN[0][0], LEAN[1][0]], [LEAN[0][1], LEAN[1][1]])
    rows = np.arange(len(hh), dtype=np.float32)
    mx = (x[None, :] + lean[None, :] * rows[:, None]).astype(np.float32)
    my = np.broadcast_to(rows[:, None], mx.shape).astype(np.float32)
    leaned = cv2.remap(pure, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    prof = cv2.GaussianBlur(leaned[:, 400:1600].mean(1)[None], (0, 0), RED_SOFT[0])[0]
    pk = int(np.argmax(prof))
    prof[pk:] = np.minimum.accumulate(prof[pk:])
    prof[:pk] = np.maximum.accumulate(prof[:pk])
    prof /= prof.max()
    amp = cv2.GaussianBlur(((leaned * prof[:, None]).sum(0) / (prof ** 2).sum())[None], (0, 0), RED_SOFT[1])[0]
    back = np.empty_like(mx)
    for j in range(len(hh)):
        back[j] = np.interp(x, mx[j], x)
    red = cv2.remap((amp[None, :] * prof[:, None]).astype(np.float32), back, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    green = clean.copy()
    green[..., 0] = np.maximum(clean[..., 0] - pure, 0)
    print("red: peak at h", round(float(hh[pk]), 4), "half at h", round(float(hh[pk + np.argmax(prof[pk:] < 0.5)]), 4), "tenth at h", round(float(hh[pk + np.argmax(prof[pk:] < 0.1)]), 4), "strongest", round(float(amp.max()), 4))
    return green + red[..., None] * np.asarray(RED_TINT, np.float32)


def below(seen, hin):
    tint = np.asarray(TINT, np.float32)
    ex = np.maximum(seen[..., 1] - OVER * np.maximum(seen[..., 0], seen[..., 2]), 0) / (1 - OVER * tint[2])
    ex = cv2.morphologyEx(ex, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    fall = (np.exp(hin / COVER[0]) * COVER[1] + np.exp(-(hin / COVER[2]) ** 2) * COVER[3]) / (COVER[1] + COVER[3])
    return ex[..., None] * tint * fall[:, None, None]


def main():
    out = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
    seen, back, air, offset, inside, h, u, v, o = unroll()
    z = int(np.searchsorted(h, 0))
    res = (np.maximum(seen - back - offset - air, 0) * inside[..., None])[z:].astype(np.float32)
    A = above(res, h[z:])
    soft = cv2.GaussianBlur(A, (0, 0), 2.5)
    r, gch, b = soft[..., 0], soft[..., 1], soft[..., 2]
    warm = np.maximum(gch, r * geo.smooth(0.02, 0.07, h[z:])[:, None])
    gate = geo.smooth(1.08, 1.45, warm / np.maximum(b, 1e-5))
    A = np.maximum(A - FLOOR, 0) * gate[..., None]
    A = np.concatenate([below(seen[:z].astype(np.float32), h[:z]), A], 0)
    band = cv2.GaussianBlur(A[z - 6:z + 6], (0, 0), sigmaX=0.01, sigmaY=1.2)
    w = np.clip(1 - np.abs(np.arange(-6, 6) + 0.5) / 4, 0, 1)[:, None, None]
    A[z - 6:z + 6] = A[z - 6:z + 6] * (1 - w) + band * w
    fade = geo.smooth(0.0, 0.06, u)[None, :] * (1 - geo.smooth(0.965, 1.0, u))[None, :] * (1 - geo.smooth(0.82 * TOP, TOP, h))[:, None] * geo.smooth(LOW, LOW + 0.01, h)[:, None]
    A = A * fade[..., None]
    print("offset", offset.round(4), "aurora peak", A.reshape(-1, 3).max(0).round(3), "mean", A.mean((0, 1)).round(4), "covered", float((A[..., 1] > 0.02).mean().round(3)), "limb row", z)
    img = np.clip(geo.encode(A.astype(np.float64))[::-1] * 255 + 0.5, 0, 255).astype(np.uint8)
    for key, w in (("full", W), ("web", W // 2)):
        im = Image.fromarray(img)
        if w != W:
            im = im.resize((w, H // 2), Image.LANCZOS)
        im.save((out / (key + "-aurora.webp")) if out else (geo.ROOT / "public" / "assets" / "earth" / key / "aurora.webp"), quality=95, method=6)
    Image.fromarray(img).save((out or geo.WORK / "view") / "aurora-map.jpg", quality=92)
    Image.fromarray(np.clip(geo.encode(np.maximum(seen - back - offset, 0).astype(np.float64))[::-1] * 255, 0, 255).astype(np.uint8)).save((out or geo.WORK / "view") / "aurora-seen.jpg", quality=92)
    old = json.loads((LOOK / "aurora.json").read_text())
    new = {"pa": list(PA), "top": TOP, "low": LOW, "eye": [round(float(x), 6) for x in o], "size": {"full": [W, H], "web": [W // 2, H // 2]}, "sway": old["sway"], "wave": old["wave"], "stretch": old["stretch"], "fade": old["fade"], "calm": old["calm"]}
    ((out or LOOK) / "aurora.json").write_text(json.dumps(new, indent=1) + "\n")
    print(json.dumps(new))


if __name__ == "__main__":
    main()
