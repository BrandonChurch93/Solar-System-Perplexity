from pathlib import Path

import numpy as np
from PIL import Image

import chain

ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / "out" / "work" / "earth" / "patches"
PUBLIC = ROOT / "public" / "assets" / "earth"
LEVELS = [96, 48, 24, 12]


def main():
    imgs = {d: chain.load(WORK / f"p{d}-up-4096.png") for d in LEVELS}
    for i in range(len(LEVELS) - 2, -1, -1):
        parent, child = LEVELS[i], LEVELS[i + 1]
        imgs[parent] = chain.nest(imgs[parent], imgs[child], parent, child)
    for d in LEVELS:
        im = Image.fromarray(np.clip(imgs[d] * 255 + 0.5, 0, 255).astype(np.uint8))
        im.save(PUBLIC / "full" / f"patch-{d}.jpg", quality=94, subsampling=0)
        im.resize((2048, 2048), Image.LANCZOS).save(PUBLIC / "web" / f"patch-{d}.jpg", quality=94, subsampling=0)
        print(d, "done", flush=True)


if __name__ == "__main__":
    main()
