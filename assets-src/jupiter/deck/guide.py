import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from layback import filmic, inverse_filmic, linear_to_srgb, srgb_to_linear

ROOT = os.path.join(HERE, '..', '..', '..')
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
FULL = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'full')
WEB = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'web')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'guide')


def scene(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1].astype(np.float32) / 255
    return inverse_filmic(srgb_to_linear(im)).astype(np.float32)


def display(lin):
    return linear_to_srgb(filmic(lin))


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def table(name, cfg):
    n = cfg['pixels']
    raw = np.fromfile(os.path.join(FULL, name), dtype=np.uint16).astype(np.float32) / 65535 * cfg['scale']
    return raw.reshape(3, n, n).transpose(1, 2, 0)


def field(tab, cfg, gx, gy):
    n = cfg['pixels']
    edge = 0.5 / n
    u = np.clip((gx - cfg['centre'][0]) / cfg['size'] + 0.5, edge, 1 - edge) * n - 0.5
    v = np.clip((cfg['centre'][1] - gy) / cfg['size'] + 0.5, edge, 1 - edge) * n - 0.5
    return cv2.remap(tab, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def ground(deck, fields, plates, tone, calm, centre, size, n):
    step = size / n
    xs = centre[0] + (np.arange(n) + 0.5 - n / 2) * step
    ys = centre[1] + (n / 2 - np.arange(n) - 0.5) * step
    gx, gy = np.meshgrid(xs.astype(np.float32), ys.astype(np.float32))
    join = deck['look']['join']
    total = np.zeros((n, n, 3), np.float32)
    left = np.ones((n, n), np.float32)
    for name in ['fore', 'near', 'mid', 'far']:
        pl = fields['plates'][name]
        im = plates[name]
        texel = pl['size'][0] / im.shape[1]
        if step > texel:
            im = cv2.GaussianBlur(im, (0, 0), 0.5 * step / texel)
        u = ((gx - pl['centre'][0]) / pl['size'][0] + 0.5) * im.shape[1] - 0.5
        v = (0.5 - (gy - pl['centre'][1]) / pl['size'][1]) * im.shape[0] - 0.5
        col = cv2.remap(im, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        reach = np.maximum(np.abs(gx - pl['centre'][0]) * 2 / pl['size'][0], np.abs(gy - pl['centre'][1]) * 2 / pl['size'][1])
        w = left * (1 - smoothstep(join[0], join[1], reach)) if name != 'far' else left
        total += col * w[..., None]
        left = left - w
    return total * field(tone, deck['tone'], gx, gy) * field(calm, deck['calm'], gx, gy)


def main():
    deck = json.load(open(os.path.join(STOP, 'deck.json')))
    fields = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    cfg = deck['guide']
    plates = {name: scene(os.path.join(FULL, 'plate-' + name + '.png')) for name in ['fore', 'near', 'mid', 'far']}
    tone = table('deck-tone.bin', deck['tone'])
    calm = table('deck-calm.bin', deck['calm'])
    os.makedirs(WORK, exist_ok=True)
    for name, level in cfg['levels'].items():
        n = level['pixels']['full']
        fine = level['work']
        lin = ground(deck, fields, plates, tone, calm, level['centre'], level['size'], fine)
        sigma = cfg['cutUnits'] / (level['size'] / fine)
        low = cv2.GaussianBlur(lin, (0, 0), sigma, borderType=cv2.BORDER_REPLICATE)
        for folder, key in ((FULL, 'full'), (WEB, 'web')):
            m = level['pixels'][key]
            small = cv2.resize(low, (m, m), interpolation=cv2.INTER_AREA)
            out = np.round(np.clip(display(small), 0, 1) * 255).astype(np.uint8)
            cv2.imwrite(os.path.join(folder, 'guide-' + name + '.png'), out[..., ::-1], [cv2.IMWRITE_PNG_COMPRESSION, 9])
        mean = low.reshape(-1, 3).mean(0)
        print('guide', name, 'pixels', n, 'sigma px of the work grid', round(sigma, 2), 'mean', [round(float(c), 4) for c in mean], 'display', [int(round(float(c) * 255)) for c in display(mean)])
        show = np.concatenate([np.clip(display(cv2.resize(lin, (1024, 1024), interpolation=cv2.INTER_AREA)), 0, 1), np.clip(display(cv2.resize(low, (1024, 1024), interpolation=cv2.INTER_AREA)), 0, 1)], 1)
        cv2.imwrite(os.path.join(WORK, 'guide-' + name + '.jpg'), (show * 255).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 92])


main()
