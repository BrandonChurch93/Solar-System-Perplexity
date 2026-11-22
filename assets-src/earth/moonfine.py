import sys

import cv2
import numpy as np

import geo

BOX = (2509, 226, 88)
UP = 6
SIGMA = 1.5
KEEP = 2.0
RATIO = (0.4, 2.5)
WORK = geo.WORK / "moon"


def main():
    take = sys.argv[1] if len(sys.argv) > 1 else "gen-t1.png"
    cx, cy, half = BOX
    hero = geo.read(geo.HERO)[cy - half:cy + half, cx - half:cx + half, :3].astype(np.float32)
    size = 2 * half * UP
    base = geo.decode(np.clip(cv2.resize(hero, (size, size), interpolation=cv2.INTER_LANCZOS4), 0, 1).astype(np.float64))
    fine = geo.decode(cv2.resize(geo.read(WORK / take)[..., :3].astype(np.float32), (size, size), interpolation=cv2.INTER_AREA).astype(np.float64))
    s = SIGMA * UP
    low = cv2.GaussianBlur(base, (0, 0), s)
    mine = base @ [0.25, 0.6, 0.15]
    own = np.clip(mine / np.maximum(cv2.GaussianBlur(mine, (0, 0), KEEP * UP), 1e-4), RATIO[0], RATIO[1])
    low = cv2.GaussianBlur(base, (0, 0), KEEP * UP) * cv2.GaussianBlur(own, (0, 0), 0.5 * UP)[..., None]
    grey = fine @ [0.25, 0.6, 0.15]
    ratio = np.clip(grey / np.maximum(cv2.GaussianBlur(grey, (0, 0), s), 1e-4), RATIO[0], RATIO[1])
    out = low * ratio[..., None]
    geo.write(WORK / "moon-fine.png", geo.encode(out))
    geo.write(WORK / "moon-fine-view.jpg", np.concatenate([geo.encode(base), geo.encode(out)], 1))
    print("moon-fine.png", out.shape, "ratio p1 p50 p99", np.percentile(ratio, [1, 50, 99]).round(3))


if __name__ == "__main__":
    main()
