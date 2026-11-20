import argparse
import json
import math

import cv2
import numpy as np
from scipy.ndimage import map_coordinates
from scipy.optimize import least_squares, minimize_scalar

from common import (HINTS, Body, Camera, THREE_SPHERE_TO_LOCAL, fit_path, load_hero, lonlat_to_local,
                    local_to_lonlat, mat_to_quat, normalize, quat_to_mat, ray_plane, ray_sphere,
                    save_rgb, work_dir, downsize)


def luminance(img):
    return img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def in_arcs(theta, arcs):
    ok = np.zeros_like(theta, dtype=bool)
    for a0, a1 in arcs:
        t = (theta - a0) % 360
        ok |= t <= (a1 - a0)
    return ok


def limb_signal(img, hint, star_free=False):
    lum = luminance(img)
    if hint.get("signal") == "chroma":
        lum = np.clip(img[..., 0] - img[..., 2], 0, 1)
    k = hint.get("nightMedian", 9) if star_free else 5
    lum = cv2.medianBlur((lum * 255).astype(np.uint8), k).astype(np.float32) / 255
    lum = cv2.GaussianBlur(lum, (0, 0), hint.get("blur", 2.0))
    return np.log(lum + hint.get("logEps", 0.02))


def limb_points(img, hint):
    cx, cy, r = hint["circle"]
    h, w = img.shape[:2]
    thetas = np.arange(0, 360, 0.25)
    arcs = hint.get("arcs", [[0, 360]])
    keep = in_arcs(thetas, arcs)
    for ex in hint.get("excludeArcs", []):
        keep &= ~in_arcs(thetas, [ex])
    thetas = thetas[keep]
    night = in_arcs(thetas, hint.get("nightArcs", []))
    span = hint.get("searchFrac", 0.08)
    rr = np.arange(r * (1 - span), r * (1 + span), 0.5)
    th = np.radians(thetas)[:, None]
    xs = cx + rr[None, :] * np.cos(th)
    ys = cy + rr[None, :] * np.sin(th)
    sig = limb_signal(img, hint)
    prof = map_coordinates(sig, [ys, xs], order=1, mode="nearest")
    if night.any():
        sig_n = limb_signal(img, hint, star_free=True)
        prof_n = map_coordinates(sig_n, [ys, xs], order=1, mode="nearest")
        prof = np.where(night[:, None], -prof_n, prof)
    grad = np.gradient(prof, axis=1)
    idx = np.argmin(grad, axis=1)
    strength = -grad[np.arange(len(idx)), idx]
    px = xs[np.arange(len(idx)), idx]
    py = ys[np.arange(len(idx)), idx]
    margin = 6
    inside = (px > margin) & (px < w - margin) & (py > margin) & (py < h - margin)
    lo = (idx > 2) & (idx < len(rr) - 3)
    ok = inside & lo
    thr = np.zeros_like(strength)
    for grp in (night, ~night):
        sel = ok & grp
        if sel.any():
            thr[grp] = np.percentile(strength[sel], hint.get("strengthPct", 20))
    ok &= strength > thr
    return px[ok], py[ok], thetas[ok]


def fit_cone(cam0, px, py, guess):
    rays = cam0.rays_cam(px, py)
    cx, cy, r = guess
    d0 = cam0.rays_cam(np.array([cx]), np.array([cy]))[0]
    a0 = math.atan(r / cam0.f)

    def unpack(p):
        az, el, a = p
        d = np.array([math.cos(el) * math.sin(az), math.sin(el), -math.cos(el) * math.cos(az)])
        return d, a

    p0 = [math.atan2(d0[0], -d0[2]), math.asin(d0[1]), a0]

    def res(p):
        d, a = unpack(p)
        return (np.arccos(np.clip(rays @ d, -1, 1)) - a) * cam0.f

    sol = least_squares(res, p0, loss="soft_l1", f_scale=1.5)
    for _ in range(2):
        rv = res(sol.x)
        keep = np.abs(rv) < max(3.0, 3 * np.median(np.abs(rv)))
        rays = rays[keep]
        px, py = px[keep], py[keep]
        sol = least_squares(res, sol.x, loss="soft_l1", f_scale=1.0)
    d, a = unpack(sol.x)
    rv = res(sol.x)
    return d, a, rv, px, py


def fit_circle(px, py):
    A = np.stack([px, py, np.ones_like(px)], axis=1)
    b = px * px + py * py
    c, *_ = np.linalg.lstsq(A, b, rcond=None)
    cx, cy = c[0] / 2, c[1] / 2
    r = math.sqrt(c[2] + cx * cx + cy * cy)
    return cx, cy, r


