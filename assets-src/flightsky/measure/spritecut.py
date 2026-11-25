import numpy as np
core = 0.7
def s2(size, px, py):
    tot = 0
    for j in range(-12, 13):
        for i in range(-12, 13):
            dx, dy = i - px, j - py
            if abs(dx) < size / 2 and abs(dy) < size / 2: tot += np.exp(-(dx * dx + dy * dy) / core)
    return tot
full = np.pi * core
for size in (2.6, 3.0, 3.5, 4.0, 4.4, 5.0, 6.0, 8.0):
    v = np.array([[s2(size, a, b) for a in np.linspace(0, 1, 41)] for b in np.linspace(0, 1, 41)])
    print(f'size {size}: sum of the point samples over the grid place, as a share of the whole footprint: least {v.min() / full:.3f} most {v.max() / full:.3f} swing {(v.max() - v.min()) / v.mean():.3f}')
