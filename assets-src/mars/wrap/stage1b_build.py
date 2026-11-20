import sys

import cv2
import numpy as np

from compose0 import lab, rgb
from faces import basis, splat
from geo import WORK
from seamless import blur_wrap, merge
from stage1_faces import FACES, FOV

W = 4096
EXTRA = {"h": (-140, 5, 90, "t2")}
TAKE = {"n": "t3", "s": "t3", "w": "t3", "c": "t3", "e": "t3", "b": "t2"}


def load(p):
    return cv2.cvtColor(cv2.imread(str(p)), cv2.COLOR_BGR2RGB).astype(np.float32) / 255


def save(p, x, q=95):
    cv2.imwrite(str(p), cv2.cvtColor((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR),
                [cv2.IMWRITE_JPEG_QUALITY, q, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])


def match_left(f, ref):
    n = f.shape[1]
    Lf, Lr = lab(f), lab(cv2.resize(ref, (n, f.shape[0]), interpolation=cv2.INTER_AREA))
    sl = slice(0, int(n * 0.45))
    for c in range(3):
        a, b = Lf[:, sl, c], Lr[:, sl, c]
        Lf[..., c] = (Lf[..., c] - a.mean()) / a.std() * b.std() + b.mean()
    return np.clip(rgb(Lf), 0, 1)


def core(W=W, lo=0.55, hi=0.8):
    H = W // 2
    lon = (np.arange(W) + 0.5) / W * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(H) + 0.5) / H * np.pi
    lo0, la0 = np.radians(-73.7), np.radians(-9.9)
    c = np.sin(lat)[:, None] * np.sin(la0) + np.cos(lat)[:, None] * np.cos(la0) * np.cos(lon[None] - lo0)
    t = np.clip((c - lo) / (hi - lo), 0, 1)
    return (t * t * (3 - 2 * t)).astype(np.float32)


def main(detail=float(sys.argv[1]) if len(sys.argv) > 1 else 0.5):
    s1 = WORK / "s1"
    H = W // 2
    acc = np.zeros((H, W, 3), np.float32)
    wacc = np.zeros((H, W), np.float32)
    for k in FACES:
        splat(acc, wacc, load(s1 / f"{TAKE[k]}-{k}.png"), basis(*FACES[k]), FOV, W)
    F = acc / np.maximum(wacc, 1e-6)[..., None]
    for k, (lo, la, fov, take) in EXTRA.items():
        A = np.zeros_like(F)
        Wh = np.zeros(F.shape[:2], np.float32)
        splat(A, Wh, match_left(load(s1 / f"{take}-{k}.png"), load(s1 / f"in3-{k}.jpg")), basis(lo, la), fov, W, inner=0.6)
        F = F * (1 - Wh[..., None]) + A
    de = np.load(WORK / f"delit-h-{W}.npy").astype(np.float32)
    cf = np.load(WORK / f"conf-{W}.npy").astype(np.float32) * core()
    cf = cv2.GaussianBlur(np.clip((cf - 0.5) / 0.5, 0, 1), (0, 0), 6)
    m = cf > 0.95
    Lf, Lh = lab(F), lab(de)
    for c in range(3):
        a, b = Lf[..., c][m], Lh[..., c][m]
        Lf[..., c] = (Lf[..., c] - a.mean()) / a.std() * b.std() + b.mean()
    F = merge(de, rgb(Lf), cf, sig=24, decay_deg=30.0)
    Lf = lab(F)
    hf = Lh[..., 0] - blur_wrap(Lh[..., 0], 3)
    ff = Lf[..., 0] - blur_wrap(Lf[..., 0], 3)
    Lf[..., 0] += detail * cf * (hf - ff)
    out = rgb(Lf)
    np.save(WORK / "stage1-4096.npy", out.astype(np.float16))
    save(WORK / "stage1-color-4096.jpg", out)
    save(WORK / "v_stage1.jpg", cv2.resize(np.clip(out, 0, 1), (2048, 1024), interpolation=cv2.INTER_AREA), 90)


if __name__ == "__main__":
    main()
