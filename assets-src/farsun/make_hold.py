"""The far Sun's map of place, src/space/farsun/hold.ts.

Two fields of place on the body, in the frame of the far Sun as Mercury's hold sees it
(the eye of frame 615, printed by fit/holdframe.mts). The law of the shader keeps every
grain; the map only says where a patch of the face or a ray of the gas stands and how strong.

  channel 0, the face: read on the sphere by the place the hold's eye sees it at
             (u, v across the hold's line to the centre, the limb at radius 1).
             value (byte - 128) / FACE is added to the knots' mark: over 0 a white glint,
             under 0 the knots' shade.
  channel 1, the gas: read in space by the turn about the hold's line and the distance
             from the centre (radius 1 is the surface). value (byte - 128) / GAS is a
             gain in stops, faded with the lean out of the hold's plane of sky.

Inputs, all read only: references/approved/mercury-hero.png, and renders of frame 615
made with this folder at the draft tier (the render with the state so far, and four
probe renders with a flat table: face +0.5, face -0.5, gas +1, gas -1 over the flat 0).

  probe  --face F --gas G                       writes a flat table (a measuring table, no take)
  step   --frame J --pitch PX --base M0 --probes DIR --render M --state IN --out OUT
         one take: the difference of the approved picture to the render, laid on the
         texels by least squares with the probes as the slope, added to the state.
  write  --state S                              writes hold.ts from a state

Pitch is the size of a texel in pixels of the 1920 wide frame at the hold.
"""
import argparse, base64, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
APPROVED = os.path.join(REPO, 'references', 'approved', 'mercury-hero.png')
TARGET = os.path.join(REPO, 'src', 'space', 'farsun', 'hold.ts')
FACE, GAS = 60.0, 40.0
BOX = (-1.9, -1.9, 0.5, 0.6)
WIDE, HIGH = 1920, 1080
RADIUS_PX = 444.0
FACE_STEP, GAS_STEP = 0.5, 1.0
STREAK = (146, 22, 1480)


