import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "assets"))
from common import (body_from_fit, camera_from_fit, load_fit, load_hero, lonlat_to_local,  # noqa: E402
                    local_to_lonlat, normalize)

WORK = ROOT / "out" / "work" / "wrap"
WORK.mkdir(parents=True, exist_ok=True)
FIT = load_fit("mars")
CAM = camera_from_fit(FIT)
BODY = body_from_fit(FIT)
SUN = np.asarray(FIT["sunDir"], dtype=np.float64)


def hero():
    return load_hero("mars")


def hero_geometry():
    h, w = FIT["imageSize"][1], FIT["imageSize"][0]
    py, px = np.mgrid[0:h, 0:w] + 0.5
    d = CAM.rays_world(px, py)
    hit, t, y, n = BODY.intersect(CAM.pos, d)
    p = CAM.pos + d * t[..., None]
    v = -d
    cosv = (n * v).sum(-1)
    mu = n @ SUN
    lon, lat = local_to_lonlat(y)
    return dict(hit=hit, lon=lon, lat=lat, cosv=cosv, mu=mu, n=n, p=p)


def map_lonlat(W):
    H = W // 2
    lon = (np.arange(W) + 0.5) / W * 360 - 180
    lat = 90 - (np.arange(H) + 0.5) / H * 180
    return np.meshgrid(lon, lat)


def project_lonlat(lon, lat):
    y = lonlat_to_local(lon, lat)
    p, n, cosv = BODY.visible(CAM, y)
    px, py, z = CAM.project(p)
    return px, py, cosv, n @ SUN
