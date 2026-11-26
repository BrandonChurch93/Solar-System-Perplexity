#!/usr/bin/env python3
"""subs.py: the subtitle layer of the narrated film.
White words that come in as each is spoken, on a soft moving nebula haze in purples. No box.
The layer is drawn for any frame size and rate. Word times are the kept takes' own character timings
(the voice maker's alignment) carried through the placing that narr.py wrote, pauses included.

  subs.py cues                      the cue list: every word with its film time, the rows of each line
  subs.py still T OUT [FILM]        one frame at T seconds over a film frame (or over black, grey and white bars)
  subs.py burn FILM AUDIO OUT       the film with the layer burned in and AUDIO as its sound
  subs.py layer OUT W H FPS         the layer alone with alpha (qtrle in a mov), for laying over a finished video
"""
import json, os, sys, math, subprocess
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

W = '/home/user/workspace/narration-work'
FONT = '/usr/share/fonts/truetype/lato/Lato-Medium.ttf'

# ---- look, in units of the frame height H (em = EM * H) -------------------------------------------------
EM = 0.050            # size of the type: 54 px at 1080, 108 px at 2160
BASE = 0.905          # baseline of the last row, share of H from the top
LEAD = 1.32           # row to row, em
MAXW = 0.80           # widest row, share of the frame width
ONEROW = 0.64         # a line narrower than this share of the width stays one row
WORD_IN = 0.22        # a word's fade in, s
WORD_AHEAD = 0.04     # it starts this long before its sound, s
WORD_RISE = 0.10      # it rises this far into place, em
WORD_SOFT = 0.07      # it comes in out of this much blur, em
HAZE_AHEAD = 0.26     # the haze under a word starts this long before its sound, s
HAZE_IN = 0.36        # and takes this long, s
HOLD = 0.80           # the line stands this long after its last word ends, s (less if the next line is near)
OUT = 0.55            # then all of it fades over this, s
NEXT_GAP = 0.30       # a line is gone this long before the next line's first word, s
PILL_X, PILL_Y = 0.42, 0.30   # the haze reaches this far past a word's box, em
CORE_SIG, WIDE_SIG = 0.52, 1.35   # feather of the haze core and of its wide glow, em
A_CORE, A_WIDE, A_MAX = 0.70, 0.30, 0.88  # how far the haze covers what is behind it (0 to 1)
BLOOM_T = 0.50        # the swell under a word as it is spoken decays over this, s
GRID_EM = 13.5        # the haze is computed on a grid of this many cells to the em (same look at any size)

DEEP = np.array([0.050, 0.026, 0.135], np.float32)     # deep indigo, the body of the haze
VIOLET = np.array([0.46, 0.25, 0.86], np.float32)
MAGENTA = np.array([0.78, 0.26, 0.70], np.float32)
BLUE = np.array([0.20, 0.40, 0.92], np.float32)
LILAC = np.array([0.66, 0.50, 1.00], np.float32)       # the swell under the word being spoken
WHITE = np.array([1.0, 1.0, 1.0], np.float32)

# rows broken by hand where the balance rule would split a phrase: line id -> index of the first word of row 2
BREAKS = {'05': 7, '06': 10, '07': 3, '12': 8, '15': 5, '17': 4}


