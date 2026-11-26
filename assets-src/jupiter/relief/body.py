import copy
import json
import os
import shutil
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'deck'))
import image
import view

ROOT = os.path.join(HERE, '..', '..', '..')
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
PUBLIC = os.path.join(ROOT, 'public', 'assets', 'jupiter')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'body')
BODY = json.load(open(os.path.join(STOP, 'body.json')))


class Body(view.Surface):
    def __init__(self, kind='full'):
        view.STOP, view.PUBLIC = STOP, PUBLIC
        super().__init__(kind)
        view.STOP, view.PUBLIC = WORK, WORK
        self.foot = json.load(open(os.path.join(STOP, 'deck-fields.json')))['view']['origin']

    def height(self, gx, gy):
        h = BODY['height']
        d = np.hypot(gx - self.foot[0], gy - self.foot[1])
        near = 1 - view.smooth((d - h['nearUnits'][0]) / (h['nearUnits'][1] - h['nearUnits'][0]))
        far = 1 - view.smooth((d - h['farUnits'][0]) / (h['farUnits'][1] - h['farUnits'][0]))
        return (super().height(gx, gy) * (1 + (h['gain'] - h['farGain']) * near + (h['farGain'] - 1) * far)).astype(np.float32)


def fill(rgb, need, seen, c):
    k = c['fine']
    law = BODY['height']['fill']
    skip, sigma = c['hiddenSkip'] * k, c['fillSmooth'] * k
    rows_n = need.shape[0]
    rows = np.arange(rows_n, dtype=np.int32)[:, None]
    far_row = np.maximum.accumulate(np.where(need, -1, rows), axis=0)
    near_row = np.minimum.accumulate(np.where(need, rows_n, rows)[::-1], axis=0)[::-1]
    m = need.astype(np.float32)
    size = (int(6 * sigma) | 1, 1)
    den = np.maximum(cv2.GaussianBlur(m, size, sigma), 1e-6)
    ii, jj = np.nonzero(need)
    df = (cv2.GaussianBlur((rows - far_row).astype(np.float32) * m, size, sigma) / den)[ii, jj]
    dn = (cv2.GaussianBlur((near_row - rows).astype(np.float32) * m, size, sigma) / den)[ii, jj]
    del den, m
    free = seen & ~need

    def border(start, step):
        acc = np.zeros((len(ii), 3), np.float32)
        cnt = np.zeros(len(ii), np.float32)
        for b in range(int(c['fillMean'] * k)):
            r = start + step * b
            rc = np.clip(r, 0, rows_n - 1)
            ok = (r == rc) & free[rc, jj]
            acc += rgb[rc, jj] * ok[:, None]
            cnt += ok
        ok = cnt > 0
        colour = acc / np.maximum(cnt, 1)[:, None]
        fine, ok_fine = view.across(colour, ok, need, ii, jj, c['fillAcross'][0] * k)
        wide, ok_wide = view.across(colour, ok, need, ii, jj, c['fillAcross'][1] * k)
        return fine, wide, ok_fine

    far_fine, far_wide, ok_f = border(far_row[ii, jj], -1)
    near_fine, near_wide, ok_n = border(near_row[ii, jj] + skip, 1)
    deep = c['fillAcross'][2] * k
    sf = view.smooth(df / deep)[:, None]
    sn = view.smooth(dn / deep)[:, None]
    far_c = far_fine * (1 - sf) + far_wide * sf
    near_c = near_fine * (1 - sn) + near_wide * sn
    w = view.smooth((df / np.maximum(df + dn, 1e-6) - c['fillNear']) / (1 - c['fillNear']))
    wn = np.where(ok_f, w, 1) * ok_n
    wf = np.where(ok_n, 1 - w, 1) * ok_f
    total = wn + wf
    done = total > 1e-3
    out_fill = (near_c * wn[:, None] + far_c * wf[:, None]) / np.maximum(total, 1e-3)[:, None]
    inner = view.smooth((np.minimum(df, dn) / k - c['fillDetail'][1]) / (c['fillDetail'][2] - c['fillDetail'][1]))
    light = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    rel = light / np.maximum(cv2.GaussianBlur(light, (0, 0), c['fillDetail'][3] * k), law['floor']) - 1

    def mirrored(pos):
        p0 = np.clip(np.floor(pos), 0, rows_n - 2).astype(np.int64)
        f = np.clip(pos - p0, 0, 1)
        ok = free[p0, jj] & free[p0 + 1, jj]
        return (rel[p0, jj] * (1 - f) + rel[p0 + 1, jj] * f) * ok

    detail = (mirrored(ii + 1 - 2 * df) * wf + mirrored(ii + skip - 1 + 2 * dn) * wn) / np.maximum(total, 1e-3)
    out_fill = out_fill * np.clip(1 + law['detail'] * inner * detail, law['bound'][0], law['bound'][1])[:, None]
    out = rgb.copy()
    out[ii[done], jj[done]] = out_fill[done]
    left = np.zeros(need.shape, bool)
    left[ii[~done], jj[~done]] = True
    if left.any():
        code = np.round(np.clip(view.linear_to_srgb(out), 0, 1) * 255).astype(np.uint8)
        code = cv2.inpaint(code, left.astype(np.uint8), 4, cv2.INPAINT_TELEA)
        out[left] = view.srgb_to_linear(code[left].astype(np.float64) / 255).astype(np.float32)
    longer = np.ones(need.shape, np.float32)
    longer[ii, jj] = 1 + c['fillLength'] * (df + dn) / k * (1 - inner * min(law['detail'], 1))
    return out, longer, int(done.sum()), int(left.sum())


def build():
    h = BODY['height']
    cfg = copy.deepcopy(view.CFG)
    cfg['look']['shell'] = h['shell']
    cfg['image']['march'] = h['imageMarch']
    cfg['view']['fine'] = h['viewFine']
    view.CFG = cfg
    image.CFG = cfg
    view.Surface = Body
    view.carry_fill = fill
    view.WORK = WORK
    for kind in ('full', 'web'):
        os.makedirs(os.path.join(WORK, kind), exist_ok=True)
    shutil.copy(os.path.join(STOP, 'deck-fields.json'), os.path.join(WORK, 'deck-fields.json'))
    surface = Body('full')
    pixels = {}
    for kind in ('full', 'web'):
        shrink = cfg['image']['rangeShrink'][kind]
        rng = image.fit_range(surface, shrink)
        np.save(os.path.join(WORK, 'image-range-' + kind + '.npy'), rng.astype(np.float32))
        image.code(rng)[::-1].tofile(os.path.join(PUBLIC, kind, 'relief-image-range.bin'))
        pixels[kind] = [rng.shape[1], rng.shape[0]]
    view.build()
    for kind in ('full', 'web'):
        shutil.copy(os.path.join(WORK, kind, 'deck-view-color.png'), os.path.join(PUBLIC, kind, 'relief-view-color.png'))
    f = json.load(open(os.path.join(WORK, 'deck-fields.json')))
    out = {
        'note': 'Written by assets-src/jupiter/relief/body.py. Do not edit by hand.',
        'view': f['view'],
        'range': {'pixels': pixels},
    }
    json.dump(out, open(os.path.join(STOP, 'body-fields.json'), 'w'), indent=1)


if __name__ == '__main__':
    build()
