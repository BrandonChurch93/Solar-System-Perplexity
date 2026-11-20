import argparse

import cv2
import numpy as np

from common import (CONFIG, body_from_fit, camera_from_fit, downsize, load_fit, load_hero, local_to_lonlat,
                    save_rgb, stop_ids, work_dir)


def render(stop, width, scale):
    fit = load_fit(stop)
    cam = camera_from_fit(fit)
    body = body_from_fit(fit)
    rgba = cv2.imread(str(work_dir(stop) / f"map-{width}.png"), cv2.IMREAD_UNCHANGED)
    if rgba is None:
        raise SystemExit(f"run unproject.py --stop {stop} --width {width} first")
    tex = cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255
    th, tw = tex.shape[:2]
    w, h = round(cam.w * scale), round(cam.h * scale)
    xs = (np.arange(w) + 0.5) / scale
    ys = (np.arange(h) + 0.5) / scale
    X, Y = np.meshgrid(xs, ys)
    rays = cam.rays_world(X, Y)
    hit, t, y, n = body.intersect(cam.pos, rays)
    lon, lat = local_to_lonlat(y)
    u = ((lon / 360 + 0.5) * tw - 0.5).astype(np.float32)
    v = ((0.5 - lat / 180) * th - 0.5).astype(np.float32)
    s = cv2.remap(tex, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    filled = cv2.imread(str(work_dir(stop) / f"map-filled-{width}.png"), cv2.IMREAD_COLOR)
    filled = cv2.cvtColor(filled, cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    f = cv2.remap(filled, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    a = s[..., 3:4]
    hm = hit[..., None]
    out = (s[..., :3] * a + f * (1 - a)) * hm
    hero = cv2.resize(load_hero(stop), (w, h), interpolation=cv2.INTER_AREA)
    diff = np.abs(hero - out) * hm
    sel = hit & (a[..., 0] > 0.5)
    mad = float(diff[sel].mean()) if sel.any() else float("nan")
    return hero, out, diff, mad


def run(stop, width, scale):
    hero, out, diff, mad = render(stop, width, scale)
    sheet = np.concatenate([hero, out, np.clip(diff * 2, 0, 1)], axis=1)
    path = work_dir(stop) / "verify.jpg"
    save_rgb(path, sheet, quality=90)
    save_rgb(work_dir(stop) / "verify-view.jpg", downsize(sheet, 1400), quality=88)
    print(f"{stop} mean abs diff where alpha > 0.5: {mad:.4f} -> {path}")
    return path, mad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stop", required=True)
    ap.add_argument("--width", type=int, default=CONFIG["assetSets"]["web"]["wrapMapWidth"])
    ap.add_argument("--scale", type=float, default=0.5)
    a = ap.parse_args()
    stops = stop_ids() if a.stop == "all" else a.stop.split(",")
    for s in stops:
        run(s, a.width, a.scale)


if __name__ == "__main__":
    main()
