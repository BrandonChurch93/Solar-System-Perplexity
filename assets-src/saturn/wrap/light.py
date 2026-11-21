import json

import cv2
import numpy as np

from scipy.ndimage import gaussian_filter

from geo import FIT, KNOTS, ROOT, TABLE, WORK, curve_at, hero_geometry, hero_image, scene, table_at

g = hero_geometry()
seen = scene(hero_image()).astype(np.float64)
use = g["hit"] & ~g["covered"] & ~g["shadowed"] & (g["mu"] > 0.3)
lat, ndl, mu = g["lat"], g["ndl"], g["mu"]
LW = np.array([0.2126, 0.7152, 0.0722])
print("pixels", int(use.sum()), "ndl range", ndl[use].min(), ndl[use].max(), "lat range deg", np.degrees(lat[use].min()), np.degrees(lat[use].max()))

nb = 360
lat_bin = np.clip(((lat / np.pi + 0.5) * nb).astype(int), 0, nb - 1)
knots = np.linspace(-1, 1, KNOTS)
curve = np.tile(np.clip((knots + 0.1) / 1.1, 0.01, 1)[:, None], (1, 3))
zonal = np.ones((nb, 3))
for it in range(6):
    shade = curve_at(curve, ndl)
    ratio = seen / np.maximum(shade, 1e-4)
    lit = use & (ndl > 0.35)
    for b in range(nb):
        m = lit & (lat_bin == b)
        if m.sum() > 60:
            zonal[b] = np.median(ratio[m], 0)
        else:
            zonal[b] = np.nan
    good = np.where(np.isfinite(zonal[:, 0]))[0]
    for c in range(3):
        zonal[:, c] = np.interp(np.arange(nb), good, zonal[good, c])
    alb = zonal[lat_bin]
    r2 = seen / np.maximum(alb, 1e-4)
    new = np.full((KNOTS, 3), np.nan)
    half = 1.5 / (KNOTS - 1)
    for i, k in enumerate(knots):
        m = use & (np.abs(ndl - k) < half)
        if m.sum() > 300:
            new[i] = np.median(r2[m], 0)
    good = np.where(np.isfinite(new[:, 0]))[0]
    for c in range(3):
        new[:, c] = np.interp(np.arange(KNOTS), good, new[good, c])
    top = good[-1]
    for i in range(top, KNOTS):
        new[i] = new[top]
    scale = (new[top] @ LW)
    curve = new / scale
level = np.percentile(zonal @ LW, 99) / 1.25
curve *= level
zonal /= level
print("knots with data", knots[good[0]], knots[good[-1]], "albedo level", level)
for k, row in zip(knots, curve):
    print(f"{k:+.3f}  {row[0]:.4f} {row[1]:.4f} {row[2]:.4f}")

shade = curve_at(curve, ndl)
alb = zonal[lat_bin]
res = (seen @ LW) / np.maximum((alb * shade) @ LW, 1e-5)
allow = g["hit"] & ~g["covered"] & ~g["shadowed"]
print("limb residual by view cosine (lit, ndl > 0.3):")
for a, b in ((0.05, 0.1), (0.1, 0.15), (0.15, 0.2), (0.2, 0.3), (0.3, 0.4), (0.4, 0.5), (0.5, 0.7), (0.7, 1.0)):
    m = allow & (ndl > 0.3) & (mu > a) & (mu <= b)
    print(f"  mu {a:.2f} to {b:.2f}: n {int(m.sum())} median {np.median(res[m]) if m.sum() else float('nan'):.3f}")
print("night side residual (ndl < -0.3) by view cosine:")
for a, b in ((0.05, 0.15), (0.15, 0.3), (0.3, 0.6), (0.6, 1.0)):
    m = allow & (ndl < -0.3) & (mu > a) & (mu <= b)
    if m.sum():
        print(f"  mu {a:.2f} to {b:.2f}: n {int(m.sum())} scene median", np.round(np.median(seen[m], 0), 4))

nx, ny = TABLE
xk = np.linspace(-1, 1, nx)
yk = np.linspace(-0.5, 0.5, ny) * np.pi
ratio = seen / np.maximum(alb * shade, 1e-5)
src = allow & (mu > 0.14)
xi = np.clip(np.rint((ndl * 0.5 + 0.5) * (nx - 1)).astype(int), 0, nx - 1)
yi = np.clip(np.rint((lat / np.pi + 0.5) * (ny - 1)).astype(int), 0, ny - 1)
table = np.full((ny, nx, 3), np.nan)
for j in range(ny):
    row = src & (yi == j)
    if row.sum() < 400:
        continue
    for i in range(nx):
        m = row & (xi == i)
        if m.sum() > 120:
            table[j, i] = np.median(ratio[m], 0)
    good = np.where(np.isfinite(table[j, :, 0]))[0]
    if len(good) == 0:
        continue
    for c in range(3):
        table[j, :, c] = np.interp(np.arange(nx), good, table[j, good, c])
rows = np.where(np.isfinite(table[:, 0, 0]))[0]
print("table rows with data, lat deg", np.degrees(yk[rows[0]]), np.degrees(yk[rows[-1]]))
for j in range(ny):
    if not np.isfinite(table[j, 0, 0]):
        k = ny - 1 - j
        table[j] = table[k] if np.isfinite(table[k, 0, 0]) else table[rows[np.argmin(np.abs(rows - j))]]
table = np.exp(gaussian_filter(np.log(np.clip(table, 0.08, 6)), (0.7, 0.7, 0), mode="nearest"))
res2 = (seen @ LW) / np.maximum((alb * shade * table_at(table, ndl, np.sin(lat))) @ LW, 1e-5)
for a, b in ((-1, -0.5), (-0.5, -0.2), (-0.2, 0), (0, 0.2), (0.2, 0.5), (0.5, 1)):
    m = allow & (mu > 0.2) & (ndl > a) & (ndl <= b)
    print(f"  residual with table, ndl {a} to {b}: median {np.median(res2[m]):.3f} p10 {np.percentile(res2[m], 10):.3f} p90 {np.percentile(res2[m], 90):.3f}")
np.save(WORK / "light-table.npy", table)
packed = np.concatenate([table, np.ones((ny, nx, 1))], -1).astype("<f4")
for name in ("full", "web"):
    packed.tofile(ROOT / "public/assets/saturn" / name / "light.bin")
(ROOT / "src/stops/saturn/light.json").write_text(json.dumps({"width": nx, "height": ny, "file": "light.bin"}) + "\n")
np.save(WORK / "zonal.npy", zonal)
np.save(WORK / "curve.npy", curve)
out = {"knots": KNOTS, "curve": [[round(float(x), 5) for x in row] for row in curve], "source": "assets-src/saturn/wrap/light.py, hero pixels outside the rings and their shadow, view cosine above 0.3, zonal albedo divided out"}
(ROOT / "src/stops/saturn/curve.json").write_text(json.dumps(out) + "\n")
