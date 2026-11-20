import json, sys, numpy as np, cv2
from scipy.ndimage import map_coordinates
setname = sys.argv[1] if len(sys.argv) > 1 else 'full'
MESH = 420
m = json.load(open('src/stops/mars/relief.json'))
k = 1 if setname == 'full' else 0.5
IW, IH = m['imageSize'][setname]
ox = int(m['margin']['left'] * k); EW = int(IW + 2 * ox); EH = int(IH + m['margin']['bottom'] * k)
def layer_depth(name):
    L = m['layers'][name]; b = L['box']; x0, y0, bw, bh = [v * k for v in (b['x'], b['y'], b['w'], b['h'])]
    dw, dh = L['distSize'][setname]
    d = np.fromfile(L['files'][setname]['dist'], '<f4').reshape(dh, dw)
    nx = max(2, round(MESH if bw >= bh else MESH * bw / bh)); ny = max(2, round(MESH * bh / bw if bw >= bh else MESH))
    fx = np.arange(nx + 1) / nx; fy = np.arange(ny + 1) / ny
    px = np.clip(fx * dw - 0.5, 0, dw - 1); py = np.clip(fy * dh - 0.5, 0, dh - 1)
    PY, PX = np.meshgrid(py, px, indexing='ij')
    vd = map_coordinates(d, [PY, PX], order=1)
    a = cv2.imread(L['files'][setname]['alpha'], cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
    ah, aw = a.shape
    gx = (np.arange(aw) + 0.5) / aw * nx; gy = (np.arange(ah) + 0.5) / ah * ny
    GY, GX = np.meshgrid(gy, gx, indexing='ij')
    pd = map_coordinates(vd, [GY, GX], order=1)
    full = np.full((EH, EW), np.inf, np.float32); af = np.zeros((EH, EW), np.float32)
    X0 = int(round(x0)) + ox; Y0 = int(round(y0))
    full[Y0:Y0 + ah, X0:X0 + aw] = pd; af[Y0:Y0 + ah, X0:X0 + aw] = a
    return full, af
z = {n: layer_depth(n) for n in m['drawOrder']}
res = {}
for lo, hi in (('L0', 'L2'), ('L0', 'L1'), ('L2', 'L1')):
    dl, al = z[lo]; dh_, ah_ = z[hi]
    lost = (ah_ >= 0.004) & (al >= 0.004) & (dh_ > dl)
    vis = lost & (ah_ >= 0.5)
    res[f'{hi} behind {lo}'] = dict(px=int(lost.sum()), opaquePx=int(vis.sum()))
    if len(sys.argv) > 2 and lost.any():
        cv2.imwrite(f'out/work/zlost-{hi}-{lo}.png', (lost * 255).astype(np.uint8))
print(json.dumps(res))
