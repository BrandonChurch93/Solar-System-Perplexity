"""Shared steps of the country's heights (country.py, fillheights.py, shadeheights.py): the membrane, the test
against the sight of the picture's eye, and the heights read from the light in a plate."""
import json
import cv2
import numpy as np
import geom

KM = 3389.5


def membrane(values, known):
    """Push and pull through a pyramid: the known values stay, the rest takes the smooth mean of what is known round it."""
    v = [np.where(known, values, 0).astype(np.float32)]
    w = [known.astype(np.float32)]
    while min(v[-1].shape) > 1:
        v.append(cv2.resize(v[-1], None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))
        w.append(cv2.resize(w[-1], None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))
    out = v[-1] / np.maximum(w[-1], 1e-6)
    for k in range(len(v) - 2, -1, -1):
        up = cv2.resize(out, (v[k].shape[1], v[k].shape[0]), interpolation=cv2.INTER_LINEAR)
        up = cv2.GaussianBlur(up, (0, 0), 1.0)
        wk = np.clip(w[k] * 4, 0, 1)
        out = up * (1 - wk) + (v[k] / np.maximum(w[k], 1e-6)) * wk
    return np.where(known, values, out)


class Eye:
    """What the eye of the close view saw: the nearest distance of its layers on one grid over the picture."""

    def __init__(self, relief='src/stops/mars/relief.json', geometry='out/work/place/geometry.json', kind='full', picture_only=True, horizon=0.93):
        R = json.load(open(relief))
        G = geom.load(geometry)['dive']['terrain']
        self.rot = geom.quat_matrix(G['rotation'])
        self.origin = np.array(G['origin'])
        self.scale = G['scale']
        self.W, self.H = R['imageSize']['full']
        self.th = np.tan(np.radians(R['camera']['vfovDeg']) / 2)
        b0 = self.b0 = R['layers']['L0']['box']
        gw, gh = self.gw, self.gh = R['layers']['L0']['distSize'][kind]
        near = np.full((gh, gw), np.inf, np.float32)
        for name in R['drawOrder']:
            L = R['layers'][name]
            dw, dh = L['distSize'][kind]
            dist = np.fromfile(L['files'][kind]['dist'], np.float32).reshape(dh, dw)
            alpha = cv2.resize(cv2.imread(L['files'][kind]['alpha'], cv2.IMREAD_GRAYSCALE), (dw, dh), interpolation=cv2.INTER_AREA)
            b = L['box']
            x0 = int(round((b['x'] - b0['x']) / b0['w'] * gw))
            y0 = int(round((b['y'] - b0['y']) / b0['h'] * gh))
            w = int(round(b['w'] / b0['w'] * gw))
            h = int(round(b['h'] / b0['h'] * gh))
            d = cv2.resize(dist, (w, h), interpolation=cv2.INTER_LINEAR)
            al = cv2.resize(alpha, (w, h), interpolation=cv2.INTER_LINEAR) > 127
            x1, y1 = min(x0 + w, gw), min(y0 + h, gh)
            d = np.where(al[:y1 - y0, :x1 - x0], d[:y1 - y0, :x1 - x0], np.inf)
            near[y0:y1, x0:x1] = np.minimum(near[y0:y1, x0:x1], d)
        if picture_only:
            cx = b0['x'] + (np.arange(gw) + 0.5) / gw * b0['w']
            cy = b0['y'] + (np.arange(gh) + 0.5) / gh * b0['h']
            near[~(((cx >= 0) & (cx <= self.W))[None, :] & ((cy >= 0) & (cy <= self.H))[:, None])] = np.inf
        near[near > horizon * R['camera']['horizonDistance']] = np.inf
        self.near = near

    def sees(self, points, clear=1.01):
        """True where a body point lies in front of (or on) what the eye saw in its pixel."""
        local = ((points - self.origin) @ self.rot) / self.scale
        z = -local[:, 2]
        zz = np.maximum(z, 1e-9)
        ix = (local[:, 0] / zz / (self.th * self.W / self.H) + 1) / 2 * self.W
        iy = (1 - local[:, 1] / zz / self.th) / 2 * self.H
        gx = (ix - self.b0['x']) / self.b0['w'] * self.gw - 0.5
        gy = (iy - self.b0['y']) / self.b0['h'] * self.gh - 0.5
        inside = (z > 0) & (gx >= 0) & (gx <= self.gw - 1) & (gy >= 0) & (gy <= self.gh - 1)
        xi = np.clip(np.round(gx), 0, self.gw - 1).astype(np.int64)
        yi = np.clip(np.round(gy), 0, self.gh - 1).astype(np.int64)
        saw = self.near[yi, xi]
        return inside & np.isfinite(saw) & (np.linalg.norm(local, axis=1) < saw * clear)


