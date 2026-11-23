import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'deck'))
import geom
from layback import inverse_filmic, srgb_to_linear

ROOT = os.path.join(HERE, '..', '..', '..')
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
FULL = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'full')
WEB = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'web')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'tone')


def scene(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1].astype(np.float32) / 255
    return inverse_filmic(srgb_to_linear(im)).astype(np.float32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    deck = json.load(open(os.path.join(STOP, 'deck.json')))
    fields = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    cfg = deck['tone']
    n = cfg['pixels']
    size = cfg['size']
    cx, cy = cfg['centre']
    step = size / n
    xs = cx + (np.arange(n) + 0.5 - n / 2) * step
    ys = cy + (n / 2 - np.arange(n) - 0.5) * step
    gx, gy = np.meshgrid(xs, ys)

    maps = fields['maps']
    hr = fields['heightRange']
    fm = maps['fore']
    raw = np.fromfile(os.path.join(FULL, 'deck-fore-height.bin'), dtype=np.uint16).reshape(fm['pixels']['full'], fm['pixels']['full']).astype(np.float32) / 65535
    u = ((gx - fm['centre'][0]) / fm['size'] + 0.5) * raw.shape[1] - 0.5
    v = (0.5 - (gy - fm['centre'][1]) / fm['size']) * raw.shape[0] - 0.5
    small = cv2.GaussianBlur(raw, (0, 0), step / (fm['size'] / raw.shape[0]) * 0.5)
    h = cv2.remap(small, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    inside = h >= 0
    h = np.where(inside, hr[0] + h * hr[1], 0.0)

    p = geom.from_chart(gx, gy, h)
    front = -p[..., 2] > 1e-3
    px = geom.W / 2 + geom.F * p[..., 0] / np.maximum(-p[..., 2], 1e-3)
    py = geom.H / 2 - geom.F * p[..., 1] / np.maximum(-p[..., 2], 1e-3)
    image = scene(os.path.join(FULL, 'deck-image-wide.jpg'))
    image = cv2.GaussianBlur(image, (0, 0), cfg['imageBlurPx'])
    lay = cv2.remap(image, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    eye = np.array(fields['view']['origin'])
    dist = np.hypot(gx - eye[0], gy - eye[1])
    m = cfg['marginPx']
    known = (front & (px > m) & (px < geom.W - m) & (py > m) & (py < geom.H - m)).astype(np.float32) * (1 - smoothstep(cfg['known'][0], cfg['known'][1], dist))

    plates = fields['plates']
    join = deck['look']['join']
    total = np.zeros((n, n, 3), np.float32)
    left = np.ones((n, n), np.float32)
    for name in ['fore', 'near', 'mid', 'far']:
        pl = plates[name]
        im = scene(os.path.join(FULL, 'plate-' + name + '.png'))
        texel = pl['size'][0] / im.shape[1]
        if step > texel:
            im = cv2.GaussianBlur(im, (0, 0), 0.5 * step / texel)
        u = ((gx - pl['centre'][0]) / pl['size'][0] + 0.5) * im.shape[1] - 0.5
        v = (0.5 - (gy - pl['centre'][1]) / pl['size'][1]) * im.shape[0] - 0.5
        col = cv2.remap(im, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        reach = np.maximum(np.abs(gx - pl['centre'][0]) * 2 / pl['size'][0], np.abs(gy - pl['centre'][1]) * 2 / pl['size'][1])
        w = left * (1 - smoothstep(join[0], join[1], reach)) if name != 'far' else left
        total += col * w[..., None]
        left = left - w
    sigma = cfg['blurUnits'] / step
    num = cv2.GaussianBlur(lay * known[..., None], (0, 0), sigma)
    den = cv2.GaussianBlur(total * known[..., None], (0, 0), sigma)
    cover = cv2.GaussianBlur(known, (0, 0), sigma)
    ratio = np.clip(num / np.maximum(den, 1e-6), cfg['range'][0], cfg['range'][1])
    logm = np.log(ratio) * (cover > 0.05)[..., None]
    weight = np.where(cover > 0.05, cover, 0).astype(np.float32)
    acc = np.zeros_like(logm)
    wsum = np.zeros_like(weight)
    s = sigma
    for _ in range(7):
        a = cv2.GaussianBlur(logm * weight[..., None], (0, 0), s)
        b = cv2.GaussianBlur(weight, (0, 0), s)
        take = np.clip(1 - wsum, 0, 1) * np.clip(b * 4, 0, 1)
        acc += take[..., None] * a / np.maximum(b, 1e-6)[..., None]
        wsum += take
        s *= 2
    filled = acc / np.maximum(wsum, 1e-6)[..., None]
    filled = cv2.GaussianBlur(filled, (0, 0), sigma)
    keep = 1 - smoothstep(cfg['fade'][0], cfg['fade'][1], dist)
    out = np.exp(filled * keep[..., None]).astype(np.float32)
    code = np.clip(out / cfg['scale'], 0, 1)
    stacked = np.concatenate([code[..., 0], code[..., 1], code[..., 2]], 0)
    data = np.round(stacked * 65535).astype(np.uint16)
    for folder in (FULL, WEB):
        data.tofile(os.path.join(folder, 'deck-tone.bin'))
    os.makedirs(WORK, exist_ok=True)
    show = np.concatenate([np.clip(lay * known[..., None], 0, 1), np.clip(total, 0, 1), np.clip(total * out, 0, 1), np.clip(out / 2, 0, 1)], 1)
    cv2.imwrite(os.path.join(WORK, 'tone.png'), (np.clip(show, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)[..., ::-1])
    print('tone', n, 'min', out.min(axis=(0, 1)), 'max', out.max(axis=(0, 1)), 'at eye', out[np.argmin(np.abs(ys - eye[1])), np.argmin(np.abs(xs - eye[0]))])


main()
