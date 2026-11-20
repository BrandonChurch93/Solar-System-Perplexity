import argparse
import time

import cv2
import numpy as np

from common import (CONFIG, HINTS, body_from_fit, camera_from_fit, load_fit, load_hero, lonlat_to_local,
                    normalize, stop_ids, work_dir)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def ring_hit(origin, dirs, n, inner, outer):
    den = dirs @ n
    with np.errstate(divide="ignore", invalid="ignore"):
        t = -(origin @ n) / den
    q = origin + dirs * t[..., None]
    rr = np.linalg.norm(q, axis=-1)
    return (t > 1e-6) & (rr >= inner) & (rr <= outer), t


class Mapper:
    def __init__(self, stop):
        self.fit = load_fit(stop)
        self.hint = HINTS.get(stop, {})
        self.img = load_hero(stop)
        self.cam = camera_from_fit(self.fit)
        self.body = body_from_fit(self.fit)
        up = self.fit.get("unproject", {})
        self.c0 = up.get("featherStartCos", 0.12)
        self.c1 = up.get("featherEndCos", 0.35)
        self.margin = up.get("moonMarginPx", 4)
        self.ellipses = up.get("maskEllipsesPx", [])
        self.fill_gain = up.get("fillAlphaGain", 5.0)
        self.sub = normalize(self.body.Minv @ self.cam.pos)
        self.s = None if self.fit.get("sunDir") is None else np.asarray(self.fit["sunDir"], dtype=np.float64)
        self.rings = self.fit.get("rings")
        self.src = np.ascontiguousarray(self.img[..., ::-1])

    def sample(self, y):
        p, n, cosv = self.body.visible(self.cam, y)
        px, py, z = self.cam.project(p)
        h, w = self.img.shape[:2]
        inside = (px >= 0.5) & (px <= w - 0.5) & (py >= 0.5) & (py <= h - 0.5) & (z > 0)
        a = np.clip(cosv, 0, 1) * smoothstep(self.c0, self.c1, cosv) * inside
        mx = (px - 0.5).astype(np.float32)
        my = (py - 0.5).astype(np.float32)
        col = cv2.remap(self.src, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)[..., ::-1]
        col = np.clip(col, 0, 1)
        m = self.cover(p, px, py)
        lit = np.ones(a.shape) if self.s is None else np.clip((n @ self.s) * 3, 0, 1)
        return col, a.astype(np.float32), m, lit

    def cover(self, p, px, py):
        m = np.zeros(px.shape, dtype=bool)
        for mo in self.fit.get("moons", []):
            m |= np.hypot(px - mo["cx"], py - mo["cy"]) < mo["r"] + self.margin
        for cx, cy, a, b, ang in self.ellipses:
            t = np.radians(ang)
            dx, dy = px - cx, py - cy
            u = dx * np.cos(t) + dy * np.sin(t)
            v = -dx * np.sin(t) + dy * np.cos(t)
            m |= (u / a) ** 2 + (v / b) ** 2 < 1
        if self.rings:
            n = np.asarray(self.rings["normal"], dtype=np.float64)
            lo, hi = self.rings["inner"], self.rings["outer"]
            d = p - self.cam.pos
            dist = np.linalg.norm(d, axis=-1)
            d = d / dist[..., None]
            hit, t = ring_hit(np.broadcast_to(self.cam.pos, p.shape), d, n, lo, hi)
            m |= hit & (t < dist)
            if self.s is not None:
                sh, _ = ring_hit(p + self.s * 1e-4, np.broadcast_to(self.s, p.shape), n, lo, hi)
                m |= sh
        return m