# ---- cues ------------------------------------------------------------------------------------------------
def load_cues(placing=None, kept=None, takes=None):
    placing = placing or W + '/out/placing.json'
    kept = kept or os.environ.get('NARR_KEPT', W + '/kept-a2.json')
    takes = takes or os.environ.get('NARR_TAKES', W + '/takes-a2')
    P = json.load(open(placing)); K = json.load(open(kept)); S = json.load(open(W + '/script.json'))
    rows = {r['id']: r for r in P['rows']}
    out = []
    for s in S:
        lid = s['id']; r = rows[lid]
        al = json.load(open('%s/L%s-t%d.align.json' % (takes, lid, K[lid])))['alignment']
        ch = al['characters']; t0 = al['character_start_times_seconds']; t1 = al['character_end_times_seconds']
        text = ''.join(ch).strip()
        if text != s['text'].strip():
            raise SystemExit('line %s: the take says %r, the script %r' % (lid, text, s['text']))

        def film(t, r=r):
            return r['start'] + (t - r['s0']) + sum(ad for tc, ad in r['cuts'] if tc <= t + 1e-6)
        words = []; i = 0
        while i < len(ch):
            if ch[i] == ' ':
                i += 1; continue
            j = i
            while j < len(ch) and ch[j] != ' ':
                j += 1
            k = j - 1
            while k > i and not ch[k].isalnum():
                k -= 1
            words.append(dict(w=''.join(ch[i:j]), on=round(film(t0[i]), 4), off=round(film(t1[k]), 4)))
            i = j
        out.append(dict(id=lid, label=s['label'], text=s['text'].strip(), words=words, start=r['start'], end=r['end']))
    for a, b in zip(out, out[1:] + [None]):
        last = a['words'][-1]['off']
        nxt = b['words'][0]['on'] if b else 1e9
        hold = min(HOLD, max(0.10, nxt - NEXT_GAP - HAZE_AHEAD - OUT - last))
        a['t_in'] = a['words'][0]['on'] - HAZE_AHEAD - 0.05
        a['t_out'] = last + hold
        a['t_end'] = a['t_out'] + OUT
    return out


# ---- layout ----------------------------------------------------------------------------------------------
STOPW = {'a', 'an', 'the', 'of', 'to', 'and', 'in', 'on', 'is', 'than', 'from', 'for', 'its', 'has', 'was', 'only', 'our'}


def break_rows(cue, widths, space, maxw, onerow):
    n = len(widths)
    total = sum(widths) + space * (n - 1)
    if cue['id'] in BREAKS:
        return [list(range(0, BREAKS[cue['id']])), list(range(BREAKS[cue['id']], n))]
    if total <= onerow:
        return [list(range(n))]
    best = None
    for b in range(1, n):
        w1 = sum(widths[:b]) + space * (b - 1); w2 = sum(widths[b:]) + space * (n - b - 1)
        if max(w1, w2) > maxw:
            continue
        prev = cue['words'][b - 1]['w']
        c = abs(w1 - w2) / maxw
        c += 0.0 if prev[-1] in '.?' else (0.10 if prev[-1] in ',;:' else 0.28)
        if prev.lower().strip('.,') in STOPW:
            c += 0.25
        if w1 > w2 * 1.35:
            c += 0.10
        if best is None or c < best[0]:
            best = (c, b)
    if best is None:
        raise SystemExit('line %s does not fit two rows' % cue['id'])
    return [list(range(0, best[1])), list(range(best[1], n))]


