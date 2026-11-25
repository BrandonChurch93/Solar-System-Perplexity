import sys, os, hashlib, numpy as np, cv2
from PIL import Image

CALM = 31
NEAR = 13
EVEN = 2.5
SOFT = 6.0
SPECK = 4.0
GROW = 1.6
KEEP = 0.0
FINE = 1.2


def lum(a):
    return a @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def calm(code, keep=KEEP):
    a = code.astype(np.float32)
    wide = np.dstack([cv2.medianBlur(code[..., c], CALM) for c in range(3)]).astype(np.float32)
    wide = cv2.GaussianBlur(wide, (0, 0), SOFT, borderType=cv2.BORDER_REFLECT)
    near = np.dstack([cv2.medianBlur(code[..., c], NEAR) for c in range(3)]).astype(np.float32)
    near = cv2.GaussianBlur(near, (0, 0), EVEN, borderType=cv2.BORDER_REFLECT)
    floor = wide * (lum(near) / np.maximum(lum(wide), 0.5))[..., None]
    d = a - floor
    dl = lum(d)
    noise = 1.4826 * cv2.medianBlur(np.clip(np.abs(dl) * 8, 0, 255).astype(np.uint8), CALM).astype(np.float32) / 8
    noise = np.maximum(cv2.GaussianBlur(noise, (0, 0), SOFT * 2), 0.5)
    core = (dl > SPECK * noise).astype(np.float32)
    star = np.clip(cv2.GaussianBlur(cv2.dilate(core, np.ones((3, 3), np.uint8)), (0, 0), GROW / 2) * 2, 0, 1)[..., None]
    fine = d - cv2.GaussianBlur(d, (0, 0), FINE)
    out = floor + np.maximum(d, 0) * star + keep * fine * (1 - star)
    out = np.clip(np.rint(out), 0, 255).astype(np.uint8)
    return np.where(core[..., None] > 0, code, out), core > 0, noise


def write(img, dst):
    Image.fromarray(img).save(dst, lossless=True, quality=100, method=6, exact=True)
    assert np.array_equal(np.asarray(Image.open(dst).convert('RGB')), img)
    print(f'{dst}: {img.shape[1]} x {img.shape[0]}, {os.path.getsize(dst)} bytes, sha256 {hashlib.sha256(open(dst, "rb").read()).hexdigest()}')


def main():
    src, full, web = sys.argv[1], sys.argv[2], sys.argv[3]
    keep = float(sys.argv[4]) if len(sys.argv) > 4 else KEEP
    code = np.asarray(Image.open(src).convert('RGB'))
    out, core, noise = calm(code, keep)
    moved = (out != code).any(axis=2)
    print(f'{src}: {os.path.getsize(src)} bytes, noise median {np.median(noise):.2f} codes, star pixels {int(core.sum())} ({core.mean() * 100:.2f} percent), changed pixels {int(moved.sum())} ({moved.mean() * 100:.1f} percent), star pixels changed {int((moved & core).sum())}, largest change {int(np.abs(out.astype(int) - code.astype(int)).max())} codes')
    write(out, full)
    h, w = out.shape[:2]
    half = out.reshape(h // 2, 2, w // 2, 2, 3).astype(np.float32).mean(axis=(1, 3))
    write(np.clip(np.rint(half), 0, 255).astype(np.uint8), web)


if __name__ == '__main__':
    main()
