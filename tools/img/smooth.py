#!/usr/bin/env python3
"""Image measures of npm run smooth. Reads one JSON job on stdin, writes one JSON reply on stdout."""
import json
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

LUMA = np.array([0.2126, 0.7152, 0.0722])


def grey(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64) @ LUMA


def font(size):
    for name in ('DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def small(g, scale):
    h, w = g.shape
    size = (max(int(round(w * scale)), 16), max(int(round(h * scale)), 16))
    return cv2.resize(g, size, interpolation=cv2.INTER_AREA)


def motion(a, b):
    a8 = np.clip(a, 0, 255).astype(np.uint8)
    b8 = np.clip(b, 0, 255).astype(np.uint8)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    return dis.calc(a8, b8, None)


def left(a, b):
    """What is left of the difference between a and the next frame b once the motion between them is taken out."""
    f = motion(a, b)
    h, w = a.shape
    xs, ys = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    mx = xs + f[..., 0]
    my = ys + f[..., 1]
    moved = cv2.remap(b.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    inside = (mx >= 0) & (mx <= w - 1) & (my >= 0) & (my <= h - 1)
    d = np.abs(moved - a.astype(np.float32))
    d[~inside] = np.nan
    return d, float(np.hypot(f[..., 0], f[..., 1]).mean())


def blocks(d, cols, rows):
    h, w = d.shape
    out = np.full((rows, cols), np.nan)
    for r in range(rows):
        for c in range(cols):
            part = d[r * h // rows:(r + 1) * h // rows, c * w // cols:(c + 1) * w // cols]
            if np.isfinite(part).any():
                out[r, c] = np.nanmean(part)
    return out


def span(i, n, window):
    """The window round i: window neighbours when the row is long enough, moved inward at both ends."""
    lo = max(min(i - window // 2, n - 1 - window), 0)
    return lo, min(lo + window, n - 1)


def around(values, i, window):
    """The median of the values in the window round i, i itself left out."""
    lo, hi = span(i, len(values), window)
    picked = [values[j] for j in range(lo, hi + 1) if j != i and values[j] is not None]
    return float(np.median(picked)) if picked else None


def pictures(job):
    paths = job['paths']
    scale = job.get('scale', 0.25)
    window = job.get('window', 16)
    floor = job.get('floor', 0.25)
    cols, rows = job.get('grid', [16, 9])
    marks = set(job.get('breaks', []))
    levels = []
    residual = []
    moved = []
    grids = []
    prev = None
    for i, p in enumerate(paths):
        g = grey(p)
        levels.append(float(g.mean()))
        s = small(g, scale)
        if prev is not None:
            if i in marks:
                residual.append(None)
                moved.append(None)
                grids.append(None)
            else:
                d, m = left(prev, s)
                residual.append(float(np.nanmean(d)) if np.isfinite(d).any() else None)
                moved.append(m / scale)
                grids.append(blocks(d, cols, rows))
        prev = s
    residual.append(None)
    moved.append(None)
    grids.append(None)
    n = len(paths)
    step = [None] * n
    for i in range(1, n - 1):
        if i in marks or (i + 1) in marks:
            continue
        step[i] = abs(levels[i] - (levels[i - 1] + levels[i + 1]) / 2)
    pop = [None] * n
    base = [None] * n
    block = [None] * n
    where = [None] * n
    for i in range(n):
        if residual[i] is None:
            continue
        m = around(residual, i, window)
        if m is None:
            continue
        base[i] = m
        pop[i] = residual[i] / max(m, floor)
        lo, hi = span(i, n, window)
        stack = [grids[j] for j in range(lo, hi + 1) if j != i and grids[j] is not None]
        if stack:
            med = np.nanmedian(np.stack(stack), axis=0)
            ratio = grids[i] / np.maximum(med, floor)
            if np.isfinite(ratio).any():
                at = np.unravel_index(np.nanargmax(ratio), ratio.shape)
                block[i] = float(ratio[at])
                where[i] = [int(at[1]), int(at[0])]
    return {'level': levels, 'levelStep': step, 'residual': residual, 'base': base, 'pop': pop, 'motionPx': moved, 'popBlock': block, 'popBlockAt': where, 'grid': [cols, rows]}


def panel(job):
    """Rows of three: a frame, the next one, and what is left of their difference once the motion is taken out, times the gain."""
    scale = job.get('scale', 0.25)
    gain = job.get('gain', 8)
    rows = []
    for item in job['pairs']:
        a = small(grey(item['a']), scale)
        b = small(grey(item['b']), scale)
        d, _ = left(a, b)
        d = np.nan_to_num(d)
        ca = np.asarray(Image.open(item['a']).convert('RGB').resize((a.shape[1], a.shape[0]), Image.LANCZOS))
        cb = np.asarray(Image.open(item['b']).convert('RGB').resize((a.shape[1], a.shape[0]), Image.LANCZOS))
        dd = np.repeat(np.clip(d * gain, 0, 255).astype(np.uint8)[..., None], 3, axis=2)
        rows.append((item['label'], np.concatenate([ca, cb, dd], axis=1)))
    if not rows:
        return {'written': False}
    return {'written': True, 'size': write_sheet(rows, job['output'], job.get('limit'))}


def rgb(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64)


def parity(job):
    """The same frame drawn large and scaled down against the frame drawn at the film's size."""
    coarse = int(job.get('coarse', 8))
    cols, rows = job.get('grid', [16, 9])
    gain = job.get('gain', 8)
    out = []
    sheet_rows = []
    for item in job['pairs']:
        film = rgb(item['film'])
        big = rgb(item['big'])
        h, w = film.shape[:2]
        if big.shape[0] % h or big.shape[1] % w or big.shape[0] // h != big.shape[1] // w:
            raise SystemExit('parity: ' + item['big'] + ' is not a whole multiple of ' + item['film'])
        down = cv2.resize(big, (w, h), interpolation=cv2.INTER_AREA)
        a = film @ LUMA
        b = down @ LUMA
        d = b - a
        ad = np.abs(d)
        cw, ch = max(w // coarse, 1), max(h // coarse, 1)
        cd = np.abs(cv2.resize(b, (cw, ch), interpolation=cv2.INTER_AREA) - cv2.resize(a, (cw, ch), interpolation=cv2.INTER_AREA))
        grid = cv2.resize(d, (cols, rows), interpolation=cv2.INTER_AREA)
        at = np.unravel_index(np.argmax(np.abs(grid)), grid.shape)
        fine_a = float(np.abs(cv2.Laplacian(a, cv2.CV_64F)).mean())
        fine_b = float(np.abs(cv2.Laplacian(b, cv2.CV_64F)).mean())
        channel = (down - film).reshape(-1, 3).mean(axis=0)
        out.append({
            'mean': float(ad.mean()), 'p99': float(np.percentile(ad, 99)), 'max': float(ad.max()), 'level': float(d.mean()),
            'colour': float(channel[np.argmax(np.abs(channel))]), 'coarse': float(cd.mean()), 'coarseMax': float(cd.max()),
            'blockLevel': float(grid[at]), 'blockAt': [int(at[1]), int(at[0])], 'detail': fine_a / max(fine_b, 1e-6),
        })
        if job.get('output'):
            size = (w // 3, h // 3)
            fa = np.asarray(Image.fromarray(np.clip(film, 0, 255).astype(np.uint8)).resize(size, Image.LANCZOS))
            fb = np.asarray(Image.fromarray(np.clip(down, 0, 255).astype(np.uint8)).resize(size, Image.LANCZOS))
            dd = cv2.resize(ad, size, interpolation=cv2.INTER_AREA)
            dd = np.repeat(np.clip(dd * gain, 0, 255).astype(np.uint8)[..., None], 3, axis=2)
            sheet_rows.append((item['label'], np.concatenate([fa, fb, dd], axis=1)))
    if sheet_rows:
        write_sheet(sheet_rows, job['output'], job.get('limit'))
    return out


def write_sheet(rows, output, limit):
    pad = 26
    width = rows[0][1].shape[1]
    height = sum(r[1].shape[0] + pad for r in rows)
    sheet = Image.new('RGB', (width, height), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    f = font(16)
    y = 0
    for label, img in rows:
        draw.text((6, y + 4), label, fill=(235, 235, 235), font=f)
        sheet.paste(Image.fromarray(img), (0, y + pad))
        y += img.shape[0] + pad
    if limit and max(sheet.size) > limit:
        k = limit / max(sheet.size)
        sheet = sheet.resize((max(int(sheet.size[0] * k), 1), max(int(sheet.size[1] * k), 1)), Image.LANCZOS)
    sheet.save(output)
    return list(sheet.size)


def main():
    job = json.load(sys.stdin)
    op = job.get('op')
    if op == 'pictures':
        out = pictures(job)
    elif op == 'panel':
        out = panel(job)
    elif op == 'parity':
        out = parity(job)
    else:
        raise SystemExit('unknown op ' + str(op))
    json.dump(out, sys.stdout)


if __name__ == '__main__':
    main()