class Layout:
    """Where every word of every line stands, for one frame size."""

    def __init__(self, cues, Wd, Ht):
        self.Wd, self.Ht = Wd, Ht
        self.em = EM * Ht
        self.ss = 3 if Ht <= 720 else (2 if Ht <= 1440 else 1)
        self.font = ImageFont.truetype(FONT, int(round(self.em * self.ss)))
        asc, desc = self.font.getmetrics()
        self.asc, self.desc = asc / self.ss, desc / self.ss
        pad = 3.2 * self.em
        self.y0 = int(max(0, math.floor(BASE * Ht - LEAD * self.em - self.asc - pad)))
        self.y1 = int(min(Ht, math.ceil(BASE * Ht + self.desc + pad)))
        self.bh = self.y1 - self.y0
        self.lines = {}
        space = self.font.getlength(' ') / self.ss
        for c in cues:
            widths = [self.font.getlength(w['w']) / self.ss for w in c['words']]
            rows = break_rows(c, widths, space, MAXW * Wd, ONEROW * Wd)
            items = []
            for ri, row in enumerate(rows):
                rw = sum(widths[i] for i in row) + space * (len(row) - 1)
                x = (Wd - rw) / 2.0
                base = BASE * Ht - (len(rows) - 1 - ri) * LEAD * self.em - self.y0
                for i in row:
                    items.append(dict(i=i, x=x, base=base, w=widths[i], row=ri))
                    x += widths[i] + space
            for it in items:
                it.update(self._tile(c['words'][it['i']]['w'], it['x'], it['base']))
            self.lines[c['id']] = dict(rows=rows, items=items)

    def _tile(self, word, x, base):
        """The word's coverage as a small float picture, with the place of its corner in the band."""
        ss = self.ss; m = int(math.ceil(0.30 * self.em))
        w = int(math.ceil(self.font.getlength(word) / ss)) + 2 * m + 2
        h = int(math.ceil(self.asc + self.desc)) + 2 * m + 2
        tx = int(math.floor(x)) - m; ty = int(math.floor(base - self.asc)) - m
        im = Image.new('L', (w * ss, h * ss), 0)
        ImageDraw.Draw(im).text(((x - tx) * ss, (base - self.asc - ty) * ss), word, font=self.font, fill=255)
        a = np.asarray(im, np.float32) / 255.0
        if ss > 1:
            a = cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA)
        return dict(tile=a, tx=tx, ty=ty)


# ---- the haze ----------------------------------------------------------------------------------------------
class Noise3:
    """Value noise that moves in time: a fixed lattice of random numbers read with a smooth fade. The same numbers every run."""

    def __init__(self, seed, nx=64, ny=32, nt=64):
        self.L = np.random.RandomState(seed).rand(nt, ny, nx).astype(np.float32); self.n = (nt, ny, nx)

    def at(self, X, Y, t):
        nt, ny, nx = self.n
        x0 = np.floor(X).astype(np.int32); y0 = np.floor(Y).astype(np.int32); t0 = int(math.floor(t))
        fx = (X - x0).astype(np.float32); fy = (Y - y0).astype(np.float32); ft = t - t0
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); ft = ft * ft * (3 - 2 * ft)
        x0 %= nx; y0 %= ny; x1 = (x0 + 1) % nx; y1 = (y0 + 1) % ny

        def bil(L):
            return (L[y0, x0] * (1 - fx) + L[y0, x1] * fx) * (1 - fy) + (L[y1, x0] * (1 - fx) + L[y1, x1] * fx) * fy
        return bil(self.L[t0 % nt]) * (1 - ft) + bil(self.L[(t0 + 1) % nt]) * ft


def fbm(N, X, Y, t, octs=3):
    s = 0.0; amp = 0.5; f = 1.0; tot = 0.0
    for o in range(octs):
        s = s + amp * N.at(X * f + 17.3 * o, Y * f + 9.1 * o, t * (1 + 0.5 * o) + 5.7 * o)
        tot += amp; amp *= 0.5; f *= 2.0
    return s / tot


def sstep(a, b, x):
    x = np.clip((x - a) / (b - a), 0.0, 1.0)
    return x * x * (3 - 2 * x)


def lum(c):
    """Relative luminance (WCAG) of sRGB values 0 to 1, last axis 3."""
    l = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return l[..., 0] * 0.2126 + l[..., 1] * 0.7152 + l[..., 2] * 0.0722


CAP, DESC = 0.72, 0.19        # the letters' height over and under the baseline, em
YCAP = 0.130                  # the haze is never lighter than this (relative luminance), so white stands on it by 5 to 1 at least
SHADOW = np.array([0.020, 0.012, 0.050], np.float32)
STARS = int(os.environ.get('SUBS_STARS', '1'))   # a few faint points in the haze


