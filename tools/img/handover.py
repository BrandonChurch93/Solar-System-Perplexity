#!/usr/bin/env python3
"""Image measures of the handover tool. Reads one JSON job on stdin, writes one JSON reply on stdout."""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

LUMA = np.array([0.2126, 0.7152, 0.0722])


def rgb(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64)


def font(size):
    for name in ('DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def sides(job):
    a = rgb(job['close'])
    b = rgb(job['globe'])
    d = np.abs(a - b)
    worst = d.max(axis=2)
    numbers = {
        'mean': float(d.mean()),
        'p50': float(np.percentile(worst, 50)),
        'p99': float(np.percentile(worst, 99)),
        'p999': float(np.percentile(worst, 99.9)),
        'max': float(worst.max()),
        'shareOver1': float((worst > 1).mean()),
        'shareOver4': float((worst > 4).mean()),
        'shareOver16': float((worst > 16).mean()),
        'pixelsOver16': int((worst > 16).sum()),
        'meanSigned': [float(v) for v in (b - a).mean(axis=(0, 1))],
    }
    if job.get('difference'):
        Image.fromarray(np.clip(d * job.get('gain', 8), 0, 255).astype(np.uint8)).save(job['difference'])
    if job.get('panel'):
        limit = job.get('limit', 1400)
        gain = job.get('gain', 8)
        h, w = a.shape[:2]
        cell_w = (limit - 4 * 6) // 3
        cell_h = round(cell_w * h / w)
        label = 22
        board = Image.new('RGB', (limit, cell_h + label + 12), (16, 16, 16))
        draw = ImageDraw.Draw(board)
        tiles = [('close side at T', a), ('globe side at T', b), ('difference times ' + str(gain), np.clip(d * gain, 0, 255))]
        for i, (name, im) in enumerate(tiles):
            x = 6 + i * (cell_w + 6)
            board.paste(Image.fromarray(im.astype(np.uint8)).resize((cell_w, cell_h), Image.LANCZOS), (x, 6))
            draw.text((x + 4, cell_h + 8), name, fill=(230, 230, 230), font=font(14))
        board.save(job['panel'])
    return numbers


def under(job):
    """The globe side alone against the globe side with the place picture, where the pass draws the picture at more than half weight.

    Counted on the body, and beside it on the sky. The body is a grid of 0 and 1 (rows from the top), the mask a picture of the pass weight as
    grey. Tone is the part of the difference that the means of whole blocks carry, detail is what is left inside the blocks."""
    a = rgb(job['picture'])
    b = rgb(job['alone'])
    h, w = a.shape[:2]
    weight = rgb(job['mask']).mean(axis=2) / 255.0
    grid = np.asarray(job['body'], dtype=np.float64)
    rows, cols = grid.shape
    bh, bw = h // rows, w // cols
    body = np.zeros((h, w), dtype=bool)
    body[: rows * bh, : cols * bw] = np.kron(grid > 0.5, np.ones((bh, bw), dtype=bool))
    drawn = weight > 0.5
    where = body & drawn
    above = ~body & drawn
    above[rows * bh :, :] = False
    above[:, cols * bw :] = False
    d = np.abs(a - b)
    worst = d.max(axis=2)
    signed = b - a

    def part(mask):
        n = int(mask.sum())
        return {
            'pixels': n,
            'share': float(mask.mean()),
            'mean': float(d[mask].mean()) if n else 0.0,
            'p50': float(np.percentile(worst[mask], 50)) if n else 0.0,
            'p99': float(np.percentile(worst[mask], 99)) if n else 0.0,
            'meanSigned': [float(v) for v in signed[mask].mean(axis=0)] if n else [0.0, 0.0, 0.0],
        }

    numbers = part(where)
    numbers['sky'] = part(above)
    cells = where[: rows * bh, : cols * bw].reshape(rows, bh, cols, bw).mean(axis=(1, 3)) > 0.5
    if cells.any():
        means = signed[: rows * bh, : cols * bw].reshape(rows, bh, cols, bw, 3).mean(axis=(1, 3))
        inner = np.abs(signed[: rows * bh, : cols * bw] - np.kron(means, np.ones((bh, bw, 1))))
        full = np.kron(cells, np.ones((bh, bw), dtype=bool))
        numbers['tone'] = float(np.abs(means[cells]).mean())
        numbers['detail'] = float(inner[full].mean())
    else:
        numbers['tone'] = 0.0
        numbers['detail'] = 0.0
    if job.get('panel'):
        limit = job.get('limit', 1400)
        gain = job.get('gain', 2)
        cell_w = (limit - 4 * 6) // 3
        cell_h = round(cell_w * h / w)
        label = 22
        board = Image.new('RGB', (limit, cell_h + label + 12), (16, 16, 16))
        draw = ImageDraw.Draw(board)
        shown = np.clip(d * gain, 0, 255)
        shown[~drawn] *= 0.25
        tiles = [('globe side at T with the place picture', a), ('globe side at T alone', b), ('difference times ' + str(gain) + ', dim where not counted', shown)]
        for i, (name, im) in enumerate(tiles):
            x = 6 + i * (cell_w + 6)
            board.paste(Image.fromarray(im.astype(np.uint8)).resize((cell_w, cell_h), Image.LANCZOS), (x, 6))
            draw.text((x + 4, cell_h + 8), name, fill=(230, 230, 230), font=font(14))
        board.save(job['panel'])
    return numbers


def frame(job):
    """Mean level, mean colour and the flat share of the body in one frame.

    The body is given as a grid of 0 and 1 (rows from the top), one cell per block."""
    im = rgb(job['path'])
    h, w = im.shape[:2]
    luma = im @ LUMA
    mask = np.asarray(job['body'], dtype=np.float64)
    rows, cols = mask.shape
    bh, bw = h // rows, w // cols
    blocks = luma[: rows * bh, : cols * bw].reshape(rows, bh, cols, bw)
    contrast = blocks.std(axis=(1, 3))
    level = blocks.mean(axis=(1, 3))
    colour = im[: rows * bh, : cols * bw].reshape(rows, bh, cols, bw, 3).mean(axis=(1, 3))
    body = mask > 0.5
    n = int(body.sum())
    out = {
        'level': float(luma.mean()),
        'colour': [float(v) for v in im.mean(axis=(0, 1))],
        'bodyShare': float(body.mean()),
        'bodyLevel': float(level[body].mean()) if n else 0.0,
        'bodyColour': [float(v) for v in colour[body].mean(axis=0)] if n else [0.0, 0.0, 0.0],
        'flatShare': float((contrast[body] < job['floor']).mean()) if n else 0.0,
        'contrast': float(np.median(contrast[body])) if n else 0.0,
    }
    return out


def flow(job):
    """Dense optical flow between two pairs of frames: before T on the globe side, after T on the close side."""
    import cv2

    def grey(path):
        return cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2GRAY)

    def between(p, q):
        return cv2.calcOpticalFlowFarneback(grey(p), grey(q), None, 0.5, 5, 31, 5, 7, 1.5, 0)

    before = between(job['before'][0], job['before'][1])
    after = between(job['after'][0], job['after'][1])
    mask = np.asarray(job['body'], dtype=np.float64) > 0.5
    rows, cols = mask.shape
    h, w = before.shape[:2]
    bh, bw = h // rows, w // cols

    def cells(f):
        return f[: rows * bh, : cols * bw].reshape(rows, bh, cols, bw, 2).mean(axis=(1, 3))

    a = cells(before)
    b = cells(after)
    gap = np.linalg.norm(a - b, axis=2)
    n = int(mask.sum())
    return {
        'meanBefore': float(np.linalg.norm(a, axis=2)[mask].mean()) if n else 0.0,
        'meanAfter': float(np.linalg.norm(b, axis=2)[mask].mean()) if n else 0.0,
        'meanGap': float(gap[mask].mean()) if n else 0.0,
        'maxGap': float(gap[mask].max()) if n else 0.0,
    }


def main():
    job = json.load(sys.stdin)
    op = job['op']
    if op == 'sides':
        reply = sides(job)
    elif op == 'under':
        reply = under(job)
    elif op == 'frame':
        reply = frame(job)
    elif op == 'frames':
        reply = [frame({**job, 'path': p, 'body': b}) for p, b in zip(job['paths'], job['bodies'])]
    elif op == 'flow':
        reply = flow(job)
    else:
        raise SystemExit('unknown op ' + op)
    json.dump(reply, sys.stdout)


if __name__ == '__main__':
    main()
