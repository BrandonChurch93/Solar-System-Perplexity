"""The ring's broad tone at the hold, laid again through the solved view of the hold.

The two ring pictures (polar-rings.jpg, polar-inner.jpg) hold the approved hero's ring pixels by radius and
azimuth of the ring's body. Since the hold stands in the solved view (fit.json, true circles), the film shows
them through a lens that is not the picture's own, and with the film's own light and grade on top, so the broad
tone of the lit ring at the hold is not the approved's. This tool reads the approved over the film, in scene
light and in the low band only, where both pictures show the lit ring in the open, puts that factor on the
ring's body (radius by azimuth) and multiplies the two pictures by it. Nothing is added to the shader: the
factor is in the pictures, so it goes where they go and goes out where they go out (polarHeight, polarFar).

What is measured: the film's final still of the judged frame of the hold against the approved hero, per zone of
the ring (C, B, A), by a normalised sum under a gaussian of `low` px (blurred approved over blurred film, both
times the mask), so nothing finer than the low band of the reader stands in it. The mask: the lit ring of the
same zone in both pictures (the film's lens and the picture's own fit, assets-src/saturn/fit.json), not within
`strip` px of an edge of a zone or of the limb in either, not within `shadow` px of the fall of the globe's
shadow (shadow.json).

What is laid: the factor by radius and azimuth, times a weight that is nothing within `strip` px (of the hold
frame) of each edge of a zone and inside the shadow's fall, and rises over `rise` px (edges) and over `shadow`
px (the shadow). Edges and shadow are places of the body, so their weights stand still on it. The limb and the
frame's border are not places of the body (the hold pans): the factor is measured nowhere within `strip` px of
the limb, and it is carried across that strip and along the band into what the hold's frame does not show, so
that no mark of the limb or of the frame is left on the ring.

usage: hold_ring_tone.py FILM.png LENS.json OUT_DIR [--lay] [--from DIR] [--on TONE.npy] [--root ROOT]
  FILM.png   final still of frame `frame`, with the pictures the factor is to be laid on
  LENS.json  from lens_by_frame.ts: frames[frame] with eye, q, vfov in the body frame
  --lay      multiply the pictures (read from --from, default public/assets/saturn) and write them
             to ROOT/public/assets/saturn/<set>/
  --from     the two pictures as they stood before any factor was laid (RECIPE.md says where they come from);
             a factor is always laid on those, never on a picture that already holds one
  --on       the factor already in FILM.png (ring-tone.npy of the first reading): this reading multiplies it
writes OUT_DIR/ring-tone.npy (rows radius from span[0] up, columns azimuth from -180, 3 channels), the predicted
frame and check pictures. Settings: the block `tone` of src/stops/saturn/polar.json.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates

ARGS = sys.argv[1:]


def opt(name, default=None, flag=False):
    if name in ARGS:
        i = ARGS.index(name)
        if flag:
            ARGS.pop(i)
            return True
        v = ARGS[i + 1]
        del ARGS[i:i + 2]
        return v
    return False if flag else default


ROOT = Path(opt('--root', str(Path(__file__).resolve().parents[3])))
LAY = opt('--lay', flag=True)
ON = opt('--on')
FROM = Path(opt('--from', str(ROOT / 'public' / 'assets' / 'saturn')))
STOP = ROOT / 'src' / 'stops' / 'saturn'
sys.path.insert(0, str(ROOT / 'assets-src' / 'saturn'))
from lib import Camera, normalize, pixel_grid, plane_hit, spheroid_hit  # noqa: E402

W, H = 1920, 1080
POLAR = json.loads((STOP / 'polar.json').read_text())
INNER = json.loads((STOP / 'inner.json').read_text())
CFG = POLAR['tone']
FITF = json.loads((STOP / 'fit.json').read_text())
FITA = json.loads((ROOT / 'assets-src' / 'saturn' / 'fit.json').read_text())
SHADOW = json.loads((STOP / 'shadow.json').read_text())
POLE = float(FITF['globe']['scale'][1])
ZONES = [(a, b) for a, b in CFG['zones']]
SPAN = CFG['span']
NA, NR = CFG['size']


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def rot(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2.0 * np.cross(u, np.cross(u, v) + w * v)


def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def filmic(x):
    x = np.maximum(x, 0.0)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def scene(img8):
    return inverse_filmic(to_linear(img8.astype(np.float64) / 255.0))


def display(sc):
    return to_srgb(filmic(sc)) * 255.0


def zone_of(r):
    z = np.zeros(r.shape, np.int8)
    for i, (a, b) in enumerate(ZONES):
        z[(r >= a) & (r < b)] = i + 1
    return z


def film_view(lens):
    """The film's lens in the body frame: per pixel the ring plane's radius and azimuth, whether the plane
    is in front of the globe there, whether the globe is hit, and the same lens as a projection."""
    eye = np.array(lens['eye'], np.float64)
    q = np.array(lens['q'], np.float64)
    t = np.tan(np.radians(lens['vfov']) / 2.0)
    aspect = W / H
    xs = ((np.arange(W) + 0.5) / W * 2.0 - 1.0) * t * aspect
    ys = (1.0 - (np.arange(H) + 0.5) / H * 2.0) * t
    X, Y = np.meshgrid(xs, ys)
    d = rot(q, np.stack([X, Y, -np.ones_like(X)], -1).reshape(-1, 3)).reshape(H, W, 3)
    s = np.where(np.abs(d[..., 1]) > 1e-9, -eye[1] / d[..., 1], -1.0)
    P = eye + s[..., None] * d
    r = np.hypot(P[..., 0], P[..., 2])
    az = np.arctan2(P[..., 2], P[..., 0])
    k = np.array([1.0, 1.0 / POLE, 1.0])
    e2, d2 = eye * k, d * k
    A = np.sum(d2 * d2, -1)
    B = 2.0 * np.sum(d2 * e2, -1)
    C = float(e2 @ e2) - 1.0
    disc = B * B - 4 * A * C
    ts = np.where(disc > 0, (-B - np.sqrt(np.maximum(disc, 0))) / (2 * A), np.inf)
    hit = (disc > 0) & (ts > 0)
    front = (s > 0) & (~hit | (s < ts))

    def project(Pb):
        qi = np.array([-q[0], -q[1], -q[2], q[3]])
        cam = rot(qi, (Pb - eye).reshape(-1, 3)).reshape(Pb.shape)
        depth = -cam[..., 2]
        ok = depth > 1e-3
        dd = np.where(ok, depth, 1.0)
        x = (cam[..., 0] / dd / (t * aspect) * 0.5 + 0.5) * W
        y = (0.5 - cam[..., 1] / dd / t * 0.5) * H
        # hidden by the globe: the segment from the lens to the point crosses the spheroid
        v2 = (Pb - eye) * k
        a2 = np.sum(v2 * v2, -1)
        b2 = 2.0 * np.sum(v2 * e2, -1)
        ds = b2 * b2 - 4 * a2 * C
        t0 = np.where(ds > 0, (-b2 - np.sqrt(np.maximum(ds, 0))) / (2 * a2), np.inf)
        seen = ok & ~((ds > 0) & (t0 > 0) & (t0 < 1))
        return x, y, seen

    return {'r': r, 'az': az, 'front': front, 'hit': hit, 'project': project, 'eye': eye}


def picture_view():
    """The approved picture's own fit, at the film's size: radius on its ring plane, front, globe."""
    size = FITA.get('imageSize', [W, H])
    cam = Camera(size[0], size[1], FITA['vfovDeg'], FITA['camera']['position'], FITA['camera'].get('quaternion', (0, 0, 0, 1)))
    k = W / size[0]
    px, py = pixel_grid(W, H)
    dirs = cam.rays_world(px / k, py / k)
    n = normalize(FITA['rings']['normal'])
    t, P = plane_hit(cam.pos, dirs, n)
    hit, ts = spheroid_hit(cam.pos, dirs, n)
    r = np.linalg.norm(P, axis=-1)
    return {'r': r, 'front': (t > 0) & (~hit | (t < ts)), 'hit': hit}


def in_shadow(Px, Pz):
    """Whether a point of the ring plane lies in the globe's shadow, by the one direction of shadow.json."""
    L = np.array(SHADOW['local'], np.float64)
    L = L / np.linalg.norm(L)
    k = np.array([1.0, 1.0 / POLE, 1.0])
    l2 = L * k
    p2 = np.stack([Px, np.zeros_like(Px), Pz], -1)
    a = float(l2 @ l2)
    b = 2.0 * (p2 @ l2)
    c = np.sum(p2 * p2, -1) - 1.0
    ds = b * b - 4 * a * c
    return (ds > 0) & ((-b + np.sqrt(np.maximum(ds, 0))) / (2 * a) > 0)