def push_pull(P, W, levels=12):
    stack = [(P, W)]
    for _ in range(levels):
        p, w = stack[-1]
        if min(w.shape) < 4:
            break
        stack.append((cv2.resize(p, (w.shape[1] // 2, w.shape[0] // 2), interpolation=cv2.INTER_AREA),
                      cv2.resize(w, (w.shape[1] // 2, w.shape[0] // 2), interpolation=cv2.INTER_AREA)))
    p, w = stack[-1]
    fill = p / np.maximum(w, 1e-6)[..., None]
    for p, w in reversed(stack[:-1]):
        up = cv2.resize(fill, (w.shape[1], w.shape[0]), interpolation=cv2.INTER_LINEAR)
        k = np.clip(w * 4, 0, 1)[..., None]
        fill = (p / np.maximum(w, 1e-6)[..., None]) * k + up * (1 - k)
    return fill


def run(stop, width, tile_rows):
    t0 = time.time()
    mp = Mapper(stop)
    W, H = width, width // 2
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    mask = np.zeros((H, W), dtype=np.uint8)
    P = np.zeros((H, W, 3), dtype=np.float16)
    Wt = np.zeros((H, W), dtype=np.float16)
    rowP = np.zeros((H, 3))
    rowW = np.zeros(H)
    lon = (np.arange(W) + 0.5) / W * 360 - 180
    sub = mp.sub
    for j0 in range(0, H, tile_rows):
        j1 = min(H, j0 + tile_rows)
        lat = 90 - (np.arange(j0, j1) + 0.5) / H * 180
        LON, LAT = np.meshgrid(lon, lat)
        y = lonlat_to_local(LON, LAT)
        col, a, m, lit = mp.sample(y)
        ym = y - 2 * (y @ sub)[..., None] * sub
        colm, am, mm, _ = mp.sample(ym)
        a_eff = np.clip(a * mp.fill_gain, 0, 1) * (~m)
        am_eff = np.clip(am * mp.fill_gain, 0, 1) * (~mm)
        rgba[j0:j1, :, :3] = np.clip(col * 255 + 0.5, 0, 255).astype(np.uint8)
        rgba[j0:j1, :, 3] = np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)
        mask[j0:j1] = np.where(m & (a > 0), 255, 0).astype(np.uint8)
        P[j0:j1] = col * a_eff[..., None] + colm * (am_eff * (1 - a_eff))[..., None]
        Wt[j0:j1] = a_eff + am_eff * (1 - a_eff)
        wz = a_eff * lit
        rowP[j0:j1] = (col * wz[..., None]).sum(1)
        rowW[j0:j1] = wz.sum(1)
    t1 = time.time()
    lw = min(W, 1024)
    Plo = cv2.resize(P.astype(np.float32), (lw, lw // 2), interpolation=cv2.INTER_AREA)
    Wlo = cv2.resize(Wt.astype(np.float32), (lw, lw // 2), interpolation=cv2.INTER_AREA)
    fill_lo = push_pull(Plo, Wlo)
    if mp.fit.get("unproject", {}).get("fill", "pushPull") == "zonal":
        k = H // (lw // 2)
        rp = rowP.reshape(-1, k, 3).sum(1)
        rw = rowW.reshape(-1, k).sum(1)
        cov = np.clip(rw / (W / 64), 0, 1)[:, None]
        zonal = rp / np.maximum(rw, 1e-6)[:, None] * cov + fill_lo.mean(1) * (1 - cov)
        zonal = cv2.GaussianBlur(zonal[:, None, :].astype(np.float32), (1, 0), sigmaX=0.1, sigmaY=1.0)[:, 0, :]
        fill_lo = np.ascontiguousarray(np.broadcast_to(zonal[:, None, :], fill_lo.shape), dtype=np.float32)
    filled = np.zeros((H, W, 3), dtype=np.uint8)
    for j0 in range(0, H, tile_rows):
        j1 = min(H, j0 + tile_rows)
        fy = ((np.arange(j0, j1) + 0.5) / H * (lw // 2) - 0.5).astype(np.float32)
        fx = ((np.arange(W) + 0.5) / W * lw - 0.5).astype(np.float32)
        MX, MY = np.meshgrid(fx, fy)
        f = cv2.remap(fill_lo, MX, MY, cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)
        w = Wt[j0:j1].astype(np.float32)[..., None]
        out = P[j0:j1].astype(np.float32) + (1 - w) * f
        filled[j0:j1] = np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)
    d = work_dir(stop)
    paths = [d / f"map-{W}.png", d / f"map-filled-{W}.png", d / f"mask-{W}.png"]
    cv2.imwrite(str(paths[0]), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_PNG_COMPRESSION, 3])
    cv2.imwrite(str(paths[1]), cv2.cvtColor(filled, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_PNG_COMPRESSION, 3])
    cv2.imwrite(str(paths[2]), mask, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    t2 = time.time()
    seen = float((rgba[..., 3] > 0).mean())
    print(f"{stop} {W}x{H} seen {seen:.3f} sample {t1 - t0:.1f}s fill+write {t2 - t1:.1f}s total {t2 - t0:.1f}s")
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stop", required=True)
    ap.add_argument("--width", type=int, default=CONFIG["assetSets"]["web"]["wrapMapWidth"])
    ap.add_argument("--tile-rows", type=int, default=256)
    a = ap.parse_args()
    stops = stop_ids() if a.stop == "all" else a.stop.split(",")
    for s in stops:
        run(s, a.width, a.tile_rows)


if __name__ == "__main__":
    main()
