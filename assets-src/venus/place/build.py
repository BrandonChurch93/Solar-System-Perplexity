"""The full plates of the place, made from the laid back close image (lay.py) by generation led by the laid back plate.

Order: the deepest level first (d, c, b, a, w), because every parent carries its child in its centre.

  python3 assets-src/venus/place/build.py base [TAG ...]    the globe's own look at dusk in the frame of every plate, or of the named ones (from the check renders build.views)
  python3 assets-src/venus/place/build.py guide TAG         <tag>/guide.png, the input of the composition take
  python3 assets-src/venus/place/build.py comp TAG TAKE     <tag>/comp-4096.png and the four tile inputs <tag>/in-<tile>.png
  python3 assets-src/venus/place/build.py ringguide TAG     <tag>/ring-guide.jpg, the input of the outpainting take of a level whose ring is painted new (build.ring)
  python3 assets-src/venus/place/build.py ring TAG TAKE     as comp, from <tag>/ring-take-TAKE.png, its tones locked to the plate of the earlier method (<tag>/plate-m2.png)
  python3 assets-src/venus/place/build.py plate TAG         <tag>/plate-raw.png from the tile takes kept (build.takes in plates.json), its child nested in;
                                                            it also writes the final <child>/plate-4096.png, matched to this level at its edge
  python3 assets-src/venus/place/build.py plates            all plates, deepest first
  python3 assets-src/venus/place/build.py export            the plates into public/assets/venus/{full,web}/ under the names of plates.json, for the
                                                            draw of the globe at T only (tlay.py); they are no files of the film and are taken out after it

Work files live in out/work/venus/place/. The steps and the prompts are in assets-src/venus/RECIPE.md, section "Place plates".
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'patches'))
import lay  # noqa: E402
import tiles  # noqa: E402

ROOT = lay.ROOT
WORK = lay.WORK
SPEC = lay.SPEC
BUILD = SPEC['build']
SIZE = SPEC['size']
LEVELS = SPEC['levels']
TAGS = [l['tag'] for l in LEVELS]


def half_tan(tag):
    return float(np.tan(np.radians(LEVELS[TAGS.index(tag)]['widthDeg']) / 2))


def read(path, flags=cv2.IMREAD_COLOR):
    img = cv2.imread(str(path), flags)
    if img is None:
        raise SystemExit('missing ' + str(path))
    return img.astype(np.float32) / 255


def write(path, img):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8))


def resize(img, size):
    if img.shape[0] == size:
        return img
    return cv2.resize(img, (size, size), interpolation=cv2.INTER_AREA if size < img.shape[0] else cv2.INTER_LANCZOS4)


def angle_from_centre(tag, size):
    """Arc from the plate centre in degrees, for every pixel of the plate."""
    a = ((np.arange(size) + 0.5) / size * 2 - 1) * half_tan(tag)
    x, y = np.meshgrid(a, a)
    return np.degrees(np.arctan(np.sqrt(x * x + y * y)))


def base(tag, size=1024):
    """The globe's own look at dusk (plates off, full dusk gain) in the plate frame, from the views from straight above."""
    n, e, u = lay.frame(lay.centre_dir())
    d = lay.grid(n, e, u, LEVELS[TAGS.index(tag)]['widthDeg'], size)
    head = np.array(lay.PLACE['place']['heading'])
    x = lay.unit(np.cross(head, n))
    y = np.cross(n, x)
    out = np.zeros((size, size, 3), np.float32)
    done = np.zeros((size, size), np.float32)
    for view in sorted(BUILD['views'], key=lambda v: v['height']):
        img = read(ROOT / view['file'])
        h, w = img.shape[:2]
        rel = d - n * (1 + view['height'])
        depth = np.maximum(-(rel @ n), 1e-9)
        th = np.tan(np.radians(view['vfovDeg']) / 2)
        fx = 0.5 + (rel @ x) / depth / (2 * th * w / h)
        fy = 0.5 - (rel @ y) / depth / (2 * th)
        seen = (d @ n) * (1 + view['height']) - 1
        inside = lay.smooth(0.0, 0.08, np.minimum(np.minimum(fx, 1 - fx), np.minimum(fy, 1 - fy))) * (seen > 0)
        pic = cv2.remap(img, (fx * w - 0.5).astype(np.float32), (fy * h - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        wgt = inside * (1 - done)
        out += pic * wgt[..., None]
        done += wgt
    return out / np.maximum(done, 1e-6)[..., None], done


def extend(img, known, small=256, sigma=5.0):
    """The low frequencies of img where known, carried outward into the rest."""
    s = resize(img, small)
    k = resize(known, small)
    filled = cv2.inpaint(np.clip(s * 255 + 0.5, 0, 255).astype(np.uint8), (k < 0.6).astype(np.uint8), 7, cv2.INPAINT_TELEA).astype(np.float32) / 255
    filled = cv2.GaussianBlur(filled, (0, 0), sigma)
    return cv2.resize(filled, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)


def square(tag, size):
    """The square of the child of tag in a plate of tag of this size: its width and its offset in pixels."""
    child = TAGS[TAGS.index(tag) + 1]
    n = int(round(size * half_tan(child) / half_tan(tag) / 2)) * 2
    return n, (size - n) // 2


def child_into(img, tag, c=None):
    """Lay the finished child plate (or the picture c), reduced, into the centre of img."""
    i = TAGS.index(tag)
    if i + 1 >= len(TAGS):
        return img
    child = TAGS[i + 1]
    size = img.shape[0]
    if c is None:
        plate_file = WORK / child / 'plate-4096.png'
        c = read(plate_file if plate_file.exists() else WORK / child / 'comp-4096.png')  # the composition stands in while the child's tiles are still in work
    n, o = square(tag, size)
    c = resize(c, n)
    f = BUILD['childFeather'] * n
    r = np.arange(n, dtype=np.float32) + 0.5
    edge = np.minimum(r, n - r)
    m = lay.smooth(0.0, f, np.minimum(edge[:, None], edge[None, :]))[..., None]
    out = img.copy()
    out[o:o + n, o:o + n] = out[o:o + n, o:o + n] * (1 - m) + c * m
    return out


def hint(tag, size):
    laid = resize(read(WORK / f'laid-{tag}.png'), size)
    cover = resize(read(WORK / f'cover-{tag}.png', cv2.IMREAD_GRAYSCALE), size)
    trust = resize(read(WORK / f'trust-{tag}.png', cv2.IMREAD_GRAYSCALE), size)
    ext = extend(laid, cover)
    b = cv2.resize(read(WORK / f'base-{tag}.png'), (size, size), interpolation=cv2.INTER_CUBIC)
    m = lay.smooth(BUILD['toGlobeDeg'][0], BUILD['toGlobeDeg'][1], angle_from_centre(tag, size))[..., None]
    if tag in BUILD['globeForms']['levels']:  # the globe's own cloud forms, as light and dark on the carried colour: the plate comes in over those very forms
        gf = BUILD['globeForms']
        per_deg = size / LEVELS[TAGS.index(tag)]['widthDeg']
        y = cv2.GaussianBlur(b @ tiles.LUMA, (0, 0), gf['fromDeg'] * per_deg)  # forms from this size up: the grain of the globe's texels is no cloud form
        k = np.clip((y + 0.01) / (cv2.GaussianBlur(y, (0, 0), gf['sigmaDeg'] * per_deg) + 0.01), gf['floor'].get(tag, gf['clip'][0]), gf['clip'][1]) ** gf['power']
        ext = np.clip(ext * k[..., None], 0, 1)
    low = ext * (1 - m) + b * m
    return low, laid, trust


def guide(tag):
    size = BUILD['guideSize']
    low, laid, trust = hint(tag, size)
    g = low * (1 - trust[..., None]) + laid * trust[..., None]
    g = child_into(g, tag)
    write(WORK / tag / 'low.png', low)
    write(WORK / tag / 'guide.png', g)
    print(tag, 'guide', size, 'share used as it is', round(float(trust.mean()), 3))


def keep(img, tag, fine=False, child=True):
    """Put back what is not painted: the laid back picture where it is kept in place, and the child.
    With fine, only where the laid back picture has pixels enough: the stretched part keeps the detail of the tiles."""
    size = img.shape[0]
    laid = resize(read(WORK / f'laid-{tag}.png'), size)
    trust = resize(read(WORK / f'trust-{tag}.png', cv2.IMREAD_GRAYSCALE), size)[..., None]
    if fine:
        trust = trust * resize(read(WORK / f'fine-{tag}.png', cv2.IMREAD_GRAYSCALE), size)[..., None]
    out = img * (1 - trust) + laid * trust
    return child_into(out, tag) if child else out


def low(img, small=256, sigma=5.0):
    s = cv2.GaussianBlur(resize(img, small), (0, 0), sigma)
    return cv2.resize(s, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)


def nest(tag, own):
    """The child of tag nested into own, the picture of tag without its child. Returns own with the child in it and the final child plate.
    1. Colour: about the border of the child's square the tones of own, child and all, are brought to the tones own has outside the square
       (carried inward), fading to no change edgeMatch.ramp of the half width inside. Not where the laid back picture stands.
    2. Seam: in the outer part of its square the child shows the picture of own, enlarged; its own picture begins at a line that follows
       its cloud forms (edgeMatch.seam, forms), so the place where two takes meet is no straight line. Where the laid back picture stands
       the child keeps it up to its border."""
    em = BUILD['edgeMatch']
    child = TAGS[TAGS.index(tag) + 1]
    size = own.shape[0]
    n, o = square(tag, size)
    c = read(WORK / child / 'plate-raw.png')
    known = np.ones((size, size), np.float32)
    known[o:o + n, o:o + n] = 0
    r = np.arange(size, dtype=np.float32) + 0.5
    ax = np.abs(r - size / 2) / (n / 2)  # 1 at the border of the square
    inside = 1 - np.maximum(ax[:, None], ax[None, :])  # share of the half width inside the border, below 0 outside the square
    trust = resize(read(WORK / f'trust-{tag}.png', cv2.IMREAD_GRAYSCALE), size)
    w = (1 - lay.smooth(0.0, em['ramp'], inside)) * (1 - trust)
    g = np.clip((extend(own, known) + 0.004) / (low(own) + 0.004), em['clip'][0], em['clip'][1]) ** w[..., None]
    own = own * g
    gc = cv2.resize(g[o:o + n, o:o + n], (c.shape[1], c.shape[0]), interpolation=cv2.INTER_CUBIC)
    c = c * gc
    y = c @ tiles.LUMA
    wide = cv2.GaussianBlur(y, (0, 0), em['formsSigma'][1] * SIZE)
    forms = np.clip((cv2.GaussianBlur(y, (0, 0), em['formsSigma'][0] * SIZE) - wide) / (wide + 0.02) * 2, -1, 1)
    rc = np.arange(SIZE, dtype=np.float32) + 0.5
    ec = np.minimum(rc, SIZE - rc) / (SIZE / 2)
    ins = np.minimum(ec[:, None], ec[None, :])
    feather = 2 * BUILD['childFeather']  # the square feather of the shader and of the laying in, as a share of the half width
    m = lay.smooth(em['seam'][0], em['seam'][1], ins + em['forms'] * forms) * lay.smooth(feather, feather + 0.04, ins)
    m = np.maximum(m, lay.smooth(em['ramp'] - 0.06, em['ramp'], ins))
    m = np.maximum(m, read(WORK / f'trust-{child}.png', cv2.IMREAD_GRAYSCALE))[..., None]
    up = cv2.resize(own[o:o + n, o:o + n], (SIZE, SIZE), interpolation=cv2.INTER_CUBIC)
    c = c * m + up * (1 - m)
    return child_into(own, tag, c), c


def heal(own, tag):
    """A kept outpainting take may hold a straight line along stretches of the border of the child's square, where its guide showed the
    child up to that border and the take painted another cloud beyond it. Such a stretch is found by the step in tone across the
    border: the difference of the logarithm of the tone ring.heal.step pixels to either side, smoothed along the border (along), at
    its largest within near pixels of the border, over its mean between far pixels from it (a cloud form gives about 1, a straight
    line several times that; eased over from). There the picture just outside the border is mirrored inward over a band whose depth
    follows a smooth noise, so the child's texture ends along an irregular line inside its square, in the part where the child shows
    the parent's picture anyway (nest). Not where the laid back picture stands."""
    hl = BUILD['ring']['heal']
    size = own.shape[0]
    n, o = square(tag, size)
    y = np.log(own @ tiles.LUMA + 0.02)
    trust = resize(read(WORK / f'trust-{tag}.png', cv2.IMREAD_GRAYSCALE), size)
    rng = np.random.default_rng(hl['seed'])
    nz = cv2.GaussianBlur(rng.standard_normal((size, size)).astype(np.float32), (0, 0), hl['noise'][1])
    nz = nz / nz.std() * hl['noise'][0]
    depth = hl['depth'] * n
    e = hl['axis'] * n
    grid = np.arange(size, dtype=np.float32)
    ds = np.arange(-hl['far'][1], hl['far'][1] + 1)
    out = own
    found = {}
    for side in ('left', 'right', 'top', 'bottom'):
        # the picture turned so the side runs along axis 0
        a = out if side in ('left', 'right') else out.transpose(1, 0, 2)
        ya, ta, na = (v if side in ('left', 'right') else v.T for v in (y, trust, nz))
        if side in ('left', 'top'):
            border = o
            axis = o - e
            t = grid - axis  # distance inside from the mirror axis
        else:
            border = o + n
            axis = o + n + e
            t = axis - grid
        g = np.stack([ya[:, border + d + hl['step']] - ya[:, border + d - hl['step']] for d in ds], 1)
        g = np.abs(cv2.GaussianBlur(g.astype(np.float32), (1, 0), hl['along']))
        r = g[:, np.abs(ds) <= hl['near']].max(1) / (g[:, np.abs(ds) >= hl['far'][0]].mean(1) + 0.004)
        w = lay.smooth(hl['from'][0], hl['from'][1], r)
        w[:o] = 0
        w[o + n:] = 0
        found[side] = round(float((w > 0.5).mean() * size / n), 3)
        w = cv2.dilate(w.reshape(-1, 1), np.ones((2 * hl['reach'] + 1, 1), np.uint8))  # past the ends of the stretch
        w = np.clip(cv2.GaussianBlur(w, (1, 0), hl['reach'] / 2).ravel(), 0, 1)
        k = w[:, None] * (1 - lay.smooth(hl['ease'][0], hl['ease'][1], t[None, :] / depth + na)) * (t[None, :] >= 0) * (t[None, :] < 1.6 * depth) * (1 - ta)
        src = np.clip(2 * axis - grid, 0, size - 1).astype(np.float32)
        mapx = np.ascontiguousarray(np.broadcast_to(src[None, :], (size, size)))
        mapy = np.ascontiguousarray(np.broadcast_to(grid[:, None], (size, size)))
        mir = cv2.remap(np.ascontiguousarray(a), mapx, mapy, cv2.INTER_LINEAR)
        a = a * (1 - k[..., None]) + mir * k[..., None]
        out = np.ascontiguousarray(a if side in ('left', 'right') else a.transpose(1, 0, 2))
    print(tag, 'healed shares of the sides of the child square', found)
    return out


def to_tiles(tag, out):
    """comp-4096.png of a level and its four tile inputs."""
    write(WORK / tag / 'comp-4096.png', out)
    tiles.split(str(WORK / tag / 'comp-4096.png'), str(WORK / tag), BUILD['tileInput'])
    # The tile inputs are brought to a middle exposure, so the model sees the forms of a dark deck and of a bright haze alike:
    # display value to a power that takes the tile's median to tileLift.median, within tileLift.power. The power of each tile is kept to undo it.
    lift = {}
    for t in tiles.TAGS:
        f = WORK / tag / f'in-{t}.png'
        img = read(f)
        med = float(np.clip(np.median(img @ tiles.LUMA), 0.01, 0.95))
        lift[t] = float(np.clip(np.log(BUILD['tileLift']['median']) / np.log(med), BUILD['tileLift']['power'][0], BUILD['tileLift']['power'][1]))
        write(f, img ** lift[t])
    (WORK / tag / 'lift.json').write_text(json.dumps(lift))
    print(tag, 'tile powers', {t: round(v, 3) for t, v in lift.items()})


def ring_guide(tag):
    """The input of the outpainting take of a level whose ring is painted new: the child plate in its square, its border broken up
    along a smooth noise (so the take does not keep a square), on flat grey. The take must paint everything that is grey."""
    rg = BUILD['ring']
    size = BUILD['guideSize']
    n = square(tag, size)[0]
    o = (size - n) // 2
    child = TAGS[TAGS.index(tag) + 1]
    c = resize(read(WORK / child / 'plate-raw.png'), n)
    rng = np.random.default_rng(rg['matte']['seed'])

    def noise(sigma):
        x = cv2.GaussianBlur(rng.standard_normal((n, n)).astype(np.float32), (0, 0), sigma)
        return x / x.std()

    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    d = np.minimum(np.minimum(xx, n - 1 - xx), np.minimum(yy, n - 1 - yy)) / n
    for amount, sigma in rg['matte']['noise']:
        d = d + amount * noise(sigma)
    m = lay.smooth(rg['matte']['edge'][0], rg['matte']['edge'][1], d)
    # Closed at the border of the square: the noise may not carry the child up to the border, where it would end in a straight line.
    m = (m * lay.smooth(0.0, rg['matte']['close'], np.minimum(np.minimum(xx, n - 1 - xx), np.minimum(yy, n - 1 - yy)) / n))[..., None]
    g = np.full((size, size, 3), rg['grey'], np.float32)
    g[o:o + n, o:o + n] = g[o:o + n, o:o + n] * (1 - m) + c * m
    cv2.imwrite(str(WORK / tag / 'ring-guide.jpg'), np.clip(g * 255 + 0.5, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(tag, 'ring guide', size, 'child', child, 'square', n)


def ring(tag, take):
    """As comp, for an outpainting take: the take is set to the true square of the child (a kept take may hold the child at another
    size than its guide did, build.ring.takeChild), its tones go to the tones of the plate of the earlier method (the globe's own look
    in the ring, the close image near the place) at the scale build.ring.lockSigmaDeg, so only its cloud forms are new."""
    rg = BUILD['ring']
    size = BUILD['guideSize']
    r = resize(read(WORK / tag / f'ring-take-{take}.png'), size)
    n = square(tag, size)[0]
    was = rg['takeChild'].get(tag) or n
    if was != n:
        k = n / was
        r = cv2.warpAffine(r, np.float32([[k, 0, size / 2 * (1 - k)], [0, k, size / 2 * (1 - k)]]), (size, size), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    old = resize(read(WORK / tag / 'plate-m2.png'), size)
    s = rg['lockSigmaDeg'] * size / LEVELS[TAGS.index(tag)]['widthDeg']
    r = np.clip(r * np.clip((cv2.GaussianBlur(old, (0, 0), s) + 0.004) / (cv2.GaussianBlur(r, (0, 0), s) + 0.004), rg['clip'][0], rg['clip'][1]), 0, 1)
    # The colour goes most of the way to the colour the earlier plate has there (the take painted its shadows blue in places).
    c = cv2.GaussianBlur(old, (0, 0), rg['chroma']['sigmaDeg'] * size / LEVELS[TAGS.index(tag)]['widthDeg'])
    y = r @ tiles.LUMA
    r = np.clip(r * (1 - rg['chroma']['share']) + c * (y / (c @ tiles.LUMA + 1e-4))[..., None] * rg['chroma']['share'], 0, 1)
    write(WORK / tag / 'ring-locked.png', r)
    # The child as it is now (plate-raw.png: its final plate is written only when this level is assembled).
    out = keep(resize(r, SIZE), tag, child=False)
    if TAGS.index(tag) + 1 < len(TAGS):
        out = child_into(out, tag, read(WORK / TAGS[TAGS.index(tag) + 1] / 'plate-raw.png'))
    to_tiles(tag, out)
    print(tag, 'ring from take', take, 'child square', n, 'in the guide', was)


def comp(tag, take):
    size = BUILD['guideSize']
    g = read(WORK / tag / 'guide.png')
    if str(take) == '0':  # take 0: no composition take, the guide itself goes to the tiles (a level whose painted part is the globe's own look)
        r = g
    else:
        r = resize(read(WORK / tag / f'comp-take-{take}.png'), size)
        s = BUILD['compLockSigma']
        r = r * np.clip((cv2.GaussianBlur(g, (0, 0), s) + 0.004) / (cv2.GaussianBlur(r, (0, 0), s) + 0.004), 0.5, 2.0)
    to_tiles(tag, keep(resize(r, SIZE), tag))
    print(tag, 'comp from take', take)


def lock(tile, ref, sigma):
    """As tiles.lock, with a wider limit: the tile takes of the dusk plates come back with other levels in the dark parts."""
    a = cv2.GaussianBlur(ref, (0, 0), sigma)
    b = cv2.GaussianBlur(tile, (0, 0), sigma)
    out = tile * np.clip((a + 0.004) / (b + 0.004), 0.2, 5.0)
    c = cv2.GaussianBlur(ref, (0, 0), tiles.CHROMA)
    y = out @ tiles.LUMA
    return c * (y / (c @ tiles.LUMA + 1e-4))[..., None]


def plate(tag):
    """plate-raw.png of tag from its kept tile takes, with its child nested in; this also writes the final plate of the child.
    The plate of the widest level is final at once."""
    takes = BUILD['takes'][tag]
    tk = dict(zip(['tl', 'tr', 'bl', 'br'], takes))
    lift = json.loads((WORK / tag / 'lift.json').read_text())
    for t, n in tk.items():
        if n == '0':  # take 0: no tile was made, the composition itself is used (a tile that holds only picture used as it is)
            x, y = tiles.TAGS[t]
            cv2.imwrite(str(WORK / tag / f'tile-{t}-take-0.png'), cv2.imread(str(WORK / tag / 'comp-4096.png'))[y:y + tiles.TILE, x:x + tiles.TILE])
        else:  # undo the lift of the input
            write(WORK / tag / f'tile-{t}-take-{n}u.png', read(WORK / tag / f'tile-{t}-take-{n}.png') ** (1 / lift[t]))
            tk[t] = n + 'u'
    tiles.lock = lock
    tiles.assemble(str(WORK / tag / 'comp-4096.png'), str(WORK / tag), str(WORK / tag / 'tiles-4096.png'), BUILD['tileLockSigma'], tk, True)
    out = keep(read(WORK / tag / 'tiles-4096.png'), tag, True, False)
    i = TAGS.index(tag)
    if tag in BUILD['ring']['heal']['levels']:
        out = heal(out, tag)
    if i + 1 < len(TAGS):
        out, c = nest(tag, out)
        write(WORK / TAGS[i + 1] / 'plate-4096.png', c)
    write(WORK / tag / 'plate-raw.png', out)
    if i == 0:
        write(WORK / tag / 'plate-4096.png', out)
    print(tag, 'plate from tiles', ','.join(takes))


def export():
    """The plates as they stand before the handovers, into public: only for the draw of the globe at T that tlay.py starts from
    (RECIPE.md, "Place plates at the two handovers", step 2). They are no files of the film: take them out again after that draw."""
    for level in LEVELS:
        img = cv2.imread(str(WORK / level['tag'] / 'plate-4096.png'), cv2.IMREAD_COLOR)
        for kind, size in (('full', SIZE), ('web', SIZE // 2)):
            out = img if size == SIZE else cv2.resize(img, (size, size), interpolation=cv2.INTER_AREA)
            colour = None
            if 'colour' in level:
                giver = ROOT / 'public/assets/venus' / kind / LEVELS[TAGS.index(level['colour'])]['file']
                colour = (cv2.imread(str(giver), cv2.IMREAD_COLOR), lay.colour_share(LEVELS, level['tag']), level['most'])
            lay.write_plate(ROOT / 'public/assets/venus' / kind / level['file'], out, colour)
        print('exported', level['file'])


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'base':
        for t in sys.argv[2:] or TAGS:
            b, done = base(t)
            write(WORK / f'base-{t}.png', b)
            print(t, 'base, share seen by a view', round(float((done > 0.99).mean()), 3))
    elif cmd == 'guide':
        guide(sys.argv[2])
    elif cmd == 'comp':
        comp(sys.argv[2], sys.argv[3])
    elif cmd == 'ringguide':
        ring_guide(sys.argv[2])
    elif cmd == 'ring':
        ring(sys.argv[2], sys.argv[3])
    elif cmd == 'plate':
        plate(sys.argv[2])
    elif cmd == 'plates':
        for t in reversed(TAGS):
            plate(t)
    elif cmd == 'export':
        export()
