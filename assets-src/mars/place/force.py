"""Holds a repainted plate to the place picture where the twin sees it.

The repaint (top down, look values in the patch encoding) is drawn into the twin's picture, compared there with the
picture's land (dehaze.py), and the difference, blurred to the scale the config names, is laid back and added inside
the lay back's mask: the broad light and dark of the plate then are the picture's, the fine drawing stays the
repaint's. Where the lay back is sharp enough (stretch under directFrom) the lay back itself is used as it is.
Printed: the mean difference to the picture, seen from the twin, before and after.
  python3 assets-src/mars/place/force.py --kind dive --width-deg 3.25 --repaint R.png --lay out/work/place/lay/dive-land-3.25 --t out/work/place/lay/dive-t-3.25.png --land out/work/place/dehaze/dive-land.png --tpic out/work/place/dehaze/dive-t.png --out out/work/place/plate/p3.25
"""
import argparse
import json
import subprocess
import sys
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--kind', default='dive')
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--size', type=int, default=4096)
ap.add_argument('--repaint', required=True)
ap.add_argument('--lay', required=True, help='lay back of the land without the ending: FILE.png and FILE-stretch.npy')
ap.add_argument('--t', required=True)
ap.add_argument('--land', required=True)
ap.add_argument('--tpic', required=True)
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--out', required=True)
a = ap.parse_args()
cfg = json.load(open(a.config))
fc, lead = cfg['force'], cfg['lead']
g = geom.load(a.geometry)
k = g[a.kind]
lay = k['layout']
W, H = g['format']['width'], g['format']['height']
cam = geom.Camera(k['twin'], W, H)
size = a.size