def limb_residual_px(cam, body, px, py):
    rays = cam.rays_world(px, py)
    o = body.Minv @ cam.pos
    d = normalize(rays @ body.Minv.T)
    on = np.linalg.norm(o)
    ang = np.arccos(np.clip(d @ (-o / on), -1, 1))
    return (ang - math.asin(1 / on)) * cam.f


def fit_spheroid(cam, px, py, north, b0, fix_b=False):
    def make(p):
        c = Camera(cam.w, cam.h, cam.vfov, p[:3])
        G = globe_from_pole(c, north, 0)
        return c, Body(G, b0 if fix_b else p[3])

    def res(p):
        c, body = make(p)
        return limb_residual_px(c, body, px, py)

    p0 = list(cam.pos) + ([] if fix_b else [b0])
    sol = least_squares(res, p0, loss="soft_l1", f_scale=1.0, x_scale="jac")
    keep = np.ones(len(px), bool)
    for _ in range(2):
        rv = res(sol.x)
        keep = np.abs(rv) < max(3.0, 3 * np.median(np.abs(rv)))
        px, py = px[keep], py[keep]
        sol = least_squares(res, sol.x, loss="soft_l1", f_scale=1.0, x_scale="jac")
    c, body = make(sol.x)
    return c, body.b, res(sol.x), px, py


def silhouette_points(cam, body, step=1):
    ys, xs = np.mgrid[0:cam.h:step, 0:cam.w:step]
    xs = xs + 0.5
    ys = ys + 0.5
    rays = cam.rays_world(xs.ravel(), ys.ravel())
    o = body.Minv @ cam.pos
    d = normalize(rays @ body.Minv.T)
    on = np.linalg.norm(o)
    f = (np.arccos(np.clip(d @ (-o / on), -1, 1)) - math.asin(1 / on)).reshape(xs.shape)
    pts = []
    sc = np.sign(f)
    r, c = np.where(sc[:, :-1] != sc[:, 1:])
    t = f[r, c] / (f[r, c] - f[r, c + 1])
    pts.append(np.stack([xs[r, c] + t * step, ys[r, c]], 1))
    r, c = np.where(sc[:-1, :] != sc[1:, :])
    t = f[r, c] / (f[r, c] - f[r + 1, c])
    pts.append(np.stack([xs[r, c], ys[r, c] + t * step], 1))
    return np.concatenate(pts, 0)


def sphere_hits(cam, body, step):
    ys, xs = np.mgrid[step / 2:cam.h:step, step / 2:cam.w:step]
    rays = cam.rays_world(xs.ravel(), ys.ravel())
    hit, t, y, n = body.intersect(cam.pos, rays)
    return xs.ravel(), ys.ravel(), rays, hit, n


def screen_basis(cam):
    w = normalize(cam.pos)
    up = np.array([0.0, 1.0, 0.0]) @ cam.R.T
    up = normalize(up - (up @ w) * w)
    right = np.cross(up, w)
    return w, up, right


def pole_from_angles(cam, pa_deg, sublat_deg):
    w, up, right = screen_basis(cam)
    pa, sl = math.radians(pa_deg), math.radians(sublat_deg)
    t = math.cos(pa) * up + math.sin(pa) * right
    return normalize(math.cos(sl) * t + math.sin(sl) * w)


def globe_from_pole(cam, north, sublon_deg):
    w = normalize(cam.pos)
    n = normalize(north)
    e = normalize(w - (w @ n) * n)
    a = -math.radians(sublon_deg)
    z = e * math.cos(a) + np.cross(n, e) * math.sin(a) + n * (n @ e) * (1 - math.cos(a))
    x = np.cross(n, z)
    return np.stack([x, n, z], axis=1)


def kabsch(local, world):
    H = local.T @ world
    U, S, Vt = np.linalg.svd(H)
    d = np.sign(np.linalg.det(Vt.T @ U.T))
    D = np.diag([1, 1, d])
    return Vt.T @ D @ U.T


def image_points_to_world(cam, body, pts):
    pts = np.asarray(pts, dtype=np.float64)
    rays = cam.rays_world(pts[:, 0], pts[:, 1])
    hit, t, y, n = body.intersect(cam.pos, rays)
    if not hit.all():
        bad = np.where(~hit)[0]
        raise SystemExit(f"landmarks off the disc: {pts[bad].tolist()}")
    return cam.pos + rays * t[:, None]


