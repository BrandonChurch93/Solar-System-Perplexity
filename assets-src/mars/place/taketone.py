"""Measures the tone of the takes (plates.json takes.levels), scene values, medians in the log.
  python3 assets-src/mars/place/taketone.py          the laid picture over the take under the picture's reach, per level, with
                                                     takes.levelGain on the take (plates.json takes.tone)
  python3 assets-src/mars/place/taketone.py --nest   each take against the middle of the take one level wider, and the gain per
                                                     level that makes them one, the widest held at 1 (plates.json takes.levelGain)
"""
import sys, json, cv2, numpy as np
sys.path.insert(0, 'assets-src/mars/place')
import geom
K = json.load(open('assets-src/mars/place/plates.json'))['takes']
wl = np.array([0.2126, 0.7152, 0.0722], np.float32)
T = 'assets-src/mars/place/takes/'
widths = sorted(float(w) for w in K['levels'])
def scene(w, c=1024):
    name = K['levels']['%g' % w].replace('-x2', '')
    a = cv2.cvtColor(cv2.imread(T + name), cv2.COLOR_BGR2RGB)
    return geom.scene_of(cv2.resize(a, (c, c), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0)
def med(x):
    return np.exp(np.median(np.log(np.maximum(x.reshape(-1, 3), 1e-4)), 0))
def take_at(w, c=1024):
    name = K['levels']['%g' % w].replace('-x2', '')
    a = cv2.cvtColor(cv2.imread(T + name), cv2.COLOR_BGR2RGB)
    a = cv2.resize(a, (c, c), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    return geom.texel_of(geom.scene_of(a) * np.float32((K.get('levelGain') or {}).get('%g' % w, [1, 1, 1])))
if '--curve' in sys.argv:
    # per level and colour: the texel values of the take (with levelGain) at 33 shares of its ground under the picture's reach,
    # and the laid picture's values at the same shares. countrytake.py reads a take's value through them (takecurve.json).
    out = {'note': 'taketone.py --curve: for the levels the tone is read at (plates.json takes.tone.deg, but the last, which is one), per colour the texel value (0 to 1) of the take with its levelGain at 33 shares (2 to 98 percent) of the ground under the picture\'s reach, and the laid picture\'s value at the same share. countrytake.py takes a take\'s value through these, between the levels by the log of the ground distance from the spot, so the take holds the picture\'s own range of light and colour where the picture lies.', 'share': [round(float(q), 4) for q in np.linspace(0.02, 0.98, 33)], 'levels': {}}
    for w in widths[:len(K['tone']['deg']) - 1]:
        p = ('%g' % w).replace('.', 'p'); c = 1024
        L = cv2.cvtColor(cv2.imread('assets-src/mars/place/laid/land-%s.jpg' % p), cv2.COLOR_BGR2RGB)
        L = cv2.resize(L, (c, c), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        m = cv2.resize(cv2.imread('assets-src/mars/place/laid/land-%s-laid.png' % p, 0), (c, c), interpolation=cv2.INTER_AREA) > 250
        Tk = take_at(w)
        q = np.linspace(2, 98, 33)
        out['levels']['%g' % w] = {'take': [[round(float(v), 4) for v in np.percentile(Tk[m][:, ch], q)] for ch in range(3)], 'laid': [[round(float(v), 4) for v in np.percentile(L[m][:, ch], q)] for ch in range(3)]}
        print('%g' % w, 'take 2nd, 50th, 98th', [out['levels']['%g' % w]['take'][ch][i] for ch in range(3) for i in (0, 16, 32)], 'laid', [out['levels']['%g' % w]['laid'][ch][i] for ch in range(3) for i in (0, 16, 32)])
    json.dump(out, open('assets-src/mars/place/takecurve.json', 'w'), indent=1)
    sys.exit(0)
if '--gamut' in sys.argv:
    # the approved picture's ground: by the red value, the least green over red and blue over red the picture holds (1st percentile)
    A = cv2.cvtColor(cv2.imread('references/approved/mars-close.jpg'), cv2.COLOR_BGR2RGB).astype(np.float32)
    A = A[int(A.shape[0] * 0.3):].reshape(-1, 3)
    red, gr, br = [], [], []
    for lo in range(48, 256, 16):
        sel = (A[:, 0] >= lo) & (A[:, 0] < lo + 16)
        if sel.sum() < 2000: continue
        red.append(lo + 8); gr.append(round(float(np.percentile(A[sel, 1] / A[sel, 0], 1)), 3)); br.append(round(float(np.percentile(A[sel, 2] / A[sel, 0], 1)), 3))
    print('"gamut":', json.dumps({'red': red, 'green': gr, 'blue': br}))
    sys.exit(0)
if '--nest' in sys.argv:
    gain = {widths[-1]: np.ones(3)}
    for c, p in zip(widths[-2::-1], widths[:0:-1]):
        P = scene(p); n = P.shape[0]; f = c / p
        a, b = int(round(n * (0.5 - f / 2))), int(round(n * (0.5 + f / 2)))
        r = med(P[a:b, a:b]) / med(scene(c))
        gain[c] = gain[p] * r
        print('%g in %g: the wider take over the finer on their shared ground' % (c, p), np.round(r, 3))
    print('"levelGain":', json.dumps({'%g' % w: [round(float(v), 3) for v in gain[w]] for w in widths}))
    sys.exit(0)
for w in widths:
    p = ('%g' % w).replace('.', 'p'); c = 1024
    L = cv2.cvtColor(cv2.imread('assets-src/mars/place/laid/land-%s.jpg' % p), cv2.COLOR_BGR2RGB)
    L = cv2.resize(L, (c, c), interpolation=cv2.INTER_AREA).astype(np.float32)
    m = cv2.resize(cv2.imread('assets-src/mars/place/laid/land-%s-laid.png' % p, 0), (c, c), interpolation=cv2.INTER_AREA) > 250
    SL = geom.scene_of(L / 255.0); ST = scene(w) * np.float32((K.get('levelGain') or {}).get('%g' % w, [1, 1, 1]))
    a = np.log(np.maximum(SL[m], 1e-4)); b = np.log(np.maximum(ST[m], 1e-4))
    print(p, 'mask %.3f' % m.mean(), 'laid scene median', np.round(np.exp(np.median(a, 0)), 4), 'take', np.round(np.exp(np.median(b, 0)), 4), 'ratio', np.round(np.exp(np.median(a, 0) - np.median(b, 0)), 3),
          'lum spread (log, 10th to 90th) laid %.2f take %.2f' % (np.subtract(*np.percentile(np.log(np.maximum(SL[m] @ wl, 1e-4)), [90, 10])), np.subtract(*np.percentile(np.log(np.maximum(ST[m] @ wl, 1e-4)), [90, 10]))),
          'take outside mask median', np.round(np.exp(np.median(np.log(np.maximum(ST[~m], 1e-4)), 0)), 4))
