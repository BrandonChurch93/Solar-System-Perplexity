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
SOURCE = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'full')


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


def relief(low, deck, level):
    cfg = deck['guide']['relief']
    n = low.shape[0]
    step = level['size'] / n
    xs = level['centre'][0] + (np.arange(n) + 0.5 - n / 2) * step
    ys = level['centre'][1] + (n / 2 - np.arange(n) - 0.5) * step
    gx, gy = np.meshgrid(xs.astype(np.float32), ys.astype(np.float32))
    storm = deck['life']['storm']['centre']
    s = np.hypot(gx - storm[0], gy - storm[1]) / deck['life']['flow']['scaleUnits']
    floor = cfg['floorUnits'] * (1 - smoothstep(cfg['floorEdge'][0], cfg['floorEdge'][1], s))
    crest = cfg['crestUnits'] * np.exp(-((s - cfg['crestAt']) / cfg['crestWidth']) ** 2)
    lum = low @ np.float32([0.2126, 0.7152, 0.0722])
    wide = cv2.GaussianBlur(lum, (0, 0), cfg['laneWideUnits'] / step, borderType=cv2.BORDER_REPLICATE)
    lanes = cfg['laneUnits'] * np.tanh((lum - wide) / (wide + cfg['laneFloor']) / cfg['laneKnee'])
    basin = np.clip(cfg['basinUnits'] * np.log2(np.maximum(cv2.GaussianBlur(lum, (0, 0), cfg['basinWideUnits'] / step, borderType=cv2.BORDER_REPLICATE), 1e-6) / cfg['basinLight']), cfg['basinRange'][0], cfg['basinRange'][1])
    return (cfg['datum'] + floor + crest + lanes + basin).astype(np.float32)[::-1]


def main():
    deck = json.load(open(os.path.join(STOP, 'deck.json')))
    fields = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    cfg = deck['guide']
    os.makedirs(WORK, exist_ok=True)
    span = fields['heightRange']
    made = None
    for name, level in cfg['levels'].items():
        n = level['pixels']['full']
        kept = os.path.join(WORK, 'plain-' + name + '.npy')
        stir = os.path.join(WORK, 'wild-' + name + '.npy')
        rc = cfg['rough']
        if os.path.exists(kept) and os.path.exists(stir) and '--fresh' not in sys.argv:
            plain = np.load(kept)
            wild = np.load(stir)
        else:
            if made is None:
                made = ({key: scene(os.path.join(FULL, 'plate-' + key + '.png')) for key in ['fore', 'near', 'mid', 'far']}, table('deck-tone.bin', deck['tone']), table('deck-calm.bin', deck['calm']))
            fine = level['work']
            lin = ground(deck, fields, made[0], made[1], made[2], level['centre'], level['size'], fine)
            plain = cv2.resize(cv2.GaussianBlur(lin, (0, 0), cfg['cutUnits'] / (level['size'] / fine), borderType=cv2.BORDER_REPLICATE), (n, n), interpolation=cv2.INTER_AREA)
            np.save(kept, plain)
            light = lin @ np.float32([0.2126, 0.7152, 0.0722])
            even = cv2.GaussianBlur(light, (0, 0), cfg['cutUnits'] / (level['size'] / fine), borderType=cv2.BORDER_REPLICATE)
            part = (light - even) / (even + rc['floor'])
            wild = cv2.resize(np.sqrt(cv2.GaussianBlur(part * part, (0, 0), rc['wideUnits'] / (level['size'] / fine), borderType=cv2.BORDER_REPLICATE)), (rc['pixels'], rc['pixels']), interpolation=cv2.INTER_AREA)
            np.save(stir, wild)
        low = plain
        solved = os.path.join(HERE, 'solve-' + name + '.png')
        if os.path.exists(solved):
            turn = (cv2.imread(solved, cv2.IMREAD_UNCHANGED)[..., ::-1].astype(np.float32) / 65535 * 2 - 1) * cfg['solve']['rangeLog2']
            low = low * np.exp2(cv2.resize(turn[::-1], (n, n), interpolation=cv2.INTER_LINEAR))
        lum = low @ np.float32([0.2126, 0.7152, 0.0722])
        low = low * (np.clip(lum, cfg['solve']['albedo'][0], cfg['solve']['albedo'][1]) / np.maximum(lum, 1e-6))[..., None]
        high = relief(plain, deck, level)
        stops = np.log2(np.maximum(cv2.GaussianBlur(plain @ np.float32([0.2126, 0.7152, 0.0722]), (0, 0), cfg['relief']['basinWideUnits'] / (level['size'] / n), borderType=cv2.BORDER_REPLICATE), 1e-6) / cfg['relief']['basinLight'])
        dark = cv2.resize(np.clip(-stops / rc['darkStops'], 0, 1), (rc['pixels'], rc['pixels']), interpolation=cv2.INTER_AREA) * rc['darkShare']
        coarse = np.round(np.clip(np.maximum(wild / rc['most'], dark), 0, 1)[::-1] * 65535).astype(np.uint16)
        for folder in (FULL, WEB):
            coarse.tofile(os.path.join(folder, 'guide-' + name + '-rough.bin'))
        print("rough", name, "wild tenth", round(float(np.percentile(wild, 10)), 3), "median", round(float(np.median(wild)), 3), "ninetieth", round(float(np.percentile(wild, 90)), 3), "dark share over 0.25", round(float((dark > 0.25).mean()), 3))
        for folder, key in ((FULL, 'full'), (WEB, 'web')):
            m = level['pixels'][key]
            out = np.round(np.clip(display(cv2.resize(low, (m, m), interpolation=cv2.INTER_AREA)), 0, 1) * 255).astype(np.uint8)
            cv2.imwrite(os.path.join(folder, 'guide-' + name + '.png'), out[..., ::-1], [cv2.IMWRITE_PNG_COMPRESSION, 6])
            np.round(np.clip((cv2.resize(high, (m, m), interpolation=cv2.INTER_AREA) - span[0]) / (span[1] - span[0]), 0, 1) * 65535).astype(np.uint16).tofile(os.path.join(folder, 'guide-' + name + '-height.bin'))
        mean = low.reshape(-1, 3).mean(0)
        print('guide', name, 'pixels', n, 'mean', [round(float(c), 4) for c in mean], 'display', [int(round(float(c) * 255)) for c in display(mean)])
        print('relief', name, 'units: least', round(float(high.min()), 3), 'median', round(float(np.median(high)), 3), 'most', round(float(high.max()), 3), 'steepest', round(float(np.hypot(*np.gradient(high, level['size'] / n)).max()), 3))
        show = np.concatenate([np.clip(display(cv2.resize(plain, (1024, 1024), interpolation=cv2.INTER_AREA)), 0, 1), np.clip(display(cv2.resize(low, (1024, 1024), interpolation=cv2.INTER_AREA)), 0, 1)], 1)
        cv2.imwrite(os.path.join(WORK, 'guide-' + name + '.jpg'), (show * 255).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(os.path.join(WORK, 'relief-' + name + '.jpg'), (cv2.resize(np.clip((high - span[0]) / (span[1] - span[0]), 0, 1), (1024, 1024), interpolation=cv2.INTER_AREA)[::-1] * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])


main()