def ring_edge_points(img, spec):
    if "points" in spec:
        pts = np.asarray(spec["points"], dtype=np.float64)
        if spec.get("refine"):
            pts = refine_ridge(img, pts, spec["refine"])
        return pts
    lum = cv2.GaussianBlur(luminance(img), (0, 0), 2.0)
    m = (lum > spec["threshold"]).astype(np.uint8)
    mode = cv2.RETR_EXTERNAL if spec.get("mode", "external") == "external" else cv2.RETR_CCOMP
    cnts, hier = cv2.findContours(m, mode, cv2.CHAIN_APPROX_NONE)
    h, w = m.shape
    out = []
    off = spec.get("probe", 6)
    for i, c in enumerate(cnts):
        if spec.get("mode") == "holes" and hier[0][i][3] < 0:
            continue
        if len(c) < spec.get("minLen", 200):
            continue
        c = c[:, 0, :].astype(np.float64)
        for x0, y0, x1, y1, side in spec["boxes"]:
            sel = (c[:, 0] >= x0) & (c[:, 0] < x1) & (c[:, 1] >= y0) & (c[:, 1] < y1)
            q = c[sel]
            if not len(q):
                continue
            ok = (q[:, 0] > 8) & (q[:, 0] < w - 9) & (q[:, 1] > 8) & (q[:, 1] < h - 9)
            q = q[ok]
            if side in ("out", "in"):
                v = q - np.asarray(spec["center"], dtype=np.float64)
                v /= np.linalg.norm(v, axis=1, keepdims=True)
                dx, dy = (v[:, 0], v[:, 1]) if side == "out" else (-v[:, 0], -v[:, 1])
            elif side != "any":
                dx, dy = {"up": (0, -1), "down": (0, 1), "left": (-1, 0), "right": (1, 0)}[side]
            if side != "any":
                xi = np.clip((q[:, 0] + dx * off).astype(int), 0, w - 1)
                yi = np.clip((q[:, 1] + dy * off).astype(int), 0, h - 1)
                xo = np.clip((q[:, 0] - dx * 6).astype(int), 0, w - 1)
                yo = np.clip((q[:, 1] - dy * 6).astype(int), 0, h - 1)
                q = q[(m[yi, xi] == 0) & (m[yo, xo] == 1)]
            for ex in spec.get("exclude", []):
                q = q[~((q[:, 0] >= ex[0]) & (q[:, 0] < ex[2]) & (q[:, 1] >= ex[1]) & (q[:, 1] < ex[3]))]
            out.append(q)
    pts = np.concatenate(out, 0) if out else np.zeros((0, 2))
    return pts[:: spec.get("stride", 4)] + 0.5


def refine_ridge(img, pts, radius):
    lum = cv2.GaussianBlur(luminance(img), (0, 0), 1.0)
    out = []
    for x, y in pts:
        x0, y0 = int(round(x)), int(round(y))
        win = lum[y0 - radius:y0 + radius + 1, x0 - radius:x0 + radius + 1]
        j = np.unravel_index(np.argmax(win), win.shape)
        out.append([x0 - radius + j[1] + 0.5, y0 - radius + j[0] + 0.5])
    return np.asarray(out)


def ring_normal_from_ellipse(cam, pts):
    (ex, ey), (a, b), ang = cv2.fitEllipse(pts.astype(np.float32))
    major, minor = max(a, b), min(a, b)
    th = ang if a >= b else ang + 90.0
    th = (th + 90.0) % 180.0 - 90.0
    sublat = math.degrees(math.asin(np.clip(minor / major, 0, 1)))
    return pole_from_angles(cam, th, sublat), {"ellipseCenterPx": [round(ex, 2), round(ey, 2)],
                                                "ellipseAxesPx": [round(major, 2), round(minor, 2)],
                                                "poleAngleDeg": round(th, 3), "openingDeg": round(sublat, 3)}


def fit_rings(cam, edges, normal_guess, ellipse_edge=None):
    n0 = normalize(normal_guess)

    def unpack(p):
        az, el = p
        return np.array([math.cos(el) * math.sin(az), math.sin(el), math.cos(el) * math.cos(az)])

    p0 = [math.atan2(n0[0], n0[2]), math.asin(np.clip(n0[1], -1, 1))]

    def radii(n, pts):
        rays = cam.rays_world(pts[:, 0], pts[:, 1])
        t = ray_plane(cam.pos, rays, n)
        q = cam.pos + rays * t[:, None]
        return np.linalg.norm(q, axis=1)

    def res(p):
        n = unpack(p)
        out = []
        for pts in edges.values():
            rr = radii(n, pts)
            out.append((rr - np.median(rr)) / np.median(rr) * 1000)
        return np.concatenate(out)

    info = None
    if ellipse_edge:
        n, info = ring_normal_from_ellipse(cam, edges[ellipse_edge])
    else:
        sol = least_squares(res, p0, loss="soft_l1", f_scale=2.0)
        n = unpack(sol.x)
    if n @ n0 < 0:
        n = -n
    out = {"_ellipse": info} if info else {}
    for k, pts in edges.items():
        rr = radii(n, pts)
        out[k] = (float(np.median(rr)), float(rr.std()), int(len(rr)))
    return n, out