def lower_under_sight(height, made, dirs, eye, step_km=0.05, passes=200, clear=1.01):
    """Lowers made ground until the eye could not have seen it; returns the heights, where it was lowered, the passes
    used and the share of the made ground still in sight."""
    out = height.copy()
    idx = np.nonzero(made)
    low = np.zeros(height.shape, bool)
    step = step_km / KM
    count = 0
    d = dirs[idx]
    for k in range(passes):
        bad = eye.sees(d * (1 + out[idx])[:, None], clear)
        if not bad.any():
            break
        count = k + 1
        out[idx[0][bad], idx[1][bad]] -= step
        low[idx[0][bad], idx[1][bad]] = True
    soft = cv2.GaussianBlur(out, (0, 0), 2.0)
    out = np.where(made, np.minimum(out, soft), out)
    left = float(eye.sees(d * (1 + out[idx])[:, None], clear).mean()) if len(idx[0]) else 0.0
    return out, low, count, left


def _under(h, step, axis):
    """The highest function under h along one axis whose neighbours differ by at most step."""
    n = h.shape[axis]
    shape = [1, 1]
    shape[axis] = n
    ramp = (np.arange(n, dtype=np.float32) * step).reshape(shape)
    a = np.minimum.accumulate(h - ramp, axis=axis) + ramp
    b = np.flip(np.minimum.accumulate(np.flip(h + ramp, axis=axis), axis=axis), axis=axis) - ramp
    return np.minimum(a, b)


def _under_diagonal(h, step, flip):
    n, m = h.shape
    x = h[:, ::-1] if flip else h
    sk = np.full((n, m + n), np.inf, np.float32)
    ii = np.arange(n)[:, None]
    jj = np.arange(m)[None, :]
    sk[ii, jj + ii] = x
    sk = _under(sk, step, 0)
    out = sk[ii, jj + ii]
    return out[:, ::-1] if flip else out


def cone_under(h, step):
    """The highest function under h that no cone of the slope step per texel pierces from above (eight directions:
    rows, columns and both diagonals, each exact in one pass since the four are laid one into the other)."""
    out = _under(_under(h.astype(np.float32), step, 0), step, 1)
    d = step * np.float32(np.sqrt(2))
    return _under_diagonal(_under_diagonal(out, d, False), d, True)


def hold_slope(h, step):
    """Heights whose slope is nowhere more than step per texel: the mean of the highest such ground under h and the
    lowest such ground over it. Ground that is under the limit already is left as it is; a wall becomes a slope of
    the limit centred on the wall."""
    low = cone_under(h, step)
    high = -cone_under(-h, step)
    return (0.5 * (low + high)).astype(np.float32)


