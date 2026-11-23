"""Simulated top down dive sheet: the globe's ground alone (wrap map plus patch levels, no place picture), seen from
straight above the spot at 12 view widths from the hold to the twin. Levels are blended as the planet shader does
it for a view that looks straight down: edge feather, and a level only comes in where its parent has run out of
texels for the tile. No blur, no light: this is the ground as painted.
  python3 assets-src/mars/place/topdown.py --levels out/work/place/levels.json --out out/work/place/topdown.jpg
levels.json: [{"file": "...", "widthDeg": 96}, ...] from the widest to the narrowest.
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--levels', required=True)
ap.add_argument('--wrap', default='public/assets/mars/full/wrap-color.jpg')
ap.add_argument('--out', required=True)
ap.add_argument('--assets', default='public/assets/mars/full', help='folder of the files when --levels is the levels.json of the stop')
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--tile', type=int, default=640)
ap.add_argument('--from-deg', type=float, default=60)
ap.add_argument('--to-deg', type=float, default=0.12)
ap.add_argument('--count', type=int, default=12)
ap.add_argument('--cols', type=int, default=4)
ap.add_argument('--feather', type=float, default=0.12)
ap.add_argument('--fade', default='1.02,1.5')
ap.add_argument('--film-px', type=float, default=1080, help='levels come in as they would in a film frame this many px high')
ap.add_argument('--east-deg', type=float, default=0, help='centre of the view, degrees east of the spot at the last tile')
ap.add_argument('--north-deg', type=float, default=0)
a = ap.parse_args()
f0, f1 = [float(x) for x in a.fade.split(',')]


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def mips(img):
    out = [img]
    while out[-1].shape[0] > 64:
        out.append(cv2.resize(out[-1], (out[-1].shape[1] // 2, out[-1].shape[0] // 2), interpolation=cv2.INTER_AREA))
    return out


def sample(pyr, u, v, texels_per_px):
    """Trilinear read of a mip pyramid at uv in 0..1, texels_per_px of the base level per output pixel."""
    lod = float(np.clip(np.log2(max(texels_per_px, 1e-6)), 0, len(pyr) - 1))
    lo = int(np.floor(lod))
    hi = min(lo + 1, len(pyr) - 1)
    f = lod - lo
    res = None
    for lv, w in ((lo, 1 - f), (hi, f)):
        if w <= 0:
            continue
        img = pyr[lv]
        mx = (u * img.shape[1] - 0.5).astype(np.float32)
        my = (v * img.shape[0] - 0.5).astype(np.float32)
        s = cv2.remap(img, mx, my, cv2.INTER_CUBIC if texels_per_px < 1 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        res = s * w if res is None else res + s * w
    return res


with open(a.levels) as f:
    spec = json.load(f)
if isinstance(spec, dict):
    spec = [dict(s, file=a.assets + '/' + s['file']) for s in spec['levels']]
shown = any(s.get('own') for s in spec)
light = np.array(json.load(open(a.config))['lead']['light'][::-1], np.float32)


def read(path, own):
    """With own levels in the ladder the sheet is in look values: a lit picture is shown times the globe's light."""
    img = cv2.imread(path, cv2.IMREAD_COLOR).astype(np.float32) / 255
    return geom.texel_of(geom.scene_of(img) * light) if shown and not own else img


wrap = mips(read(a.wrap, False))
levels = [(mips(read(s['file'], s.get('own', False))), float(s['widthDeg'])) for s in spec]
n, east, north = geom.patch_frame()
widths = [a.from_deg * (a.to_deg / a.from_deg) ** (i / (a.count - 1)) for i in range(a.count)]
rows = (a.count + a.cols - 1) // a.cols
pad, bar = 8, 26
sheet = np.full((rows * (a.tile + pad + bar) + pad, a.cols * (a.tile + pad) + pad, 3), 0.05, np.float32)
labels = []
for i, wd in enumerate(widths):
    k = i / (a.count - 1)
    t = geom.half_tan(wd)
    c = (np.arange(a.tile) + 0.5) / a.tile
    cx = np.tan(np.radians(a.east_deg * k))
    cy = np.tan(np.radians(a.north_deg * k))
    x = cx + (2 * c - 1) * t
    y = cy + (1 - 2 * c) * t
    d = n[None, None, :] + x[None, :, None] * east[None, None, :] + y[:, None, None] * north[None, None, :]
    d /= np.linalg.norm(d, axis=2, keepdims=True)
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    px_rad = 2 * t / a.tile
    wrap_tpp = px_rad * wrap[0].shape[1] / (2 * np.pi)
    col = sample(wrap, lon / (2 * np.pi) + 0.5, 0.5 - lat / np.pi, wrap_tpp)
    k_film = a.tile / a.film_px
    parent = wrap_tpp * k_film
    used = []
    for pyr, pw in levels:
        scale = 1 / (2 * geom.half_tan(pw))
        u = x[None, :] * scale + 0.5 + 0 * y[:, None]
        v = 0.5 - y[:, None] * scale + 0 * x[None, :]
        edge = np.minimum(np.minimum(u, 1 - u), np.minimum(v, 1 - v))
        w = smoothstep(0, a.feather, edge) * (1 - smoothstep(f0, f1, parent))
        tpp = px_rad * scale * pyr[0].shape[0]
        if w.max() > 0:
            s = sample(pyr, np.clip(u, 0, 1), np.clip(v, 0, 1), tpp)
            col = col * (1 - w[..., None]) + s * w[..., None]
            used.append('%g' % pw)
        parent = tpp * k_film
    r, cc = divmod(i, a.cols)
    y0 = pad + r * (a.tile + pad + bar)
    x0 = pad + cc * (a.tile + pad)
    sheet[y0:y0 + a.tile, x0:x0 + a.tile] = np.clip(col, 0, 1)
    label = '%d  %.3g deg across, deepest level in use %s deg' % (i + 1, wd, used[-1] if used else 'wrap')
    labels.append((label, (x0 + 2, y0 + a.tile + 18)))
sheet8 = np.round(sheet * 255).astype(np.uint8)
for label, at in labels:
    cv2.putText(sheet8, label, at, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (215, 215, 215), 1, cv2.LINE_AA)
cv2.imwrite(a.out, sheet8, [cv2.IMWRITE_JPEG_QUALITY, 92])
print('wrote', a.out, 'widths', ['%.3g' % w for w in widths])
