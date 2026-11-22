import json
import sys

import cv2
import numpy as np

import limbstrip as L

LOW, HIGH, RATIO = -12.0, 3.0, 0.85


def dips(img, pose, pa0, pa1, step=10, width=8):
    out = []
    for pa in range(pa0, pa1, step):
        s, limb, h = L.unwrap(img, pose, pa, pa + width, sub=3.0 * 1080 / img.shape[0])
        lin = L.srgb_to_linear(s[..., ::-1].astype(np.float64)) * 255
        px = h * limb * (1080 / img.shape[0])
        keep = (px >= LOW) & (px <= HIGH)
        b = np.median(lin, axis=1)[keep, 2]
        x = px[keep]
        order = np.argsort(x)
        b, x = b[order], x[order]
        b = np.convolve(np.pad(b, 1, mode='edge'), np.ones(3) / 3, mode='valid')
        worst, at = 1.0, 0.0
        for i in range(1, len(b) - 1):
            if b[i] <= b[i - 1] and b[i] <= b[i + 1]:
                r = b[i] / max(min(b[:i].max(), b[i + 1:].max()), 1e-6)
                if r < worst:
                    worst, at = r, x[i]
        out.append((pa, worst, at, b[np.argmin(np.abs(x + 9))], b[np.argmin(np.abs(x + 4))], b[np.argmin(np.abs(x))], b[np.argmin(np.abs(x - 2))]))
    return out


if __name__ == '__main__':
    still, frame = sys.argv[1], int(sys.argv[2])
    poses = {p['frame']: p for p in json.load(open(sys.argv[3] if len(sys.argv) > 3 else 'out/work/earth/p6/poses.json'))}
    rows = dips(cv2.imread(still), poses[frame], 60, 170)
    bad = 0
    for pa, worst, at, a, b, c, d in rows:
        bad += worst < RATIO
        print(f'pa {pa:3d}  dip {worst:.2f} at {at:6.1f} px   blue at -9 {a:5.2f}  -4 {b:5.2f}  0 {c:5.2f}  +2 {d:5.2f}')
    print(f'{still}: frame {frame}, {bad} of {len(rows)} sectors with a dip below {RATIO}')