def outline(mask):
    k = np.ones((3, 3), np.uint8)
    m = mask.astype(np.uint8)
    return np.not_equal(cv2.dilate(m, k), cv2.erode(m, k))


def grow(mask, px):
    n = 2 * int(px) + 1
    return cv2.dilate(mask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (n, n))).astype(bool)


def sample(img, x, y):
    return map_coordinates(img, [y - 0.5, x - 0.5], order=1, mode='nearest')


def main():
    film_path, lens_path, out = ARGS[0], ARGS[1], Path(ARGS[2])
    out.mkdir(parents=True, exist_ok=True)
    lens = json.load(open(lens_path))['frames'][str(CFG['frame'])]
    low, strip, rise, shmar, shrise = CFG['low'], CFG['strip'], CFG['rise'], CFG['shadow'], CFG['shadowRise']
    lo, hi = CFG['limits']
    # both pictures as the reader takes them (hold_bands.py): the approved to the film's size by Lanczos
    approved = np.asarray(Image.open(str(ROOT / 'references' / 'approved' / 'saturn-hero.png')).convert('RGB').resize((W, H), Image.LANCZOS))
    film = np.asarray(Image.open(film_path).convert('RGB'))
    VF, VA = film_view(lens), picture_view()
    zF = np.where(VF['front'], zone_of(VF['r']), 0)
    zA = np.where(VA['front'], zone_of(VA['r']), 0)
    shadow = VF['front'] & in_shadow(VF['r'] * np.cos(VF['az']), VF['r'] * np.sin(VF['az']))
    edges = outline(zF) | outline(zA)
    limb = outline(VF['hit']) | outline(VA['hit'])
    # where one picture is under `gross` of the other at `grossPx` px, the two do not show the same thing (the
    # approved's own shadow edge, an edge further off than the strip): that is place, not tone, and is left out
    lum = np.array([0.2126, 0.7152, 0.0722])
    lA = gaussian_filter(approved.astype(np.float64) @ lum, CFG['grossPx'])
    lF = gaussian_filter(film.astype(np.float64) @ lum, CFG['grossPx'])
    gross = (zF > 0) & ((lA < CFG['gross'] * lF) | (lF < CFG['gross'] * lA))
    keep = (zF > 0) & (zF == zA) & ~grow(edges | limb, strip) & ~grow(shadow | gross, shmar)
    SA, SF = scene(approved), scene(film)
    logG = np.zeros((H, W, 3))
    have = np.zeros((H, W))
    for z in range(1, len(ZONES) + 1):
        m = (keep & (zF == z)).astype(np.float64)
        wm = gaussian_filter(m, low, mode='constant')
        num = np.stack([gaussian_filter(SA[..., c] * m, low, mode='constant') for c in range(3)], -1)
        den = np.stack([gaussian_filter(SF[..., c] * m, low, mode='constant') for c in range(3)], -1)
        g = np.log(np.clip(num / np.maximum(den, 1e-9), lo, hi))
        use = (zF == z) & (wm > CFG['least'])
        logG[use] = g[use]
        have[use] = wm[use]
    # onto the body
    az = (np.arange(NA) + 0.5) / NA * 2.0 * np.pi - np.pi
    rr = SPAN[0] + (np.arange(NR) + 0.5) / NR * (SPAN[1] - SPAN[0])
    AZ, RR = np.meshgrid(az, rr)
    Pb = np.stack([RR * np.cos(AZ), np.zeros_like(AZ), RR * np.sin(AZ)], -1)
    x, y, seen = VF['project'](Pb)
    inside = seen & (x > 0.5) & (x < W - 0.5) & (y > 0.5) & (y < H - 0.5)
    xs, ys = np.clip(x, 0.5, W - 0.5), np.clip(y, 0.5, H - 0.5)
    usef = (have > CFG['least']).astype(np.float64)
    su = np.where(inside, sample(usef, xs, ys), 0.0)
    zb = zone_of(RR)
    wt = np.where((su > 0.5) & (zb > 0), sample(have * usef, xs, ys) / np.maximum(su, 1e-6), 0.0)
    body = np.stack([np.where(wt > 0, sample(logG[..., c] * usef, xs, ys) / np.maximum(su, 1e-6), 0.0) for c in range(3)], -1)
    # the light of the factor (its luminance) keeps the low band; its colour (each channel over the light) and,
    # if asked, the light too are made broader along the band, so that the beat of fine lines that stand a few
    # px apart in the two pictures is not laid as a mottle of colour
    def along(v, deg):
        if deg <= 0:
            return v
        sa = deg / 360.0 * NA
        den = gaussian_filter(wt, (0, sa), mode=('nearest', 'wrap'))
        return np.where(wt > 0, gaussian_filter(v * wt, (0, sa), mode=('nearest', 'wrap')) / np.maximum(den, 1e-9), 0.0)
    light = body @ lum
    body = np.stack([along(light, CFG['along']) + along(body[..., c] - light, CFG['hueAlong']) for c in range(3)], -1)
    # what the frame does not show, and the strip along the limb: carried along the band (azimuth), each zone
    # for itself in radius, by normalised sums under gaussians of growing width; a wider one counts only where
    # the narrower ones hold next to nothing, so the carried factor runs on smoothly from the measured one
    filled = np.zeros_like(body)
    got = np.zeros((NR, NA))
    for z in range(1, len(ZONES) + 1):
        rows = np.where(zb[:, 0] == z)[0]
        if rows.size == 0:
            continue
        a, b = rows[0], rows[-1] + 1
        accv = body[a:b] * wt[a:b][..., None]
        accw = wt[a:b].copy()
        sr = CFG['carryRadius'] / (SPAN[1] - SPAN[0]) * NR
        for k, deg in enumerate(CFG['carry']):
            sa = deg / 360.0 * NA
            c = 10.0 ** (-2 * (k + 1))
            accw += c * gaussian_filter(wt[a:b], (sr, sa), mode=('nearest', 'wrap'))
            accv += c * np.stack([gaussian_filter(body[a:b, :, ch] * wt[a:b], (sr, sa), mode=('nearest', 'wrap')) for ch in range(3)], -1)
        ok = accw > 1e-12
        filled[a:b][ok] = accv[ok] / accw[ok][:, None]
        got[a:b] = ok
    # weights that stand on the body: the edges of the zones (px of the hold frame along the radius), the shadow
    dr = 1e-3
    x2, y2, _ = VF['project'](np.stack([(RR + dr) * np.cos(AZ), np.zeros_like(AZ), (RR + dr) * np.sin(AZ)], -1))
    px_per_r = np.hypot(x2 - x, y2 - y) / dr
    dist = np.full((NR, NA), 0.0)
    for i, (a, b) in enumerate(ZONES):
        inz = zb == i + 1
        dist[inz] = (np.minimum(RR - a, b - RR) * px_per_r)[inz]
    w_edge = smoothstep(strip, strip + rise, dist) * (zb > 0)
    sh_body = in_shadow(Pb[..., 0], Pb[..., 2])
    # the distance from the shadow's fall, in px of the hold frame: over the screen where the frame shows the
    # place, else over the ring plane (a square raster of it, in radii) times the scale of the lens there
    d_scr = distance_transform_edt(~shadow)
    n = 1200
    g = (np.arange(n) + 0.5) / n * 2.0 * SPAN[1] - SPAN[1]
    GX, GZ = np.meshgrid(g, g)
    d_pl = distance_transform_edt(~in_shadow(GX, GZ)) * (2.0 * SPAN[1] / n)
    d_far = map_coordinates(d_pl, [(Pb[..., 2] + SPAN[1]) / (2.0 * SPAN[1]) * n - 0.5, (Pb[..., 0] + SPAN[1]) / (2.0 * SPAN[1]) * n - 0.5], order=1, mode='nearest') * px_per_r
    d_sh = np.where(inside, sample(d_scr, xs, ys), d_far)
    w_sh = smoothstep(0.0, shrise, d_sh) * ~sh_body
    tone = np.clip(np.exp(filled * (w_edge * w_sh * got)[..., None]), lo, hi)
    # a second reading: the film already holds the factor of the first (--on), the two multiply and the limits
    # hold for the product; `tone` stays what this reading adds, for the predicted frame
    total = tone
    if ON:
        prev = np.load(ON).astype(np.float64)
        total = np.clip(prev * tone, lo, hi)
        tone = total / prev
    np.save(out / 'ring-tone.npy', total.astype(np.float32))
    # the tone map itself must be broad: its largest step between neighbours, as a share
    print('tone map %d x %d, span %.2f to %.2f: factor least %.3f most %.3f, mean over the zones %.3f %.3f %.3f' % (NA, NR, SPAN[0], SPAN[1], tone.min(), tone.max(), *[tone[zb > 0][:, c].mean() for c in range(3)]))
    for i in range(len(ZONES)):
        inz = (zb == i + 1) & (wt > 0)
        print('  zone %d (%.4f to %.4f): measured share of the circle %.3f, factor where measured %.3f %.3f %.3f' % (i + 1, ZONES[i][0], ZONES[i][1], inz.mean() / max((zb == i + 1).mean(), 1e-9), *[np.exp(body[inz][:, c]).mean() for c in range(3)]))
    # the predicted frame: the factor on the film's ring pixels in scene light
    u = (VF['az'] + np.pi) / (2 * np.pi) * NA - 0.5
    v = (VF['r'] - SPAN[0]) / (SPAN[1] - SPAN[0]) * NR - 0.5
    onring = VF['front'] & (VF['r'] > SPAN[0]) & (VF['r'] < SPAN[1])
    T = np.stack([map_coordinates(tone[..., c], [np.clip(v, 0, NR - 1), u % NA], order=1, mode='grid-wrap') for c in range(3)], -1)
    T = np.where(onring[..., None], T, 1.0)
    pred = np.clip(np.where(onring[..., None], display(SF * T), film.astype(np.float64)), 0, 255)
    cv2.imwrite(str(out / 'predicted.png'), np.round(pred).astype(np.uint8)[..., ::-1])
    cv2.imwrite(str(out / 'tone-screen.jpg'), np.clip((T - 1.0) * CFG['show'] * 127 + 128, 0, 255).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])
    refB = gaussian_filter(approved.astype(np.float32), (16, 16, 0), mode='nearest')
    for name, im in (('film', film.astype(np.float32)), ('predicted', pred.astype(np.float32))):
        dl = np.abs(gaussian_filter(im, (16, 16, 0), mode='nearest') - refB).mean(-1)
        print('  low band 16 px against the approved, %s: %.4f (lit ring measured %.4f, rest %.4f)' % (name, dl.mean(), dl[keep].sum() / dl.size, dl[~keep].sum() / dl.size))
    # check pictures: the mask over both pictures, the tone map
    for name, im in (('mask-film', film), ('mask-approved', approved)):
        v3 = im.astype(np.float64).copy()
        v3[~keep] *= 0.35
        v3[grow(shadow, shmar) & (zF > 0)] += np.array([60.0, 0, 0])
        cv2.imwrite(str(out / (name + '.jpg')), np.clip(v3, 0, 255).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])
    show = np.clip((total - 1.0) * CFG['show'] * 127 + 128, 0, 255).astype(np.uint8)
    cv2.imwrite(str(out / 'ring-tone.png'), cv2.resize(show[::-1, :, ::-1], (1440, 3 * NR), interpolation=cv2.INTER_LINEAR))
    if LAY:
        lay(total, out)