class Renderer:
    def __init__(self, cues, Wd, Ht):
        self.cues = cues; self.L = L = Layout(cues, Wd, Ht); self.Wd, self.Ht = Wd, Ht
        em = L.em; self.cell = cell = em / GRID_EM
        self.gw = int(math.ceil(Wd / cell)); self.gh = int(math.ceil(L.bh / cell))
        gy, gx = np.mgrid[0:self.gh, 0:self.gw].astype(np.float32)
        self.U = gx / GRID_EM; self.V = gy / GRID_EM
        self.N = [Noise3(s) for s in (11, 23, 37, 51, 67)]
        self.up = (int(round(self.gw * cell)), int(round(self.gh * cell)))
        rs = np.random.RandomState(5)
        self.stars = [(rs.rand() * self.gw / GRID_EM, rs.rand() * self.gh / GRID_EM, rs.rand(), 0.25 + 0.75 * rs.rand() ** 2) for _ in range(int(self.gw * self.gh / GRID_EM ** 2 * 0.9))]
        for ci, c in enumerate(cues):
            for it in L.lines[c['id']]['items']:
                x0 = (it['x'] - PILL_X * em) / cell; x1 = (it['x'] + it['w'] + PILL_X * em) / cell
                y0 = (it['base'] - (CAP + PILL_Y) * em) / cell; y1 = (it['base'] + (DESC + PILL_Y) * em) / cell
                xa, xb = max(0, int(math.floor(x0))), min(self.gw, int(math.ceil(x1)))
                ya, yb = max(0, int(math.floor(y0))), min(self.gh, int(math.ceil(y1)))
                cx = np.clip(np.minimum(np.arange(xa, xb) + 1, x1) - np.maximum(np.arange(xa, xb), x0), 0, 1).astype(np.float32)
                cy = np.clip(np.minimum(np.arange(ya, yb) + 1, y1) - np.maximum(np.arange(ya, yb), y0), 0, 1).astype(np.float32)
                it['pill'] = (slice(ya, yb), slice(xa, xb), np.outer(cy, cx))

    def cue_at(self, t):
        act = [(i, c) for i, c in enumerate(self.cues) if c['t_in'] <= t <= c['t_end']]
        assert len(act) <= 1, 'two lines at %.3f' % t
        return act[0] if act else None

    def layer(self, t, parts=False):
        """The band at time t: colour times alpha (bh, Wd, 3) and alpha (bh, Wd), or None when no line stands."""
        hit = self.cue_at(t)
        if hit is None:
            return None
        ci, c = hit; L = self.L; em = L.em
        env = 1.0 if t <= c['t_out'] else 1.0 - float(sstep(0, 1, (t - c['t_out']) / OUT))
        M = np.zeros((self.gh, self.gw), np.float32); Mb = np.zeros_like(M)
        At = np.zeros((L.bh, self.Wd), np.float32)
        for it in L.lines[c['id']]['items']:
            w = c['words'][it['i']]
            h = float(sstep(0, 1, (t - (w['on'] - HAZE_AHEAD)) / HAZE_IN)) * env
            if h <= 0:
                continue
            ys, xs, rect = it['pill']
            M[ys, xs] = np.maximum(M[ys, xs], h * rect)
            b = float(sstep(0, 1, (t - (w['on'] - 0.08)) / 0.16)) * math.exp(-max(0.0, t - w['on'] - 0.08) / BLOOM_T) * env
            if b > 0.004:
                Mb[ys, xs] = np.maximum(Mb[ys, xs], b * rect)
            p = min(1.0, max(0.0, (t - (w['on'] - WORD_AHEAD)) / WORD_IN))
            if p <= 0:
                continue
            e = 1 - (1 - p) ** 3
            tile = it['tile']
            if e < 0.999:
                sg = (1 - e) * WORD_SOFT * em
                if sg > 0.15:
                    tile = cv2.GaussianBlur(tile, (0, 0), sg)
                dy = (1 - e) * WORD_RISE * em
                tile = cv2.warpAffine(tile, np.float32([[1, 0, 0], [0, 1, dy]]), (tile.shape[1], tile.shape[0]), flags=cv2.INTER_LINEAR)
            ty, tx = it['ty'], it['tx']; th, tw = tile.shape
            ya, yb = max(0, ty), min(L.bh, ty + th); xa, xb = max(0, tx), min(self.Wd, tx + tw)
            At[ya:yb, xa:xb] = np.maximum(At[ya:yb, xa:xb], tile[ya - ty:yb - ty, xa - tx:xb - tx] * (e * env))
        core = cv2.GaussianBlur(M, (0, 0), CORE_SIG * GRID_EM)
        wide = cv2.GaussianBlur(M, (0, 0), WIDE_SIG * GRID_EM)
        S = cv2.GaussianBlur(Mb, (0, 0), 0.60 * GRID_EM) if Mb.max() > 0 else Mb
        U, V = self.U, self.V
        # the clouds: slow value noise, bent by a slower one, drifting left
        warp = fbm(self.N[3], U * 0.13, V * 0.30, t * 0.09 + ci * 3.1, 2) - 0.5
        X = U * 0.30 - t * 0.075 + 1.9 * warp + ci * 7.7; Y = V * 0.80 + 1.1 * warp
        tt = t * 0.26 + ci * 2.3
        n1 = fbm(self.N[0], X, Y, tt)
        cloud = 0.30 + 0.70 * sstep(0.30, 0.76, n1)
        # the colour runs along the line, blue to violet to magenta and back, and drifts
        q = (U * 0.045 + t * 0.022 + ci * 0.37 + 0.35 * (fbm(self.N[1], X * 0.6 + 31.0, Y * 0.7, tt * 0.8, 2) - 0.5)) * 2 * math.pi
        kb = 0.5 + 0.5 * np.cos(q); km = 0.5 + 0.5 * np.cos(q - 2.3)
        hue = VIOLET[None, None, :] * (1 - 0.75 * kb[..., None]) * (1 - 0.70 * km[..., None]) + BLUE * (0.95 * kb[..., None]) + MAGENTA * (0.80 * km[..., None])
        # thin lighter threads where a second noise crosses its middle
        n2 = fbm(self.N[2], X * 1.7 + 63.0, Y * 1.9, tt * 1.2)
        thread = np.clip(1 - np.abs(n2 - 0.5) * 9.0, 0, 1) ** 2 * sstep(0.35, 0.70, n1)
        col = DEEP[None, None, :] + 0.60 * cloud[..., None] * hue + 0.22 * thread[..., None] * LILAC + 0.50 * S[..., None] * LILAC
        y = lum(np.clip(col, 0, 1))
        col = np.clip(col * np.minimum(1.0, (YCAP / np.maximum(y, 1e-4)) ** (1 / 2.2))[..., None], 0, 1)
        edge = fbm(self.N[4], U * 0.26 - t * 0.05, V * 0.70, t * 0.20 + ci, 2)
        a = A_CORE * sstep(0.06, 0.52, core * (0.80 + 0.40 * edge)) + A_WIDE * sstep(0.0, 0.60, wide) * (0.35 + 0.95 * cloud) + 0.10 * S
        a = np.minimum(a, A_MAX)
        if STARS:
            a2 = np.clip(a / 0.5, 0, 1)
            for (su, sv, sph, ssz) in self.stars:
                tw = 0.5 + 0.5 * math.sin(t * (1.1 + 1.7 * sph) + 40 * sph)
                gx = su * GRID_EM; gy = sv * GRID_EM
                ix, iy = int(gx), int(gy)
                if 1 <= ix < self.gw - 2 and 1 <= iy < self.gh - 2:
                    amp = (0.25 + 0.75 * tw) * ssz * float(a2[iy, ix])
                    if amp > 0.02:
                        fx, fy = gx - ix, gy - iy
                        for dy_, wy in ((0, 1 - fy), (1, fy)):
                            for dx_, wx in ((0, 1 - fx), (1, fx)):
                                col[iy + dy_, ix + dx_] += amp * wy * wx * np.array([0.85, 0.80, 1.0], np.float32)
            col = np.clip(col, 0, 1)
        g = cv2.resize(np.dstack([col, a]).astype(np.float32), self.up, interpolation=cv2.INTER_LINEAR)[:L.bh, :self.Wd]
        if g.shape[0] < L.bh or g.shape[1] < self.Wd:
            g = cv2.copyMakeBorder(g, 0, L.bh - g.shape[0], 0, self.Wd - g.shape[1], cv2.BORDER_REPLICATE)
        hc, ha = g[..., :3], g[..., 3]
        sh = np.minimum(0.90, 0.85 * np.minimum(1.0, 2.2 * cv2.GaussianBlur(At, (0, 0), 0.085 * em)) + 0.55 * np.minimum(1.0, 2.2 * cv2.GaussianBlur(At, (0, 0), 0.26 * em)))
        P = hc * ha[..., None]; A = ha
        P = P * (1 - sh[..., None]) + SHADOW * sh[..., None]; A = A * (1 - sh) + sh
        P = P * (1 - At[..., None]) + At[..., None]; A = A * (1 - At) + At
        if parts:
            return P, A, At
        return P, A

    def over(self, frame, t, fi=0):
        """frame: uint8 (Ht, Wd, 3) RGB, changed in place inside the band."""
        r = self.layer(t)
        if r is None:
            return frame
        P, A = r; L = self.L
        band = frame[L.y0:L.y1].astype(np.float32) / 255.0
        out = band * (1 - A[..., None]) + P
        d = (np.random.RandomState(fi).rand(L.bh, self.Wd, 1).astype(np.float32) - 0.5) * (1.0 / 255.0) * (A[..., None] > 0.004)
        frame[L.y0:L.y1] = np.clip((out + d) * 255.0 + 0.5, 0, 255).astype(np.uint8)
        return frame