def ring_hit(origin, dirs, n, inner, outer):
    t = ray_plane(origin, dirs, n)
    q = origin + dirs * t[..., None]
    rr = np.linalg.norm(q, axis=-1)
    return (t > 0) & (rr >= inner) & (rr <= outer), t


def fit_moon(img, hint):
    cx, cy, r = hint["circle"]
    if hint.get("refine", True):
        sub = {"circle": [cx, cy, r], "searchFrac": hint.get("searchFrac", 0.3), "blur": hint.get("blur", 1.0),
               "arcs": hint.get("arcs", [[0, 360]]), "strengthPct": hint.get("strengthPct", 30),
               "nightArcs": hint.get("nightArcs", [])}
        px, py, _ = limb_points(img, sub)
        if len(px) > 20:
            for _ in range(3):
                cx2, cy2, r2 = fit_circle(px, py)
                dist = np.abs(np.hypot(px - cx2, py - cy2) - r2)
                keep = dist < max(1.5, 2.5 * np.median(dist))
                px, py = px[keep], py[keep]
            cx, cy, r = fit_circle(px, py)
    return float(cx), float(cy), float(r)


def moon_world(cam, cx, cy, r, hint):
    ray = cam.rays_world(np.array([cx]), np.array([cy]))[0]
    edge = cam.rays_world(np.array([cx + r]), np.array([cy]))[0]
    ang = math.acos(np.clip(ray @ edge, -1, 1))
    if "depth" in hint:
        t = hint["depth"]
    else:
        R = hint["orbitRadius"]
        b = ray @ cam.pos
        c = cam.pos @ cam.pos - R * R
        disc = b * b - c
        if disc < 0:
            t = -b
        else:
            t = -b + math.sqrt(disc) if hint.get("side", "back") == "back" else -b - math.sqrt(disc)
    pos = cam.pos + ray * t
    return pos, t * math.sin(ang), t


def shadow_center(cam, body, mpos, s):
    hit, t, y, n = body.intersect(mpos, -s[None, :])
    p = mpos - s * t[0]
    x, yy, _ = cam.project(p[None, :])
    return x[0], yy[0], bool(hit[0])


def unit_from_angles(az, el):
    return np.array([math.cos(el) * math.sin(az), math.sin(el), math.cos(el) * math.cos(az)])


