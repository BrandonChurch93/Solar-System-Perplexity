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


def turned(q, v):
    """The vectors v turned by the quaternion q (x, y, z, w)."""
    u = np.asarray(q[:3], dtype=np.float64)
    uv = np.cross(u, v)
    return v + 2.0 * (q[3] * uv + np.cross(u, uv))


def back(q):
    return [-q[0], -q[1], -q[2], q[3]]


def small(path, scale):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    if scale < 1:
        im = im.resize((max(int(round(w * scale)), 1), max(int(round(h * scale)), 1)), Image.BOX)
    return np.asarray(im).astype(np.float64)


def ground(pose, h, w):
    """Where the ray through the middle of each pixel meets the unit sphere of the body: a mask and the points."""
    ys, xs = np.mgrid[0:h, 0:w]
    sx = (xs + 0.5) / w * 2 - 1
    sy = 1 - (ys + 0.5) / h * 2
    tan = np.tan(np.radians(pose['vfov']) / 2)
    ray = np.stack([sx * tan * (w / h), sy * tan, -np.ones_like(sx)], axis=-1)
    ray /= np.linalg.norm(ray, axis=-1, keepdims=True)
    ray = turned(pose['quaternion'], ray)
    eye = np.asarray(pose['position'], dtype=np.float64)
    along = -(ray @ eye)
    disc = along * along - eye @ eye + 1
    met = disc > 0
    t = along - np.sqrt(np.where(met, disc, 0))
    met &= t > 0
    return met, eye + ray * t[..., None]


def onto(pose, point, h, w):
    """The points of the unit sphere in the picture of a camera: x, y in pixels and whether the camera sees them."""
    eye = np.asarray(pose['position'], dtype=np.float64)
    v = turned(back(pose['quaternion']), point - eye)
    k = h / 2 / np.tan(np.radians(pose['vfov']) / 2)
    z = np.minimum(v[..., 2], -1e-9)
    x = w / 2 + v[..., 0] / -z * k
    y = h / 2 - v[..., 1] / -z * k
    faces = np.einsum('...i,...i->...', point, eye - point) > 0
    return x, y, (v[..., 2] < -1e-9) & faces & (x >= 0.5) & (x <= w - 0.5) & (y >= 0.5) & (y <= h - 0.5)


def taken(im, x, y):
    """The picture read between its pixels (pixel middles at whole numbers and a half)."""
    h, w = im.shape[:2]
    fx = np.clip(x - 0.5, 0, w - 1.001)
    fy = np.clip(y - 0.5, 0, h - 1.001)
    x0 = np.floor(fx).astype(int)
    y0 = np.floor(fy).astype(int)
    ax = (fx - x0)[..., None]
    ay = (fy - y0)[..., None]
    return (im[y0, x0] * (1 - ax) + im[y0, x0 + 1] * ax) * (1 - ay) + (im[y0 + 1, x0] * (1 - ax) + im[y0 + 1, x0 + 1] * ax) * ay


def inner(mask):
    """The mask without its rim: a pixel stays where its eight neighbours are in the mask too (the edge of the picture is no rim)."""
    h, w = mask.shape
    wide = np.pad(mask, 1, mode='edge')
    out = np.ones_like(mask)
    for dy in range(3):
        for dx in range(3):
            out &= wide[dy:dy + h, dx:dx + w]
    return out


def in_place(job):
    """The change of each frame against the frame before it on the ground that both frames show.

    Every frame comes with its camera at the unit sphere of the body (position, quaternion, vfov) and the turn of the body at its time. A pixel
    of a frame is laid over the frame before by the ground it shows: its ray meets the sphere, the point is taken back by the turn of this
    frame and forward by the turn of the frame before, and is projected into that frame. Where the frame before shows the same ground the two
    values are compared; ground that is new in the frame (it came in at the edge of the picture or over the rim) is counted as a share and
    left out of the change. So a frame that opens on a darker side of the body reads as new ground, not as a step of the look. The rim of
    the body, one pixel wide in either frame, holds a part of the sky and is left out of both.

    Reply, one entry a frame (null for the first): seen, the share of the body's pixels (new or seen in both) whose ground the frame before
    shows too; level and colour, the mean change on them (signed, this frame less the one before); rms, the root mean square of the change
    of the level; fresh, the mean level of the new ground, and kept, the mean level of the ground seen in both, in this frame."""
    scale = job.get('scale', 0.25)
    out = [None]
    before = None
    pictures = []
    for path, pose in zip(job['paths'], job['poses']):
        im = small(path, scale)
        h, w = im.shape[:2]
        met, point = ground(pose, h, w)
        core = inner(met)
        if before is not None:
            was_im, was_pose, was_core = before
            at = turned(was_pose['turn'], turned(back(pose['turn']), point))
            x, y, sees = onto(was_pose, at, h, w)
            whole = was_core[np.clip(np.floor(y).astype(int), 0, h - 1), np.clip(np.floor(x).astype(int), 0, w - 1)]
            both = core & sees & whole
            new = core & ~sees
            m = int(both.sum())
            n = m + int(new.sum())
            d = (im - taken(was_im, x, y))[both]
            luma = d @ LUMA
            level = im @ LUMA
            out.append({
                'seen': m / n if n else 0.0,
                'level': float(luma.mean()) if m else 0.0,
                'colour': [float(v) for v in d.mean(axis=0)] if m else [0.0, 0.0, 0.0],
                'rms': float(np.sqrt((luma ** 2).mean())) if m else 0.0,
                'fresh': float(level[new].mean()) if n > m else 0.0,
                'kept': float(level[both].mean()) if m else 0.0,
            })
            pictures.append((was_im, im, new, both, x, y))
        else:
            pictures.append(None)
        before = (im, pose, core)
    for want in job.get('panels', []):
        i = want['index']
        if i < 1 or i >= len(pictures) or pictures[i] is None:
            continue
        was_im, im, new, both, x, y = pictures[i]
        h, w = im.shape[:2]
        gain = want.get('gain', 8)
        fresh = im.copy()
        fresh[new] = fresh[new] * 0.35 + np.array([255.0, 0.0, 255.0]) * 0.65
        laid = taken(was_im, x, y)
        change = np.zeros_like(im)
        change[both] = np.clip(128 + (im - laid)[both] * gain, 0, 255)
        tiles = [(want['names'][0], was_im), (want['names'][1], im), ('new ground in magenta', fresh), ('change in place times ' + str(gain) + ' (grey: none)', change)]
        limit = want.get('limit', 1400)
        cell_w = (limit - 5 * 6) // 4
        cell_h = round(cell_w * h / w)
        label = 22
        board = Image.new('RGB', (limit, cell_h + label + 12), (16, 16, 16))
        draw = ImageDraw.Draw(board)
        for j, (name, tile) in enumerate(tiles):
            tx = 6 + j * (cell_w + 6)
            board.paste(Image.fromarray(tile.astype(np.uint8)).resize((cell_w, cell_h), Image.LANCZOS), (tx, 6))
            draw.text((tx + 4, cell_h + 8), name, fill=(230, 230, 230), font=font(14))
        board.save(want['file'])
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
    elif op == 'inPlace':
        reply = in_place(job)
    else:
        raise SystemExit('unknown op ' + op)
    json.dump(reply, sys.stdout)


if __name__ == '__main__':
    main()
