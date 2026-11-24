import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'deck'))
from layback import filmic, inverse_filmic, linear_to_srgb, srgb_to_linear

ROOT = os.path.join(HERE, '..', '..', '..')
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
FULL = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'full')
WEB = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'web')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'calm')


def scene(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1].astype(np.float32) / 255
    return inverse_filmic(srgb_to_linear(im)).astype(np.float32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def lum(c):
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]


def carry(value, weight, sigma, levels):
    acc = np.zeros_like(value)
    wsum = np.zeros_like(weight)
    s = sigma
    for _ in range(levels):
        a = cv2.GaussianBlur(value * weight[..., None], (0, 0), s)
        b = cv2.GaussianBlur(weight, (0, 0), s)
        take = np.clip(1 - wsum, 0, 1) * np.clip(b * 4, 0, 1)
        acc += take[..., None] * a / np.maximum(b, 1e-6)[..., None]
        wsum += take
        s *= 2
    return acc / np.maximum(wsum, 1e-6)[..., None]


def lattice(x, y, seed):
    xi = np.floor(x)
    yi = np.floor(y)
    fx = x - xi
    fy = y - yi
    fx = fx * fx * (3 - 2 * fx)
    fy = fy * fy * (3 - 2 * fy)

    def at(i, j):
        v = np.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453
        return v - np.floor(v)

    return (at(xi, yi) * (1 - fx) + at(xi + 1, yi) * fx) * (1 - fy) + (at(xi, yi + 1) * (1 - fx) + at(xi + 1, yi + 1) * fx) * fy


def grid(centre, size, n):
    step = size / n
    xs = centre[0] + (np.arange(n) + 0.5 - n / 2) * step
    ys = centre[1] + (n / 2 - np.arange(n) - 0.5) * step
    gx, gy = np.meshgrid(xs, ys)
    return gx, gy, step


def plates_on(deck, fields, gx, gy, step):
    join = deck['look']['join']
    total = np.zeros(gx.shape + (3,), np.float32)
    left = np.ones(gx.shape, np.float32)
    for name in ['fore', 'near', 'mid', 'far']:
        pl = fields['plates'][name]
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
    return total


