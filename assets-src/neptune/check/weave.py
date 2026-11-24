"""The pattern number of the smooth report for one pair of film frames, without the frames between them.

Usage: python3 assets-src/neptune/check/weave.py POSES.json DIR A B [OUT.jpg] [DIR_B]
DIR holds fA.png and fB.png (any format; both are reduced to 480 px wide, the size the report measures at). The later frame is
carried back onto the earlier one on the unit sphere of the stop with the cameras of weave.ts (the report carries it along its
optical flows; on the sphere no flow can err), then judged by tools/img/smooth.py pattern() with the config's numbers.
Prints the 99th percentile on the body, the mean, where the largest value is (in pixels of 1920) and the share judged.
OUT.jpg: the earlier frame, the later one carried back, and the pattern change (black 0, white 1 and over).
"""
import json
import os
import sys

import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'img'))
import smooth  # noqa: E402

cfg = json.load(open(os.path.join(ROOT, 'config', 'showcase.json')))['smooth']['pictures']
WIDE = 480


def rot(q, v):
    u = np.array(q[:3], dtype=np.float64)
    t = 2 * np.cross(u, v)
    return v + q[3] * t + np.cross(u, t)


def inv(q):
    return [-q[0], -q[1], -q[2], q[3]]


def load(path):
    g = smooth.grey(path)
    return smooth.small(g, WIDE / g.shape[1])


def carry(a_pose, b_pose, shape):
    h, w = shape
    k = h / 2 / np.tan(np.radians(a_pose['vfov']) / 2)
    xs, ys = smooth.places(shape)
    v = np.stack([(xs + 0.5 - w / 2) / k, (h / 2 - ys - 0.5) / k, -np.ones(shape, dtype=np.float32)], axis=-1).astype(np.float64)
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    ray = rot(a_pose['q'], v)
    p = np.array(a_pose['p'], dtype=np.float64)
    near = -(ray @ p)
    disc = near * near - p @ p + 1
    front = near - np.sqrt(np.maximum(disc, 0))
    hit = (disc > 0) & (front > 0)
    x = p + ray * front[..., None]
    x = rot(b_pose['laid'], rot(inv(a_pose['laid']), x))
    pb = np.array(b_pose['p'], dtype=np.float64)
    d = rot(inv(b_pose['q']), x - pb)
    kb = h / 2 / np.tan(np.radians(b_pose['vfov']) / 2)
    with np.errstate(all='ignore'):
        mx = d[..., 0] / -d[..., 2] * kb + w / 2 - 0.5
        my = h / 2 - 0.5 - d[..., 1] / -d[..., 2] * kb
    seen = hit & (d[..., 2] < 0) & ((x * (x - pb)).sum(-1) < 0)
    inside = seen & (mx >= 0) & (mx <= w - 1) & (my >= 0) & (my <= h - 1)
    return mx.astype(np.float32), my.astype(np.float32), inside


def main():
    poses = json.load(open(sys.argv[1]))
    folder, a_id, b_id = sys.argv[2], sys.argv[3], sys.argv[4]
    out = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] != '-' else None
    folder_b = sys.argv[6] if len(sys.argv) > 6 else folder
    a = load(os.path.join(folder, 'f%s.png' % a_id))
    b = load(os.path.join(folder_b, 'f%s.png' % b_id))
    scale = WIDE / 1920
    sigma = float(cfg['changeBlurPx']) * scale
    wide = float(cfg['patternPx']) * scale
    pa, pb = poses[a_id], poses[b_id]
    mx, my, inside = carry(pa, pb, a.shape)
    # WEAVE_MARGIN (px of 1920, a tool for causes, not the report's number): a wider margin inside the limb of both frames.
    margin = sigma + float(os.environ.get('WEAVE_MARGIN', '0')) * scale
    first = smooth.body(pa, a.shape, margin)
    last = smooth.body(pb, b.shape, margin)
    ok = first & inside & (cv2.remap(last.astype(np.float32), mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.5)
    later = cv2.remap(b.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    p = smooth.pattern(a.astype(np.float32), later, ok, wide / 5, wide, float(cfg['patternFloor']))
    value, at, share = smooth.patterned(p)
    if value is None:
        print('%s to %s: not judged, share %.3f' % (a_id, b_id, share))
    else:
        print('%s to %s: pattern %.2f (limit %.2f), mean %.2f, largest at %d, %d of 1920 by 1080, judged share %.2f, heights %.3f to %.3f' % (a_id, b_id, value, cfg['maxPattern'], float(np.nanmean(p)), at[0] / scale, at[1] / scale, share, pa['height'], pb['height']))
    if out:
        shown = np.nan_to_num(p, nan=0.0)
        tiles = [np.clip(a, 0, 255), np.clip(later * ok, 0, 255), np.clip(shown * 255, 0, 255)]
        sheet = np.concatenate([cv2.resize(t.astype(np.uint8), None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR) for t in tiles], axis=1)
        cv2.imwrite(out, sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])


main()
