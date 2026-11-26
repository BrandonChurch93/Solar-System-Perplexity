import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, Camera, hero_camera, load_json, normalize, pixel_grid, plane_hit, spheroid_hit  # noqa: E402

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic, srgb_to_linear  # noqa: E402

W, H = 1920, 1080
OUT = (640, 360)
REF = {"hero": "saturn-hero.png", "close": "saturn-close.jpg"}
NAME = {"hero": "hold-light", "close": "skim-light"}


def scene(img):
    return inverse_filmic(np.clip(srgb_to_linear(img[..., ::-1].astype(np.float64) / 255), 0, 0.985))


def hero_mask():
    fit = load_json(HERE / "fit.json")
    cam = hero_camera(fit)
    k = W / fit["imageSize"][0]
    px, py = pixel_grid(W, H)
    dirs = cam.rays_world(px / k, py / k)
    n = normalize(fit["rings"]["normal"])
    t, P = plane_hit(cam.pos, dirs, n)
    hit, ts = spheroid_hit(cam.pos, dirs, n)
    r = np.linalg.norm(P, axis=-1)
    alpha = cv2.resize(cv2.imread(str(WORK / "shot" / "web" / "hero-rings-mask.png"))[..., 2], (W, H), interpolation=cv2.INTER_AREA)
    covered = (t > 0) & (t < ts) & (alpha > 40)
    return hit & ~covered


def hero_mask_two():
    """The globe in the open in both pictures: the approved's (the picture's own fit, assets-src/saturn/fit.json)
    and the film's at the hold (src/stops/saturn/fit.json), with neither ring in front. For a hold whose view is
    not the picture's own fit: the ratio is taken only where both show the globe, the rest is filled from there."""
    px, py = pixel_grid(W, H)
    both = np.ones((H, W), bool)
    for fit in (load_json(HERE / "fit.json"), load_json(ROOT / "src" / "stops" / "saturn" / "fit.json")):
        size = fit.get("imageSize", [W, H])
        cam = Camera(size[0], size[1], fit["vfovDeg"], fit["camera"]["position"], fit["camera"].get("quaternion", (0, 0, 0, 1)))
        k = W / size[0]
        dirs = cam.rays_world(px / k, py / k)
        n = normalize(fit["rings"]["normal"])
        t, P = plane_hit(cam.pos, dirs, n)
        hit, ts = spheroid_hit(cam.pos, dirs, n)
        r = np.linalg.norm(P, axis=-1)
        covered = (t > 0) & (t < ts) & (r > fit["rings"]["inner"]) & (r < fit["rings"]["outer"])
        both &= hit & ~covered
    return both


def layers_mask(path):
    lay = cv2.imread(path).astype(np.float32) / 255
    return (np.abs(lay[..., 0] - 0.9) < 0.08) & (np.abs(lay[..., 1] - 0.45) < 0.08) & (np.abs(lay[..., 2] - 0.15) < 0.08)


def main():
    view, film = sys.argv[1], sys.argv[2]
    args = dict(a.split("=", 1) for a in sys.argv[3:])
    sigma = float(args.get("sigma", 5))
    lo, hi = float(args.get("lo", 0.2)), float(args.get("hi", 5))
    ref = cv2.resize(cv2.imread(str(ROOT / "references" / "approved" / REF[view])), (W, H), interpolation=cv2.INTER_AREA)
    img = cv2.imread(film)
    mask = (hero_mask_two() if "two" in args else hero_mask()) if view == "hero" else layers_mask(args["layers"])
    g = lambda a: cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32)
    ys, xs = np.nonzero(mask)
    box = (slice(ys.min(), ys.max()), slice(xs.min(), xs.max()))
    a, b = g(ref)[box], g(img)[box]
    (dx, dy), resp = cv2.phaseCorrelate(a, b, cv2.createHanningWindow(a.shape[::-1], cv2.CV_32F))
    print("film offset", round(dx, 2), round(dy, 2), "response", round(resp, 2))
    if abs(dx) < 6 and abs(dy) < 6 and "noshift" not in args:
        img = cv2.warpAffine(img, np.float32([[1, 0, -dx], [0, 1, -dy]]), (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    A, F = scene(ref), scene(img)
    core = cv2.erode(mask.astype(np.uint8), np.ones((int(args.get("erode", 17)), int(args.get("erode", 17))), np.uint8)).astype(np.float64)
    blur = lambda x, s: cv2.GaussianBlur(x, (0, 0), s)
    num = blur(A * core[..., None], sigma)
    den = blur(F * core[..., None], sigma)
    wt = blur(core, sigma)
    floor = float(args.get("floor", 0.002))
    ratio = np.clip((num + floor * wt[..., None]) / (den + floor * wt[..., None] + 1e-9), lo, hi)
    known = (wt > 0.35).astype(np.float64)
    ratio = np.where(known[..., None] > 0, ratio, 0)
    for s in (4, 10, 25, 60, 150):
        nb = blur(ratio * known[..., None], s)
        wb = blur(known, s)
        fill = (known < 0.5) & (wb > 0.01)
        ratio[fill] = nb[fill] / wb[fill][:, None]
        known[fill] = 1
    ratio[known < 0.5] = 1
    if "prev" in args:
        prev = np.fromfile(args["prev"], np.float32).reshape(OUT[1], OUT[0], 4)[..., :3]
        ratio = np.clip(ratio * cv2.resize(prev, (W, H), interpolation=cv2.INTER_LINEAR), lo, hi)
    small = cv2.resize(ratio, OUT, interpolation=cv2.INTER_AREA).astype(np.float32)
    data = np.concatenate([small, np.ones(OUT[::-1] + (1,), np.float32)], -1)
    for key in ("full", "web"):
        data.tofile(ROOT / "public" / "assets" / "saturn" / key / (NAME[view] + ".bin"))
    (ROOT / "src" / "stops" / "saturn" / (NAME[view] + ".json")).write_text(json.dumps({"source": "assets-src/saturn/shot/light.py " + view, "file": NAME[view] + ".bin", "width": OUT[0], "height": OUT[1]}, indent=1) + "\n")
    m = mask
    print("ratio on the globe: median", np.round(np.median(ratio[m], 0), 3), "p5", np.round(np.percentile(ratio[m], 5, 0), 3), "p95", np.round(np.percentile(ratio[m], 95, 0), 3))
    vis = np.clip(np.log2(ratio) / 4 + 0.5, 0, 1)
    cv2.imwrite(str(WORK / (NAME[view] + "-ratio.jpg")), (vis[..., ::-1] * 255).astype(np.uint8))


if __name__ == "__main__":
    main()