def light(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    return np.log(np.maximum(g, 0.02))


def relief_from_light(L, deg, bearing_deg, broad_deg, fine_deg=0.0, hold=0.35):
    """Brightness (log) taken as the slope of the ground towards the Sun and integrated wave by wave. deg: degrees
    per texel; bearing: where the light comes from, clockwise from north. Waves longer than broad_deg are left out.
    Returned in units of log brightness times degree, positive up when multiplied by a positive gain."""
    n = L.shape[0]
    L = L - cv2.GaussianBlur(L, (0, 0), broad_deg / deg / 2)
    pad = n // 4
    Lp = cv2.copyMakeBorder(L, pad, pad, pad, pad, cv2.BORDER_REFLECT)
    m = Lp.shape[0]
    f = np.fft.fft2(Lp)
    k = np.fft.fftfreq(m, d=deg) * 2 * np.pi
    kx, ky = np.meshgrid(k, k)
    b = np.radians(bearing_deg)
    ks = kx * np.sin(b) - ky * np.cos(b)  # image rows run south
    kk = kx * kx + ky * ky
    band = 1 - np.exp(-kk * (broad_deg / (2 * np.pi)) ** 2 * 4)
    if fine_deg > 0:
        band *= np.exp(-kk * (fine_deg / (2 * np.pi)) ** 2)
    H = f * (1j * ks) / (ks * ks + hold * kk + 1e-9) * band
    H[0, 0] = 0
    return np.real(np.fft.ifft2(H))[pad:pad + n, pad:pad + n].astype(np.float32)


def shaded(height, deg, bearing_deg=175.0, up=0.38):
    """Shaded relief of a height plate (radii), light from the bearing: a grey picture 0 to 1."""
    b = np.radians(bearing_deg)
    s = np.array([np.sin(b), np.cos(b), up])
    s /= np.linalg.norm(s)
    gy, gx = np.gradient(height, np.radians(deg))
    nrm = np.dstack([-gx, gy, np.ones_like(gx)])
    nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
    shade = np.clip(nrm @ s, 0, 1) / s[2] * 0.6
    lo, hi = np.percentile(height, [1, 99])
    grey = 0.35 + 0.65 * np.clip((height - lo) / max(hi - lo, 1e-9), 0, 1)
    return np.clip(grey * shade, 0, 1)


def lattice_noise(u, v, seed, shape=(1024, 64)):
    """Smooth noise from a fixed table of numbers (seeded, so the same at every level and every run): -1 to 1 at
    table coordinates u, v, wrapped."""
    table = np.random.RandomState(seed).rand(*shape).astype(np.float32) * 2 - 1
    u0 = np.floor(u).astype(np.int64)
    v0 = np.floor(v).astype(np.int64)
    fu = (u - u0).astype(np.float32)
    fv = (v - v0).astype(np.float32)
    fu = fu * fu * (3 - 2 * fu)
    fv = fv * fv * (3 - 2 * fv)
    a0, a1 = u0 % shape[0], (u0 + 1) % shape[0]
    b0, b1 = v0 % shape[1], (v0 + 1) % shape[1]
    return (table[a0, b0] * (1 - fu) + table[a1, b0] * fu) * (1 - fv) + (table[a0, b1] * (1 - fu) + table[a1, b1] * fu) * fv


def trough(x, y, axis, floor_km, half_floor, wall, fall_from, fall_to, wander=None, gullies=None):
    """A canyon along a line of points (degrees east and north of the spot): height in km (negative) at x, y.
    Flat floor, sloped walls; the depth falls off with the length along the line. wander: the two rims run in and
    out along the length by sums of sines of fixed lengths and phases (one set a side), and the floor rises and
    falls a little, so the canyon is not a tube; gullies: spurs and gullies on the walls. All of it a function of the
    place alone."""
    best = np.full(x.shape, np.inf, np.float32)
    side = np.zeros(x.shape, np.float32)
    run = 0.0
    parts = []
    for (ax, ay), (bx, by) in zip(axis[:-1], axis[1:]):
        dx, dy = bx - ax, by - ay
        ln = float(np.hypot(dx, dy))
        t = np.clip(((x - ax) * dx + (y - ay) * dy) / (ln * ln), 0, 1)
        dist = np.hypot(x - ax - t * dx, y - ay - t * dy)
        nearer = dist < best
        best = np.where(nearer, dist, best)
        side = np.where(nearer, np.sign((x - ax) * dy - (y - ay) * dx), side)
        parts.append((dist, run + t * ln))
        run += ln
    # the length along the line: where two pieces are equally near (inside a bend) it is their mean, so it has no jump
    soft = max(0.15 * wall, 1e-6)
    wsum = np.zeros(x.shape, np.float32)
    along = np.zeros(x.shape, np.float32)
    for dist, al in parts:
        wgt = np.exp(-np.minimum((dist - best) / soft, 30)).astype(np.float32)
        wsum += wgt
        along += wgt * al
    along /= wsum
    del parts
    s = np.clip((along - fall_from) / (fall_to - fall_from), 0, 1)
    depth = floor_km * (1 - s * s * (3 - 2 * s))
    if wander:
        def waves(phases):
            out = np.zeros(x.shape, np.float32)
            for ln, share, ph in zip(wander['lengthsDeg'], wander['shares'], phases):
                out += share * np.sin(2 * np.pi * along / ln + ph)
            return out
        wide = np.exp(wander['amount'] * np.where(side > 0, waves(wander['phaseNorth']), waves(wander['phaseSouth'])))
        # near the axis both sides meet: the width there is the mean of the two, so the floor has no seam
        mean = np.exp(wander['amount'] * 0.5 * (waves(wander['phaseNorth']) + waves(wander['phaseSouth'])))
        k = np.clip(best / max(half_floor, 1e-6), 0, 1)
        wide = mean * (1 - k) + wide * k
        best = best / wide
        depth = depth * (1 + wander['floor'] * waves(wander['phaseFloor']))
    if gullies:
        # spurs and gullies: the walls stand out and back by a noise that is long across the canyon and short along
        # it, octave by octave, in the canyon's own coordinates (length along the line, distance from it by side)
        across = side * best
        g = np.zeros(x.shape, np.float32)
        for o, share in enumerate(gullies['shares']):
            k = 2.0 ** o
            g += share * lattice_noise(along / gullies['alongDeg'] * k + 17.3 * o, across / gullies['acrossDeg'] * k + 5.1 * o, gullies['seed'] + o)
        best = np.maximum(best + gullies['shiftDeg'] * g * np.clip(best / max(half_floor, 1e-6), 0, 1), 0)
    u = np.clip((best - half_floor) / wall, 0, 1)
    return (depth * (1 - u * u * (3 - 2 * u))).astype(np.float32)


def octaves(x, most_px):
    """Splits a field into bands of one octave each (difference of blurs), finest first; what is left is not returned."""
    bands = []
    s = 1.0
    prev = x
    while s <= most_px:
        nxt = cv2.GaussianBlur(x, (0, 0), s)
        bands.append((s, prev - nxt))
        prev = nxt
        s *= 2
    return bands, prev
