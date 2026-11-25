"""The picture of the place past the end of the ground of the surface view, as the eye of T sees it.

The ground of the surface view (the canvas of the relief and its aprons) ends: seen from the eye of T of the dive its lower end
lies on the lower border of the frame of T, and the plates went on below it with other cloud. A take of the image tool continues
the picture of a survey camera (survey.ts) past that end. Here the take is brought onto the survey picture: scaled to its size,
registered on the part both hold (ECC, affine), matched in colour on that part, and set in where the close side has no ground.
The result, out/work/venus/place/t/more-<frame>-<name>.png, is what tlay.py round lays into the plates (atT.round.more).

python3 assets-src/venus/place/more.py KIND NAME TAKE    TAKE: the take scaled to the size of the survey picture
"""
import sys

import cv2
import numpy as np

import lay
import tlay

T = tlay.T
R = tlay.AT['round']


def main(kind, name, take):
    f = tlay.camera(kind)['frame']
    close = cv2.imread(str(T / f'close-{f}-{name}.png'), cv2.IMREAD_COLOR)
    layers = cv2.imread(str(T / f'layers-{f}-{name}.png'), cv2.IMREAD_COLOR).max(2)
    new = cv2.imread(str(take), cv2.IMREAD_COLOR)
    h, w = close.shape[:2]
    if new.shape[:2] != (h, w):
        new = cv2.resize(new, (w, h), interpolation=cv2.INTER_LANCZOS4)
    ground = (layers > 25).astype(np.uint8)
    inner = cv2.erode(ground, np.ones((2 * R['moreInPx'] + 1,) * 2, np.uint8))
    # Registration at a quarter of the size, on the part both hold.
    q = 4
    a = cv2.cvtColor(cv2.resize(close, (w // q, h // q), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
    b = cv2.cvtColor(cv2.resize(new, (w // q, h // q), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
    mask = cv2.resize(inner, (w // q, h // q), interpolation=cv2.INTER_NEAREST)
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(a, b, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), mask, 5)
    warp[:, 2] *= q
    new = cv2.warpAffine(new, warp, (w, h), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    # Colour: the take's own copy of the kept part against the kept part, in the band next to the end of the ground.
    band = (cv2.dilate(1 - ground, np.ones((2 * R['moreBandPx'] + 1,) * 2, np.uint8)) & inner).astype(bool)
    gains = []
    out = new.astype(np.float32)
    for c in range(3):
        x, y = new[..., c][band].astype(np.float32), close[..., c][band].astype(np.float32)
        gain = float((y.mean() + 1) / (x.mean() + 1))
        gains.append(round(gain, 3))
        out[..., c] *= gain
    # The kept part stays; the take comes in over moreInPx pixels inside the end of the ground.
    share = cv2.GaussianBlur(inner.astype(np.float32), (0, 0), R['moreInPx'] / 2)
    share = np.clip((share - 0.5) * 2, 0, 1)[..., None]
    res = close.astype(np.float32) * share + out * (1 - share)
    cv2.imwrite(str(T / f'more-{f}-{name}.png'), np.clip(res + 0.5, 0, 255).astype(np.uint8))
    diff = np.abs(new.astype(np.float32) * np.array(gains, np.float32) - close.astype(np.float32)).mean(2)[inner.astype(bool)]
    print(kind, name, 'ECC', round(float(cc), 4), 'shift px', [round(float(v), 2) for v in warp[:, 2]], 'gains b g r', gains,
          'take against the kept part, mean of 255', round(float(diff.mean()), 2), 'share of the picture that is new', round(float(1 - share.mean()), 4))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
