import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt, map_coordinates

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "close"))
from lib import ROOT, WORK, lum  # noqa: E402
from skim_rings import JPTS, ring_alpha  # noqa: E402
from layoutgeo import GW, GH, C, hc, side, plane_from_approved, a2g, model_lambda  # noqa: E402

REF = ROOT / "references" / "approved" / "saturn-close.jpg"
OUT = WORK / "apron"
LEFT, RIGHT, BELOW = 0.75, 0.25, 1.0
W, H = 2816, 1584
SW, SH = W // 2, H // 2
X0 = int(round(LEFT * SW))
FEATHER = 28
SKY = 34.0
SIZES = {"full": (5632, 3168), "web": (4096, 2304)}
OUTER = 2.12
EDGE_REACH = 120.0


def canvas():
    OUT.mkdir(parents=True, exist_ok=True)
    ref = cv2.imread(str(REF))
    can = np.zeros((H, W, 3), np.uint8)
    can[:] = (255, 0, 255)
    can[0:SH, X0:X0 + SW] = cv2.resize(ref, (SW, SH), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(OUT / "canvas-in.png"), can)
    print("canvas", can.shape, "approved frame at x", X0, "to", X0 + SW, "y 0 to", SH)


def model_field():
    lay = np.fromfile(str(ROOT / "public/assets/saturn/full/layout.bin"), np.float32).reshape(GH, GW, 4)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    x, y = (xs + 0.5 - X0) * 2.0, (ys + 0.5) * 2.0
    X, live = plane_from_approved(x, y)
    P = X - C
    lam = model_lambda(P @ hc, P @ side)
    gx, gy, ok = a2g(x, y)
    e = np.minimum(np.minimum(gx / GW, 1 - gx / GW), np.minimum(gy / GH, 1 - gy / GH))
    ins = np.clip(e / 0.04, 0, 1)
    ins = np.where(ok, ins * ins * (3 - 2 * ins), 0.0)
    res = map_coordinates(lay[..., 0], [np.clip(gy - 0.5, 0, GH - 1), np.clip(gx - 0.5, 0, GW - 1)], order=1, mode="nearest")
    return np.where(live, lam + ins * res, 99.0).astype(np.float32)


def model_edge():
    lam = model_field()
    alpha = cv2.resize(ring_alpha(), (SW, SH), interpolation=cv2.INTER_AREA)
    col = alpha[:, 0:3].mean(axis=1)
    yb = int(np.argmax(col > 0.5))
    lift = float(lam[yb, X0]) - OUTER
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    lam2 = lam - max(lift, 0.0) * np.exp(-((xs - X0) ** 2 + (ys - yb) ** 2) / (2 * EDGE_REACH ** 2))
    ring = lam2 <= OUTER
    sd = distance_transform_edt(ring) - distance_transform_edt(~ring)
    print("outer edge of the close image at the left border: row", yb, "layout radius there", round(float(lam[yb, X0]), 3), "lift", round(lift, 3))
    return np.clip(0.5 + sd / 2.4, 0, 1).astype(np.float32)


def canvas2():
    OUT.mkdir(parents=True, exist_ok=True)
    ref = cv2.imread(str(REF))
    edge = model_edge()
    can = np.zeros((H, W, 3), np.uint8)
    can[:] = (255, 0, 255)
    sky = np.median(ref[40:400, 40:1200].reshape(-1, 3), axis=0)
    space = edge < 0.5
    space[:, X0 + SW:] = False
    can[space] = sky.astype(np.uint8)
    can[0:SH, X0:X0 + SW] = cv2.resize(ref, (SW, SH), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(OUT / "canvas-in-b.png"), can)
    np.save(str(OUT / "edge.npy"), edge)
    print("canvas with the outer edge of the layout model, space share", round(float(space.mean()), 3), "sky", sky.tolist())


