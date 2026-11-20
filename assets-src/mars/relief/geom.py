import json, numpy as np
CF = json.load(open('assets-src/mars/relief/camera-fit.json'))
W, H = 2816, 1584
F = CF['focalPx']
P = np.radians(-CF['pitchDownDeg'])
RL = np.radians(CF['rollDeg'])
DIP = np.radians(CF['dipDeg'])
R = CF['planetRadius']
DH = CF['horizonDistance']

def up_vec():
    u = np.array([0.0, np.cos(-P), -np.sin(-P)])
    c, s = np.cos(RL), np.sin(RL)
    return np.array([c * u[0] - s * u[1], s * u[0] + c * u[1], u[2]])
U = up_vec()

def rays(w=W, h=H):
    s = W / w
    x = (np.arange(w) + 0.5) * s
    y = (np.arange(h) + 0.5) * s
    X, Y = np.meshgrid(x, y)
    d = np.stack([X - W / 2, -(Y - H / 2), -np.full_like(X, F)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)

def ground_dist(d):
    du = d @ U
    b = (R + 1) * du
    disc = b * b - (2 * R + 1)
    t = -b - np.sqrt(np.maximum(disc, 0))
    return np.where((disc > 0) & (t > 0), np.minimum(t, DH), DH)