def lay(tone, out):
    for key in ('full', 'web'):
        for cfg in (POLAR, INNER):
            src = FROM / key / cfg['file']
            img = cv2.imread(str(src))
            h, w = img.shape[:2]
            # the picture's rows: top row outermost; columns: azimuth from -180
            r = cfg['span'][1] - (np.arange(h) + 0.5) / h * (cfg['span'][1] - cfg['span'][0])
            a = (np.arange(w) + 0.5) / w * NA - 0.5
            v = (r - SPAN[0]) / (SPAN[1] - SPAN[0]) * NR - 0.5
            A, V = np.meshgrid(a, np.clip(v, 0, NR - 1))
            T = np.stack([map_coordinates(tone[..., c], [V, A % NA], order=1, mode='grid-wrap') for c in range(3)], -1)
            T = np.where(((r > SPAN[0]) & (r < SPAN[1]))[:, None, None], T, 1.0)
            res = np.clip(np.round(display(scene(img[..., ::-1]) * T)), 0, 255).astype(np.uint8)
            same = np.all(T == 1.0, -1)
            res[same] = img[..., ::-1][same]
            dst = ROOT / 'public' / 'assets' / 'saturn' / key / cfg['file']
            cv2.imwrite(str(dst), res[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, CFG['quality']])
            back = cv2.imread(str(dst))[..., ::-1].astype(np.float64)
            # the fine lines: what the new file holds over the old, less the factor, above the low band
            want = display(scene(img[..., ::-1]) * T)
            hp = (back - want) - gaussian_filter(back - want, (4, 4, 0))
            print('%s %s: %d x %d, %d bytes (was %d); factor %.3f to %.3f; the file against the old picture times the factor: mean abs %.3f levels, fine part rms %.3f levels' % (key, cfg['file'], w, h, dst.stat().st_size, src.stat().st_size, T.min(), T.max(), np.abs(back - want).mean(), np.sqrt((hp ** 2).mean())))


if __name__ == '__main__':
    main()