def register(take, small):
    g0 = cv2.GaussianBlur(lum(small[..., ::-1].astype(np.float32)), (0, 0), 1.2)
    g1 = cv2.GaussianBlur(lum(take[..., ::-1].astype(np.float32)), (0, 0), 1.2)
    warp = np.array([[1, 0, X0], [0, 1, 0]], np.float32)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7)
    cc, warp = cv2.findTransformECC(g0, g1, warp, cv2.MOTION_AFFINE, crit, None, 5)
    full = np.vstack([warp, [0, 0, 1]]) @ np.array([[1, 0, -X0], [0, 1, 0], [0, 0, 1]], np.float64)
    out = cv2.warpAffine(take, full[:2].astype(np.float32), (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    print("registration: correlation", round(float(cc), 4), "affine", np.round(warp, 5).tolist())
    return out


def settle(take, small, steps=2):
    inside = np.zeros((H, W), bool)
    inside[0:SH, X0:X0 + SW] = True
    dist, (iy, ix) = distance_transform_edt(~inside, return_indices=True)
    for _ in range(steps):
        a = lum(small[..., ::-1].astype(np.float32))
        b = lum(take[0:SH, X0:X0 + SW, ::-1].astype(np.float32))
        flow = cv2.calcOpticalFlowFarneback(np.clip(a, 0, 255).astype(np.uint8), np.clip(b, 0, 255).astype(np.uint8), None, 0.5, 5, 31, 5, 7, 1.5, 0)
        flow = cv2.GaussianBlur(flow, (0, 0), 12)
        field = np.zeros((H, W, 2), np.float32)
        field[0:SH, X0:X0 + SW] = flow
        field = field[iy, ix] * np.exp(-dist / 260.0)[..., None].astype(np.float32)
        field = cv2.GaussianBlur(field, (0, 0), 6)
        gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
        take = cv2.remap(take, gx + field[..., 0], gy + field[..., 1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        print("  residual flow inside: median", round(float(np.median(np.hypot(flow[..., 0], flow[..., 1]))), 3), "p99", round(float(np.percentile(np.hypot(flow[..., 0], flow[..., 1]), 99)), 3))
    return take


def tone(take, small, alpha):
    inside = np.zeros((H, W), bool)
    inside[0:SH, X0:X0 + SW] = True
    ring = np.zeros((H, W), np.float32)
    ring[0:SH, X0:X0 + SW] = alpha
    a = np.zeros((H, W, 3), np.float32)
    a[0:SH, X0:X0 + SW] = small.astype(np.float32)
    b = take.astype(np.float32)
    s = 30.0
    wb = cv2.GaussianBlur(ring, (0, 0), s)
    ga = cv2.GaussianBlur(a * ring[..., None], (0, 0), s) / np.maximum(wb, 1e-3)[..., None]
    gb = cv2.GaussianBlur(b * ring[..., None], (0, 0), s) / np.maximum(wb, 1e-3)[..., None]
    gain = np.clip((ga + 4.0) / (gb + 4.0), 0.6, 1.6)
    known = wb > 0.5
    dist, (iy, ix) = distance_transform_edt(~known, return_indices=True)
    spread = gain[iy, ix]
    fade = np.exp(-dist / 500.0)[..., None]
    mean = np.median(gain[known], axis=0)
    spread = cv2.GaussianBlur((mean + (spread - mean) * fade).astype(np.float32), (0, 0), 40)
    gain = np.where(known[..., None], gain, spread)
    gain = cv2.GaussianBlur(gain.astype(np.float32), (0, 0), 8)
    print("tone gain inside: median", np.round(mean, 3).tolist(), "range", round(float(gain[known].min()), 3), round(float(gain[known].max()), 3))
    return np.clip(b * gain, 0, 255)


def ring_mask(img, alpha):
    y = lum(cv2.GaussianBlur(img, (0, 0), 2.5)[..., ::-1].astype(np.float32))
    dark = (y < SKY).astype(np.uint8)
    dark[0:SH, X0:X0 + SW] = (alpha < 0.5).astype(np.uint8)
    seed = np.zeros((H + 2, W + 2), np.uint8)
    sky = dark.copy()
    cv2.floodFill(sky, seed, (4, 4), 2)
    sky = sky == 2
    sky[:, X0 + SW - 200:] = False
    sky = cv2.morphologyEx(sky.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) > 0
    n, lab = cv2.connectedComponents((~sky).astype(np.uint8))
    keep = lab == lab[H - 4, X0 + SW // 2]
    soft = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 1.6)
    edge = np.clip((y - SKY * 0.55) / (SKY * 0.9), 0, 1)
    near = cv2.dilate(keep.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    out = np.where(soft > 0.98, 1.0, np.where(near, np.minimum(edge, soft * 2.0), 0.0)).astype(np.float32)
    xs = np.arange(X0 + SW, W) + 0.5
    slope = (JPTS[-1, 1] - JPTS[-3, 1]) / (JPTS[-1, 0] - JPTS[-3, 0])
    line = (JPTS[-1, 1] + slope * ((xs - X0) * 2 - JPTS[-1, 0])) / 2
    rows = np.arange(H, dtype=np.float32)[:, None]
    out[:, X0 + SW:] = np.clip(rows - line[None, :] + 1.0, 0, 1)
    out[0:SH, X0:X0 + SW] = alpha
    return out


def build(path):
    take = cv2.imread(str(path))
    if take.shape[:2] != (H, W):
        print("take resized from", take.shape[:2])
        take = cv2.resize(take, (W, H), interpolation=cv2.INTER_LANCZOS4)
    ref = cv2.imread(str(REF))
    small = cv2.resize(ref, (SW, SH), interpolation=cv2.INTER_AREA)
    alpha = cv2.resize(ring_alpha(), (SW, SH), interpolation=cv2.INTER_AREA)
    take = register(take, small)
    take = settle(take, small)
    take = tone(take, small, alpha)
    d = np.zeros((H, W), np.float32)
    yy, xx = np.mgrid[0:SH, 0:SW]
    d[0:SH, X0:X0 + SW] = np.minimum(np.minimum(xx, SW - 1 - xx), SH - 1 - yy)
    w = np.clip(d / FEATHER, 0, 1)
    w = (w * w * (3 - 2 * w))[..., None]
    base = take.copy()
    base[0:SH, X0:X0 + SW] = small
    comp = np.clip(take * (1 - w) + base * w, 0, 255).astype(np.uint8)
    mask = ring_mask(comp, alpha)
    cv2.imwrite(str(OUT / "apron-2k.png"), comp)
    cv2.imwrite(str(OUT / "apron-2k-mask.png"), np.clip(mask * 255 + 0.5, 0, 255).astype(np.uint8))
    view = comp.copy()
    view[mask < 0.5] = (view[mask < 0.5] * 0.35 + np.array([90, 0, 90])).astype(np.uint8)
    cv2.rectangle(view, (X0, 0), (X0 + SW, SH), (0, 255, 255), 1)
    cv2.imwrite(str(OUT / "apron-view.jpg"), view, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print("ring share of the canvas", round(float((mask > 0.5).mean()), 3))


def ship():
    comp = OUT / "apron-2k.png"
    big = OUT / "apron-4k.png"
    if not big.exists():
        subprocess.run([sys.executable, str(ROOT / "tools/ml/upscale.py"), "--in", str(comp), "--out", str(big), "--width", str(2 * W)], check=True)
    img = cv2.imread(str(big))
    ref = cv2.imread(str(REF))
    d = np.zeros((2 * H, 2 * W), np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    d[0:H, 2 * X0:2 * X0 + W] = np.minimum(np.minimum(xx, W - 1 - xx), H - 1 - yy)
    w = np.clip(d / (2 * FEATHER), 0, 1)
    w = (w * w * (3 - 2 * w))[..., None]
    base = img.copy()
    base[0:H, 2 * X0:2 * X0 + W] = ref
    img = np.clip(img * (1 - w) + base * w, 0, 255).astype(np.uint8)
    mask = cv2.imread(str(OUT / "apron-2k-mask.png"), cv2.IMREAD_GRAYSCALE)
    for key, (cw, ch) in SIZES.items():
        dst = ROOT / "public" / "assets" / "saturn" / key
        out = img if (cw, ch) == (2 * W, 2 * H) else cv2.resize(img, (cw, ch), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(dst / "skim-apron.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 92])
        m = np.zeros((H, W, 3), np.uint8)
        m[..., 2] = mask
        m[..., 1] = 255
        cv2.imwrite(str(dst / "skim-apron-mask.png"), m, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        print(key, cw, ch)
    (ROOT / "src/stops/saturn/apron.json").write_text(json.dumps({"source": "assets-src/saturn/shot/skim_apron.py, the approved close image carried past its left, right and lower borders on a wider canvas from the same camera", "file": "skim-apron.jpg", "mask": "skim-apron-mask.png", "left": LEFT, "right": RIGHT, "below": BELOW, "sets": {k: list(v) for k, v in SIZES.items()}}, indent=1) + "\n")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "canvas":
        canvas()
    elif cmd == "canvas2":
        canvas2()
    elif cmd == "build":
        build(Path(sys.argv[2]))
    elif cmd == "ship":
        ship()
