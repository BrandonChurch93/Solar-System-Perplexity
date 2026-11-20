import cv2
import numpy as np

from compose0 import lab, rgb
from faces import basis, splat
from geo import WORK
from seamless import merge
from stage1_faces import FACES, FOV

W = 4096
TAKE = {"n": "t2", "s": "t2", "w": "t2", "c": "t2", "e": "t2", "b": "t2"}


def load(p):
    return cv2.cvtColor(cv2.imread(str(p)), cv2.COLOR_BGR2RGB).astype(np.float32) / 255


def blur_wrap(x, s):
    pad = int(3 * s)
    y = np.concatenate([x[:, -pad:], x, x[:, :pad]], 1)
    y = cv2.GaussianBlur(y, (0, 0), s)
    return y[:, pad:-pad]


def main():
    s1 = WORK / "s1"
    H = W // 2
    acc = np.zeros((H, W, 3), np.float32)
    wacc = np.zeros((H, W), np.float32)
    for k, (lo, la) in FACES.items():
        f = load(s1 / f"{TAKE[k]}-{k}.png")
        splat(acc, wacc, f, basis(lo, la), FOV, W)
    F = acc / np.maximum(wacc, 1e-6)[..., None]
    de = np.load(WORK / f"delit-h-{W}.npy").astype(np.float32)
    cf = np.load(WORK / f"conf-{W}.npy").astype(np.float32)
    m = cf > 0.95
    Lf, Lh = lab(F), lab(de)
    corr = []
    for c in range(3):
        a, b = Lf[..., c][m], Lh[..., c][m]
        sa, sb = a.std(), b.std()
        corr.append((a.mean(), sa, b.mean(), sb))
        Lf[..., c] = (Lf[..., c] - a.mean()) / sa * sb + b.mean()
    F = rgb(Lf)
    np.save(WORK / "s1-F.npy", F.astype(np.float16))
    F = merge(de, F, cf)
    w3 = cf[..., None]
    out = de * w3 + F * (1 - w3)
    np.save(WORK / "stage1-4096.npy", out.astype(np.float16))
    cv2.imwrite(str(WORK / "stage1-color-4096.jpg"), cv2.cvtColor((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR),
                [cv2.IMWRITE_JPEG_QUALITY, 95, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    cv2.imwrite(str(WORK / "v_stage1.jpg"), cv2.cvtColor((cv2.resize(np.clip(out, 0, 1), (2048, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
    print("lab correction (face mean, sd, hero mean, sd)", np.round(corr, 2).tolist())


if __name__ == "__main__":
    main()
