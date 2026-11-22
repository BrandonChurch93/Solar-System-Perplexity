import json
import sys

import cv2
import numpy as np
from scipy.optimize import least_squares

import geo

OUT = geo.ROOT / "src" / "stops" / "earth"
FILL = geo.WORK / "sky" / "fill-t1.png"
AURORA = (14.0, 78.0)
TOP = 0.6
LAYERS = 4
EPS = 0.003


def fields():
    hero = geo.decode(geo.read(geo.HERO)[..., :3].astype(np.float64))
    fill = geo.decode(geo.read(FILL)[..., :3].astype(np.float64))
    g = geo.hero_geometry(1)
    c = geo.FIT["circle"]
    py, px = np.mgrid[0:hero.shape[0], 0:hero.shape[1]].astype(np.float64) + 0.5
    pa = np.degrees(np.arctan2(px - c["cx"], -(py - c["cy"]))) % 360
    keep = (np.hypot(px - 2509, py - 226) > 95) & (px > 40) & (px < hero.shape[1] - 40) & (py > 30) & (py < hero.shape[0] - 30)
    return hero, fill, g["rt"].astype(np.float64) - 1, g["at"].astype(np.float64), pa, keep


def samples():
    hero, fill, h, at, pa, keep = fields()
    diff = hero - fill
    far = keep & (h > 0.3) & (pa > 80) & (pa < 170)
    offset = np.median(diff[far], axis=0)
    print("offset between hero and fill on the night side", offset.round(4))
    edges = np.concatenate([np.arange(0.004, 0.02, 0.002), np.arange(0.02, 0.08, 0.006), np.arange(0.08, 0.3, 0.02), np.arange(0.3, TOP + 0.01, 0.05)])
    rows = []
    for a0 in range(0, 360, 4):
        if AURORA[0] <= a0 < AURORA[1]:
            continue
        sect = keep & (pa >= a0) & (pa < a0 + 4)
        for lo, hi in zip(edges[:-1], edges[1:]):
            m = sect & (h >= lo) & (h < hi)
            if m.sum() < 40:
                continue
            rows.append((a0 + 2, 0.5 * (lo + hi), *at[m].mean(0), *(np.median(diff[m], axis=0) - offset)))
    line = []
    for a0 in range(0, 360, 4):
        sect = (pa >= a0) & (pa < a0 + 4)
        prof = []
        for r0 in np.arange(-0.012, 0.0081, 0.00075):
            m = sect & (h >= r0) & (h < r0 + 0.00075)
            prof.append((r0 + 0.000375, *np.median(hero[m], axis=0), *at[m].mean(0)) if m.sum() > 8 else (r0, 0, 0, 0, 0, 0, 1))
        prof = np.array(prof)
        k = (prof[:, 0] > -0.005) & (prof[:, 0] < 0.002)
        i = np.flatnonzero(k)[np.argmax(prof[k, 2])]
        inner = prof[(prof[:, 0] > -0.011) & (prof[:, 0] < -0.006), 1:4].mean(0)
        outer = prof[(prof[:, 0] > 0.0035) & (prof[:, 0] < 0.006), 1:4].mean(0)
        line.append((a0 + 2, prof[i, 0], *prof[i, 1:4], *inner, *outer, *prof[i, 4:7]))
    return np.array(rows), np.array(line)


MAP_W, MAP_H = 180, 64
RIM_ROWS = 8
RIM_BAND = (-0.011, -0.004)


