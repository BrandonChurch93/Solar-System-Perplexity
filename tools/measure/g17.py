import json
import sys

import cv2
import numpy as np
from PIL import Image

DEFINITION = {
    "name": "dog-band-energy-v1",
    "luma": "sRGB luma 0.2126 R + 0.7152 G + 0.0722 B on 0..1 values, no linearisation",
    "band": "difference of Gaussians: blur sigma 0.6 px minus blur sigma 2.0 px, which keeps roughly 0.08 to 0.3 cycles per pixel",
    "energy": "mean of the squared band signal inside a tile",
    "grid": [12, 8],
    "tileMeanLumaFloor": 0.04,
    "tileEnergyFloor": "max(2e-5, 0.05 x the 90th percentile of approved tile energy)",
    "ratio": "per tile film energy / approved energy; median and 25th percentile over kept tiles",
    "resize": "approved image centre cropped to the film aspect, then Lanczos to the film size",
}


def luma(path, size=None):
    im = Image.open(path).convert("RGB")
    if size is not None:
        w, h = size
        iw, ih = im.size
        target = w / h
        if abs(iw / ih - target) > 1e-3:
            if iw / ih > target:
                nw = round(ih * target)
                x = (iw - nw) // 2
                im = im.crop((x, 0, x + nw, ih))
            else:
                nh = round(iw / target)
                y = (ih - nh) // 2
                im = im.crop((0, y, iw, y + nh))
        im = im.resize((w, h), Image.LANCZOS)
    a = np.asarray(im).astype(np.float64) / 255.0
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def band(y):
    return cv2.GaussianBlur(y, (0, 0), 0.6) - cv2.GaussianBlur(y, (0, 0), 2.0)


def tiles(y, b, gx, gy):
    h, w = y.shape
    out = []
    for j in range(gy):
        for i in range(gx):
            y0, y1 = j * h // gy, (j + 1) * h // gy
            x0, x1 = i * w // gx, (i + 1) * w // gx
            out.append((i, j, float(y[y0:y1, x0:x1].mean()), float((b[y0:y1, x0:x1] ** 2).mean())))
    return out


def measure(film_path, approved_path):
    fy = luma(film_path)
    h, w = fy.shape
    ay = luma(approved_path, (w, h))
    gx, gy = DEFINITION["grid"]
    ft = tiles(fy, band(fy), gx, gy)
    at = tiles(ay, band(ay), gx, gy)
    energies = np.array([t[3] for t in at])
    floor = max(2e-5, 0.05 * float(np.percentile(energies, 90)))
    kept = []
    for f, a in zip(ft, at):
        if a[2] > DEFINITION["tileMeanLumaFloor"] and a[3] > floor:
            kept.append({"tile": [a[0], a[1]], "film": f[3], "approved": a[3], "ratio": f[3] / a[3]})
    if not kept:
        return {"tiles": 0, "median": None, "p25": None, "floor": floor, "worst": []}
    r = np.array([k["ratio"] for k in kept])
    worst = sorted(kept, key=lambda k: k["ratio"])[:5]
    return {
        "tiles": len(kept),
        "median": float(np.median(r)),
        "p25": float(np.percentile(r, 25)),
        "floor": floor,
        "worst": [{"tile": k["tile"], "ratio": round(k["ratio"], 4)} for k in worst],
    }


if __name__ == "__main__":
    if sys.argv[1] == "--definition":
        print(json.dumps(DEFINITION))
    else:
        print(json.dumps(measure(sys.argv[1], sys.argv[2])))
