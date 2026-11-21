import json
import struct
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OUT = 'out/work/u/t/'
PUB = 'public/assets/uranus/'
RHO = 40.0
SHEARS = np.arange(-0.5, 0.501, 0.1)
WIN = 15
LOW = 0.0015
GAP = 14
EXTEND_DEG = 20.0
REACH = 90


def lines_only(pol):
    best = np.full(pol.shape, -1.0, np.float32)
    slope = np.zeros(pol.shape, np.float32)
    half = WIN // 2
    for s in SHEARS:
        stack = []
        for k in range(-half, half + 1):
            sh = ndi.shift(pol, (-s * k, 0), order=1, mode='constant') if abs(s * k) > 1e-6 else pol
            stack.append(np.roll(sh, -k, axis=1))
        med = np.median(np.stack(stack, 0), 0)
        better = med > best
        best[better] = med[better]
        slope[better] = s
    return np.maximum(best, 0), slope


def track(L, slope):
    S = ndi.gaussian_filter(L, (1.0, 0.8))
    nt = L.shape[1]
    tracks = []
    active = []
    for j in range(nt):
        c = S[:, j]
        idx = np.flatnonzero((c[1:-1] > c[:-2]) & (c[1:-1] >= c[2:]) & (c[1:-1] > LOW)) + 1
        den = c[idx - 1] - 2 * c[idx] + c[idx + 1]
        sub = idx + np.where(np.abs(den) > 1e-12, 0.5 * (c[idx - 1] - c[idx + 1]) / den, 0)
        used = np.zeros(len(idx), bool)
        for a in sorted(range(len(active)), key=lambda a: -len(active[a]['j'])):
            t = active[a]
            if len(idx) == 0:
                continue
            pred = t['r'][-1] + t['s'] * (j - t['j'][-1])
            dd = np.abs(sub - pred)
            dd[used] = 1e9
            k = int(np.argmin(dd))
            if dd[k] < 1.6 + 0.08 * (j - t['j'][-1]):
                if len(t['j']) >= 6:
                    t['s'] = 0.7 * t['s'] + 0.3 * (sub[k] - t['r'][-6]) / (j - t['j'][-6])
                t['j'].append(j)
                t['r'].append(float(sub[k]))
                t['a'].append(float(c[idx[k]]))
                used[k] = True
        keep = []
        for t in active:
            (tracks if j - t['j'][-1] > GAP else keep).append(t)
        active = keep
        for k in np.flatnonzero(~used):
            active.append({'j': [j], 'r': [float(sub[k])], 'a': [float(c[idx[k]])], 's': float(slope[idx[k], j])})
    return tracks + active