def ratio_map(p, line_ratio):
    hero, fill, h, at, pa, keep = fields()
    diff = hero - fill
    far = keep & (h > 0.3) & (pa > 80) & (pa < 170)
    diff = diff - np.median(diff[far], axis=0)
    u = np.sqrt(np.clip(h / TOP, 0, 1)) * MAP_H
    col = (np.degrees(np.arctan2(at @ geo.CAM.R[:, 0], at @ geo.CAM.R[:, 1])) % 360) / 360 * MAP_W
    seen = np.zeros((MAP_H, MAP_W, 3))
    known = np.zeros((MAP_H, MAP_W), bool)
    centre = np.zeros((MAP_H, MAP_W, 3))
    iu = np.floor(u).astype(int)
    ic = np.floor(col).astype(int) % MAP_W
    ok = keep & (h > 0) & (iu < MAP_H)
    order = np.lexsort((ic[ok], iu[ok]))
    key = (iu[ok] * MAP_W + ic[ok])[order]
    vals = diff[ok][order]
    ats = at[ok][order]
    cuts = np.flatnonzero(np.diff(key)) + 1
    starts = np.concatenate([[0], cuts])
    ends = np.concatenate([cuts, [len(key)]])
    for a, b in zip(starts, ends):
        if b - a < 6:
            continue
        r, c = divmod(int(key[a]), MAP_W)
        seen[r, c] = np.median(vals[a:b], axis=0)
        centre[r, c] = ats[a:b].mean(0)
        known[r, c] = True
    hh = TOP * ((np.arange(MAP_H) + 0.5) / MAP_H) ** 2
    ang = np.radians((np.arange(MAP_W) + 0.5) * 360 / MAP_W)
    o = geo.SHAPE_INV @ geo.CAM.pos
    axis = o / np.linalg.norm(o)
    right, up = geo.CAM.R[:, 0], geo.CAM.R[:, 1]
    ring = np.sin(ang)[:, None] * right[None, :] + np.cos(ang)[:, None] * up[None, :]
    ring -= (ring @ axis)[:, None] * axis[None, :]
    ring /= np.linalg.norm(ring, axis=1, keepdims=True)
    tilt = 1 / np.linalg.norm(o)
    AT = ring * np.sqrt(1 - tilt * tilt) + axis[None, :] * tilt
    mod = np.stack([model(p, np.full(MAP_W, x), AT) for x in hh], 0)
    e = 0.0015
    ratio = (np.maximum(seen, 0) + e) / (mod + e)
    cols = (np.arange(MAP_W) + 0.5) * 360 / MAP_W
    bad = (cols >= AURORA[0]) & (cols < AURORA[1])
    known[:, bad] = False
    ratio[~known] = 1
    w = known.astype(np.float64)
    for _ in range(3):
        num = cv2.GaussianBlur(np.concatenate([ratio * w[..., None]] * 3, 1), (0, 0), sigmaX=2.5, sigmaY=1.5)[:, MAP_W:2 * MAP_W]
        den = cv2.GaussianBlur(np.concatenate([w] * 3, 1), (0, 0), sigmaX=2.5, sigmaY=1.5)[:, MAP_W:2 * MAP_W]
        filled = num / np.maximum(den, 1e-6)[..., None]
        ratio = np.where((w > 0)[..., None], ratio, np.where((den > 1e-3)[..., None], filled, 1))
        w = np.maximum(w, (den > 1e-3).astype(np.float64))
    lo_i, hi_i = np.flatnonzero(bad)[0] - 1, np.flatnonzero(bad)[-1] + 1
    for c in np.flatnonzero(bad):
        t = (c - lo_i) / (hi_i - lo_i)
        ratio[:, c] = ratio[:, lo_i] * (1 - t) + ratio[:, hi_i] * t
    ratio = cv2.GaussianBlur(np.concatenate([ratio] * 3, 1), (0, 0), sigmaX=1.5, sigmaY=1.0)[:, MAP_W:2 * MAP_W]
    ratio = np.clip(ratio, 0, 3.98)
    alpha = np.interp(cols, line_ratio[:, 0], line_ratio[:, 1], period=360)
    out = np.concatenate([ratio / 4, np.broadcast_to(np.clip(alpha / 4, 0, 1)[None, :, None], (MAP_H, MAP_W, 1))], -1)
    band = (h > RIM_BAND[0]) & (h < RIM_BAND[1])
    rim = np.zeros((MAP_W, 3))
    for c in range(MAP_W):
        m = band & (ic == c)
        rim[c] = np.median(hero[m], axis=0)
    pad = np.concatenate([rim[-8:], rim, rim[:8]], 0)
    rim = cv2.GaussianBlur(pad[None].astype(np.float64), (0, 0), sigmaX=1.2, sigmaY=0.01)[0, 8:-8]
    row = np.concatenate([np.sqrt(np.clip(rim / 4, 0, 1)), np.ones((MAP_W, 1))], -1)
    out = np.concatenate([out, np.broadcast_to(row[None], (RIM_ROWS, MAP_W, 4))], 0)
    img = np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)
    for key in ("full", "web"):
        cv2.imwrite(str(geo.ROOT / "public" / "assets" / "earth" / key / "air-glow.png"), img[..., [2, 1, 0, 3]])
    view = np.clip(np.concatenate([ratio / 2, geo.encode(np.maximum(seen, 0) * 4), geo.encode(mod * ratio * 4)], 0), 0, 1)
    geo.write(geo.WORK / "view" / "air-ratio.jpg", cv2.resize(view.astype(np.float32), (MAP_W * 4, MAP_H * 12), interpolation=cv2.INTER_NEAREST))
    print("ratio median", np.median(ratio[known], axis=0).round(3), "p5", np.percentile(ratio[known], 5).round(3), "p95", np.percentile(ratio[known], 95).round(3))


