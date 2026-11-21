import numpy as np


def _pass(a, cap):
    h, w = a.shape[:2]
    out = a.copy()
    n = w // 8
    edges = np.arange(1, n) * 8
    left = a[:, edges - 1]
    right = a[:, edges]
    inner = 0.5 * ((a[:, edges - 1] - a[:, edges - 2]) + (a[:, edges + 1] - a[:, edges]))
    step = right - left - inner
    step = np.clip(step, -cap, cap)
    for j in range(4):
        k = 0.5 * (1 - (j + 0.5) / 4)
        out[:, edges + j] -= step * k
        out[:, edges - 1 - j] += step * k
    return out


def deblock(a, cap=4.0 / 255):
    a = _pass(a.astype(np.float32), cap)
    return _pass(a.transpose(1, 0, 2), cap).transpose(1, 0, 2)
