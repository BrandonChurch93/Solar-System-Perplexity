import json

import cv2
import numpy as np
from PIL import Image

import geo

LOOK = geo.ROOT / "src" / "stops" / "earth"
FILL = geo.WORK / "sky" / "fill-t1.png"
PA = (2.0, 92.0)
TOP = 0.27
W, H = 2048, 384
FLOOR = 0.004


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


def main():
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
    h = (v * TOP)[:, None] * np.ones(W)[None, :]
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
    air = glow(look, h, at, turn)
    A = seen - back - offset - air
    inside = (qx > 2) & (qx < geo.CAM.w - 2) & (qy > 2) & (qy < geo.CAM.h - 2)
    A = np.maximum(A, 0) * inside[..., None]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    k2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    closed = np.stack([cv2.GaussianBlur(cv2.morphologyEx(A[..., i].astype(np.float32), cv2.MORPH_CLOSE, k2), (0, 0), 2.0) for i in range(3)], -1)
    A = np.maximum(A, closed * 0.92)
    opened = np.stack([cv2.GaussianBlur(cv2.morphologyEx(A[..., i].astype(np.float32), cv2.MORPH_OPEN, k), (0, 0), 1.5) for i in range(3)], -1)
    A = np.minimum(A, opened * 1.1)
    soft = cv2.GaussianBlur(A.astype(np.float32), (0, 0), 2.5)
    r, gch, b = soft[..., 0], soft[..., 1], soft[..., 2]
    warm = np.maximum(gch, r * geo.smooth(0.02, 0.07, v)[:, None])
    gate = geo.smooth(1.08, 1.45, warm / np.maximum(b, 1e-5))
    A = np.maximum(A - FLOOR, 0) * gate[..., None]
    fade = geo.smooth(0.0, 0.06, u)[None, :] * (1 - geo.smooth(0.94, 1.0, u))[None, :] * (1 - geo.smooth(0.82, 1.0, v))[:, None]
    A = A * fade[..., None]
    print("offset", offset.round(4), "aurora peak", A.reshape(-1, 3).max(0).round(3), "mean", A.mean((0, 1)).round(4), "covered", float((A[..., 1] > 0.02).mean().round(3)))
    img = np.clip(geo.encode(A.astype(np.float64))[::-1] * 255 + 0.5, 0, 255).astype(np.uint8)
    for key, w in (("full", W), ("web", W // 2)):
        im = Image.fromarray(img)
        if w != W:
            im = im.resize((w, H // 2), Image.LANCZOS)
        im.save(geo.ROOT / "public" / "assets" / "earth" / key / "aurora.webp", quality=95, method=6)
    Image.fromarray(img).save(geo.WORK / "view" / "aurora-map.jpg", quality=92)
    Image.fromarray(np.clip(geo.encode(np.maximum(seen - back - offset, 0).astype(np.float64))[::-1] * 255, 0, 255).astype(np.uint8)).save(geo.WORK / "view" / "aurora-seen.jpg", quality=92)
    out = {"pa": list(PA), "top": TOP, "eye": [round(float(x), 6) for x in o], "size": {"full": [W, H], "web": [W // 2, H // 2]}, "sway": [0.004, 9.0, 1.3], "wave": [0.3, 17.0, 2.1], "stretch": [0.08, 6.0, 0.9], "fade": [1.0, 1.7], "calm": [2.6, 6.0, 0.15]}
    (LOOK / "aurora.json").write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps(out))


if __name__ == "__main__":
    main()