def field_on(field, centre, size, gx, gy):
    n = field.shape[0]
    u = np.clip((gx - centre[0]) / size + 0.5, 0.5 / n, 1 - 0.5 / n) * n - 0.5
    v = np.clip(0.5 - (gy - centre[1]) / size, 0.5 / n, 1 - 0.5 / n) * n - 0.5
    return cv2.remap(field, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def tone_field(deck):
    tn = deck['tone']
    raw = np.fromfile(os.path.join(FULL, 'deck-tone.bin'), dtype=np.uint16).astype(np.float32) / 65535 * tn['scale']
    return raw.reshape(3, tn['pixels'], tn['pixels']).transpose(1, 2, 0)


def build(deck, fields):
    cfg = deck['calm']
    hue_cfg = cfg['hue']
    sh = cfg['shade']
    tn = deck['tone']
    n = cfg['pixels']
    gx, gy, step = grid(cfg['centre'], cfg['size'], n)
    ground = plates_on(deck, fields, gx, gy, step) * field_on(tone_field(deck), tn['centre'], tn['size'], gx, gy)

    pl = deck['plates']
    nc = fields['plates']['near']['centre']
    k = pl['nestPower']
    r = (np.abs(gx - nc[0]) ** k + np.abs(gy - nc[1]) ** k) ** (1 / k)
    own = 1 - smoothstep(pl['nest'][0], pl['nest'][1], r) ** 2

    sigma = hue_cfg['blurUnits'] / step
    low = cv2.GaussianBlur(ground, (0, 0), sigma)
    bias = 1 / (lum(ground) + hue_cfg['darkBias'])
    deep = cv2.GaussianBlur(ground * bias[..., None], (0, 0), sigma) / cv2.GaussianBlur(bias, (0, 0), sigma)[..., None]
    cold = np.maximum((low[..., 2] - low[..., 0]) / (low[..., 2] + low[..., 0] + 1e-4), (deep[..., 2] - deep[..., 0]) / (deep[..., 2] + deep[..., 0] + 1e-4))
    free = 1 - smoothstep(0, hue_cfg['nestShare'], own)
    mask = cv2.GaussianBlur(smoothstep(hue_cfg['cold'][0], hue_cfg['cold'][1], cold) * free, (0, 0), hue_cfg['softUnits'] / step)
    warm = ((1 - smoothstep(hue_cfg['warm'][0], hue_cfg['warm'][1], cold)) * free).astype(np.float32)
    around = carry(low, warm, hue_cfg['surroundUnits'] / step, 5)
    hue = around / np.maximum(lum(around), 1e-6)[..., None]
    target = hue * np.maximum(lum(low), hue_cfg['lift'] * lum(around))[..., None]
    gain = (low + mask[..., None] * (target - low)) / np.maximum(low, 1e-5)
    gain = gain * np.minimum(1, hue_cfg['most'] / gain.max(axis=-1))[..., None]
    gain = cv2.GaussianBlur(np.maximum(gain, hue_cfg['least']), (0, 0), hue_cfg['softUnits'] / step)

    inner = carry(ground, (own > sh['inside']).astype(np.float32), sh['carryUnits'] / step, 7)
    outer = carry(ground * gain, (own < sh['outside']).astype(np.float32), sh['carryUnits'] / step, 7)
    storm = deck['life']['storm']['centre']
    plain = np.hypot(gx - storm[0], gy - storm[1])
    wavy = plain + (lattice(gx / sh['noise'][0], gy / sh['noise'][0], sh['seed']) - 0.5) * 2 * sh['noise'][1]
    hold = 1 - smoothstep(sh['reach'][0], sh['reach'][1], wavy)
    rows = smoothstep(sh['rows'][0], sh['rows'][1], gy) * (1 - smoothstep(sh['rows'][2], sh['rows'][3], gy))
    dark = smoothstep(sh['dark'][1], sh['dark'][0], lum(inner) / np.maximum(lum(outer), 1e-6)) * rows
    lifted = np.exp(np.log(sh['lift'][2]) * smoothstep(sh['lift'][0], sh['lift'][1], plain) * dark)[..., None]
    depth = np.minimum(np.log(np.maximum(inner * lifted, 1e-5) / np.maximum(outer, 1e-5)), 0) * (hold * dark)[..., None]
    share = outer * (1 - own)[..., None] / np.maximum(inner * own[..., None] + outer * (1 - own)[..., None], 1e-6)
    shade = lifted * (1 - share) + np.exp(depth) * share

    rim = np.minimum(cfg['size'] / 2 - np.abs(gx - cfg['centre'][0]), cfg['size'] / 2 - np.abs(gy - cfg['centre'][1]))
    field = 1 + (gain * shade - 1) * smoothstep(0, cfg['edgeUnits'], rim - step)[..., None]
    return field.astype(np.float32), ground


def display(x, exposure):
    return (np.clip(linear_to_srgb(filmic(x * exposure)), 0, 1) * 255).astype(np.uint8)


def preview(deck, fields, field, path):
    cfg = deck['calm']
    tn = deck['tone']
    z = cfg['preview']['zoom']
    gx, gy, step = grid(cfg['centre'], cfg['size'], cfg['pixels'] * z)
    before = plates_on(deck, fields, gx, gy, step) * field_on(tone_field(deck), tn['centre'], tn['size'], gx, gy)
    after = before * field_on(field, cfg['centre'], cfg['size'], gx, gy)
    e = cfg['preview']['exposure']
    cv2.imwrite(path, np.concatenate([display(before, e), display(after, e)], 1)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 92])


def main():
    deck = json.load(open(os.path.join(STOP, 'deck.json')))
    fields = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    cfg = deck['calm']
    field, _ = build(deck, fields)
    code = np.clip(field / cfg['scale'], 0, 1)
    data = np.round(np.concatenate([code[..., 0], code[..., 1], code[..., 2]], 0) * 65535).astype(np.uint16)
    for folder in (FULL, WEB):
        data.tofile(os.path.join(folder, 'deck-calm.bin'))
    os.makedirs(WORK, exist_ok=True)
    preview(deck, fields, field, os.path.join(WORK, 'calm.jpg'))
    print('calm', cfg['pixels'], 'least', field.min(axis=(0, 1)), 'most', field.max(axis=(0, 1)), 'rim', np.abs(field[[0, -1]] - 1).max(), np.abs(field[:, [0, -1]] - 1).max())


if __name__ == '__main__':
    main()