def fit_sun_dir(img, cam, body, hint, extra_mask):
    step = 4
    xs, ys, rays, hit, n = sphere_hits(cam, body, step)
    view_cos = -(rays * n).sum(1)
    lum = cv2.GaussianBlur(luminance(img), (0, 0), 2.0)
    L = map_coordinates(lum, [ys - 0.5, xs - 0.5], order=1)
    em = map_coordinates(extra_mask.astype(np.float32), [ys - 0.5, xs - 0.5], order=0) > 0.5
    use = hit & (view_cos > hint.get("minViewCos", 0.3)) & ~em
    n = n[use]
    L = L[use]
    gx = (xs[use] // step).astype(int)
    gy = (ys[use] // step).astype(int)
    lo, hi = np.percentile(L, 3), np.percentile(L, 95)
    lit = L > lo + hint.get("terminatorLevel", 0.35) * (hi - lo)
    grid = np.zeros((cam.h // step + 1, cam.w // step + 1), np.uint8)
    grid[gy, gx] = np.where(lit, 2, 1)
    er = cv2.erode((grid > 0).astype(np.uint8), np.ones((5, 5), np.uint8))
    edge = (cv2.morphologyEx((grid == 2).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0) & (er > 0)
    nt = n[edge[gy, gx]]
    wt = hint.get("terminatorWeight", 0.3)
    gamma = hint.get("shadeGamma", 1.0)

    def model(q, nn):
        return q[3] + q[2] * np.maximum(nn @ unit_from_angles(q[0], q[1]), 0) ** gamma

    def res(q):
        r1 = model(q, n) - L
        r2 = (nt @ unit_from_angles(q[0], q[1])) * wt if len(nt) else np.zeros(0)
        return np.concatenate([r1, r2])

    best = None
    for az in np.radians(np.arange(-180, 180, 45)):
        for el in np.radians([-50, -15, 15, 50]):
            sol = least_squares(res, [az, el, hi - lo, lo], loss="soft_l1", f_scale=0.05)
            if best is None or sol.cost < best.cost:
                best = sol
    s = unit_from_angles(best.x[0], best.x[1])
    r1 = model(best.x, n) - L
    r2 = nt @ s if len(nt) else np.zeros(1)
    return s, {
        "model": "luminance = ambient + gain * max(0, n.s), soft L1, plus n.s = 0 on the detected terminator",
        "shadingRms": float(np.sqrt(np.mean(r1 ** 2))),
        "terminatorRmsDeg": float(np.degrees(np.sqrt(np.mean(np.arcsin(np.clip(r2, -1, 1)) ** 2)))),
        "terminatorSamples": int(len(nt)),
        "discSamples": int(len(L)),
        "gain": float(best.x[2]), "ambient": float(best.x[3]),
    }


def bright_centroid(img, hint):
    cx, cy = hint["near"]
    rad = hint.get("radius", 40)
    lum = luminance(img)
    h, w = lum.shape
    ys, xs = np.mgrid[0:h, 0:w]
    m = (np.hypot(xs - cx, ys - cy) < rad) & (lum > hint.get("threshold", 0.95))
    return float(xs[m].mean() + 0.5), float(ys[m].mean() + 0.5), int(m.sum())


def draw_curve(canvas, cam, body, lon, lat, color, thick=1):
    y = lonlat_to_local(lon, lat)
    p, n, cosv = body.visible(cam, y)
    x, yy, _ = cam.project(p)
    for i in range(len(lon) - 1):
        if cosv[i] > 0 and cosv[i + 1] > 0:
            cv2.line(canvas, (int(x[i]), int(yy[i])), (int(x[i + 1]), int(yy[i + 1])), color, thick)


def overlay(img, cam, body, fit, limb_px, limb_py, path, extra_pts=None):
    canvas = (np.clip(img, 0, 1) * 255).astype(np.uint8).copy()
    sil = silhouette_points(cam, body, 2)
    for X, Y in sil[::3]:
        cv2.circle(canvas, (int(X), int(Y)), 2, (0, 255, 0), -1)
    for X, Y in zip(limb_px[::4], limb_py[::4]):
        cv2.circle(canvas, (int(X), int(Y)), 2, (255, 0, 255), -1)
    for lat in range(-60, 90, 30):
        lon = np.linspace(-180, 180, 721)
        draw_curve(canvas, cam, body, lon, np.full_like(lon, lat), (255, 80, 0) if lat == 0 else (255, 255, 0))
    for lon in range(-180, 180, 30):
        lat = np.linspace(-90, 90, 361)
        draw_curve(canvas, cam, body, np.full_like(lat, lon), lat, (255, 80, 0) if lon == 0 else (255, 255, 0))
    npole = body.M @ np.array([0, 1.0, 0])
    x, y, _ = cam.project(np.array([npole * 1.25]))
    cv2.putText(canvas, "N", (int(x[0]), int(y[0])), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 3)
    if fit.get("sunDir"):
        s = np.array(fit["sunDir"])
        e1 = normalize(np.cross(s, [0.3, 1, 0.1]))
        e2 = np.cross(s, e1)
        th = np.linspace(0, 2 * math.pi, 1000)
        tp = np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2
        yloc = normalize(tp @ body.Minv.T)
        lon, lat = local_to_lonlat(yloc)
        draw_curve(canvas, cam, body, lon, lat, (255, 0, 0), 3)
        x, y, _ = cam.project(np.array([s * 1.2]))
        cv2.circle(canvas, (int(x[0]), int(y[0])), 12, (255, 0, 0), 3)
    for m in fit.get("moons", []):
        cv2.circle(canvas, (int(m["cx"]), int(m["cy"])), int(m["r"]), (0, 255, 255), 2)
        if "shadowPx" in m:
            cv2.circle(canvas, (int(m["shadowPx"][0]), int(m["shadowPx"][1])), 10, (0, 255, 255), 3)
    if fit.get("rings"):
        rg = fit["rings"]
        n = np.array(rg["normal"])
        e1 = normalize(np.cross(n, [1, 0, 0.2]))
        e2 = np.cross(n, e1)
        th = np.linspace(0, 2 * math.pi, 3000)
        for rad in [v["radius"] for v in rg["edges"].values()]:
            q = rad * (np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2)
            x, y, z = cam.project(q)
            cv2.polylines(canvas, [np.stack([x, y], 1).astype(np.int32)], True, (255, 128, 255), 2)
    if extra_pts is not None:
        for X, Y in extra_pts:
            cv2.circle(canvas, (int(X), int(Y)), 4, (255, 255, 255), -1)
    if fit.get("sunInFrame"):
        sf = fit["sunInFrame"]
        cv2.drawMarker(canvas, (int(sf["cx"]), int(sf["cy"])), (255, 0, 0), cv2.MARKER_CROSS, 60, 4)
    save_rgb(path, downsize(canvas.astype(np.float32) / 255, 1400), quality=88)


def r6(v):
    return [round(float(x), 6) for x in v]


def run(stop, vfov, silhouette_only=False):
    hint = HINTS[stop]
    img = load_hero(stop)
    h, w = img.shape[:2]
    cam0 = Camera(w, h, vfov, [0, 0, 0])
    px, py, _ = limb_points(img, hint)
    if "limbPoints" in hint:
        lp = np.asarray(hint["limbPoints"], dtype=np.float64)
        rep = hint.get("limbPointsWeight", 20)
        px = np.concatenate([px, np.repeat(lp[:, 0], rep)])
        py = np.concatenate([py, np.repeat(lp[:, 1], rep)])
    d, a, rv, px, py = fit_cone(cam0, px, py, hint["circle"])
    cam = Camera(w, h, vfov, (-d / math.sin(a)).tolist())
    body = Body()
    ccx, ccy, cr = fit_circle(px, py)
    g = hint.get("globe", {"poleAngleDeg": 0, "subLatDeg": 0, "subLonDeg": 0})

    rings = None
    edges = None
    edge_pts = None

    def do_rings(cam_):
        pts = {k: ring_edge_points(img, spec) for k, spec in hint["rings"]["edges"].items()}
        n, e = fit_rings(cam_, pts, hint["rings"].get("normalGuess", [0, 1, 0.3]), hint["rings"].get("ellipseEdge"))
        return n, e, pts

    if "rings" in hint and not silhouette_only:
        n, edges, edge_pts = do_rings(cam)

    def pole(cam_):
        if g.get("poleFromRings") and edges is not None:
            return n.copy(), "pole from ring normal"
        return pole_from_angles(cam_, g["poleAngleDeg"], g["subLatDeg"]), "pole angle and sub-camera latitude"

    polar = 1.0
    if "oblate" in hint and not silhouette_only:
        north, _ = pole(cam)
        cam, polar, rv, px, py = fit_spheroid(cam, px, py, north, hint["oblate"].get("polar", 0.9),
                                              fix_b=hint["oblate"].get("fixed", False))
        if "rings" in hint:
            n, edges, edge_pts = do_rings(cam)
        north, _ = pole(cam)
        cam, polar, rv, px, py = fit_spheroid(cam, px, py, north, polar, fix_b=hint["oblate"].get("fixed", False))
        if "rings" in hint:
            n, edges, edge_pts = do_rings(cam)
    north, pole_method = pole(cam)
    body = Body(globe_from_pole(cam, north, 0), polar)
    rv = limb_residual_px(cam, body, px, py)
    sectors = sector_residuals_body(cam, body, img, hint)

    pcx, pcy, _ = cam.project(np.zeros((1, 3)))
    dist = float(np.linalg.norm(cam.pos))
    fit = {
        "stop": stop,
        "imageSize": [w, h],
        "vfovDeg": vfov,
        "aspect": w / h,
        "circle": {"cx": round(float(ccx), 2), "cy": round(float(ccy), 2), "r": round(float(cr), 2)},
        "silhouette": {
            "model": "perspective sphere fitted on limb rays" if polar == 1.0 else "perspective oblate spheroid fitted on limb rays",
            "bodyCenterPx": [round(float(pcx[0]), 2), round(float(pcy[0]), 2)],
            "angularRadiusDeg": round(math.degrees(math.asin(1 / dist)), 5),
            "distance": round(dist, 6),
            "limbPoints": int(len(px)),
            "residualRmsPx": round(float(np.sqrt(np.mean(rv ** 2))), 3),
            "residualMedianAbsPx": round(float(np.median(np.abs(rv))), 3),
            "sectorMedianResidualPx": sectors,
            "note": hint.get("silhouetteNote", ""),
        },
        "camera": {"position": r6(cam.pos), "quaternion": [0, 0, 0, 1], "up": [0, 1, 0],
                   "note": "three.js PerspectiveCamera, looks down local -Z; identity rotation, so world axes are the camera axes and world +Y is image up"},
    }
    if silhouette_only:
        print(stop, fit["circle"], fit["silhouette"]["residualRmsPx"], sectors)
        fit_path(stop).parent.mkdir(parents=True, exist_ok=True)
        fit_path(stop).write_text(json.dumps(fit, indent=2) + "\n")
        return None

    if edges is not None:
        rs = hint["rings"]
        rings = {"normal": r6(n),
                 "inner": round(edges[rs["innerEdge"]][0], 4),
                 "outer": round(edges[rs["outerEdge"]][0], 4),
                 "edges": {k: {"radius": round(v[0], 4), "std": round(v[1], 5), "points": v[2]} for k, v in edges.items() if k != "_ellipse"},
                 "normalMethod": "ellipse" if edges.get("_ellipse") else "perspective circle",
                 "ellipse": edges.get("_ellipse"),
                 "note": rs.get("note", "")}
        fit["rings"] = rings

    moon_fits = [(mh, *fit_moon(img, mh)) for mh in hint.get("moons", [])]

    yy, xx = np.mgrid[0:h, 0:w]
    excl = np.zeros((h, w), bool)
    for mh, cx, cy, r in moon_fits:
        excl |= np.hypot(xx - cx, yy - cy) < r * 1.15 + 4
        if "shadow" in mh:
            sx, sy = mh["shadow"]
            excl |= np.hypot(xx - sx, yy - sy) < r * 1.8
    for ex_cx, ex_cy, ex_r in hint.get("shadeExclude", []):
        excl |= np.hypot(xx - ex_cx, yy - ex_cy) < ex_r
    rays_all = cam.rays_world(xx.ravel() + 0.5, yy.ravel() + 0.5)
    sh, st, sy_, sn = body.intersect(cam.pos, rays_all)
    if rings:
        rh, rt = ring_hit(cam.pos, rays_all, np.array(rings["normal"]), rings["inner"], rings["outer"])
        excl |= (rh & (~sh | (rt < st))).reshape(h, w)

    if hint.get("kind") == "star":
        s = None
        sun_stats = {"note": "the Sun is the light; sunDir is not defined"}
    else:
        s, sun_stats = fit_sun_dir(img, cam, body, hint, excl)
        if rings:
            p = cam.pos + rays_all * st[:, None]
            shad, _ = ring_hit(p, np.broadcast_to(s, p.shape), np.array(rings["normal"]), rings["inner"], rings["outer"])
            excl2 = excl | (sh & shad).reshape(h, w)
            s, sun_stats = fit_sun_dir(img, cam, body, hint, excl2)
        if "sunDirOverride" in hint:
            sun_stats["fittedSunDir"] = r6(s)
            s = normalize(hint["sunDirOverride"])
            sun_stats["override"] = hint.get("sunDirOverrideNote", True)
    del rays_all, sh, st, sy_, sn
    fit["sunDir"] = None if s is None else r6(s)
    fit["sunFit"] = {k: (round(v, 5) if isinstance(v, float) else v) for k, v in sun_stats.items()}

    moons = []
    for mh, cx, cy, r in moon_fits:
        entry = {"id": mh["id"], "cx": round(cx, 2), "cy": round(cy, 2), "r": round(r, 2)}
        ray = cam.rays_world(np.array([cx]), np.array([cy]))[0]
        edge = cam.rays_world(np.array([cx + r]), np.array([cy]))[0]
        ang = math.acos(np.clip(ray @ edge, -1, 1))
        if "shadow" in mh and s is not None:
            target = np.array(mh["shadow"], dtype=np.float64)

            def err(t):
                x, y, ok = shadow_center(cam, body, cam.pos + ray * t, s)
                return np.hypot(x - target[0], y - target[1]) if ok else 1e6

            ts = np.linspace(0.3, dist - 0.5, 400)
            t0 = ts[int(np.argmin([err(t) for t in ts]))]
            t = minimize_scalar(err, bounds=(max(0.2, t0 - 0.05), t0 + 0.05), method="bounded").x
            pos = cam.pos + ray * t
            rad = t * math.sin(ang)
            x, y, _ = shadow_center(cam, body, pos, s)
            entry["shadowPx"] = [round(float(x), 2), round(float(y), 2)]
            entry["shadowHintPx"] = mh["shadow"]
            entry["depthFrom"] = "solved so the shadow centre lands on the shadow in the image"
        else:
            pos, rad, t = moon_world(cam, cx, cy, r, mh)
            entry["depthFrom"] = "depth hint" if "depth" in mh else f"orbit radius {mh['orbitRadius']} body radii, {mh.get('side', 'back')} side"
        entry["position"] = r6(pos)
        entry["radius"] = round(float(rad), 6)
        entry["distanceFromCamera"] = round(float(t), 5)
        entry["distanceFromBody"] = round(float(np.linalg.norm(pos)), 5)
        moons.append(entry)
    fit["moons"] = moons

    extra = {}
    if "landmarks" in g:
        lm = g["landmarks"]
        wpts = image_points_to_world(cam, body, [l["px"] for l in lm])
        lpts = lonlat_to_local(np.array([l["lon"] for l in lm]), np.array([l["lat"] for l in lm]))
        G = kabsch(lpts, normalize(wpts))
        errs = np.degrees(np.arccos(np.clip(((lpts @ G.T) * normalize(wpts)).sum(1), -1, 1)))
        pole_method = "fitted to named landmarks (least squares rotation)"
        extra = {"landmarkErrDeg": {l["name"]: round(float(e), 2) for l, e in zip(lm, errs)},
                 "landmarkRmsDeg": round(float(np.sqrt(np.mean(errs ** 2))), 2)}
    else:
        G = globe_from_pole(cam, north, g.get("subLonDeg", 0))
    body = Body(G, polar)
    sub = normalize(body.Minv @ cam.pos)
    slon, slat = local_to_lonlat(sub)
    fit["globe"] = {
        "quaternion": [round(float(v), 7) for v in mat_to_quat(G)],
        "meshQuaternionForThreeSphereGeometry": [round(float(v), 7) for v in mat_to_quat(G @ THREE_SPHERE_TO_LOCAL)],
        "scale": [1.0, round(polar, 5), 1.0],
        "northPole": r6(G[:, 1]),
        "subCameraLonDeg": round(float(slon), 3),
        "subCameraLatDeg": round(float(slat), 3),
        "method": pole_method,
        "note": g.get("note", ""),
        **extra,
    }
    if s is not None:
        lo, la = local_to_lonlat(normalize(G.T @ s))
        fit["globe"]["subSolarLonDeg"] = round(float(lo), 3)
        fit["globe"]["subSolarLatDeg"] = round(float(la), 3)
    if rings:
        fit["rings"]["poleToRingNormalDeg"] = round(float(np.degrees(np.arccos(abs(np.clip(G[:, 1] @ np.array(rings["normal"]), -1, 1))))), 3)

    if "sunInFrame" in hint:
        sfh = hint["sunInFrame"]
        if "circleFit" in sfh:
            cf = sfh["circleFit"]
            qx, qy, _ = limb_points(img, {"circle": cf["circle"], "searchFrac": cf.get("searchFrac", 0.15),
                                          "arcs": cf["arcs"], "blur": 3.0, "strengthPct": 20})
            sx, sy, sr = fit_circle(qx, qy)
            fit["sunInFrame"] = {"cx": round(float(sx), 2), "cy": round(float(sy), 2), "r": round(float(sr), 2),
                                 "method": "circle fit on the edge of the bright disc"}
        else:
            sx, sy, npx = bright_centroid(img, sfh)
            fit["sunInFrame"] = {"cx": round(sx, 2), "cy": round(sy, 2), "method": f"centroid of {npx} saturated pixels"}
        ray = cam.rays_world(np.array([fit["sunInFrame"]["cx"]]), np.array([fit["sunInFrame"]["cy"]]))[0]
        fit["sunInFrame"]["directionFromCamera"] = r6(ray)
        if s is not None:
            fit["sunInFrame"]["angleToSunDirDeg"] = round(float(np.degrees(np.arccos(np.clip(ray @ s, -1, 1)))), 3)

    fit["unproject"] = hint.get("unproject", {})
    fit["conventions"] = {
        "globeLocal": "direction of (lon, lat) is (cos(lat) sin(lon), sin(lat), cos(lat) cos(lon)); lon 0 lat 0 is local +Z; world = quaternion * (scale * local)",
        "map": "equirectangular, u = lon/360 + 0.5, v = lat/180 + 0.5, north at the top",
        "threeSphereGeometry": "SphereGeometry puts u at (-cos(2 pi u) sin(theta), cos(theta), sin(2 pi u) sin(theta)): u = 0.5 is +X and east runs counterclockwise about +Y seen from the north, the same handedness as the local frame above. The map is not mirrored and needs no flip; it is only turned 90 degrees about Y, so on a SphereGeometry mesh use meshQuaternionForThreeSphereGeometry (globe.quaternion times a -90 degree turn about Y) and globe.scale",
    }
    out = fit_path(stop)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(fit, indent=2) + "\n")
    allpts = np.concatenate(list(edge_pts.values())) if edge_pts else None
    overlay(img, cam, body, fit, px, py, work_dir(stop) / "fit-overlay.jpg", allpts)
    return fit


def sector_residuals_body(cam, body, img, hint):
    sub = dict(hint)
    sub.pop("excludeArcs", None)
    sub["arcs"] = [[0, 360]]
    sub["strengthPct"] = 0
    px, py, th = limb_points(img, sub)
    rv = limb_residual_px(cam, body, px, py)
    out = {}
    for s0 in range(0, 360, 30):
        m = (th >= s0) & (th < s0 + 30)
        if m.sum() > 10:
            out[str(s0)] = round(float(np.median(rv[m])), 2)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stop", required=True)
    ap.add_argument("--vfov", type=float, default=30.0)
    ap.add_argument("--silhouette-only", action="store_true")
    a = ap.parse_args()
    stops = list(HINTS) if a.stop == "all" else a.stop.split(",")
    for s in stops:
        f = run(s, a.vfov, a.silhouette_only)
        if f is None:
            continue
        si = f["silhouette"]
        print(s, "rms", si["residualRmsPx"], "b", f["globe"]["scale"][1], "sun", f["sunDir"], f["sunFit"].get("shadingRms"),
              "sub", f["globe"]["subCameraLonDeg"], f["globe"]["subCameraLatDeg"], "rings", f.get("rings", {}).get("edges"))


if __name__ == "__main__":
    main()
