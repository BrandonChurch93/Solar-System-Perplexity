import json
import sys
from pathlib import Path

import cv2
import numpy as np

import geo

SCALE = 2
W = 2048
FINE = geo.WORK / "moon" / "moon-fine.png"
FINE_BOX = (2509, 226, 88, 6)
OUT = geo.ROOT / "src" / "stops" / "earth" / "moon.json"
MASK = (0.03, 0.14)
TERM = (-0.06, 0.2)
NIGHT_FLOOR = 0.06
EDGE = 0.03


def main():
    hero = geo.decode(geo.hero(SCALE)[..., :3].astype(np.float64))
    m = geo.FIT["moons"][0]
    centre = np.asarray(m["position"], dtype=np.float64)
    px, py, z = geo.CAM.project(centre)
    r = m["radius"] / z * geo.CAM.f
    back = geo.normalize(geo.CAM.pos - centre)
    right = geo.normalize(np.cross(geo.CAM.R[:, 1], back))
    up = np.cross(back, right)
    frame = np.stack([right, up, back], 1)
    sun = geo.SUN @ frame

    half = int(np.ceil(r * SCALE)) + 40
    cx, cy = px * SCALE, py * SCALE
    x0, y0 = int(round(cx)) - half, int(round(cy)) - half
    crop = hero[y0:y0 + 2 * half, x0:x0 + 2 * half]
    yy, xx = np.mgrid[0:2 * half, 0:2 * half].astype(np.float64) + 0.5
    lum = cv2.GaussianBlur(crop @ [0.25, 0.6, 0.15], (0, 0), 1.0)
    lit_dir = np.arctan2(-sun[1], sun[0])
    pts = []
    for ang in lit_dir + np.radians(np.arange(-84, 85, 2.0)):
        rad = np.arange(r * SCALE * 0.85, half - 2, 0.25)
        sx = (cx - x0 + np.cos(ang) * rad - 0.5).astype(np.float32)[None]
        sy = (cy - y0 + np.sin(ang) * rad - 0.5).astype(np.float32)[None]
        v = cv2.remap(lum.astype(np.float32), sx, sy, cv2.INTER_LINEAR)[0]
        g = v[8:] - v[:-8]
        i = int(np.argmin(g))
        if g[i] < -EDGE:
            pts.append((cx - x0 + np.cos(ang) * rad[i + 4], cy - y0 + np.sin(ang) * rad[i + 4]))
    cnt = np.asarray(pts)
    for _ in range(4):
        A = np.stack([cnt[:, 0] * 2, cnt[:, 1] * 2, np.ones(len(cnt))], 1)
        sol, *_ = np.linalg.lstsq(A, (cnt ** 2).sum(1), rcond=None)
        fx, fy = sol[0], sol[1]
        fr = np.sqrt(sol[2] + fx * fx + fy * fy)
        res = np.hypot(cnt[:, 0] - fx, cnt[:, 1] - fy) - fr
        cnt = cnt[np.abs(res) <= max(1.0, 2 * np.sqrt((res ** 2).mean()))]
    res = np.hypot(cnt[:, 0] - fx, cnt[:, 1] - fy) - fr
    shift = ((fx - (cx - x0)) / SCALE, (fy - (cy - y0)) / SCALE)
    centre = centre + (geo.CAM.R[:, 0] * shift[0] - geo.CAM.R[:, 1] * shift[1]) * z / geo.CAM.f
    print("moon from the fit: centre", round(cx - x0, 1), round(cy - y0, 1), "r", round(r * SCALE, 1), "limb circle:", round(fx, 1), round(fy, 1), round(fr, 1), "points", len(cnt), "rms", round(float(np.sqrt((res ** 2).mean())), 2))
    R = fr + 0.5
    radius = m["radius"] * R / (r * SCALE)
    out_dir = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
    bx, by, bh, up = FINE_BOX
    crop = geo.decode(geo.read(FINE)[..., :3].astype(np.float64))
    fx, fy, R = ((x0 + fx) / SCALE - (bx - bh)) * up, ((y0 + fy) / SCALE - (by - bh)) * up, R * up / SCALE

    lon = (np.arange(W) + 0.5) / W * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(W // 2) + 0.5) / (W // 2) * np.pi
    lo, la = np.meshgrid(lon, lat)
    d = np.stack([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)], -1)
    ndl = d @ sun
    front = d[..., 2]

    def sample(dx, dy):
        mx = (fx + dx * R - 0.5).astype(np.float32)
        my = (fy - dy * R - 0.5).astype(np.float32)
        return cv2.remap(crop.astype(np.float32), mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    squeeze = 0.985
    power = 0.55

    def shade_of(n):
        return geo.smooth(TERM[0], TERM[1], n) * np.maximum(n, 0) ** power

    def take(v):
        k = shade_of(v @ sun)
        ok = geo.smooth(0.3, 0.5, k) * geo.smooth(0.25, 0.45, v[..., 2])
        return sample(v[..., 0] * squeeze, v[..., 1] * squeeze) / np.maximum(k, 0.2)[..., None], ok

    baked = sample(d[..., 0] * squeeze, d[..., 1] * squeeze)
    e = geo.normalize(np.array([sun[0], sun[1], 0.0]))
    across = d - 2 * (d @ e)[..., None] * e
    behind = d * np.array([1.0, 1.0, -1.0])
    both = across * np.array([1.0, 1.0, -1.0])
    acc = np.zeros_like(baked)
    wsum = np.zeros(baked.shape[:2])
    first, ok0 = take(d)
    lit_px = ok0 > 0.99
    gain = np.median(first[lit_px], axis=0)
    for v in (d, across, behind, both):
        c, ok = take(v)
        ok = ok * (1 - np.minimum(wsum, 1))
        acc += c * ok[..., None]
        wsum += ok
    flat = np.broadcast_to(gain, baked.shape)
    albedo = (acc + flat * (1 - np.minimum(wsum, 1))[..., None]) / gain
    albedo = np.clip(albedo, 0, 2.5)
    shade = shade_of(ndl)
    earth = np.median(baked[(ndl < -0.3) & (front > 0.4)], axis=0)
    mask = geo.smooth(MASK[0], MASK[1], front)
    for key, w in (("full", W), ("web", W // 2)):
        base = out_dir or geo.ROOT / "public" / "assets" / "earth" / key
        tag = (key + "-") if out_dir else ""
        a8 = np.clip(geo.encode(albedo * 0.4) * 255 + 0.5, 0, 255).astype(np.uint8)
        b8 = np.clip(np.concatenate([geo.encode(baked), mask[..., None]], -1) * 255 + 0.5, 0, 255).astype(np.uint8)
        if w != W:
            a8 = cv2.resize(a8, (w, w // 2), interpolation=cv2.INTER_AREA)
            b8 = cv2.resize(b8, (w, w // 2), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(base / (tag + "moon-color.jpg")), a8[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 92])
        from PIL import Image
        Image.fromarray(b8, "RGBA").save(base / (tag + "moon-lit.webp"), lossless=True, exact=True, method=6)
    q = geo.mat_to_quat(frame)
    out = {"center": [round(float(v), 6) for v in centre], "radius": round(float(radius), 6), "quaternion": [round(float(v), 7) for v in q], "sun": [round(float(v), 4) for v in gain], "earthshine": [round(float(v), 5) for v in earth], "albedoScale": 2.5, "terminator": list(TERM), "power": power, "squeeze": squeeze, "mapWidth": {"full": W, "web": W // 2}}
    (out_dir / "moon.json" if out_dir else OUT).write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps(out))
    geo.write((out_dir or geo.WORK / "view") / "moon-maps.jpg", np.concatenate([geo.encode(albedo * 0.4), geo.encode(baked) * mask[..., None]], 0))


if __name__ == "__main__":
    main()