def picture(path):
    im = Image.open(path).convert('RGB')
    if not im.size == (WIDE, HIGH):
        im = im.resize((WIDE, HIGH), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    return np.stack([ndimage.median_filter(a[..., c], size=7) for c in range(3)], -1)


def geometry(frame):
    f = json.load(open(frame))[0]
    eye = np.array(f['eye'])
    right, up, back = (np.array(f[k]) for k in ('right', 'up', 'back'))
    away = np.linalg.norm(eye)
    limb = 1.0 / np.sqrt(away * away - 1.0)
    axis = -eye / away
    x = np.cross(axis, [0.0, 1.0, 0.0]); x /= np.linalg.norm(x)
    y = np.cross(x, axis)
    fl = (HIGH / 2) / np.tan(np.radians(f['vfov']) / 2)
    py, px = np.mgrid[0:HIGH, 0:WIDE].astype(np.float64) + 0.5
    cx, cy = (px - WIDE / 2) / fl, (HIGH / 2 - py) / fl
    ray = cx[..., None] * right + cy[..., None] * up - back
    along = ray @ axis
    u, v = (ray @ x) / (along * limb), (ray @ y) / (along * limb)
    r = np.hypot(u, v)
    reach = away * np.sin(np.arctan(r * limb))
    seen = along > 0
    planet = np.array(f['planet'])
    cosine = (cx * planet[0] + cy * planet[1] - planet[2]) / np.sqrt(cx * cx + cy * cy + 1)
    clear = np.arccos(np.clip(cosine, -1, 1)) > f['planetRadius'] + 30.0 / fl
    clear &= ~((np.abs(py - STREAK[0]) < STREAK[1]) & (px < STREAK[2]))
    return dict(eye=eye, u=u, v=v, r=r, reach=reach, seen=seen & clear)


def grid(pitch):
    step = pitch / RADIUS_PX
    w = int(np.ceil((BOX[2] - BOX[0]) / step)); h = int(np.ceil((BOX[3] - BOX[1]) / step))
    return w, h


def splat(w, h, u, v, weight, value):
    tx = (u - BOX[0]) / (BOX[2] - BOX[0]) * w - 0.5
    ty = (v - BOX[1]) / (BOX[3] - BOX[1]) * h - 0.5
    value = np.broadcast_to(value, u.shape)
    ok = (tx > -1) & (tx < w) & (ty > -1) & (ty < h) & (weight > 0)
    tx, ty, weight, value = tx[ok], ty[ok], weight[ok], value[ok]
    x0, y0 = np.floor(tx).astype(int), np.floor(ty).astype(int)
    fx, fy = tx - x0, ty - y0
    out = np.zeros((h, w))
    for dx, dy, part in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
        xi, yi = x0 + dx, y0 + dy
        inside = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
        np.add.at(out, (yi[inside], xi[inside]), (part * weight * value)[inside])
    return out


def spread(state, known, pitch):
    sigma = max(1.0, 30.0 / pitch)
    top = ndimage.gaussian_filter(state * known, sigma, mode='constant')
    under = ndimage.gaussian_filter(known, sigma, mode='constant')
    filled = known * state + (1 - known) * top / (under + 0.25)
    h, w = state.shape
    edge = np.minimum.outer(np.minimum(np.arange(h) + 0.5, h - np.arange(h) - 0.5), np.minimum(np.arange(w) + 0.5, w - np.arange(w) - 0.5))
    return filled * np.clip((edge - 0.5) / max(1.5, 45.0 / pitch), 0, 1)


def resample(field, w, h):
    if field.shape == (h, w):
        return field.copy()
    zoom = (h / field.shape[0], w / field.shape[1])
    return ndimage.zoom(field, zoom, order=1, mode='nearest', grid_mode=True)


def emit(face, gas, pitch, eye):
    h, w = face.shape
    data = np.zeros((h, w, 2), np.uint8)
    data[..., 0] = np.clip(np.round(face * FACE + 128), 0, 255)
    data[..., 1] = np.clip(np.round(gas * GAS + 128), 0, 255)
    text = base64.b64encode(data.tobytes()).decode()
    nums = lambda a: ', '.join(repr(round(float(n), 6)) for n in a)
    open(TARGET, 'w').write("export const HOLD = { width: %d, height: %d, pitch: %s, face: %d, gas: %d, eye: [%s], box: [%s], data: '%s' }\n" % (w, h, repr(pitch), FACE, GAS, nums(eye), nums(BOX), text))
    print('hold.ts %d x %d, pitch %s px, %d bytes of file' % (w, h, pitch, os.path.getsize(TARGET)))


def load(path, w, h):
    if path and os.path.exists(path):
        s = np.load(path)
        return resample(s['face'], w, h), resample(s['gas'], w, h), int(s['takes'])
    return np.zeros((h, w)), np.zeros((h, w)), 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument('mode', choices=('probe', 'step', 'write'))
    p.add_argument('--frame'); p.add_argument('--pitch', type=float, default=40)
    p.add_argument('--face', type=float, default=0); p.add_argument('--gas', type=float, default=0)
    p.add_argument('--base'); p.add_argument('--probes'); p.add_argument('--render')
    p.add_argument('--state'); p.add_argument('--out')
    p.add_argument('--damp', type=float, default=0.8)
    a = p.parse_args()
    eye = np.array(json.load(open(a.frame))[0]['eye'])
    w, h = grid(a.pitch)
    if a.mode == 'probe':
        emit(np.full((2, 2), a.face), np.full((2, 2), a.gas), 0, eye)
        return
    face, gas, takes = load(a.state, w, h)
    if a.mode == 'write':
        emit(face, gas, a.pitch, eye)
        return
    g = geometry(a.frame)
    want = picture(APPROVED) - picture(a.render)
    base = picture(a.base)
    probe = lambda name: picture(os.path.join(a.probes, name))
    lift, shade = (probe('face+.png') - base) / FACE_STEP, (base - probe('face-.png')) / FACE_STEP
    more, less = probe('gas+.png') - base, (base - probe('gas-.png')) * 2.0
    dot = lambda p, q: (p * q).sum(-1)

    on = (g['seen'] & (g['r'] < 1.0)).astype(float)
    up = splat(w, h, g['u'], g['v'], on, dot(want, lift)) / (splat(w, h, g['u'], g['v'], on, dot(lift, lift)) + splat(w, h, g['u'], g['v'], on, 1.0) + 1e-9)
    down = splat(w, h, g['u'], g['v'], on, dot(want, shade)) / (splat(w, h, g['u'], g['v'], on, dot(shade, shade)) + splat(w, h, g['u'], g['v'], on, 1.0) + 1e-9)
    side = np.where(face > 0.02, 1, np.where(face < -0.02, -1, np.where(down < 0, -1, 1)))
    face = face + a.damp * np.clip(np.where(side > 0, up, down), -0.8, 0.8)
    count = splat(w, h, g['u'], g['v'], on, 1.0)
    full = (a.pitch * a.pitch)
    face = np.clip(spread(face, np.clip(count / (0.5 * full), 0, 1), a.pitch), -2.1, 2.1)

    out = (g['seen'] & (g['reach'] >= 1.0)).astype(float)
    gu, gv = g['u'] / np.maximum(g['r'], 1e-9) * g['reach'], g['v'] / np.maximum(g['r'], 1e-9) * g['reach']
    tx = ((gu - BOX[0]) / (BOX[2] - BOX[0]) * w - 0.5); ty = ((gv - BOX[1]) / (BOX[3] - BOX[1]) * h - 0.5)
    now = np.exp2(ndimage.map_coordinates(gas, [ty, tx], order=1, mode='nearest'))[..., None]
    sign = splat(w, h, gu, gv, out, want.mean(-1))
    ratio = []
    for slope in (more * now, less * now):
        ratio.append(splat(w, h, gu, gv, out, dot(want, slope)) / (splat(w, h, gu, gv, out, dot(slope, slope)) + splat(w, h, gu, gv, out, 1.0) + 1e-9))
    change = np.log2(1.0 + np.clip(np.where(sign > 0, ratio[0], ratio[1]), -0.6, 3.0))
    gas = gas + a.damp * change
    count = splat(w, h, gu, gv, out, 1.0)
    gas = np.clip(spread(gas, np.clip(count / (0.5 * full), 0, 1), a.pitch), -3.0, 3.0)

    takes += 1
    np.savez(a.out, face=face, gas=gas, takes=takes, pitch=a.pitch)
    emit(face, gas, a.pitch, eye)
    print('take %d: face %.2f..%.2f (mean abs %.3f), gas %.2f..%.2f stops (mean abs %.3f)' % (takes, face.min(), face.max(), np.abs(face).mean(), gas.min(), gas.max(), np.abs(gas).mean()))


main()
