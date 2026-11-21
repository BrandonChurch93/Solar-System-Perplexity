import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT

GW, GH, VL, BACK = 640, 480, 104.0, 0.35
W, H = 2816, 1584
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
fa = (H / 2) / np.tan(np.radians(close["vfov"]) / 2)
fl = (GH / 2) / np.tan(np.radians(VL) / 2)
k = fl / fa
tilt, roll = np.radians(close["tiltDeg"]), np.radians(close["rollDeg"])
nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
C = np.array(close["centre"])
height = -C @ nc
hc = -C - height * nc
reach = np.linalg.norm(hc)
hc /= reach
side = np.cross(nc, hc)
fh = np.array([0.0, 0.0, -1.0])
fh = fh - nc * (fh @ nc)
fh /= np.linalg.norm(fh)
OL = -BACK * fh


def plane_from_grid(gx, gy):
    d = np.stack([(gx - GW / 2) / fl, (GH / 2 - gy) / fl, -np.ones_like(gx)], -1)
    den = d @ nc
    live = den < -1e-4
    t = np.where(live, -height / np.minimum(den, -1e-4), 0.0)
    return OL + d * t[..., None], live


def plane_from_approved(x, y):
    d = np.stack([(x - W / 2) / fa, (H / 2 - y) / fa, -np.ones_like(x)], -1)
    den = d @ nc
    live = den < -1e-4
    t = np.where(live, -height / np.minimum(den, -1e-4), 0.0)
    return d * t[..., None], live


def g2a(gx, gy):
    X, live = plane_from_grid(gx, gy)
    z = -X[..., 2]
    ok = live & (z > 0.02)
    zz = np.where(ok, z, 1.0)
    return np.where(ok, X[..., 0] / zz * fa + W / 2, -1e5), np.where(ok, H / 2 - X[..., 1] / zz * fa, -1e5), ok


def a2g(x, y):
    X, live = plane_from_approved(x, y)
    Xl = X - OL
    z = -Xl[..., 2]
    ok = live & (z > 0.02)
    zz = np.where(ok, z, 1.0)
    return np.where(ok, Xl[..., 0] / zz * fl + GW / 2, -1e5), np.where(ok, GH / 2 - Xl[..., 1] / zz * fl, -1e5), ok


def cam2g(Q):
    Xl = Q - OL
    z = -Xl[..., 2]
    return Xl[..., 0] / z * fl + GW / 2, GH / 2 - Xl[..., 1] / z * fl, z


MODEL = ROOT / "src/stops/saturn/closeModel.json"


def model_lambda(u, v, m=None):
    m = m if m is not None else json.loads(MODEL.read_text())
    (a0, b0), (a1, b1), (R0, R1) = m["c0"], m["c1"], m["R"]
    du, dv = u - a0, v - b0
    A = a1 * a1 + b1 * b1 - R1 * R1
    B = du * a1 + dv * b1 + R0 * R1
    return (B - np.sqrt(np.maximum(B * B - A * (du * du + dv * dv - R0 * R0), 0.0))) / A
