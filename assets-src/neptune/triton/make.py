import sys
import cv2
import numpy as np

SRC = 'out/work/nep/gen/triton-map-t3-2x.png'
W, H = 4096, 2048
SATURATION = 0.3
PIVOT = 0.5
CONTRAST = 1.25
CAP = (0, 45)
WASH = (0.93, 0.84, 0.845)
PLAIN = (0.955, 0.972, 1.0)
DETAIL = (60, 0.55)


def main():
    src = cv2.imread(SRC).astype(np.float32) / 255
    img = cv2.resize(src, (W, H), interpolation=cv2.INTER_LANCZOS4)
    lum = img.mean(-1, keepdims=True)
    img = lum + (img - lum) * SATURATION
    img = np.clip((img - PIVOT) * CONTRAST + PIVOT, 0, 1)
    wrap = np.concatenate([img[:, -3 * DETAIL[0]:], img, img[:, :3 * DETAIL[0]]], axis=1)
    low = cv2.GaussianBlur(wrap, (0, 0), DETAIL[0])[:, 3 * DETAIL[0]:-3 * DETAIL[0]]
    img = np.clip(low + (img - low) * DETAIL[1], 0, 1)
    lat0 = (0.5 - (np.arange(H) + 0.5) / H) * 180
    cap = np.clip((lat0 - CAP[0]) / (CAP[1] - CAP[0]), 0, 1)
    cap = (cap * cap * (3 - 2 * cap))[:, None, None].astype(np.float32)
    img = img * ((1 - cap) * np.array(PLAIN, np.float32)[None, None, ::-1] + cap * np.array(WASH, np.float32)[None, None, ::-1])
    band = W // 10
    left = img[:, :band].copy()
    right = img[:, -band:].copy()
    t = np.linspace(0, 1, band, dtype=np.float32)[None, :, None]
    k = 0.5 * (1 - np.cos(np.pi * t))
    img[:, :band] = right[:, ::-1] * (1 - k) * 0.5 + left * (0.5 + 0.5 * k)
    img[:, -band:] = left[:, ::-1] * k[:, ::-1] * 0.5 + right * (1 - 0.5 * k[:, ::-1])
    lat = (0.5 - (np.arange(H) + 0.5) / H) * 180
    zonal = img.mean(axis=1, keepdims=True)
    w = np.clip((np.abs(lat) - 68) / 18, 0, 1)[:, None, None].astype(np.float32)
    w = w * w * (3 - 2 * w)
    out = img.copy()
    for y in range(H):
        if w[y, 0, 0] <= 0:
            continue
        stretch = 1 / max(np.cos(np.radians(lat[y])), 0.02)
        sigma = min(0.6 * stretch, W / 6)
        row = np.concatenate([img[y], img[y], img[y]], axis=0)[None]
        blur = cv2.GaussianBlur(row, (0, 0), sigmaX=sigma, sigmaY=0.01)[0, W:2 * W]
        out[y] = blur * (1 - w[y, 0, 0]) + zonal[y] * w[y, 0, 0]
    out = np.clip(out, 0, 1)
    full = (out * 255 + 0.5).astype(np.uint8)
    cv2.imwrite('public/assets/neptune/full/triton.jpg', full, [cv2.IMWRITE_JPEG_QUALITY, 92])
    web = cv2.resize(full, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    cv2.imwrite('public/assets/neptune/web/triton.jpg', web, [cv2.IMWRITE_JPEG_QUALITY, 88])
    cv2.imwrite('out/work/nep/triton-preview.jpg', cv2.resize(full, (1400, 700), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print('ok', full.shape, float(out.mean()))


main()
