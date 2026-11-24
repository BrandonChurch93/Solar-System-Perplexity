import json
import os
import sys
import numpy as np
import cv2

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import pack

towers = json.load(open('src/stops/earth/relief.json'))['towers']
box = towers['box']
dw, dh = towers['distSize']
a = pack.unpack('public/assets/earth/full/' + towers['body'], (dh, dw))
n, lab = cv2.connectedComponents((a > 0).astype(np.uint8), connectivity=8)
x0, y0, bw, bh = box
def run(cells):
    nx = max(2, round(cells)); ny = max(2, round(cells * bh / bw))
    rx = bw / nx; ry = bh / ny
    xs = x0 + np.arange(nx + 1) / nx * bw; ys = y0 + np.arange(ny + 1) / ny * bh
    v = np.zeros((ny + 1, nx + 1), np.float32); l = np.zeros((ny + 1, nx + 1), np.int32)
    for j, y in enumerate(ys):
        j0 = max(int(np.floor((y - ry - y0) / bh * dh - 0.5)), 0); j1 = min(int(np.ceil((y + ry - y0) / bh * dh - 0.5)), dh - 1)
        jc = min(max(int(round((y - y0) / bh * dh - 0.5)), 0), dh - 1)
        for i, x in enumerate(xs):
            i0 = max(int(np.floor((x - rx - x0) / bw * dw - 0.5)), 0); i1 = min(int(np.ceil((x + rx - x0) / bw * dw - 0.5)), dw - 1)
            ic = min(max(int(round((x - x0) / bw * dw - 0.5)), 0), dw - 1)
            if j1 >= j0 and i1 >= i0:
                v[j, i] = a[j0:j1 + 1, i0:i1 + 1].min()
            l[j, i] = lab[jc, ic]
    kept = []
    for k in range(1, n):
        peak = a[lab == k].max()
        m = v[l == k]
        kept.append((m.max() if m.size else 0) / peak)
    kept = np.array(kept)
    print('mesh %d: %d by %d cells, %d vertices a sheet; bodies %d, with depth left %d; share of the peak half depth kept: least %.2f, quartiles %.2f %.2f %.2f, most %.2f' % (cells, nx, ny, (nx + 1) * (ny + 1), n - 1, (kept > 0).sum(), kept.min(), *np.percentile(kept, [25, 50, 75]), kept.max()))
for c in [int(s) for s in sys.argv[1:]]: run(c)
