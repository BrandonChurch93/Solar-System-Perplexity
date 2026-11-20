import json, numpy as np, cv2
from scipy import ndimage as ndi
m = json.load(open('assets-src/mars/relief/relief.json'))
MESH, GAP = 420, 1.03
for setname, k in (('full', 1.0), ('web', 0.5)):
    L0 = m['layers']['L0']; b0 = L0['box']
    dw, dh = L0['distSize'][setname]
    d0 = np.fromfile(L0['files'][setname]['dist'], '<f4').reshape(dh, dw).copy()
    s0 = b0['w'] * k / dw
    cell = b0['w'] * k / MESH / s0
    new = d0.copy()
    for name in ('L2', 'L1'):
        L = m['layers'][name]; b = L['box']
        uw, uh = L['distSize'][setname]
        du = np.fromfile(L['files'][setname]['dist'], '<f4').reshape(uh, uw)
        a = cv2.imread(L['files'][setname]['alpha'], cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
        a = cv2.resize(a, (uw, uh), interpolation=cv2.INTER_AREA)
        X0 = int(round((b['x'] - b0['x']) * k / s0)); Y0 = int(round((b['y'] - b0['y']) * k / s0))
        big = np.zeros_like(d0); big[Y0:Y0 + uh, X0:X0 + uw] = du
        inbox = np.zeros(d0.shape, bool); inbox[Y0:Y0 + uh, X0:X0 + uw] = True
        _, (iy, ix) = ndi.distance_transform_edt(~inbox, return_indices=True)
        big = ndi.grey_dilation(big[iy, ix], size=(int(cell) + 1, int(cell) + 1))
        mask = np.zeros(d0.shape, bool); mask[Y0:Y0 + uh, X0:X0 + uw] = a > 0.002
        dout = ndi.distance_transform_edt(~mask)
        t = np.clip((dout - 1.5 * cell) / cell, 0, 1)
        w = 1 - t * t * (3 - 2 * t)
        new = np.maximum(new, new + w * (big * GAP - new))
    ch = new > d0
    print(setname, 'L0 dist samples moved back', int(ch.sum()), 'median ratio', float(np.median(new[ch] / d0[ch])) if ch.any() else 1.0)
    new.astype('<f4').tofile(L0['files'][setname]['dist'])
