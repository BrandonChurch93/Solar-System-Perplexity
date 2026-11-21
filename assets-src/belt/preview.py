import json
import sys
import numpy as np
from PIL import Image

F = np.float32


def lookup(d):
    ax = np.abs(d)
    face = np.where((ax[:, 0] >= ax[:, 1]) & (ax[:, 0] >= ax[:, 2]), np.where(d[:, 0] > 0, 0, 1), np.where(ax[:, 1] >= ax[:, 2], np.where(d[:, 1] > 0, 2, 3), np.where(d[:, 2] > 0, 4, 5)))
    x, y, z = d[:, 0], d[:, 1], d[:, 2]
    ma = np.choose(face, [ax[:, 0], ax[:, 0], ax[:, 1], ax[:, 1], ax[:, 2], ax[:, 2]])
    sc = np.choose(face, [-z, z, x, x, x, -x])
    tc = np.choose(face, [-y, -y, z, -z, -y, -y])
    return face, (sc / ma + 1) / 2, (tc / ma + 1) / 2


def sample(tex, d):
    n = tex.shape[1]
    face, s, t = lookup(d)
    i = np.clip((s * n).astype(int), 0, n - 1)
    j = np.clip((t * n).astype(int), 0, n - 1)
    return tex[face, j, i]


def main():
    folder, rid = sys.argv[1], sys.argv[2]
    man = json.load(open(folder + '/manifest.json'))['rocks'][rid]
    n, h = man['size'], man['aux']
    rgba = np.fromfile(folder + '/rock-' + rid + '.map.bin', np.uint8).reshape(6, n, n, 4).astype(F) / 255
    raw = open(folder + '/rock-' + rid + '.aux.bin', 'rb').read()
    hgt = np.frombuffer(raw[: 6 * h * h * 2], '<u2').reshape(6, h, h).astype(F) / 65535 * (man['hi'] - man['lo']) + man['lo']
    ao = np.frombuffer(raw[6 * h * h * 2:], np.uint8).reshape(6, h, h).astype(F) / 255
    size = 420
    tiles = []
    light = np.array([-0.85, 0.3, 0.42], F)
    light /= np.linalg.norm(light)
    for k, (yaw, pitch) in enumerate(((0, 0), (90, 20), (200, -30))):
        cy, sy, cp, sp = np.cos(np.radians(yaw)), np.sin(np.radians(yaw)), np.cos(np.radians(pitch)), np.sin(np.radians(pitch))
        rot = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], F) @ np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]], F)
        c = (np.arange(size) + 0.5) / size * 2.2 - 1.1
        x, y = np.meshgrid(c, -c)
        o = np.stack([x, y, np.full_like(x, 2.0)], -1).reshape(-1, 3).astype(F) @ rot.T
        dirv = (np.array([0, 0, -1], F) @ rot.T)[None, :]
        lw = light @ rot.T
        t = np.zeros(o.shape[0], F)
        for _ in range(90):
            p = o + dirv * t[:, None]
            l = np.linalg.norm(p, axis=1)
            t += np.clip((l - sample(hgt, p / l[:, None])) * 0.45, -0.02, 0.2)
        p = o + dirv * t[:, None]
        l = np.linalg.norm(p, axis=1)
        d = p / l[:, None]
        hit = (np.abs(l - sample(hgt, d)) < 0.02) & (t < 3.5)
        tex = sample(rgba, d)
        nn = tex[:, :3] * 2 - 1
        nn /= np.linalg.norm(nn, axis=1, keepdims=True)
        sh = np.ones(o.shape[0], F)
        for s in np.linspace(0.02, 1.2, 40):
            q = p + lw[None, :] * F(s)
            ql = np.linalg.norm(q, axis=1)
            sh = np.minimum(sh, np.clip((ql - sample(hgt, q / ql[:, None])) / (s * 0.08) + 0.3, 0, 1))
        mu0 = np.clip(nn @ lw, 0, 1)
        mu = np.clip(-(nn @ dirv[0]), 0.02, 1)
        col = tex[:, 3] * (1.6 * mu0 * (0.5 + 0.5 * 2 / (mu0 + mu + 1e-3) * 0.5) * sh + 0.03 * sample(ao, d))
        tiles.append(np.where(hit, col, 0).reshape(size, size))
    img = np.concatenate(tiles, 1)
    Image.fromarray(np.round(np.clip(img, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)).save(sys.argv[3])


main()