SECTOR = (2.0, 92.0)
TINT = (0.2, 1.0, 0.25)
OVER = 1.08
ENDS = (0.58, 0.64)
FAINT = (0.004, 0.03)
GONE = 0.44


def under(out=None):
    look = json.loads((OUT / "air.json").read_text())
    hero, fill, h, at, pa, keep = fields()
    tint = np.asarray(TINT)
    extra = np.maximum(hero[..., 1] - OVER * np.maximum(hero[..., 0], hero[..., 2]), 0) / (1 - OVER * tint[2])
    hero = hero - (extra * ((pa >= SECTOR[0]) & (pa < SECTOR[1]) & (np.abs(h) < 0.05)))[..., None] * tint
    dirv, lo = np.asarray(look["dir"]), look["dayFrom"]
    ratio = []
    for a0 in range(0, 360, 4):
        sect = (pa >= a0) & (pa < a0 + 4)
        prof = []
        for r0 in np.arange(-0.012, 0.0081, 0.00075):
            m = sect & (h >= r0) & (h < r0 + 0.00075)
            prof.append((r0 + 0.000375, *np.median(hero[m], axis=0), *at[m].mean(0)) if m.sum() > 8 else (r0, 0, 0, 0, 0, 0, 1))
        prof = np.array(prof)
        k = (prof[:, 0] > -0.005) & (prof[:, 0] < 0.002)
        i = np.flatnonzero(k)[np.argmax(prof[k, 2])]
        inner = prof[(prof[:, 0] > -0.011) & (prof[:, 0] < -0.006), 2].mean()
        outer = prof[(prof[:, 0] > 0.0035) & (prof[:, 0] < 0.006), 2].mean()
        x = float(day_factor(prof[i, 4:7], dirv, lo))
        want = look["line"][1] * x ** look["linePower"]
        ratio.append((a0 + 2, x, np.clip(max(prof[i, 2] - 0.5 * (inner + outer), 0) / max(want, 1e-6), FAINT[1], 3.0) if want > FAINT[0] else 1.0))
    ratio = np.array(ratio)
    lg = np.log(ratio[:, 2])
    lg = 0.25 * np.roll(lg, 1) + 0.5 * lg + 0.25 * np.roll(lg, -1)
    path = geo.ROOT / "public" / "assets" / "earth" / "full" / "air-glow.png"
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    cols = (np.arange(MAP_W) + 0.5) * 360 / MAP_W
    was = img[0, :, 3].astype(np.float64) / 255 * 4
    now = np.interp(cols, ratio[:, 0], np.exp(lg), period=360)
    lit = np.interp(cols, ratio[:, 0], ratio[:, 1], period=360)
    now = np.where(lit < GONE, np.minimum(now, 1.0), now)
    night = 1 - geo.smooth(ENDS[0], ENDS[1], lit)
    alpha = was * (1 - night) + now * night
    img[:MAP_H, :, 3] = np.clip(alpha / 4 * 255 + 0.5, 0, 255).astype(np.uint8)[None, :]
    ic = np.floor((np.degrees(np.arctan2(at @ geo.CAM.R[:, 0], at @ geo.CAM.R[:, 1])) % 360) / 360 * MAP_W).astype(int) % MAP_W
    band = (h > RIM_BAND[0]) & (h < RIM_BAND[1])
    rim = np.zeros((MAP_W, 3))
    for c in range(MAP_W):
        rim[c] = np.median(hero[band & (ic == c)], axis=0)
    inside = (cols >= SECTOR[0]) & (cols < SECTOR[1])
    calm = np.median(np.stack([np.roll(rim, 1, 0), rim, np.roll(rim, -1, 0)]), axis=0)
    rim = np.where(inside[:, None], calm, rim)
    pad = np.concatenate([rim[-8:], rim, rim[:8]], 0)
    rim = cv2.GaussianBlur(pad[None].astype(np.float64), (0, 0), sigmaX=1.2, sigmaY=0.01)[0, 8:-8]
    row = np.clip(np.sqrt(np.clip(rim / 4, 0, 1)) * 255 + 0.5, 0, 255).astype(np.uint8)
    old_row = img[MAP_H, :, [2, 1, 0]].T.copy()
    img[MAP_H:, :, 2], img[MAP_H:, :, 1], img[MAP_H:, :, 0] = row[None, :, 0], row[None, :, 1], row[None, :, 2]
    for key in ("full", "web"):
        cv2.imwrite(str((out / (key + "-air-glow.png")) if out else (geo.ROOT / "public" / "assets" / "earth" / key / "air-glow.png")), img)
    print("line share, was and now, and rim (code values, was and now) every 8 deg")
    for c in range(1, MAP_W, 4):
        print(f"  pa {cols[c]:5.0f} x {np.interp(cols[c], ratio[:, 0], ratio[:, 1], period=360):.2f} line {was[c]:.2f} {alpha[c]:.2f} rim {old_row[c]} {row[c]}")


