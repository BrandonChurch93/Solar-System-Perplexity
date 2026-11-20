import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


BACKGROUND = (23, 23, 23)
TEXT = (224, 224, 224)
MARK = (255, 218, 103)
FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
LANCZOS = Image.Resampling.LANCZOS


def font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except OSError:
        return ImageFont.load_default()


def opened(path):
    with Image.open(path) as source:
        rgb = source.convert('RGB')
        return Image.frombytes('RGB', rgb.size, rgb.tobytes())


def fitted(im, limit, expand=False):
    edge = max(im.size)
    if edge == limit or (edge < limit and not expand):
        return im
    return im.resize(tuple(max(1, round(d * limit / edge)) for d in im.size), LANCZOS)


def saved(im, path, quality=None):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if quality is None:
        im.save(path, format='PNG', compress_level=4)
    else:
        im.save(path, format='JPEG', quality=quality, subsampling=0, optimize=True)


def geometry(limit):
    return max(2, limit // 175), max(9, limit // 100), max(13, limit // 60)


def sheet(inputs, limit):
    gap, text, label_h = geometry(limit)
    aspect = opened(inputs[0]['path']).width / opened(inputs[0]['path']).height
    choices = []
    for cols in range(1, len(inputs) + 1):
        rows = math.ceil(len(inputs) / cols)
        cell_w = min((limit - gap * (cols + 1)) // cols, int(((limit - gap * (rows + 1)) // rows - label_h) * aspect))
        choices.append((cell_w, cols, rows))
    width, cols, rows = max(choices, key=lambda item: item[0])
    height = round(width / aspect)
    board = Image.new('RGB', (cols * (width + gap) + gap, rows * (height + label_h + gap) + gap), BACKGROUND)
    draw = ImageDraw.Draw(board)
    for i, spec in enumerate(inputs):
        x, y = gap + i % cols * (width + gap), gap + i // cols * (height + label_h + gap)
        im = opened(spec['path'])
        board.paste(im.resize((width, height), LANCZOS), (x, y))
        draw.text((x + gap // 2, y + height + (label_h - text) // 2), spec['label'], fill=TEXT, font=font(text))
    return board


def icon(i):
    chars = ''
    while i >= 0:
        chars = chr(ord('A') + i % 26) + chars
        i = i // 26 - 1
    return chars


def crop_label(i, rect):
    return icon(i) + '  ' + ','.join(map(str, rect))


def bbox(rect):
    x, y, w, h = rect
    return x, y, x + w, y + h


def at(im, x, y, w, h):
    return max(0, min(im.width - w, x - w // 2)), max(0, min(im.height - h, y - h // 2)), w, h


def salience(im, rect_w, rect_h, limit):
    luma_img = fitted(im, limit).convert('L')
    luma = np.asarray(luma_img, dtype=np.float32)
    padded = np.pad(luma, 1, mode='edge')
    grad = np.hypot(padded[1:-1, 2:] - padded[1:-1, :-2], padded[2:, 1:-1] - padded[:-2, 1:-1])
    high = abs(luma - (padded[1:-1, 2:] + padded[1:-1, :-2] + padded[2:, 1:-1] + padded[:-2, 1:-1]) / 4)
    xs = list(range(rect_w // 2, im.width, max(1, rect_w // 2))) + [im.width - rect_w // 2]
    ys = list(range(rect_h // 2, im.height, max(1, rect_h // 2))) + [im.height - rect_h // 2]
    scored = {}
    dark = min(40, max(12, float(np.percentile(luma, 25)) + 12))
    for cy in ys:
        for cx in xs:
            rect = at(im, cx, cy, rect_w, rect_h)
            x, y, r, b = bbox(rect)
            x, r = round(x * luma_img.width / im.width), round(r * luma_img.width / im.width)
            y, b = round(y * luma_img.height / im.height), round(b * luma_img.height / im.height)
            levels = luma[y:b, x:r]
            edges = grad[y:b, x:r]
            if levels.size == 0:
                continue
            low = levels < dark
            balance = 2 * min(float(low.mean()), float((~low).mean()))
            detail = float(high[y:b, x:r].mean())
            limb = balance * (float(np.percentile(edges, 95)) + float(edges.mean()))
            scored[rect] = (detail, limb)
    return scored


def overlap(a, b):
    x, y, r, d = bbox(a)
    xx, yy, rr, dd = bbox(b)
    return max(0, min(r, rr) - max(x, xx)) * max(0, min(d, dd) - max(y, yy)) / min(a[2] * a[3], b[2] * b[3])


def selected(im, limit, max_width=None, explicit=(), cover=False, count=2):
    gap, _, label_h = geometry(limit)
    w = min(im.width, max_width or (limit - gap * 4) // 3, max(1, im.width // 2))
    h = min(im.height, (limit - 4 * gap - 3 * label_h) // 3, w, max(1, im.height // 2))
    centers = [(2, 2), (1, 1), (3, 1), (1, 3), (3, 3)]
    regions = list(dict.fromkeys(at(im, im.width * x // 4, im.height * y // 4, w, h) for x, y in centers))
    scored = salience(im, w, h, limit)
    for metric in (0, 1):
        ranked = sorted(scored, key=lambda r: (-scored[r][metric], r[1], r[0]))
        chosen = []
        for threshold in (0.45, 0.8, 1.0):
            for rect in ranked:
                if len(chosen) >= count:
                    break
                if rect not in regions and all(overlap(rect, other) <= threshold for other in regions):
                    regions.append(rect)
                    chosen.append(rect)
    if cover:
        regions.extend((x, y, min(w, im.width - x), min(h, im.height - y)) for y in range(0, im.height, h) for x in range(0, im.width, w))
    for x, y, rw, rh in explicit:
        if min(x, y) < 0 or min(rw, rh) < 1 or x + rw > im.width or y + rh > im.height:
            raise ValueError(f'crop {(x, y, rw, rh)} lies outside the {im.width} by {im.height} frame')
        for py in range(y, y + rh, limit - 2 * gap - label_h):
            for px in range(x, x + rw, limit - 2 * gap):
                regions.append((px, py, min(x + rw - px, limit - 2 * gap), min(y + rh - py, limit - 2 * gap - label_h)))
    return list(dict.fromkeys(regions))


def packed(regions, limit):
    gap, text, label_h = geometry(limit)
    label_font = font(text)
    pages, page = [], []
    x = y = gap
    row = 0
    for i, rect in enumerate(regions):
        width, height = max(rect[2], math.ceil(label_font.getlength(crop_label(i, rect)))), rect[3]
        if x + width + gap > limit:
            x, y, row = gap, y + row + gap, 0
        if y + height + label_h + gap > limit:
            pages.append(page)
            page, x, y, row = [], gap, gap, 0
        page.append((x, y, rect, i, width))
        x += width + gap
        row = max(row, height + label_h)
    if page:
        pages.append(page)
    return pages


def grid(im, page, limit):
    gap, text, label_h = geometry(limit)
    width = max(x + w + gap for x, _, _, _, w in page)
    height = max(y + r[3] + label_h + gap for _, y, r, _, _ in page)
    board = Image.new('RGB', (width, height), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label_font = font(text)
    for x, y, rect, i, _ in page:
        h = rect[3]
        board.paste(im.crop(bbox(rect)), (x, y))
        draw.text((x, y + h + (label_h - text) // 2), crop_label(i, rect), fill=TEXT, font=label_font)
    return board


def overview(im, regions, limit):
    thumb = fitted(im, limit // 2).copy()
    draw = ImageDraw.Draw(thumb)
    label_font = font(geometry(limit)[1])
    for i, r in enumerate(regions):
        x, y, right, bottom = bbox(r)
        x, right = round(x * thumb.width / im.width), round(right * thumb.width / im.width) - 1
        y, bottom = round(y * thumb.height / im.height), round(bottom * thumb.height / im.height) - 1
        right, bottom = max(x, right), max(y, bottom)
        draw.rectangle((x, y, right, bottom), outline=MARK)
        draw.text((x + 3, y + 2), icon(i), fill=MARK, font=label_font, stroke_width=1, stroke_fill=BACKGROUND)
    return thumb


def combine_pair(a, b, limit, with_labels):
    gap, text, label_h = geometry(limit)
    top = label_h + gap if with_labels else gap
    width = a.width + b.width + gap * 3
    board = Image.new('RGB', (width, top + max(a.height, b.height) + gap), BACKGROUND)
    board.paste(a, (gap, top))
    board.paste(b, (a.width + gap * 2, top))
    if with_labels:
        draw = ImageDraw.Draw(board)
        draw.text((gap, gap), 'approved', fill=TEXT, font=font(text))
        draw.text((a.width + gap * 2, gap), 'film', fill=TEXT, font=font(text))
    return board


def pair_images(job):
    a, b = (opened(path) for path in (job['a'], job['b']))
    return a.resize(b.size, LANCZOS), b


def region_entry(path, page):
    return {'path': path, 'rectangles': [rect for _, _, rect, _, _ in page]}


def run(job):
    op = job['op']
    limit = job.get('limit')
    output = job.get('output')
    if op == 'sheet':
        saved(sheet(job['inputs'], limit), output)
    elif op == 'single':
        im = opened(job['input'])
        if 'size' in job:
            im = im.resize(tuple(job['size']), LANCZOS)
        if 'width' in job:
            width = job['width']
            im = im.resize((width, max(1, round(im.height * width / im.width))), LANCZOS)
        if limit:
            im = fitted(im, limit)
        saved(im, output, job.get('quality'))
    elif op == 'crops':
        im = opened(job['input'])
        regions = selected(im, limit, explicit=job.get('regions', ()), cover=job.get('cover', False))
        result = []
        for i, page in enumerate(packed(regions, limit), 1):
            path = f'{output}-{i:02}.png'
            saved(grid(im, page, limit), path)
            result.append(region_entry(path, page))
        if job.get('overview'):
            saved(overview(im, regions, limit), job['overview'])
        return result
    elif op == 'compare':
        a, b = pair_images(job)
        gap, _, label_h = geometry(limit)
        panel_limit = (2 * limit - 3 * gap) // 2
        regions = selected(b, limit, max_width=(panel_limit - 4 * gap) // 3)
        pages = packed(regions, panel_limit)
        details = [combine_pair(grid(a, p, panel_limit), grid(b, p, panel_limit), limit, False) for p in pages]
        top_limit = min(panel_limit, int((2 * limit - sum(p.height for p in details) - label_h - 4 * gap) * b.width / b.height))
        if top_limit < 1:
            raise ValueError('comparison dimensions do not fit')
        top = combine_pair(fitted(a, top_limit), fitted(b, top_limit), limit, True)
        height = top.height + sum(p.height for p in details)
        board = Image.new('RGB', (max(top.width, *(p.width for p in details)), height), BACKGROUND)
        y = 0
        for row in [top, *details]:
            board.paste(row, ((board.width - row.width) // 2, y))
            y += row.height
        saved(board, output, job['quality'])
        saved(fitted(board, limit, expand=True), job['view'], job['quality'])
        return regions
    elif op == 'pair':
        a, b = pair_images(job)
        if job.get('together'):
            cell_limit = (limit - geometry(limit)[0] * 3) // 2
            saved(combine_pair(fitted(a, cell_limit), fitted(b, cell_limit), limit, False), output + '.png')
        else:
            cell_limit = limit
            for name, im in (('a', a), ('b', b)):
                saved(fitted(im, limit), f'{output}-{name}.png')
        regions = selected(b, cell_limit)
        result = []
        for i, page in enumerate(packed(regions, cell_limit), 1):
            prefix = f'{output}-{i:02}'
            if job.get('together'):
                saved(combine_pair(grid(a, page, cell_limit), grid(b, page, cell_limit), limit, False), prefix + '.png')
                result.append(region_entry(prefix + '.png', page))
            else:
                for name, im in (('a', a), ('b', b)):
                    path = f'{prefix}-{name}.png'
                    saved(grid(im, page, cell_limit), path)
                    result.append(region_entry(path, page))
        return result
    else:
        raise ValueError(f'unknown operation {op}')


print(json.dumps(run(json.load(sys.stdin))))
