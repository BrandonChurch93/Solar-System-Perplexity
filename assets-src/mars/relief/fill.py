import numpy as np, cv2

def _down(a):
    return cv2.resize(a, ((a.shape[1] + 1) // 2, (a.shape[0] + 1) // 2), interpolation=cv2.INTER_AREA)

def pushpull(val, w, min_size=1):
    val = np.asarray(val, np.float32); w = np.asarray(w, np.float32)
    two = val.ndim == 2
    if two: val = val[..., None]
    pyr = [(val * w[..., None], w)]
    while min(pyr[-1][1].shape) > min_size:
        v, ww = pyr[-1]
        dv = _down(v)
        if dv.ndim == 2: dv = dv[..., None]
        pyr.append((dv, _down(ww)))
    v, ww = pyr[-1]
    est = v / np.maximum(ww, 1e-8)[..., None]
    for v, ww in reversed(pyr[:-1]):
        upv = cv2.resize(est, (ww.shape[1], ww.shape[0]), interpolation=cv2.INTER_LINEAR)
        if upv.ndim == 2: upv = upv[..., None]
        a = np.clip(ww * 4, 0, 1)[..., None]
        est = a * (v / np.maximum(ww, 1e-8)[..., None]) + (1 - a) * upv
    return est[..., 0] if two else est
