import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK  # noqa: E402

N = 1024
R0, R1 = 1.0, 3.7
STEP = 0.0004
MARGIN = 0.012
SHRINK = 0.006
MIN_ARC = 0.03


def rot(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def main():
    pose = json.loads(subprocess.run(["npx", "tsx", "assets-src/saturn/check/poses.ts"], cwd=ROOT, capture_output=True, text=True, check=True).stdout)["skim"]
    c = np.array(pose["position"])
    R = rot(pose["quaternion"])
    t = np.tan(np.radians(pose["vfov"]) / 2)
    site = np.arctan2(c[2], c[0])
    mask = cv2.imread(str(ROOT / "public" / "assets" / "saturn" / "web" / "skim-rings-mask.png"))[..., 2].astype(np.float32) / 255
    h, w = mask.shape
    phi = np.arange(-np.pi, np.pi, STEP)
    radii = R0 + (R1 - R0) * (np.arange(N) + 0.5) / N
    out = np.zeros((2, N, 4), np.float32)
    lens = []
    for i, r in enumerate(radii):
        P = np.stack([r * np.cos(phi + site), np.zeros_like(phi), r * np.sin(phi + site)], -1)
        q = (P - c) @ R
        front = q[:, 2] < -1e-4
        z = np.where(front, -q[:, 2], 1)
        u = q[:, 0] / z / (t * 16 / 9)
        v = q[:, 1] / z / t
        ok = front & (np.abs(u) < 1 - MARGIN) & (np.abs(v) < 1 - MARGIN)
        px = np.clip(((u * 0.5 + 0.5) * w).astype(int), 0, w - 1)
        py = np.clip(((0.5 - v * 0.5) * h).astype(int), 0, h - 1)
        ok &= mask[py, px] > 0.98
        edges = np.diff(np.concatenate([[0], ok.astype(np.int8), [0]]))
        starts, ends = np.nonzero(edges == 1)[0], np.nonzero(edges == -1)[0]
        runs = sorted(((phi[s] + SHRINK / r, phi[e - 1] - SHRINK / r) for s, e in zip(starts, ends) if phi[e - 1] - phi[s] > MIN_ARC / r + 2 * SHRINK / r), key=lambda ab: ab[0] - ab[1])[:2]
        lens.append([b - a for a, b in runs])
        if len(runs) > 0:
            out[0, i, 0:2] = runs[0]
            out[1, i, 0] = 1
        if len(runs) > 1:
            out[0, i, 2:4] = runs[1]
            out[1, i, 1] = 1
    valid = out[1, :, 0] > 0
    print("radii with an arc", round(float(radii[valid].min()), 3), "to", round(float(radii[valid].max()), 3), "with two arcs", int((out[1, :, 1] > 0).sum()), "of", N)
    for r in (1.2, 1.4, 1.7, 1.9, 2.0, 2.1, 2.2, 2.3, 2.6, 3.0, 3.4):
        i = int((r - R0) / (R1 - R0) * N)
        print(" r", r, "arcs", np.round(out[0, i], 3), "flags", out[1, i, :2])
    for key in ("full", "web"):
        out.tofile(ROOT / "public" / "assets" / "saturn" / key / "skim-arcs.bin")
    (ROOT / "src" / "stops" / "saturn" / "skim-arcs.json").write_text(json.dumps({"source": "assets-src/saturn/shot/skim_arcs.py", "file": "skim-arcs.bin", "width": N, "height": 2, "radii": [R0, R1], "site": float(site)}, indent=1) + "\n")
    vis = np.zeros((N, 1600, 3), np.uint8)
    for i in range(N):
        for k, colr in ((0, (80, 200, 255)), (1, (255, 160, 80))):
            if out[1, i, k] > 0:
                a, b = out[0, i, 2 * k: 2 * k + 2]
                vis[i, int((a + np.pi) / (2 * np.pi) * 1600):int((b + np.pi) / (2 * np.pi) * 1600)] = colr
    cv2.imwrite(str(WORK / "skim-arcs.png"), vis)


if __name__ == "__main__":
    main()
