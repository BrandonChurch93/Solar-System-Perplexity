import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import prep
from prep import GEN, PL, display, scene_of
from prep import vblur


def code(scene):
    return display(scene).astype(np.float32) / 255


def shift_of(a, b):
    ga = cv2.GaussianBlur(a.mean(-1), (0, 0), 3)
    gb = cv2.GaussianBlur(b.mean(-1), (0, 0), 3)
    ga = ga - cv2.GaussianBlur(ga, (0, 0), 40)
    gb = gb - cv2.GaussianBlur(gb, (0, 0), 40)
    (dx, dy), peak = cv2.phaseCorrelate(ga.astype(np.float64), gb.astype(np.float64), cv2.createHanningWindow(ga.shape[::-1], cv2.CV_64F))
    return dx, dy, peak


def join(name, take):
    canvas = np.load(os.path.join(GEN, name + '-canvas.npy'))
    blur = np.load(os.path.join(GEN, name + '-blur.npy'))
    tie = np.load(os.path.join(GEN, name + '-tie.npy'))
    ny, nx = canvas.shape[:2]
    img = cv2.imread(take, cv2.IMREAD_COLOR)[::-1, :, ::-1]
    size = img.shape[:2]
    if size != (ny, nx):
        img = cv2.resize(img, (nx, ny), interpolation=cv2.INTER_LANCZOS4)
    gen = img.astype(np.float32) / 255
    far = prep.grade()
    can = code(canvas * far)
    dx, dy, peak = shift_of(can, gen)
    if abs(dx) > 0.3 or abs(dy) > 0.3:
        gen = cv2.warpAffine(gen, np.float32([[1, 0, -dx], [0, 1, -dy]]), (nx, ny), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    k, lo, hi = PL['lock']
    sigma = np.clip(k * tie, lo, hi).astype(np.float32)
    sigma = np.exp(cv2.GaussianBlur(np.log(sigma), (0, 0), 8))
    levels = (0.0, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0, 128.0, 256.0, 512.0)
    can_low = vblur(can, sigma, levels)
    gen_low = vblur(gen, sigma, levels)
    gain = PL['lockGain']
    out = can_low + gain * (gen - gen_low)
    fin = PL['finishedPx']
    keep = np.clip((2 * fin - blur) / fin, 0, 1)
    keep = cv2.GaussianBlur(keep, (0, 0), 1.5)[..., None]
    out = out * (1 - keep) + can * keep
    out = np.clip(out, 0, 1)
    plate = scene_of(out * 255) / far
    low_can = cv2.GaussianBlur(can, (0, 0), 24)
    low_gen = cv2.GaussianBlur(gen, (0, 0), 24)
    corr = float(np.corrcoef((low_can - cv2.GaussianBlur(low_can, (0, 0), 200)).ravel(), (low_gen - cv2.GaussianBlur(low_gen, (0, 0), 200)).ravel())[0, 1])
    hp = lambda x: float((x - cv2.GaussianBlur(x, (0, 0), 4)).std() * 255)
    print(name, 'take', os.path.basename(take), 'size', size, 'shift px', round(dx, 2), round(dy, 2), 'peak', round(peak, 3), 'band correlation with the canvas', round(corr, 3), 'detail (std of the high pass, sigma 4 px) canvas', round(hp(can), 2), 'take', round(hp(gen), 2), 'plate', round(hp(out), 2), 'mean abs change of the take by the lock', round(float(np.abs(out - gen).mean() * 255), 2))
    return plate, out


if __name__ == '__main__':
    name, take = sys.argv[1], sys.argv[2]
    plate, out = join(name, take)
    if len(sys.argv) > 3 and sys.argv[3] == 'keep':
        np.save(os.path.join(GEN, name + '-plate.npy'), plate)
        cv2.imwrite(os.path.join(GEN, name + '-plate.png'), np.round(out[::-1, :, ::-1] * 255).astype(np.uint8))
    else:
        cv2.imwrite(os.path.splitext(take)[0] + '-joined.png', np.round(out[::-1, :, ::-1] * 255).astype(np.uint8))
