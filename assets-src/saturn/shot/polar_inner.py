import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d, median_filter

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib import ROOT, WORK, calm, load_json  # noqa: E402
from polar_rings import PENUMBRA, POLAR, fill, project  # noqa: E402
from skim_bloom import decode, encode, filmic, inverse_filmic  # noqa: E402

SPAN = (1.10, 1.56)
SIZE = {"full": (8192, 448), "web": (4096, 224)}
SRC = {"full": WORK / "hero-x2.png", "web": ROOT / "references" / "approved" / "saturn-hero.png"}
FAR = 1.11
NEAR = 1.045
SKY_ROWS = (1.10, 1.118)
SKY_AZ = 3.0
STAR_AZ = 1.1
STAR_END = (1.25, 1.29)
FLOOR = (0.93, 1.2458, 1.5)
EDGE = 24
GRAIN = 8
TRIM = 12


def unproject(key):
    shots = load_json(WORK / "shots.json")
    m = np.array(shots["hero"]["matrix"], dtype=np.float64).reshape(4, 4)
    cam = np.array(shots["hero"]["camera"])
    shadow = np.array(load_json(ROOT / "src" / "stops" / "saturn" / "shadow.json")["local"])
    meta = load_json(ROOT / "src" / "stops" / "saturn" / "polar.json")
    warp = np.fromfile(ROOT / "public" / "assets" / "saturn" / key / meta["warp"]["file"], dtype=np.float32).reshape(meta["warp"]["height"], meta["warp"]["width"])[0]
    src = SRC[key] if SRC[key].exists() else SRC["web"]
    img = cv2.imread(str(src), cv2.IMREAD_COLOR)
    w, h = SIZE[key]
    phi = ((np.arange(w) + 0.5) / w - 0.5) * 2 * np.pi
    shape = np.interp((np.arange(w) + 0.5) / w * len(warp) - 0.5, np.arange(len(warp)), warp, period=len(warp))
    rho = SPAN[0] + (1 - (np.arange(h) + 0.5) / h) * (SPAN[1] - SPAN[0])
    pp, rr = np.meshgrid(phi, rho)
    ra = rr + shape[None, :]
    p = np.stack([ra * np.cos(pp), np.zeros_like(ra), ra * np.sin(pp)], axis=-1)
    u, v, cw = project(m, p)
    ih, iw = img.shape[:2]
    col = cv2.remap(img, (u * iw - 0.5).astype(np.float32), ((1 - v) * ih - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    inside = (cw > 0) & (u > 0.004) & (u < 0.996) & (v > 0.004) & (v < 0.996)
    ss = shadow * np.array([1, 1 / POLAR, 1])
    ss = ss / np.linalg.norm(ss)
    along = p @ ss
    miss = np.linalg.norm(p - along[..., None] * ss, axis=-1)
    lit = (along > 0.03) | (miss > PENUMBRA + 0.16 + 0.05 * np.maximum(-along, 0))
    c = cam * np.array([1, 1 / POLAR, 1])
    d = p * np.array([1, 1 / POLAR, 1]) - c
    qa = (d * d).sum(-1)
    qb = d @ c
    b = np.sqrt(np.maximum((c * c).sum() - qb * qb / qa, 0))
    front = -qb > qa
    clear = np.where(front, b > NEAR, b > FAR)
    return col, inside & lit & clear, rr, pp


def build(key):
    col, ok, rr, pp = unproject(key)
    h, w = ok.shape
    k = w / 4096
    r = rr[:, 0]
    ok = cv2.erode(ok.astype(np.uint8), np.ones((3, int(TRIM * k) | 1), np.uint8)) > 0
    soft, share = calm(col, (ok & (rr > STAR_END[0])).astype(np.float32), k)
    plain = median_filter(col, size=(1, int(STAR_AZ / 360 * w) | 1, 1), mode="wrap")
    t = np.clip((r - STAR_END[0]) / (STAR_END[1] - STAR_END[0]), 0, 1)[:, None, None]
    col = plain * (1 - t) + soft * t
    lin = inverse_filmic(decode(col[..., ::-1].astype(np.float64)))
    rows = (r >= SKY_ROWS[0]) & (r < SKY_ROWS[1])
    have = ok[rows].mean(0) > 0.9
    sky = np.where(have[:, None], np.median(lin[rows], axis=0), np.nan)
    idx = np.arange(w)
    good = np.isfinite(sky[:, 0])
    sky = np.stack([np.interp(idx, idx[good], sky[good, c], period=w) for c in range(3)], -1)
    n = int(SKY_AZ / 360 * w) | 1
    sky = gaussian_filter1d(median_filter(sky, size=(n, 1), mode="wrap"), n / 2, axis=0, mode="wrap")
    ramp = np.clip((r - FLOOR[1]) / (FLOOR[2] - FLOOR[1]), 0, 1)
    through = 1 - FLOOR[0] * ramp * ramp * (3 - 2 * ramp)
    lin = np.maximum(lin - through[:, None, None] * sky[None, :, :], 0)
    own = encode(filmic(lin))[..., ::-1].astype(np.float32)
    out = np.clip(fill(own, ok, int(EDGE * k), GRAIN * k), 0, 255).astype(np.uint8)
    dst = ROOT / "public" / "assets" / "saturn" / key
    cv2.imwrite(str(dst / "polar-inner.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 92])
    view = np.concatenate([np.clip(col, 0, 255).astype(np.uint8), np.where(ok[..., None], own, 0).astype(np.uint8), out], axis=0)
    cv2.imwrite(str(WORK / f"polar-inner-{key}.jpg"), cv2.resize(view, (2048, int(2048 * 3 * h / w)), interpolation=cv2.INTER_AREA))
    az = np.degrees(pp[0])
    print(key, w, h, "valid share", round(float(ok.mean()), 3), "valid azimuth at r 1.3", [round(float(a), 1) for a in az[np.flatnonzero(np.diff(ok[np.argmin(abs(r - 1.3))].astype(np.int8)))]], "share calmed", round(share, 4), "sky level (display)", np.round(encode(filmic(np.median(sky, 0)))).astype(int))
    return w, h


if __name__ == "__main__":
    sizes = {key: build(key) for key in (sys.argv[1:] or ["full", "web"])}
    meta = {"source": "assets-src/saturn/shot/polar_inner.py, the hero's inner ring pixels (C ring and the faint sheet inside it) on the ring plane, azimuth by radius, the hero's sky taken out, gaps filled along the bands", "file": "polar-inner.jpg", "span": list(SPAN), "sets": {k: list(v) for k, v in sizes.items()}}
    if len(sizes) == 2:
        (ROOT / "src" / "stops" / "saturn" / "inner.json").write_text(json.dumps(meta, indent=1) + "\n")
