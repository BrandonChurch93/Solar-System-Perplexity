"""S2: the globe as it is drawn, laid top down onto a plate (the guide the repaint starts from).

python3 assets-src/neptune/place/vguide.py POSES.json DIR frames widthDeg size [eastDeg northDeg] OUT.png

Each frame DIR/fN.png is a render of the globe side without the place (no shown plates, no live close layer, no
cirrus, near grade full; a local patch that is never committed). Every texel of the plate is looked up in the frames
that see it, through the pose of that frame and the globe's flow at that frame, and the frames are mixed by how many
screen pixels they give per plate texel. The result is the globe's own look in the display values the shown plates
are painted in, good enough for the ring where a plate fades into the levels above and as the base of the guide.
"""
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import layback  # noqa: E402
from layback import QB, cgeo, flow  # noqa: E402
import cover  # noqa: E402


def project(d, pose, w, h):
    """Screen position of the deck texels of texture directions d in one frame, and what that frame resolves."""
    n = flow.deck_shown(d, cover.state_of(pose)) @ QB
    p = cgeo.CENTRE[None, None, :] + cgeo.RADIUS * n
    cam = np.array(pose['position'])
    v = (p - cam) @ layback.matrix(pose['quaternion'])
    ty = np.tan(np.radians(pose['vfovDeg']) / 2)
    tx = ty * w / h
    z = np.minimum(v[..., 2], -1e-6)
    px = (v[..., 0] / -z / tx + 1) / 2 * w - 0.5
    py = (1 - v[..., 1] / -z / ty) / 2 * h - 0.5
    facing = ((cam - p) * n).sum(-1) > 0
    ok = facing & (v[..., 2] < 0) & (px > 0) & (px < w - 1) & (py > 0) & (py < h - 1)
    res = np.minimum(np.hypot(np.gradient(px, axis=1), np.gradient(py, axis=1)), np.hypot(np.gradient(px, axis=0), np.gradient(py, axis=0)))
    border = np.clip(np.minimum(np.minimum(px, w - 1 - px), np.minimum(py, h - 1 - py)) / 80, 0, 1)
    return px.astype(np.float32), py.astype(np.float32), ok, res * border


def laid(poses, folder, frames, width, size, centre=(0.0, 0.0)):
    d = layback.plate_dirs(width, size, centre).astype(np.float64)
    total = np.zeros((size, size, 3), np.float64)
    weight = np.zeros((size, size), np.float64)
    for f in frames:
        im = cv2.imread(os.path.join(folder, 'f%s.png' % f)).astype(np.float32) / 255
        px, py, ok, res = project(d, poses[str(f)], im.shape[1], im.shape[0])
        got = cv2.remap(im, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        w = np.where(ok, np.minimum(res, 1.0) ** 4, 0.0)
        total += got * w[..., None]
        weight += w
    return (total / np.maximum(weight, 1e-9)[..., None]).astype(np.float32)[..., ::-1], weight > 1e-6


if __name__ == '__main__':
    poses = json.load(open(sys.argv[1]))
    folder, frames, width, size = sys.argv[2], sys.argv[3].split(','), float(sys.argv[4]), int(sys.argv[5])
    off = (float(sys.argv[6]), float(sys.argv[7])) if len(sys.argv) > 8 else (0.0, 0.0)
    centre = (float(np.tan(np.radians(off[0]))), float(np.tan(np.radians(off[1]))))
    rgb, got = laid(poses, folder, frames, width, size, centre)
    out = sys.argv[-1]
    cv2.imwrite(out, (np.clip(rgb[..., ::-1], 0, 1) * 255 + 0.5).astype(np.uint8))
    print(out, 'covered %.3f' % got.mean())
