import json
import sys

import cv2
import numpy as np

H0, H1 = -0.06, 0.05
SHAPE = np.asarray(json.load(open("src/stops/earth/shape.json"))["matrix"], dtype=np.float64)
UNSHAPE = np.linalg.inv(SHAPE)


def srgb_to_linear(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def unwrap(img, pose, pa0, pa1, sub=3.0):
    hh, ww = img.shape[:2]
    world = np.asarray(pose["basis"], dtype=np.float64).reshape(4, 4).T[:3, :3]
    eye = UNSHAPE @ np.asarray(pose["eye"], dtype=np.float64)
    m = UNSHAPE @ world
    k = (hh / 2) / np.tan(np.radians(pose["vfov"]) / 2)
    dist = np.linalg.norm(eye)
    axis = -eye / dist
    up = m[:, 1]
    e2 = up - axis * up.dot(axis)
    e2 /= np.linalg.norm(e2)
    e1 = np.cross(axis, e2)
    e1 = e1 if e1.dot(m[:, 0]) > 0 else -e1
    limb = np.tan(np.arcsin(1 / np.linalg.norm(pose["eye"]))) * k
    n_pa = int((pa1 - pa0) / 360 * 2 * np.pi * limb)
    n_h = int((H1 - H0) * limb * sub)
    pa = np.radians(np.linspace(pa0, pa1, n_pa))[None, :]
    h = np.linspace(H1, H0, n_h)[:, None]
    th = np.arcsin(np.clip((1 + h) / dist, -1, 1))
    d = np.cos(th)[..., None] * axis + np.sin(th)[..., None] * (np.sin(pa)[..., None] * e1 + np.cos(pa)[..., None] * e2)
    c = (d @ SHAPE.T) @ world
    x = ww / 2 + c[..., 0] / -c[..., 2] * k
    y = hh / 2 - c[..., 1] / -c[..., 2] * k
    out = cv2.remap(img, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 0, 255))
    return out, limb, h[:, 0]


def main():
    out, still, frame, pa0, pa1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
    gain = float(sys.argv[6]) if len(sys.argv) > 6 else 3.0
    poses = {p["frame"]: p for p in json.load(open(sys.argv[7] if len(sys.argv) > 7 else "out/work/earth/p6/poses.json"))}
    img = cv2.imread(still, cv2.IMREAD_COLOR)
    strip, limb, h = unwrap(img, poses[frame], pa0, pa1)
    rows = [strip, np.clip(strip.astype(np.float32) * gain, 0, 255).astype(np.uint8)]
    if frame == 1755 or "--hero" in sys.argv:
        hero = cv2.imread("out/work/earth/hero.jpg", cv2.IMREAD_COLOR)
        hs, _, _ = unwrap(hero, poses[1755], pa0, pa1, sub=3.0 * img.shape[0] / hero.shape[0])
        hs = cv2.resize(hs, (strip.shape[1], strip.shape[0]), interpolation=cv2.INTER_AREA)
        rows = [hs, strip, np.clip(hs.astype(np.float32) * gain, 0, 255).astype(np.uint8), rows[1]]
        lin_h = srgb_to_linear(hs[..., ::-1].astype(np.float64))
    lin = srgb_to_linear(strip[..., ::-1].astype(np.float64))
    sheet = np.concatenate([np.concatenate([r, np.full((6, r.shape[1], 3), 90, np.uint8)]) for r in rows])
    zero = int(round((H1 - 0) / (H1 - H0) * (strip.shape[0] - 1)))
    sheet[:, :6] = 90
    for i in range(len(rows)):
        sheet[i * (strip.shape[0] + 6) + zero, :6] = (0, 255, 255)
    cv2.imwrite(out, sheet)
    print(out, sheet.shape, "limb px", round(limb, 1), "rows per px", 3)
    step = max(1, strip.shape[0] // 52)
    for j in range(0, strip.shape[0], step):
        a = np.median(lin[j : j + step], axis=(0, 1)) * 255
        s = f"h {h[j]:+.4f} px {h[j] * limb:+6.1f}  film {a[0]:6.2f} {a[1]:6.2f} {a[2]:6.2f}"
        if len(rows) == 4:
            b = np.median(lin_h[j : j + step], axis=(0, 1)) * 255
            s += f"   hero {b[0]:6.2f} {b[1]:6.2f} {b[2]:6.2f}"
        print(s)


if __name__ == "__main__":
    main()
