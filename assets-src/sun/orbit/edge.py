import json
import sys
import cv2
import numpy as np
from PIL import Image
from geo import W, H, ROOT, WORK, load, save

TILE = (2752, 1548)
GREY = 880
MARGIN = 0.3
CARD = ROOT + '/public/assets/sun/full/sky-hold.webp'


def interior():
    a = np.asarray(Image.open(CARD).convert('RGB'))
    px, py = round(W * MARGIN), round(H * MARGIN)
    return a[py:py + H, px:px + W]


def tile_input(side):
    card = interior()
    k = TILE[1] / H
    keep = TILE[0] - GREY
    span = round(keep / k)
    part = card[:, W - span:] if side == 'right' else card[:, :span]
    part = cv2.resize(part, (keep, TILE[1]), interpolation=cv2.INTER_AREA)
    grey = np.full((TILE[1], GREY, 3), 128, np.uint8)
    out = np.concatenate([part, grey], 1) if side == 'right' else np.concatenate([grey, part], 1)
    Image.fromarray(out).save(f'{WORK}/edge-input-{side}.png')
    print(side, 'kept card columns', span, 'grey canvas columns', GREY, 'card columns to paint', round(GREY / k))


def place(side):
    src = np.asarray(Image.open(f'{WORK}/edge-input-{side}.png').convert('RGB'))
    take = np.asarray(Image.open(f'{WORK}/edge-take-{side}.png').convert('RGB'))
    w, h = TILE
    take = cv2.resize(take, (w, h), interpolation=cv2.INTER_LANCZOS4)
    keep = np.zeros((h, w), np.uint8)
    if side == 'right':
        keep[40:h - 40, 40:w - GREY - 40] = 255
    else:
        keep[40:h - 40, GREY + 40:w - 40] = 255
    k = 4
    small = lambda a, i: cv2.resize(a, (w // k, h // k), interpolation=i)
    soft = lambda a: cv2.GaussianBlur(small(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), cv2.INTER_AREA).astype(np.float32) / 255, (0, 0), 3)
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(soft(src), soft(take), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), small(keep, cv2.INTER_NEAREST), 5)
    warp[:, 2] *= k
    moved = cv2.warpAffine(take, warp, (w, h), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    m = keep > 0
    a = src[m].astype(np.float64).mean(0)
    b = moved[m].astype(np.float64).mean(0)
    diff = float(np.abs(src[m].astype(np.float64) - moved[m]).mean())
    Image.fromarray(moved).save(f'{WORK}/edge-moved-{side}.png')
    kk = TILE[1] / H
    px = round(W * MARGIN)
    cols = round(px * kk) + 2
    part = moved[:, w - GREY:w - GREY + cols] if side == 'right' else moved[:, GREY - cols:GREY]
    part = cv2.resize(part, (round(cols / kk), H), interpolation=cv2.INTER_LANCZOS4)
    part = part[:, :px] if side == 'right' else part[:, part.shape[1] - px:]
    Image.fromarray(part).save(f'{WORK}/edge-{side}.png')
    json.dump({'matrix': warp.tolist(), 'cc': float(cc), 'means': [a.tolist(), b.tolist()], 'kept difference': diff}, open(f'{WORK}/edge-place-{side}.json', 'w'))
    print(side, 'cc', round(float(cc), 4), 'matrix', warp.round(4).tolist(), 'kept sky: mean abs difference', round(diff, 2), 'means', a.round(1), b.round(1), 'strip', part.shape)


if __name__ == '__main__':
    {'input': tile_input, 'place': place}[sys.argv[1]](sys.argv[2])