def read(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    return img.astype(np.float32) / (65535 if img.dtype == np.uint16 else 255)


R = read(a.repaint)[..., :3]
if R.shape[0] != size:
    R = cv2.resize(R, (size, size), interpolation=cv2.INTER_CUBIC if R.shape[0] < size else cv2.INTER_AREA)
R = np.clip(R, 0, 1)
L = read(a.lay + '.png')
stretch = np.load(a.lay + '-stretch.npy')
t = read(a.t)[..., 0]
if L.shape[0] != size:
    raise SystemExit('the lay back is %d px, the plate %d' % (L.shape[0], size))
# seen: the fan the twin sees, its edge also feathered on the ground (plate px; near the twin the picture's own edge
# feather is a hair line). m: where the picture leads (seen and clear enough air). far: seen through thick haze.
seen = geom.picture_edge(cam, lay, a.width_deg, size, lead['edgeShare'])
seen = seen * geom.smoothstep(0.0, fc['edgePx'], cv2.distanceTransform((seen > 0.02).astype(np.uint8), cv2.DIST_L2, 5))
m = seen * geom.smoothstep(lead['tFrom'], lead['tTo'], t)
far = np.clip(seen - m, 0, 1)


def spread(D, w):
    """Push pull fill: D where w is 1, outside it the nearest values of D, broader with distance."""
    ds, ws = [D * w[..., None]], [w]
    while ds[-1].shape[0] > 4:
        ds.append(cv2.pyrDown(ds[-1]))
        ws.append(cv2.pyrDown(ws[-1]))
    fill = ds[-1] / np.maximum(ws[-1], 1e-6)[..., None]
    for lv in range(len(ds) - 2, -1, -1):
        up = cv2.resize(fill, (ds[lv].shape[1], ds[lv].shape[0]), interpolation=cv2.INTER_LINEAR)
        own = ds[lv] / np.maximum(ws[lv], 1e-6)[..., None]
        k = np.clip(ws[lv], 0, 1)[..., None]
        fill = own * k + up * (1 - k)
    return fill


# the far fan: what the picture shows there is mostly its haze, and the take was led by it. Its broad colour is
# brought to that of the land around the fan (look values, by ratio); the drawing stays.
if far.max() > 0 and fc['calmShare'] > 0:
    Rs = geom.scene_of(R)
    q = 8  # the broad colours are compared on a grid of an eighth of the plate
    small = cv2.resize(Rs, (size // q, size // q), interpolation=cv2.INTER_AREA)
    sig = fc['calmBlurDeg'] / a.width_deg * size / q
    low = cv2.GaussianBlur(small, (0, 0), sig)
    out = 1 - np.clip(cv2.resize(seen, (size // q, size // q), interpolation=cv2.INTER_AREA) * 4, 0, 1)
    around = cv2.GaussianBlur(spread(low, out), (0, 0), sig)
    lum = lambda v: v @ np.array([0.0722, 0.7152, 0.2126], np.float32)
    ratio = np.clip((lum(around) + 1e-3) / (lum(low) + 1e-3), fc['calmLeast'], fc['calmMost'])
    ratio = cv2.resize(ratio, (size, size), interpolation=cv2.INTER_LINEAR)[..., None]
    hue = cv2.resize(around / (lum(around)[..., None] + 1e-4), (size, size), interpolation=cv2.INTER_LINEAR)
    k = (far * fc['calmShare'])[..., None]
    Rs = Rs * (1 + (ratio - 1) * k)
    Rs = Rs + (lum(Rs)[..., None] * hue - Rs) * (k * fc['calmHue'])
    R = np.clip(geom.texel_of(Rs), 0, 1)
    del hue, k
    del Rs, around, ratio, small, low

step = fc['pictureStep']
pw, ph = lay['width'] // step, lay['height'] // step
ys, xs = np.mgrid[0:ph, 0:pw].astype(np.float32)
fx = ((xs + 0.5) * step - lay['shift']) / lay['scale'] - lay['left']
fy = ((ys + 0.5) * step - lay['shift']) / lay['scale'] - lay['top']
pts, ok = cam.hit(cam.rays(fx, fy))
ge, gn, dn = geom.to_patch(pts)
del pts
ht = geom.half_tan(a.width_deg)
u = (ge / (2 * ht) + 0.5) * size
v = (0.5 - gn / (2 * ht)) * size
inside = ok & (dn > 0.3) & (u > 1) & (u < size - 1) & (v > 1) & (v < size - 1)


def draw(plate):
    """The plate as the twin's picture shows it (picture grid of pictureStep)."""
    pyr = [plate]
    while pyr[-1].shape[0] > 8:
        pyr.append(cv2.pyrDown(pyr[-1]))
    du = np.hypot(np.gradient(u, axis=1), np.gradient(v, axis=1))
    dv = np.hypot(np.gradient(u, axis=0), np.gradient(v, axis=0))
    lod = np.clip(np.log2(np.maximum(np.maximum(du, dv), 1e-6)) - 0.5, 0, len(pyr) - 1.001)
    lod = np.where(inside, lod, 0)
    lo = np.floor(lod).astype(np.int32)
    fr = (lod - lo).astype(np.float32)
    out = np.zeros((ph, pw, 3), np.float32)
    for lv in range(len(pyr)):
        use = inside & ((lo == lv) | (lo == lv - 1))
        if not use.any():
            continue
        s = 2.0 ** lv
        tex = cv2.remap(pyr[lv], (u / s - 0.5).astype(np.float32), (v / s - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        w = np.where(lo == lv, 1 - fr, 0) + np.where(lo == lv - 1, fr, 0)
        out += tex * (w * use)[..., None]
    return out


land = cv2.resize(read(a.land)[..., :3], (pw, ph), interpolation=cv2.INTER_AREA)
tp = cv2.resize(read(a.tpic)[..., 0], (pw, ph), interpolation=cv2.INTER_AREA)
valid = (inside & (tp > lead['tFrom'])).astype(np.float32)
judge = inside & (tp > lead['tTo'])


def report(name, plate):
    d = np.abs(draw(plate) - land)[judge] * 255
    print('%s: mean difference to the picture from the twin %.2f of 255 (95th percentile %.1f) on %d picture points' % (name, d.mean(), np.percentile(d, 95), judge.sum()))


report('repaint', R)
D = (land - draw(R)) * valid[..., None]
sigma = fc['blurPx'] / step
D = cv2.GaussianBlur(D, (0, 0), sigma) / np.maximum(cv2.GaussianBlur(valid, (0, 0), sigma), 0.05)[..., None]
D *= (valid > 0)[..., None]
full = cv2.resize(np.clip(D * 0.5 + 0.5, 0, 1), (lay['width'], lay['height']), interpolation=cv2.INTER_LINEAR)
tmp = a.out + '-diff'
cv2.imwrite(tmp + '-pic.png', np.round(full * 65535).astype(np.uint16))
subprocess.run([sys.executable, 'assets-src/mars/place/layback.py', '--kind', a.kind, '--width-deg', str(a.width_deg), '--size', str(size), '--image', tmp + '-pic.png', '--out', tmp, '--geometry', a.geometry], check=True, stdout=subprocess.DEVNULL)
Dp = (read(tmp + '.png')[..., :3] - 0.5) * 2
# The blur of the difference is round in the picture but long on the ground where the view grazes: it would lay
# streaks that point at the twin. So the difference is blurred again on the ground, round, as wide as that length.
need = np.log2(np.maximum(fc['blurPx'] * stretch * fc['groundBlur'], 1.0))
dm, mm = Dp * m[..., None], m.copy()
acc = np.zeros_like(Dp)
lv = 0
while True:
    w = np.clip(1 - np.abs(need - lv), 0, 1) if (1 << (lv + 1)) < size // 8 else (need >= lv - 1) * np.clip(need - lv + 1, 0, 1)
    if w.max() > 0:
        d = dm / np.maximum(mm, 1e-4)[..., None]
        if lv > 0:
            d = cv2.resize(d, (size, size), interpolation=cv2.INTER_CUBIC)
        acc += d * w[..., None]
    if (1 << (lv + 1)) >= size // 8:
        break
    dm, mm = cv2.pyrDown(dm), cv2.pyrDown(mm)
    lv += 1
Dp = acc
del acc, dm, mm, need

# outside the fan the difference goes on, fading with the distance from the fan's edge: no light or dark of the
# picture may end on the outline of what the twin sees
far = cv2.distanceTransform((m < 0.5).astype(np.uint8), cv2.DIST_L2, 5) / size * a.width_deg
fall = (1 - geom.smoothstep(0.0, fc['spreadDeg'], far)) * fc['spreadShare']
# the hold is whole only near the twin: where the twin looks along the ground, what the picture shows is cliff faces
# pulled out over the land behind them, and held in full they read from above as strokes that run out from the twin.
# The measure is the ground one picture px covers along the view (degrees), the same on every plate. Beyond holdToDeg
# only the broad tone of the picture is held (the difference blurred round on the ground over broadDeg).
reach = stretch * (a.width_deg / size)
near = 1 - geom.smoothstep(fc['holdFromDeg'], fc['holdToDeg'], reach)
q = 8
sig = max(fc['broadDeg'] / a.width_deg * size / q, 0.5)
ms = cv2.resize(m, (size // q, size // q), interpolation=cv2.INTER_AREA)
broad = cv2.GaussianBlur(cv2.resize(Dp * m[..., None], (size // q, size // q), interpolation=cv2.INTER_AREA), (0, 0), sig) / np.maximum(cv2.GaussianBlur(ms, (0, 0), sig), 0.05)[..., None]
# beyond the hold the broad tone is a gain on the take, kept between broadLeast and broadMost: as a sum the picture's
# bright hazy far ground turned the take grey white, and from above the place stood pale in the land round it
Rb = cv2.GaussianBlur(cv2.resize(R, (size // q, size // q), interpolation=cv2.INTER_AREA), (0, 0), sig)
# the gain is limited in its lightness only; the hue of the broad tone goes to the picture's by broadHue (a take
# matched to the red of the globe stood as red ground under the tan far land of the picture). The fine drawing of the
# take is kept there by broadDetail (the power on its ratio to its own broad tone) and its fine colour by broadColour:
# seen along the ground from the twin, bright red veins ran through the far wall of the picture as it came in.
lumt = lambda v: v @ np.array([0.0722, 0.7152, 0.2126], np.float32)
want = np.maximum(Rb + broad, 0.0)
gl = np.clip((lumt(want) + 1e-3) / (lumt(Rb) + 1e-3), fc['broadLeast'], fc['broadMost'])
hue = want / (lumt(want)[..., None] + 1e-3)
hue = hue * fc['broadHue'] + Rb / (lumt(Rb)[..., None] + 1e-3) * (1 - fc['broadHue'])
want = cv2.resize((hue * (lumt(Rb) * gl)[..., None]).astype(np.float32), (size, size), interpolation=cv2.INTER_LINEAR)
Rbf = np.maximum(cv2.resize(Rb, (size, size), interpolation=cv2.INTER_LINEAR), 0.02)
fine = np.maximum(R, 0.0) / Rbf
finel = (lumt(np.maximum(R, 0.0)) / lumt(Rbf))[..., None]
fine = np.power(np.maximum(finel + (fine - finel) * fc['broadColour'], 1e-3), fc['broadDetail'])
held = (R + Dp) * near[..., None]
held += want * fine * (1 - near)[..., None]
del want, fine, finel, Rbf, hue, gl, broad, ms, Rb
k = (m * fc['share'])[..., None]
plate = np.clip(R * (1 - k) + held * k, 0, 1)
del held, k
# (a gain on the broad tone, not a sum: the take is often lit where the picture's near ground is dark, and a sum
# leaves the land beside the fan brighter than the fan)
sig = fc['toneBlur'] * size
Ps, Rsc = geom.scene_of(plate), geom.scene_of(R)
tone = cv2.GaussianBlur(Ps * m[..., None], (0, 0), sig) / np.maximum(cv2.GaussianBlur(m, (0, 0), sig), 1e-3)[..., None]
tone = cv2.GaussianBlur(spread(tone, (cv2.GaussianBlur(m, (0, 0), sig) > 0.5).astype(np.float32)), (0, 0), fc['spreadBlurPx'])
# round the twin's foot the tone is that of the held near ground of the picture, not of the whole edge of the fan
# (on a wide plate the dark near ground is a small part of that edge, and the plate stayed lit round a dark plate
# nested in it: a soft dark mound). It fades to the edge's tone over nearDeg from the held ground.
src = m * near
bs = cv2.GaussianBlur(src, (0, 0), sig)
if (bs > 0.5).any() and fc['nearDeg'] > 0:
    tn = cv2.GaussianBlur(Ps * src[..., None], (0, 0), sig) / np.maximum(bs, 1e-3)[..., None]
    tn = cv2.GaussianBlur(spread(tn, (bs > 0.5).astype(np.float32)), (0, 0), fc['spreadBlurPx'])
    vn = 1 - geom.smoothstep(0.0, fc['nearDeg'], cv2.distanceTransform((src < 0.5).astype(np.uint8), cv2.DIST_L2, 5) / size * a.width_deg)
    tone = tone + (tn - tone) * vn[..., None]
    del tn, vn
del src, bs
Rlow = cv2.GaussianBlur(Rsc, (0, 0), sig)
gain = np.clip((tone + 2e-3) / (Rlow + 2e-3), fc['toneLeast'], fc['toneMost'])
gain = 1 + (gain - 1) * fall[..., None]
# where the gain darkens, the shaded ground takes more of it than the lit ground (the power of the gain is the ratio
# of the ground to its own broad tone to the power of minus toneShade): the dark comes in as longer shadows along the
# forms of the land, not as a soft dark cloud over it
lums = lambda v: v @ np.array([0.0722, 0.7152, 0.2126], np.float32)
rel = np.clip(lums(Rsc) / (lums(Rlow) + 1e-3), 0.25, 4.0)[..., None]
gain = np.where(gain < 1, np.power(np.maximum(gain, 1e-3), np.power(rel, -fc['toneShade'])), gain)
out = np.clip(geom.texel_of(Rsc * gain), 0, 1)
del Rlow, rel
plate = plate * m[..., None] + out * (1 - m)[..., None]
del Ps, Rsc, tone, gain, out
report('held to the picture', plate)
direct = m * (1 - geom.smoothstep(fc['directFrom'], fc['directTo'], stretch)) * near
plate = plate * (1 - direct[..., None]) + L[..., :3] * direct[..., None]
report('with the sharp lay back', plate)
print('lay back leads on %.4f of the plate, is used as it is on %.4f' % ((m > 0.5).mean(), (direct > 0.5).mean()))
cv2.imwrite(a.out + '.png', np.round(plate * 65535).astype(np.uint16))
cv2.imwrite(a.out + '-mask.png', np.round(m * 255).astype(np.uint8))
cv2.imwrite(a.out + '-twin.jpg', np.round(np.vstack([draw(plate), land]) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