def day_factor(AT, dirv, lo):
    return np.clip((AT @ dirv - lo) / (1 - lo), 0, 1)


def unit(th, ph):
    return np.array([np.cos(th) * np.cos(ph), np.sin(th), np.cos(th) * np.sin(ph)])


def model(p, H, AT):
    heights = np.exp(p[0:LAYERS])
    cols = np.exp(p[LAYERS:LAYERS * 4]).reshape(LAYERS, 3)
    powers = np.exp(p[LAYERS * 4:LAYERS * 5])
    k = LAYERS * 5
    dirv = unit(p[k], p[k + 1])
    x = day_factor(AT, dirv, p[k + 2])
    out = np.zeros((len(H), 3))
    for i in range(LAYERS):
        out += cols[i][None, :] * (x ** powers[i] * np.exp(-H / heights[i]))[:, None]
    return out


def main():
    S, L = samples()
    PA, H, AT, V = S[:, 0], S[:, 1], S[:, 2:5], np.maximum(S[:, 5:8], 0)

    def res(p):
        return (np.log(model(p, H, AT) + EPS) - np.log(V + EPS)).ravel()

    h0 = [0.006, 0.02, 0.06, 0.2]
    c0 = [1.0, 2.5, 5.0, 0.1, 0.5, 1.2, 0.03, 0.1, 0.2, 0.004, 0.012, 0.016]
    p0 = np.concatenate([np.log(h0), np.log(c0), np.log([1.5, 1.5, 1.2, 1.0]), [0.2, 2.9, -0.4]])
    lo = np.concatenate([np.log([0.003, 0.012, 0.035, 0.12]), np.full(12, np.log(1e-4)), np.full(4, np.log(0.3)), [-1.4, 1.2, -1.0]])
    hi = np.concatenate([np.log([0.012, 0.035, 0.12, 0.5]), np.full(12, np.log(30.0)), np.full(4, np.log(8.0)), [1.4, 4.8, 0.3]])
    fit = least_squares(res, p0, bounds=(lo, hi), loss="soft_l1", f_scale=0.25)
    p = fit.x
    m = model(p, H, AT)
    k = LAYERS * 5
    dirv = unit(p[k], p[k + 1])
    print("rms log", float(np.sqrt((fit.fun ** 2).mean())), "dir", dirv.round(3), "lo", round(float(p[k + 2]), 3))

    x = day_factor(L[:, 11:14], dirv, p[k + 2])
    peak = L[:, 2:5]
    base = 0.5 * (L[:, 5:8] + L[:, 8:11])
    amp = np.maximum(peak - base, 0)
    lit = x > 0.02

    def lres(q):
        return np.log(np.exp(q[0]) * x[lit] ** np.exp(q[1]) + 0.05) - np.log(amp[lit, 1] + 0.05)

    lf = least_squares(lres, [np.log(1.5), 0.0], loss="soft_l1", f_scale=0.3)
    green = float(np.exp(lf.x[0]))
    lpow = float(np.exp(lf.x[1]))
    ok = lit & (peak[:, 2] < 4.0) & (amp[:, 1] > 0.1)
    ratio = np.median(amp[ok] / amp[ok, 1:2], axis=0) if ok.sum() > 4 else np.array([0.2, 1.0, 2.6])
    print("line green", green, "power", lpow, "ratio", ratio.round(3), "from", int(ok.sum()))
    rim = np.median(L[x > 0.6, 5:8], axis=0)
    rim_night = np.median(L[L[:, 11:14] @ geo.SUN < -0.25, 5:8], axis=0)
    print("line peak at h, lit sectors: median", np.median(L[x > 0.6, 1]).round(5), "quartiles", np.percentile(L[x > 0.6, 1], [25, 75]).round(5))
    print("rim inside lit", rim.round(3), "night", rim_night.round(4))
    for a, xx, pk, am in list(zip(L[:, 0], x, peak, amp))[::5]:
        print(f"  line pa {a:5.0f} x {xx:.2f} peak {pk[0]:.2f} {pk[1]:.2f} {pk[2]:.2f} amp g {am[1]:.2f} model {green * xx ** lpow:.2f}")

    want = green * x ** lpow
    lr = np.where(want > 0.05, np.clip(amp[:, 1] / np.maximum(want, 1e-3), 0.3, 3.0), 1.0)
    pad = np.concatenate([lr[-6:], lr, lr[:6]])
    lr = np.convolve(pad, np.hanning(9) / np.hanning(9).sum(), mode="same")[6:-6]
    ratio_map(p, np.stack([L[:, 0], lr], 1))
    old = json.loads((OUT / "air.json").read_text())
    new = {
        "top": TOP,
        "heights": np.exp(p[0:LAYERS]).round(5).tolist(),
        "colors": np.exp(p[LAYERS:LAYERS * 4]).reshape(LAYERS, 3).round(5).tolist(),
        "powers": np.exp(p[LAYERS * 4:LAYERS * 5]).round(4).tolist(),
        "dir": dirv.round(5).tolist(),
        "dayFrom": round(float(p[k + 2]), 4),
        "line": (ratio * green).round(4).tolist(),
        "linePower": round(lpow, 4),
        "lineWidth": old.get("lineWidth", 0.0016),
        "lineAt": old.get("lineAt", -0.0004),
        "rim": rim.round(4).tolist(),
        "rimNight": rim_night.round(4).tolist(),
        "mapRows": [MAP_H, RIM_ROWS],
        "inner": old.get("inner", 0.004),
        "innerStrength": old.get("innerStrength", 0.5),
    }
    (OUT / "air.json").write_text(json.dumps(new, indent=1) + "\n")
    print(json.dumps(new))
    for a in (2, 90, 130, 174, 202, 226, 250, 274, 298, 322, 346):
        kk = PA == a
        if not kk.any():
            continue
        print("pa", a)
        for hh, v, q in list(zip(H[kk], V[kk], m[kk]))[::5]:
            print(f"  h {hh:.4f} seen {v[0]:.4f} {v[1]:.4f} {v[2]:.4f} model {q[0]:.4f} {q[1]:.4f} {q[2]:.4f}")


if __name__ == "__main__":
    if "--under" in sys.argv:
        from pathlib import Path

        under(Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None)
    else:
        main()