def main():
    d = np.load(OUT + 'ring-unwrap.npz')
    un, valid, r0, r1 = d['un'], d['valid'], float(d['r0']), float(d['r1'])
    fit = json.load(open('assets-src/uranus/terrain/ringfit.json'))
    nr, nt = valid.shape
    lum = un @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    resid = lum - ndi.median_filter(lum, size=(25, 1))
    resid[~ndi.binary_erosion(valid, iterations=3)] = 0
    L, slope = lines_only(resid)
    tracks = track(L, slope)
    cols = np.flatnonzero(valid.mean(0) > 0.5)
    c0, c1 = int(cols.min()), int(cols.max())
    ext = int(EXTEND_DEG / 360 * nt)
    lines = []
    amps = []
    long = [t for t in tracks if t['j'][-1] - t['j'][0] > 450]
    inner = max(long, key=lambda t: np.median(t['r']) if False else -np.median(t['r']))
    outer = max(long, key=lambda t: np.median(t['r']))
    kin = np.polyfit(inner['j'], inner['r'], 3)
    kout = np.polyfit(outer['j'], outer['r'], 1)
    for t in tracks:
        j = np.array(t['j'])
        if j[-1] - j[0] < 110 or len(j) < 80:
            continue
        a = np.array(t['a'])
        if np.median(a) < LOW * 1.3:
            continue
        rr = np.array(t['r'])
        rough = float(np.sqrt(np.mean((rr - ndi.gaussian_filter1d(rr, 6)) ** 2)))
        mid = j[len(j) // 2]
        if rough > 0.45 or np.median(rr) < np.polyval(kin, mid) - 8 or np.median(rr) > np.polyval(kout, mid) + 8:
            continue
        full = np.arange(j[0], j[-1] + 1)
        r = ndi.gaussian_filter1d(np.interp(full, j, t['r']), 3)
        a = ndi.gaussian_filter1d(np.interp(full, j, a), 4)
        fade_in = np.ones(len(full))
        if len(full) > 60:
            first_valid = valid[np.clip(int(round(r[0])), 0, nr - 1), max(full[0] - REACH, 0):full[0]].all()
            last_valid = valid[np.clip(int(round(r[-1])), 0, nr - 1), full[-1] + 1:min(full[-1] + 1 + REACH, nt)].all()
            if not first_valid:
                k = np.polyfit(full[:80], r[:80], 1)
                add = np.arange(full[0] - ext, full[0])
                r = np.concatenate([np.polyval(k, add), r])
                a = np.concatenate([np.full(ext, np.median(a[:50])), a])
                fade_in = np.concatenate([np.clip(np.arange(ext) / 20.0, 0, 1), fade_in])
                full = np.concatenate([add, full])
            else:
                fade_in[:16] = np.arange(16) / 16.0
            if not last_valid:
                k = np.polyfit(full[-80:], r[-80:], 1)
                add = np.arange(full[-1] + 1, full[-1] + 1 + ext)
                r = np.concatenate([r, np.polyval(k, add)])
                a = np.concatenate([a, np.full(ext, np.median(a[-50:]))])
                fade_in = np.concatenate([fade_in, np.clip(np.arange(ext)[::-1] / 20.0, 0, 1)])
                full = np.concatenate([full, add])
            else:
                fade_in[-16:] *= np.arange(16)[::-1] / 16.0
        radius = (r0 + (r + 0.5) / nr * (r1 - r0)).astype(np.float32)
        lines.append((full[0], radius, (a * fade_in).astype(np.float32)))
        amps.append(float(np.median(a)))
    sm = ndi.gaussian_filter(L, (0.6, 2.0))
    peak_rows = []
    for j in range(c0 + 100, c1 - 100, 40):
        c = sm[:, j]
        k = int(np.argmax(c))
        if c[k] > 0.02 and 4 < k < nr - 5:
            half = c[k] / 2
            lo = k
            while lo > 0 and c[lo] > half:
                lo -= 1
            hi = k
            while hi < nr - 1 and c[hi] > half:
                hi += 1
            peak_rows.append(hi - lo)
    fwhm = float(np.median(peak_rows)) if peak_rows else 3.0
    sigma = fwhm / 2.355 / nr * (r1 - r0)
    scale = fit['radius'] * RHO / fit['rho']
    centre = (np.array(fit['centre']) * RHO / fit['rho']).tolist()
    n = fit['normal']
    step = 2 * np.pi / nt
    blob = [struct.pack('<f', len(lines))]
    for start, radius, amp in lines:
        theta0 = (start + 0.5) * step + np.pi
        blob.append(struct.pack('<7f', n[0], n[1], n[2], 0.0, theta0, step, len(radius)))
        blob.append(radius.tobytes())
        blob.append(amp.tobytes())
    data = b''.join(blob)
    for key in ('full', 'web'):
        open(PUB + key + '/deck-rings.bin', 'wb').write(data)
    json.dump({'centre': centre, 'scale': scale, 'normal': n, 'sigma': sigma, 'lines': len(lines), 'samples': int(sum(len(l[1]) for l in lines))}, open('src/stops/uranus/deck-rings.json', 'w'), indent=1)
    print(len(tracks), 'raw tracks', len(lines), 'kept', 'samples', sum(len(l[1]) for l in lines), 'bytes', len(data), 'fwhm rows', fwhm, 'sigma', sigma, 'scale', scale, 'median amp', np.median(amps), 'max', np.max(amps))
    show = np.zeros((nr, nt, 3), np.uint8)
    show[...] = (np.clip(L * 12, 0, 1) ** 0.6 * 130)[..., None]
    for k, (start, radius, amp) in enumerate(lines):
        rows = np.clip(((radius - r0) / (r1 - r0) * nr - 0.5).round().astype(int), 0, nr - 1)
        colsk = np.clip(np.arange(start, start + len(rows)), 0, nt - 1)
        show[rows, colsk] = [(60 + 97 * k) % 255, (120 + 53 * k) % 255, 255]
    Image.fromarray(show[::-1, c0 - ext:c1 + ext]).resize((1600, 700), Image.LANCZOS).save(OUT + 'ring-tracks.jpg', quality=90)


main()
