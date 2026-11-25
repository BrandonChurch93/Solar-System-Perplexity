import sys, os, hashlib, numpy as np, cv2
from PIL import Image

WIDE = 31
SOFT = 6.0
NEAR = 13
EVEN = 2.5
SPECK = 4.0
GROW = 1.6
RING = 7
PIT = 1.0
DEEP = 2.5
HUE = 0.0
W = np.array([0.2126, 0.7152, 0.0722], np.float32)


def lum(a):
    return a @ W


def med(code, k, s):
    m = np.dstack([cv2.medianBlur(code[..., c], k) for c in range(3)]).astype(np.float32)
    return cv2.GaussianBlur(m, (0, 0), s, borderType=cv2.BORDER_REFLECT)


def calm(code, hue=HUE):
    a = code.astype(np.float32)
    wide = med(code, WIDE, SOFT)
    near = med(code, NEAR, EVEN)
    L, Ln, Lw = lum(a), lum(near), lum(wide)
    dl = L - Ln
    noise = 1.4826 * cv2.medianBlur(np.clip(np.abs(dl) * 8, 0, 255).astype(np.uint8), WIDE).astype(np.float32) / 8
    noise = np.maximum(cv2.GaussianBlur(noise, (0, 0), SOFT * 2), 0.5)
    core = (dl > SPECK * noise).astype(np.float32)
    star = np.clip(cv2.GaussianBlur(cv2.dilate(core, np.ones((3, 3), np.uint8)), (0, 0), GROW / 2) * 2, 0, 1)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * RING + 1, 2 * RING + 1))
    ring = np.clip(cv2.GaussianBlur(cv2.dilate(core, k), (0, 0), 1.5) * 1.5, 0, 1)
    lack = np.minimum(Ln, Lw) - L
    t = np.clip((lack - PIT * noise) / ((DEEP - PIT) * noise), 0, 1)
    L1 = L + lack * t * t * (3 - 2 * t) * ring
    flat = wide * (L1 / np.maximum(Lw, 0.5))[..., None]
    own = a + near * ((L1 - L) / np.maximum(Ln, 0.5))[..., None]
    mix = (hue * (1 - star))[..., None]
    out = flat * mix + own * (1 - mix)
    out = np.clip(np.rint(out), 0, 255).astype(np.uint8)
    return np.where(core[..., None] > 0, code, out), core > 0, noise, ring


def write(img, dst):
    Image.fromarray(img).save(dst, lossless=True, quality=100, method=6, exact=True)
    assert np.array_equal(np.asarray(Image.open(dst).convert('RGB')), img)
    print(f'{dst}: {img.shape[1]} x {img.shape[0]}, {os.path.getsize(dst)} bytes, sha256 {hashlib.sha256(open(dst, "rb").read()).hexdigest()}')


def main():
    src, full, web = sys.argv[1], sys.argv[2], sys.argv[3]
    hue = float(sys.argv[4]) if len(sys.argv) > 4 else HUE
    code = np.asarray(Image.open(src).convert('RGB'))
    out, core, noise, ring = calm(code, hue)
    moved = (out != code).any(axis=2)
    dl = lum(out.astype(np.float32)) - lum(code.astype(np.float32))
    print(f'{src}: {os.path.getsize(src)} bytes, noise median {np.median(noise):.2f} codes, star pixels {int(core.sum())} ({core.mean() * 100:.2f} percent), changed pixels {int(moved.sum())} ({moved.mean() * 100:.1f} percent), star pixels changed {int((moved & core).sum())}, largest change {int(np.abs(out.astype(int) - code.astype(int)).max())} codes, luma raised by over 1 code {int((dl > 1).sum())} ({(dl > 1).mean() * 100:.2f} percent), luma lowered by over 1 code {int((dl < -1).sum())}')
    write(out, full)
    h, w = out.shape[:2]
    write(np.asarray(Image.fromarray(out).resize((w // 2, h // 2), Image.LANCZOS)), web)


if __name__ == '__main__':
    main()
