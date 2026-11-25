import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
RULE = json.loads((HERE / "finest.json").read_text())


def weight(h, w, keep, gone):
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.rfftfreq(w)[None, :]
    r = np.hypot(fx, fy)
    t = np.clip((1.0 / gone - r) / (1.0 / gone - 1.0 / keep), 0.0, 1.0)
    return (t * t * (3.0 - 2.0 * t)).astype(np.float32)


def cut(plane, keep, gone, pad, round_the_globe):
    side = 0 if round_the_globe else pad
    p = np.pad(plane.astype(np.float32), ((pad, pad), (side, side)), mode="reflect")
    f = np.fft.rfft2(p)
    f *= weight(p.shape[0], p.shape[1], keep, gone)
    return np.fft.irfft2(f, s=p.shape)[pad:-pad, side:p.shape[1] - side]


def band(plane, lo, hi):
    f = np.fft.rfft2(plane.astype(np.float32))
    fy = np.fft.fftfreq(plane.shape[0])[:, None]
    fx = np.fft.rfftfreq(plane.shape[1])[None, :]
    r = np.hypot(fx, fy)
    f[(r < 1.0 / hi) | (r > 1.0 / lo)] = 0
    return float(np.fft.irfft2(f, s=plane.shape).std())


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1] == "public" else ROOT / "public" / "assets" / "earth"
    names = sys.argv[2:] or list(RULE["maps"])
    for name in names:
        rule = RULE["maps"][name]
        src = ROOT / "public" / "assets" / "earth" / rule["set"] / name
        mode = "RGBA" if name.endswith(".webp") else "RGB"
        m = np.asarray(Image.open(src).convert(mode))
        keep, gone = rule["keepTexels"], rule["goneTexels"]
        new = np.stack([cut(m[..., c], keep, gone, rule["pad"], rule["roundTheGlobe"]) for c in range(m.shape[2])], axis=-1)
        new = np.clip(np.rint(new), 0, 255).astype(np.uint8)
        y0, y1, x0, x1 = rule["probe"]
        ch = m.shape[2] - 1 if mode == "RGBA" else 1
        fine, kept = rule["bands"][0], rule["bands"][-1]
        if band(m[y0:y1, x0:x1, ch], fine[0], fine[1]) < rule["doneUnder"] * band(m[y0:y1, x0:x1, ch], kept[0], kept[1]):
            print("%s holds no more than %.2f of its coarse detail at periods %.1f to %.1f texels: it is cut already, not written" % (name, rule["doneUnder"], fine[0], fine[1]))
            continue
        for lo, hi in rule["bands"]:
            print("%s channel %d, rows %d to %d, columns %d to %d, periods %.1f to %.1f texels: before %.2f, after %.2f (rms, steps of 255)" % (name, ch, y0, y1, x0, x1, lo, hi, band(m[y0:y1, x0:x1, ch], lo, hi), band(new[y0:y1, x0:x1, ch], lo, hi)))
        d = np.abs(new.astype(np.int16) - m.astype(np.int16))
        print("%s: mean change %.3f, largest %d; mean level before %.4f, after %.4f" % (name, d.mean(), d.max(), m.mean(), new.mean()))
        dst = out / rule["set"] / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        if mode == "RGBA":
            Image.fromarray(new, "RGBA").save(dst, "WEBP", quality=rule["quality"], exact=True, method=4)
        else:
            Image.fromarray(new, "RGB").save(dst, "JPEG", quality=rule["quality"], subsampling=0)
        print("wrote %s, %d bytes" % (dst, dst.stat().st_size))


if __name__ == "__main__":
    main()