def probe(path):
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                   'stream=width,height,r_frame_rate,nb_frames,color_space,color_range,color_transfer,color_primaries,pix_fmt', '-of', 'json', path], capture_output=True, text=True).stdout)['streams'][0]
    a, b = j['r_frame_rate'].split('/')
    j['fps'] = float(a) / float(b)
    return j


def grab(path, t, Wd=None, Ht=None):
    pr = probe(path); w, h = pr['width'], pr['height']
    vf = [] if not Wd else ['-vf', 'scale=%d:%d:flags=lanczos' % (Wd, Ht)]
    if Wd:
        w, h = Wd, Ht
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', '%.4f' % t, '-i', path, '-frames:v', '1'] + vf + ['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).copy()


def contrast(R, frame, t):
    """White against what stands round the letters: (least, mean, least without the layer, mean without) as WCAG ratios."""
    r = R.layer(t, parts=True)
    if r is None:
        return None
    P, A, At = r; L = R.L
    band = frame[L.y0:L.y1].astype(np.float32) / 255.0
    comp = band * (1 - A[..., None]) + P
    k = int(max(1, round(0.14 * L.em)))
    near = cv2.dilate((At > 0.25).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))) > 0
    ring = near & (At < 0.03)
    if ring.sum() < 20:
        return None
    yc = lum(comp)[ring]; yf = lum(band)[ring]
    f = lambda y: 1.05 / (y + 0.05)
    return (float(f(np.percentile(yc, 99.5))), float(f(yc.mean())), float(f(np.percentile(yf, 99.5))), float(f(yf.mean())))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'cues'
    if cmd == 'cues':
        cues = load_cues(); L = Layout(cues, 1920, 1080)
        for c, n in zip(cues, cues[1:] + [None]):
            ln = L.lines[c['id']]
            rows = [' '.join(c['words'][i]['w'] for i in row) for row in ln['rows']]
            ws = c['words']
            assert n is None or c['t_end'] <= n['t_in'], 'line %s runs into the next' % c['id']
            print('%s %-17s in %.2f first word %.2f last word ends %.2f out %.2f gone %.2f | %s' % (c['id'], c['label'], c['t_in'], ws[0]['on'], ws[-1]['off'], c['t_out'], c['t_end'], ' / '.join(rows)))
            if '-v' in sys.argv:
                print('     ' + ' '.join('%s@%.2f' % (w['w'], w['on']) for w in ws))
        json.dump(cues, open(W + '/out/cues.json', 'w'), indent=1)
    elif cmd == 'still':
        t = float(sys.argv[2]); out = sys.argv[3]; film = sys.argv[4] if len(sys.argv) > 4 else None
        size = (int(sys.argv[5]), int(sys.argv[6])) if len(sys.argv) > 6 else (None, None)
        if film:
            fr = grab(film, t, *size)
        else:
            fr = np.zeros((1080, 1920, 3), np.uint8); fr[:, 640:1280] = 128; fr[:, 1280:] = 255
        R = Renderer(load_cues(), fr.shape[1], fr.shape[0])
        c = contrast(R, fr, t)
        R.over(fr, t, int(round(t * 30)))
        Image.fromarray(fr).save(out, quality=93)
        print(out, fr.shape, 'contrast least %.2f mean %.2f (film alone least %.2f mean %.2f)' % c if c else 'no line')
    elif cmd == 'measure':
        film = sys.argv[2]; pr = probe(film); cues = load_cues(); R = Renderer(cues, pr['width'], pr['height'])
        res = []
        for c in cues:
            worst = None
            ts = [w['on'] + 0.30 for w in c['words']] + [c['words'][-1]['off'] + 0.2, c['t_out']]
            for t in ts:
                k = contrast(R, grab(film, t), t)
                if k and (worst is None or k[0] < worst[0]):
                    worst = k + (t,)
            res.append(dict(id=c['id'], label=c['label'], least=round(worst[0], 2), mean=round(worst[1], 2), film_least=round(worst[2], 2), film_mean=round(worst[3], 2), at=round(worst[4], 2), times=len(ts)))
            print('%s %-17s least %.2f mean %.2f | film alone least %.2f mean %.2f | at %.2f s of %d times' % (c['id'], c['label'], worst[0], worst[1], worst[2], worst[3], worst[4], len(ts)))
        json.dump(res, open(W + '/out/subs-contrast.json', 'w'), indent=1)
        print('LEAST OF ALL %.2f' % min(r['least'] for r in res))
    elif cmd == 'burn':
        film, audio, out = sys.argv[2], sys.argv[3], sys.argv[4]
        t0 = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0; dur = float(sys.argv[6]) if len(sys.argv) > 6 else None
        pr = probe(film); Wd, Ht, fps = pr['width'], pr['height'], pr['fps']
        R = Renderer(load_cues(), Wd, Ht)
        cut = (['-ss', '%.4f' % t0] if t0 else []) + (['-t', '%.4f' % dur] if dur else [])
        dec = subprocess.Popen(['ffmpeg', '-v', 'error'] + cut + ['-i', film, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE, bufsize=Wd * Ht * 3 * 4)
        tags = []
        if pr.get('color_space') in ('bt709',):
            tags = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (Wd, Ht), '-r', '%g' % fps, '-i', '-'] + cut + ['-i', audio,
                                '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', os.environ.get('CRF', '16'), '-pix_fmt', 'yuv420p'] + tags +
                               ['-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
        n = 0; nb = Wd * Ht * 3
        import time; T0 = time.time()
        while True:
            buf = dec.stdout.read(nb)
            if len(buf) < nb:
                break
            fr = np.frombuffer(buf, np.uint8).reshape(Ht, Wd, 3).copy()
            R.over(fr, t0 + n / fps, n)
            enc.stdin.write(fr.tobytes()); n += 1
            if n % 600 == 0:
                print('frame %d, %.1f s' % (n, time.time() - T0), flush=True)
        enc.stdin.close(); enc.wait(); dec.wait()
        print('DONE %d frames, %.1f s, %s' % (n, time.time() - T0, out))
