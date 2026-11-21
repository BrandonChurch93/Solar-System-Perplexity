import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, POLAR, ROOT, WORK, hero_camera, load_json, plane_hit, spheroid_hit, srgb_to_linear  # noqa: E402

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from common import quat_to_mat  # noqa: E402
from lightcurve import inverse_filmic  # noqa: E402

FIT = load_json(HERE / "fit.json")
KNOTS = 33


def filmic(x):
    x = np.clip(x, 0, None)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene(srgb):
    return inverse_filmic(srgb_to_linear(np.clip(srgb, 0, 1)))


def ring_frame():
    return quat_to_mat(FIT["globe"]["quaternion"])


def sun_local():
    s = np.array(FIT["sunDir"], dtype=np.float64)
    return (s / np.linalg.norm(s)) @ ring_frame()


def hero_geometry(scale=1):
    cam = hero_camera(FIT)
    w, h = cam.w * scale, cam.h * scale
    xs, ys = np.meshgrid((np.arange(w) + 0.5) / scale, (np.arange(h) + 0.5) / scale)
    d = cam.rays_world(xs, ys)
    M = ring_frame()
    n = M[:, 1]
    hit, t = spheroid_hit(cam.pos, d, n)
    P = (cam.pos + d * t[..., None]) @ M
    p = P * np.array([1, 1 / POLAR, 1])
    p /= np.maximum(np.linalg.norm(p, axis=-1, keepdims=True), 1e-9)
    nl = p * np.array([1, 1 / POLAR, 1])
    nl /= np.linalg.norm(nl, axis=-1, keepdims=True)
    dl = d @ M
    sl = sun_local()
    ndl = nl @ sl
    mu = -(nl * dl).sum(-1)
    tr, pr = plane_hit(cam.pos, d, n)
    rr = np.linalg.norm(pr, axis=-1)
    inner, outer = FIT["rings"]["inner"], FIT["rings"]["outer"]
    covered = (tr > 0) & (tr < t) & (rr > inner - 0.02) & (rr < outer + 0.02)
    ts = -P[..., 1] / sl[1]
    rs = np.linalg.norm(P[..., [0, 2]] + sl[[0, 2]] * ts[..., None], axis=-1)
    shadowed = (ts > 0) & (rs > inner - 0.03) & (rs < outer + 0.03)
    return {"hit": hit, "p": p, "ndl": ndl, "mu": mu, "covered": covered, "shadowed": shadowed, "lat": np.arcsin(np.clip(p[..., 1], -1, 1)), "lon": np.arctan2(p[..., 0], p[..., 2]), "xs": xs, "ys": ys}


def curve_at(curve, ndl):
    x = np.clip(ndl * 0.5 + 0.5, 0, 1) * (KNOTS - 1)
    return np.stack([np.interp(x, np.arange(KNOTS), curve[:, c]) for c in range(3)], -1)


def hero_image():
    return cv2.imread(str(ROOT / "references/approved/saturn-hero.png"))[..., ::-1].astype(np.float32) / 255
