import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CONFIG = json.loads((ROOT / "config" / "showcase.json").read_text())
SIZES = {"full": (4096, 2816), "web": (2048, 2048)}
SAFE = 0.9


def quat_rotate(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2.0 * np.cross(u, np.cross(u, v) + w * v)


def wrap(stop, fit, hero, width):
    height = width // 2
    lon = ((np.arange(width) + 0.5) / width - 0.5) * 2 * math.pi
    lat = (0.5 - (np.arange(height) + 0.5) / height) * math.pi
    lon, lat = np.meshgrid(lon, lat)
    d = np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)
    scale = np.array(fit["globe"]["scale"])
    q = fit["globe"]["quaternion"]
    p = quat_rotate(q, (d * scale).reshape(-1, 3)).reshape(height, width, 3)
    cam = np.array(fit["camera"]["position"], dtype=np.float64)
    dist = np.linalg.norm(cam)
    c = cam / dist
    r = np.linalg.norm(p, axis=-1, keepdims=True)
    ph = p / r
    cos_t = np.clip((ph * c).sum(-1), -1, 1)
    theta = np.arccos(cos_t)
    safe = math.acos(1.0 / dist) * SAFE
    side = ph - cos_t[..., None] * c
    side /= np.maximum(np.linalg.norm(side, axis=-1, keepdims=True), 1e-9)
    t2 = np.where(theta > safe, np.abs(2 * safe - theta), theta)
    t2 = np.where(t2 > safe, 2 * safe - t2, t2)
    m = (np.cos(t2)[..., None] * c + np.sin(t2)[..., None] * side) * r
    rel = m - cam
    t = math.tan(math.radians(fit["vfovDeg"]) / 2)
    h, w = hero.shape[:2]
    x = (rel[..., 0] / -rel[..., 2] / (t * w / h) * 0.5 + 0.5) * w - 0.5
    y = (0.5 - rel[..., 1] / -rel[..., 2] / t * 0.5) * h - 0.5
    return cv2.remap(hero, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)


def main():
    stops = [s for s in CONFIG["stops"] if len(sys.argv) < 2 or s["id"] in sys.argv[1:]]
    for s in stops:
        fit = json.loads((ROOT / "assets-src" / s["id"] / "fit.json").read_text())
        hero = cv2.imread(str(ROOT / s["hero"]), cv2.IMREAD_COLOR)
        circle = fit["circle"]
        cam_z = fit["camera"]["position"][2]
        for m in fit.get("moons", []):
            off = math.hypot(m["cx"] - circle["cx"], m["cy"] - circle["cy"])
            if m["position"][2] < 0 or m["position"][2] > cam_z or off > circle["r"]:
                continue
            reach = round(m["r"] * 1.15 + 8)
            mask = np.zeros(hero.shape[:2], np.uint8)
            cv2.circle(mask, (round(m["cx"]), round(m["cy"])), reach, 255, -1)
            step = 2.3 * reach
            best = None
            for k in range(24):
                a = 2 * math.pi * k / 24
                sx, sy = m["cx"] + step * math.cos(a), m["cy"] + step * math.sin(a)
                d = math.hypot(sx - circle["cx"], sy - circle["cy"]) + reach
                if d < circle["r"] * 0.86 and (best is None or d < best[0]):
                    best = (d, sx, sy)
            if best is None:
                hero = cv2.inpaint(hero, mask, 9, cv2.INPAINT_TELEA)
                continue
            shift = np.float32([[1, 0, m["cx"] - best[1]], [0, 1, m["cy"] - best[2]]])
            moved = cv2.warpAffine(hero, shift, (hero.shape[1], hero.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            hero = cv2.seamlessClone(moved, cv2.inpaint(hero, mask, 5, cv2.INPAINT_TELEA), mask, (round(m["cx"]), round(m["cy"])), cv2.NORMAL_CLONE)
        close = cv2.imread(str(ROOT / s["close"]), cv2.IMREAD_COLOR)
        for name, (wrap_w, close_w) in SIZES.items():
            out = ROOT / "public" / "assets" / s["id"] / name
            out.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(out / "standin-wrap.jpg"), wrap(s["id"], fit, hero, wrap_w), [cv2.IMWRITE_JPEG_QUALITY, 92])
            c = close if close.shape[1] == close_w else cv2.resize(close, (close_w, round(close_w * close.shape[0] / close.shape[1])), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(out / "standin-close.jpg"), c, [cv2.IMWRITE_JPEG_QUALITY, 94])
        recipe = ROOT / "assets-src" / s["id"] / "RECIPE.md"
        text = f"""# {s['name']} stand-ins

Stand-ins for the Phase 2 blockout. Each is replaced when the stop is built.

## public/assets/{s['id']}/full/standin-wrap.jpg and public/assets/{s['id']}/web/standin-wrap.jpg

- Tool: `python3 tools/assets/standin.py {s['id']}` (numpy and OpenCV, no model).
- Inputs: `{s['hero']}`, `assets-src/{s['id']}/fit.json`.
- Prompt: none.
- What it does: unprojects the approved hero image onto the fitted sphere as an equirectangular map, {SIZES['full'][0]} wide for `full` and {SIZES['web'][0]} wide for `web`. The part of the globe the image does not show is filled by mirroring the visible part about a circle at {SAFE} of the limb angle. A moon that sits in front of the disc is painted out first, because a stand-in sphere takes its place: a patch of the same globe from beside the moon is copied over its fitted circle with OpenCV seamless cloning. No other cleanup: the light, the limb glow, rings and shadows stay baked in.
- Take kept: the only one.
- Checks: the judged `hold` frame lines up with the approved hero image in `npm run compare`.

## public/assets/{s['id']}/full/standin-close.jpg and public/assets/{s['id']}/web/standin-close.jpg

- Tool: `python3 tools/assets/standin.py {s['id']}`.
- Input: `{s['close']}`.
- Prompt: none.
- What it does: the approved close image, re-encoded at its own size for `full` and resized to {SIZES['web'][1]} wide for `web`. Nothing is redrawn.
- Take kept: the only one.
- Checks: the judged `terrain` frame lines up with the approved close image in `npm run compare`.
"""
        recipe.write_text(text)
        print("stand-in", s["id"])


if __name__ == "__main__":
    main()
